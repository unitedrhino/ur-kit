/**
 * 文件说明：验证证据引用定位参数在知识库工作台的落地消费全链路——
 * URL 带定位参数进入 → 自动选中文档 → 切解析阅读 → 三态文案 → 参数从地址栏移除，
 * 以及浏览器刷新/前进后退把参数重放回地址栏后的自愈再消费。
 */
import type { KnowledgeDetail, KnowledgeTreeNode } from '../data';

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import WorkbenchPage from '../workbench-page.vue';

/** vi.hoisted 供 mock 工厂共享的转义仓：路由状态与请求桩必须在 import 前就绪。 */
const harness = vi.hoisted(() => {
  const calls = { getDetail: [] as unknown[][], getContent: [] as unknown[][], replace: [] as Record<string, unknown>[] };
  /** route 由工厂注入 reactive 代理；测试与组件共享同一实例。 */
  const holder: { route?: { params: Record<string, string>; query: Record<string, unknown> } } = {};
  return { calls, holder };
});

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  const route = reactive({ params: { id: '1' }, query: {} }) as { params: Record<string, string>; query: Record<string, unknown> };
  harness.holder.route = route;
  const navigate = async (to: { query?: Record<string, unknown> }) => {
    if (to?.query) {
      route.query = { ...to.query };
      harness.calls.replace.push({ ...to.query });
    }
  };
  return {
    useRoute: () => route,
    useRouter: () => ({ replace: navigate, push: navigate }),
  };
});

vi.mock('../../../hooks/use-task-polling', () => ({ useTaskPolling: () => ({ start: vi.fn(), stop: vi.fn() }) }));
vi.mock('../../../hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../../store/session', () => ({ useSessionStore: () => ({ tenantCode: 'platform', token: 'token' }) }));
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    // happy-dom 无 matchMedia，固定桌面态避免媒体查询抖动
    useMediaQuery: () => ({ value: true }),
  };
});
vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    name: 'PageStub',
    inheritAttrs: false,
    setup:
      (_, { slots }) =>
      () =>
        slots.default?.(),
  }),
}));

