/**
 * 文件说明：验证文档面板的引用定位三态反馈展示与 PDF 定位视图分流。
 * 组件桩只保留挂点，聚焦 citationLocate 相关分支的渲染行为。
 */
import type { KnowledgeDetail } from '../data';

import { flushPromises, mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import DocumentPane from '../components/document-pane.vue';

/** 异步视图组件桩：render 函数规避运行时模板编译差异，只保留断言挂点。 */
function stubView(testId: string, text: (props: Record<string, unknown>) => string, props: string[] = []) {
  return {
    __isTeleport: false,
    name: testId,
    props,
    setup: (props: Record<string, unknown>) => () => h('div', { 'data-test': testId }, text(props)),
  };
}

vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({ Badge: { template: '<span data-test="stub-badge"><slot /></span>' } }));
vi.mock('@unitedrhino/saas-ui/ui/button', () => ({ Button: { template: '<button data-test="stub-button"><slot /></button>' } }));
vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { template: '<div data-test="stub-dialog"><slot /></div>' },
  DialogContent: { template: '<div data-test="stub-dialog-content"><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/dropdown-menu', () => ({
  DropdownMenu: { template: '<div data-test="stub-dropdown"><slot /></div>' },
  DropdownMenuContent: { template: '<div data-test="stub-dropdown-content"><slot /></div>' },
  DropdownMenuItem: { template: '<div data-test="stub-dropdown-item"><slot /></div>' },
  DropdownMenuTrigger: { template: '<div data-test="stub-dropdown-trigger"><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/empty', () => ({
  Empty: { template: '<div data-test="stub-empty"><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/tabs', () => ({
  Tabs: { props: ['modelValue'], template: '<div data-test="stub-tabs"><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { props: ['value'], template: '<div :data-value="value"><slot /></div>' },
}));
vi.mock('lucide-vue-next', () => ({
  ChevronDown: { template: '<i />' },
  ChevronLeft: { template: '<i />' },
  ChevronRight: { template: '<i />' },
  Crosshair: { template: '<i data-test="stub-icon-crosshair" />' },
  FileText: { template: '<i data-test="stub-icon-file" />' },
  LoaderCircle: { template: '<i data-test="stub-icon-loader" />' },
  MoreHorizontal: { template: '<i data-test="stub-icon-more" />' },
  PanelLeft: { template: '<i data-test="stub-icon-panel" />' },
  ZoomIn: { template: '<i />' },
  ZoomOut: { template: '<i />' },
}));
vi.mock('naive-ui', () => ({
  NButton: { template: '<button data-test="stub-nbutton"><slot /></button>' },
  NSpin: { template: '<div data-test="stub-nspin"><slot /></div>' },
}));

vi.mock('../document-reading.vue', () => ({
  default: stubView('stub-reading', (props) => String((props.highlight as undefined | { charStart?: number })?.charStart ?? ''), [
    'detail',
    'highlight',
    'text',
  ]),
}));
vi.mock('../document-relations.vue', () => ({ default: stubView('stub-relations', () => '') }));
vi.mock('../processing-results.vue', () => ({ default: stubView('stub-results', () => '') }));
vi.mock('../data', () => ({ statusLabel: vi.fn(() => '已就绪') }));
vi.mock('../workbench', () => ({ knowledgeStatusClass: vi.fn(() => '') }));
vi.mock('./dialog-resize', () => ({ useDialogWidth: vi.fn(() => ({ startResize: vi.fn(), style: {} })) }));
vi.mock('./dialog-resize-handle.vue', () => ({ default: stubView('stub-resize-handle', () => '') }));
vi.mock('./processing-stages.vue', () => ({ default: stubView('stub-stages', () => '') }));
// happy-dom 下 vite preload helper 通常使 defineAsyncComponent 的动态导入不 resolve，
// viewer 内部渲染无法在此断言，激活与分流以 pdf-locate-active 挂载点为准，viewer 内部属浏览器级验证；
// 个别时序下加载器会完成：mock 命名空间必须带 __esModule 让 Vue 解包 default，并带上
// 渲染期探测的标记位，否则整个命名空间被当作组件、连环抛 "No xxx export" unhandled rejection。
vi.mock('../components/pdf-locate-viewer.vue', () => ({
  __esModule: true,
  __isTeleport: false,
  __isKeepAlive: false,
  default: stubView('stub-pdf-locate', (props) => String(props.quote ?? ''), ['filename', 'pageIndex', 'quote', 'url']),
}));

/** fixture 构造最小 KnowledgeDetail，满足面板渲染所需的文档信息。 */
function detailFixture(path: string): KnowledgeDetail {
  return {
    document: { id: 9, knowledgeID: 4, name: '文档', nodeType: 'file', parentID: 0, path },
    sourceVersion: 'v1',
    processingStages: [],
  };
}

/** mountPane 挂载面板并等待异步视图组件解析，便于断言子视图渲染结果。 */
async function mountPane(props: Record<string, unknown>) {
  const wrapper = mount(DocumentPane, {
    props: { detail: detailFixture('说明.md'), previewMode: 'source', workbenchTab: 'content', ...props },
  });
  await flushPromises();
  await nextTick();
  return wrapper;
}

describe('文档面板引用定位三态反馈', () => {
  it('反馈文案显示在文档名下方，精确命中为成功色', async () => {
    const wrapper = await mountPane({ citationLocate: { message: '已定位到引用内容', status: 'exact' } });
    const feedback = wrapper.get('[data-testid="citation-locate-feedback"]');
    expect(feedback.text()).toBe('已定位到引用内容');
    expect(feedback.classes()).toContain('text-green-600');
  });

  it('仅定位到页为提示色，未找到为警示色', async () => {
    const page = await mountPane({ citationLocate: { message: '仅定位到第 3 页', pageIndex: 2, status: 'page' } });
    expect(page.get('[data-testid="citation-locate-feedback"]').classes()).toContain('text-amber-600');
    const miss = await mountPane({ citationLocate: { message: '未能定位', status: 'miss' } });
    expect(miss.get('[data-testid="citation-locate-feedback"]').classes()).toContain('text-destructive');
  });

  it('无定位请求时不渲染反馈行，保持目录路径展示', async () => {
    const wrapper = await mountPane({ folder: '手册/接入' });
    expect(wrapper.find('[data-testid="citation-locate-feedback"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('手册/接入');
  });

  it('pDF 带定位请求保持原文件视图（内置定位组件异步加载），不落入降级插槽', async () => {
    const wrapper = await mountPane({
      citationLocate: { message: '已定位到引用内容', status: 'exact' },
      citationPending: true,
      citationPageIndex: 2,
      citationQuote: '设备接入示例',
      detail: detailFixture('手册/接入.pdf'),
    });
    // PDF 分支由独立的 pdf-locate-viewer 组件承担（RAGFlow 同款文本层换算），
    // 渲染链路属于浏览器级验证；此处断言分流标志与插槽边界。
    expect(wrapper.find('[data-testid="pdf-locate-active"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="source-preview-unsupported"]').exists()).toBe(false);
  });

  it('真实死锁回归：PDF 有待处理定位请求但尚未上报结果时即激活内置定位视图', async () => {
    // 激活判定必须基于"存在待处理请求"而非"已上报结果"：
    // 若依赖 citationLocate 非空，viewer 不渲染→永不上报→结果永空，深链定位整体失效。
    const wrapper = await mountPane({
      citationPageIndex: 0,
      citationPending: true,
      citationQuote: 'register the product',
      detail: detailFixture('手册/接入.pdf'),
    });
    expect(wrapper.find('[data-testid="pdf-locate-active"]').exists()).toBe(true);
    // viewer 挂载时机会因测试环境异步解析快慢而漂移，激活挂载点是确定性回归锚点；
    // viewer 收到的引文/先验页与其页文本匹配属浏览器级验证。
  });

  it('无待处理定位请求的 PDF 保持普通预览插槽，不激活内置定位视图', async () => {
    const wrapper = await mountPane({ detail: detailFixture('手册/接入.pdf') });
    expect(wrapper.find('[data-testid="pdf-locate-active"]').exists()).toBe(false);
  });

  it('非 PDF 带定位请求保持原文件预览插槽，不渲染 PDF 定位组件', async () => {
    const wrapper = await mountPane({
      citationLocate: { message: '已定位到引用内容', status: 'exact' },
      detail: detailFixture('手册/说明.md'),
    });
    expect(wrapper.find('[data-testid="pdf-locate-active"]').exists()).toBe(false);
  });
});
