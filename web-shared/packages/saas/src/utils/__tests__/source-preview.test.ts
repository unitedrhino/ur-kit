// 验证预览组件的错误恢复与快速切换，避免旧文件加载覆盖新文件。
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Preview from '../../views/knowledge-base/source-preview.vue';
const state = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('../../views/knowledge-base/preview-renderers', () => ({
  loadRendererByFormat: state.load,
  previewFormat: () => 'pdf',
  loadPreviewViewer: async () => (await import('@file-viewer/vue3')).FileViewer,
}));
vi.mock('@file-viewer/vue3', () => ({
  FileViewer: { props: ['options', 'filename'], template: '<div data-viewer>{{ filename }}:{{ options.renderers[0].name }}</div>' },
}));
vi.mock('naive-ui', () => ({ NButton: { template: '<button><slot /></button>' }, NSpin: { template: '<div>加载中</div>' } }));

describe('原文预览异步状态', () => {
  it('加载失败后可重试', async () => {
    state.load.mockRejectedValueOnce(new Error('断网')).mockResolvedValueOnce({ name: 'pdf' });
    const wrapper = mount(Preview, { props: { url: '/a.pdf', filename: 'a.pdf' } });
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-viewer]').text()).toBe('a.pdf:pdf');
    wrapper.unmount();
  });
  it('快速切换后旧响应不覆盖当前预览', async () => {
    let resolveOld!: (value: object) => void;
    state.load
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce({ name: 'word' });
    const wrapper = mount(Preview, { props: { url: '/a.pdf', filename: 'a.pdf' } });
    await wrapper.setProps({ url: '/b.docx', filename: 'b.docx' });
    await flushPromises();
    resolveOld({ name: 'pdf' });
    await flushPromises();
    expect(wrapper.get('[data-viewer]').text()).toBe('b.docx:word');
    wrapper.unmount();
  });
});