vi.mock('@unitedrhino/saas-ui/ui/badge', () => ({ Badge: { template: '<span><slot /></span>' } }));
vi.mock('@unitedrhino/saas-ui/ui/button', () => ({ Button: { template: '<button><slot /></button>' } }));
vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/dropdown-menu', () => ({
  DropdownMenu: { template: '<div><slot /></div>' },
  DropdownMenuContent: { template: '<div><slot /></div>' },
  DropdownMenuItem: { template: '<div><slot /></div>' },
  DropdownMenuSeparator: { template: '<div />' },
  DropdownMenuTrigger: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/empty', () => ({
  Empty: { template: '<div><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/sheet', () => ({
  Sheet: { template: '<div><slot /></div>' },
  SheetContent: { template: '<div><slot /></div>' },
  SheetDescription: { template: '<div><slot /></div>' },
  SheetTitle: { template: '<div><slot /></div>' },
}));
vi.mock('@unitedrhino/saas-ui/ui/tabs', () => ({
  Tabs: { props: ['modelValue'], template: '<div><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { props: ['value'], template: '<div><slot /></div>' },
}));
vi.mock('lucide-vue-next', () => {
  const icon = (name: string) => ({ name, template: '<i />' });
  return {
    ArrowLeft: icon('arrow-left'),
    Download: icon('download'),
    Folder: icon('folder'),
    MoreHorizontal: icon('more-horizontal'),
    RefreshCw: icon('refresh-cw'),
    Upload: icon('upload'),
  };
});

vi.mock('../components/compile-progress-bar.vue', () => ({ default: { template: '<div data-test="stub-compile-bar" />' } }));
vi.mock('../components/document-pane.vue', () => ({
  default: defineComponent({
    name: 'StubDocumentPane',
    props: {
      canWrite: { type: Boolean, default: false },
      citationLocate: { type: Object, default: null },
      citationPending: { type: Boolean, default: false },
      citationPageIndex: { type: Number, default: undefined },
      citationQuote: { type: String, default: '' },
      detail: { type: Object, default: null },
      detailError: { type: String, default: '' },
      detailLoading: { type: Boolean, default: false },
      directoryVisible: { type: Boolean, default: true },
      folder: { type: String, default: '' },
      parsedError: { type: String, default: '' },
      parsedLoading: { type: Boolean, default: false },
      parsedText: { type: String, default: '' },
      pendingCount: { type: Number, default: 0 },
      previewMode: { type: String, default: 'source' },
      retryError: { type: String, default: '' },
      retrying: { type: Boolean, default: false },
      sourcePreviewURL: { type: String, default: '' },
      workbenchTab: { type: String, default: 'content' },
    },
    template: '<div data-test="stub-pane" />',
  }),
}));
vi.mock('../components/document-tree.vue', () => ({ default: { template: '<div data-test="stub-tree" />' } }));
vi.mock('../components/import-dialog.vue', () => ({ default: { template: '<div data-test="stub-import" />' } }));
vi.mock('../components/settings-panel.vue', () => ({ default: { template: '<div data-test="stub-settings" />' } }));
vi.mock('../components/zip-transfer.vue', () => ({ default: { template: '<div data-test="stub-zip" />' } }));
vi.mock('../retrieval-panel.vue', () => ({ default: { template: '<div data-test="stub-retrieval" />' } }));
vi.mock('../source-preview.vue', () => ({ default: { template: '<div data-test="stub-source-preview" />' } }));

vi.mock('../data', () => ({ statusLabel: () => '已完成' }));
vi.mock('../processing', () => ({ processingStageNames: {} }));

/** Api 桩：记录调用并返回最小可用数据；fixtures 在用例内按需覆写。 */
const apiState = vi.hoisted(() => ({ detail: null as unknown, parsedFullText: '', anchors: [] as unknown[] }));
vi.mock('../index.api', () => ({
  Api: {
    getOne: async () => ({
      compiledDocumentCount: 1,
      documentCount: 1,
      failedDocumentCount: 0,
      id: 1,
      name: 'TASK144 验收库',
      scope: 'platform',
      status: 'success',
    }),
    getTree: async () => ({
      knowledgeID: 1,
      nodes: [
        { id: 5, knowledgeID: 1, name: '流程图说明.md', nodeType: 'file', parentID: 0, path: '/流程图说明.md' },
        { id: 7, knowledgeID: 1, name: 'kb144-test.pdf', nodeType: 'file', parentID: 0, path: '/kb144-test.pdf' },
      ] as KnowledgeTreeNode[],
    }),
    getStatus: async () => ({}),
    getFieldReferencePendingSummary: async () => [],
    getDetail: async (documentID: number) => {
      harness.calls.getDetail.push([documentID]);
      return apiState.detail;
    },
    getContent: async (documentID: number) => {
      harness.calls.getContent.push([documentID]);
      return { chunkAnchors: apiState.anchors, documentID, parsedFullText: apiState.parsedFullText, sourceTextReady: true };
    },
  },
}));

/** route() 返回工厂注入的响应式路由；测试通过它改写地址栏模拟浏览器行为。 */
function route() {
  if (!harness.holder.route) throw new Error('vue-router mock 未初始化');
  return harness.holder.route;
}

/** detailFixture 提供非 PDF 文档，保证定位链路走解析阅读分支。 */
function detailFixture(): KnowledgeDetail {
  return {
    document: { id: 5, knowledgeID: 1, name: '流程图说明.md', nodeType: 'file', parentID: 0, path: '/流程图说明.md' },
    sourceVersion: 'v1',
    processingStages: [],
  };
}

/** mountPage 以真实路由 query 状态挂载工作台并推进全部异步链路。 */
async function mountPage(query: Record<string, unknown>) {
  route().query = { ...query };
  const wrapper = mount(WorkbenchPage, { props: { mode: 'platform' } });
  await flushPromises();
  await nextTick();
  await flushPromises();
  return wrapper;
}

/** paneProps 读取文档面板桩收到的关键 props，模拟真实面板对定位请求的呈现。 */
function paneProps(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  const pane = wrapper.findComponent({ name: 'StubDocumentPane' });
  const citationLocate = pane.props('citationLocate') as null | { charStart?: number; message: string; status: string };
  return { citationLocate, citationPending: pane.props('citationPending'), parsedText: pane.props('parsedText'), previewMode: pane.props('previewMode') };
}

/** 复现环境的真实参数：文档 5、chunk 0、区间 [8,18)、兜底引文「接入流程图」。 */
const DEEP_LINK_QUERY = { doc: '5', chunk: '0', cs: '8', ce: '18', q: '接入流程图' };

beforeEach(() => {
  harness.calls.getDetail.length = 0;
  harness.calls.getContent.length = 0;
  harness.calls.replace.length = 0;
  apiState.detail = detailFixture();
  apiState.parsedFullText = '流程图说明\n以下是接入流程图:\ngraph TD 图表内容占位。\n完成。';
  // 真实 get-content 返回全部切片锚点，这里同时给出 chunk 0 与 chunk 1。
  apiState.anchors = [
    { artifactID: 1, charEnd: 30, charStart: 8, chunkIndex: 0 },
    { artifactID: 2, charEnd: 60, charStart: 40, chunkIndex: 1 },
  ];
});

describe('证据引用定位落地消费', () => {
  it('带定位参数 URL 进入：自动选中文档、切解析阅读、产出三态文案并清理参数', async () => {
    const wrapper = await mountPage({ ...DEEP_LINK_QUERY });

    // 自动选中文档：详情与解析全文按 doc=5 加载。
    expect(harness.calls.getDetail).toContainEqual([5]);
    expect(harness.calls.getContent).toContainEqual([5]);

    // 切解析阅读：面板收到的视图为 reading。
    const { citationLocate, previewMode } = paneProps(wrapper);
    expect(previewMode).toBe('reading');

    // 三态文案：chunk 锚点精确命中。
    expect(citationLocate?.status).toBe('exact');
    expect(citationLocate?.message).toBe('已定位到引用内容');
    expect(citationLocate?.charStart).toBe(8);

    // 参数从地址栏移除：最终路由只剩 doc 与 view。
    expect(route().query).toEqual({ doc: '5', view: 'reading' });
    wrapper.unmount();
  });

  it('浏览器刷新/前进后退重放定位参数后，工作台重新消费并再次清理', async () => {
    const wrapper = await mountPage({ ...DEEP_LINK_QUERY });
    expect(route().query).toEqual({ doc: '5', view: 'reading' });

    // 模拟浏览器把落地前地址栏重放回来（导航意图重提交）：参数回归且 view 丢失。
    route().query = { ...DEEP_LINK_QUERY };
    await flushPromises();
    await nextTick();
    await flushPromises();

    const { citationLocate, previewMode } = paneProps(wrapper);
    expect(previewMode).toBe('reading');
    expect(citationLocate?.status).toBe('exact');
    expect(citationLocate?.message).toBe('已定位到引用内容');
    expect(route().query).toEqual({ doc: '5', view: 'reading' });
    wrapper.unmount();
  });

  it('页面内再次点击证据链（参数变化）按新请求重新定位', async () => {
    const wrapper = await mountPage({ ...DEEP_LINK_QUERY });
    expect(paneProps(wrapper).citationLocate?.charStart).toBe(8);

    // 新证据指向另一切片：锚点表已含 chunk 1，应按新锚点精确定位并再次清理参数。
    route().query = { doc: '5', view: 'reading', chunk: '1', cs: '40', ce: '60', q: '图表内容占位' };
    await flushPromises();
    await nextTick();
    await flushPromises();

    const { citationLocate } = paneProps(wrapper);
    expect(citationLocate?.status).toBe('exact');
    expect(citationLocate?.charStart).toBe(40);
    expect(route().query).toEqual({ doc: '5', view: 'reading' });
    wrapper.unmount();
  });

  it('无定位参数的普通打开不触发定位文案与参数清理导航', async () => {
    const wrapper = await mountPage({ doc: '5' });
    const { citationLocate } = paneProps(wrapper);
    expect(citationLocate ?? null).toBeNull();
    expect(harness.calls.replace).toHaveLength(0);
    wrapper.unmount();
  });

  it('pDF 深链保持原文件视图并下发待处理请求，viewer 上报后展示三态文案', async () => {
    // 复现环境 kb144-test.pdf（文档 7）的定位场景：PDF 留在原文件视图，
    // 待处理请求先于结果下发（激活 pdf-locate-viewer），viewer 上报三态后才出现文案。
    apiState.detail = {
      document: { id: 7, knowledgeID: 1, name: 'kb144-test.pdf', nodeType: 'file', parentID: 0, path: '/kb144-test.pdf' },
      sourceVersion: 'v1',
      processingStages: [],
    };
    const wrapper = await mountPage({ doc: '7', chunk: '0', q: 'register the product', pi: '0' });

    // 自动选中文档 7，且 PDF 不切解析阅读。
    expect(harness.calls.getDetail).toContainEqual([7]);
    expect(harness.calls.getContent).toHaveLength(0);

    let pane = paneProps(wrapper);
    expect(pane.previewMode).toBe('source');
    expect(pane.citationPending).toBe(true);
    // 上报前没有三态文案（此前死锁：激活依赖结果，结果依赖激活）。
    expect(pane.citationLocate ?? null).toBeNull();
    // 参数已从地址栏清理（PDF 分流不清 view，保持默认原文件视图）。
    expect(route().query).toEqual({ doc: '7' });

    // 模拟 pdf-locate-viewer 页文本匹配后上报。
    wrapper.findComponent({ name: 'StubDocumentPane' }).vm.$emit('locateDetected', { message: '已定位到引用内容', pageIndex: 0, status: 'exact' });
    await nextTick();
    await flushPromises();

    pane = paneProps(wrapper);
    expect(pane.citationLocate?.status).toBe('exact');
    expect(pane.citationLocate?.message).toBe('已定位到引用内容');
    expect(pane.citationPending).toBe(true);
    wrapper.unmount();
  });

  it('自文本文档阅读视图深链切换 PDF：定位请求强制回原文件视图激活定位', async () => {
    // 前一文档残留的 view=reading 不得让 PDF 停在解析阅读视图，
    // 否则 pdf-locate-active 永不激活；仅在消费定位请求这一刻强制回原文件视图。
    apiState.detail = {
      document: { id: 7, knowledgeID: 1, name: 'kb144-test.pdf', nodeType: 'file', parentID: 0, path: '/kb144-test.pdf' },
      sourceVersion: 'v1',
      processingStages: [],
    };
    const wrapper = await mountPage({ doc: '5', view: 'reading' });
    expect(paneProps(wrapper).previewMode).toBe('reading');

    // 深链切换到 PDF 文档带定位参数（地址栏残留 view=reading）。
    route().query = { doc: '7', chunk: '0', q: 'register the product', pi: '0', view: 'reading' };
    await flushPromises();
    await nextTick();
    await flushPromises();

    const pane = paneProps(wrapper);
    expect(pane.previewMode).toBe('source');
    expect(pane.citationPending).toBe(true);
    expect(pane.citationLocate ?? null).toBeNull();
    // 地址栏收敛为 doc+source；导航瞬间曾派发的 PDF 解析全文请求被定位分流失效守卫丢弃，
    // 解析正文不进入渲染管线（PDF 的阅读走 pdf-locate-viewer，不消费 parsedFullText）。
    expect(route().query).toEqual({ doc: '7', view: 'source' });
    expect(pane.parsedText ?? '').toBe('');
    wrapper.unmount();
  });
});
