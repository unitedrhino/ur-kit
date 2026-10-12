/** 文件说明：验证 GLB 文件进入上传链路，原文区装配 GLB 三维预览并隔离加载失败与快速切换。 */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, onBeforeUnmount } from 'vue';

import { i18n } from '../../../locales';
import knowledgeBaseMessages from '../../../locales/langs/zh-CN/knowledgeBase.json';

import ImportDialog from '../components/import-dialog.vue';
import SourcePreview from '../source-preview.vue';

/** 上传、提示和预览加载的可观测替身，不连接外部服务。 */
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  importDocuments: vi.fn(),
  toast: vi.fn(),
  loadViewer: vi.fn(),
  loadRenderer: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock('../index.api', () => ({ Api: { uploadTempFile: mocks.upload, importDocuments: mocks.importDocuments } }));
vi.mock('../../../hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@vben/preferences', () => ({ usePreferences: () => ({ isDark: { value: false } }) }));
vi.mock('lucide-vue-next', () => ({ LoaderCircle: { template: '<i />' } }));
vi.mock('naive-ui', () => ({ NSpin: { template: '<span />' }, NButton: { template: '<button><slot /></button>' } }));
vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));
vi.mock('../preview-renderers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../preview-renderers')>()),
  loadPreviewViewer: mocks.loadViewer,
  loadRendererByFormat: mocks.loadRenderer,
}));

beforeEach(() => {
  vi.clearAllMocks();
  i18n.global.mergeLocaleMessage('zh-CN', { knowledgeBase: knowledgeBaseMessages });
  i18n.global.locale.value = 'zh-CN';
  mocks.upload.mockResolvedValue({ filePath: 'uploads/pump.glb' });
  mocks.importDocuments.mockResolvedValue(undefined);
  mocks.loadViewer.mockResolvedValue(defineComponent({
    props: ['url', 'filename', 'options'],
    /** 观察卸载是否发生，真实引擎的卸载行为另由浏览器验收覆盖。 */
    setup(props) {
      onBeforeUnmount(mocks.dispose);
      return () => h('div', { 'data-testid': 'viewer', 'data-filename': props.filename });
    },
  }));
  mocks.loadRenderer.mockResolvedValue({});
});

describe('GLB 知识库导入', () => {
  it('大写扩展名模型完成上传并提交文档导入，通知工作台刷新', async () => {
    const wrapper = mount(ImportDialog, { props: { knowledgeId: 7 } });
    const input = wrapper.get('input[type="file"]');
    const file = new File(['synthetic GLB'], '水泵.GLB', { type: 'model/gltf-binary' });
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] });
    await input.trigger('change');
    await flushPromises();
    expect(mocks.upload).toHaveBeenCalledWith(file);
    expect(mocks.importDocuments).toHaveBeenCalledWith(7, [{ filePath: 'uploads/pump.glb', name: '水泵.GLB', path: '水泵.GLB' }], 0);
    expect(wrapper.emitted('imported')).toHaveLength(1);
    expect(wrapper.emitted('invalidSelection')).toBeUndefined();
    wrapper.unmount();
  });

  it('GLB 使用原始路径装配模型预览，切换 PDF 时卸载旧预览', async () => {
    const wrapper = mount(SourcePreview, { props: { url: '/source/pump', filename: '水泵', path: '模型/水泵.GLB' } });
    await flushPromises();
    expect(mocks.loadRenderer).toHaveBeenCalledWith('model');
    expect(wrapper.get('[data-testid="viewer"]').attributes('data-filename')).toBe('模型/水泵.GLB');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await wrapper.setProps({ filename: '手册.pdf', path: '手册.pdf' });
    await flushPromises();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.loadRenderer).toHaveBeenCalledWith('pdf');
    expect(wrapper.get('[data-testid="viewer"]').attributes('data-filename')).toBe('手册.pdf');
    wrapper.unmount();
  });

  it('快速切换到 PDF 后丢弃迟到的 GLB 渲染器', async () => {
    /** 延迟首个模型引擎，模拟网络下载期间切换文档；按已判定格式分发。 */
    let resolveModel!: (value: object) => void;
    mocks.loadRenderer.mockImplementation((format: string) => format === 'model'
      ? new Promise((resolve) => { resolveModel = resolve; })
      : Promise.resolve({ id: 'pdf' }));
    const wrapper = mount(SourcePreview, { props: { url: '/source/1', filename: 'pump.glb' } });
    await flushPromises();
    await wrapper.setProps({ url: '/source/2', filename: 'manual.pdf' });
    await flushPromises();
    resolveModel({ id: 'model' });
    await flushPromises();
    expect(wrapper.get('[data-testid="viewer"]').attributes('data-filename')).toBe('manual.pdf');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('模型引擎加载失败提供重试，恢复后装配预览', async () => {
    mocks.loadRenderer.mockRejectedValueOnce(new Error('internal module path'));
    const wrapper = mount(SourcePreview, { props: { url: '/source/pump', filename: 'pump.glb' } });
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).not.toContain('internal module path');
    expect(wrapper.find('[data-testid="viewer"]').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(mocks.loadRenderer).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="viewer"]').attributes('data-filename')).toBe('pump.glb');
    wrapper.unmount();
  });
});
