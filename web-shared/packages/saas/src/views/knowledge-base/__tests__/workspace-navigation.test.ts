/** 文件说明：真实路由下验证三视图、目录恢复、懒加载、只读边界与乱序详情请求。 */
import type { VNode } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import type { KnowledgeDetail } from '../data';

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';

import { getTabKey, useTabbarStore } from '@vben/stores';

import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import orgRoutes from '../../../../../../apps/org-manage/src/router/routes/modules/app';
import platformRoutes from '../../../../../../apps/platform-manage/src/router/routes/modules/platform-manage';
import { Api } from '../index.api';
import Workbench from '../workbench-page.vue';

vi.mock('@vben/common-ui', () => ({ Page: { template: '<div><slot /></div>' } }));
vi.mock('../../../hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../../store/session', () => ({ useSessionStore: () => ({ tenantCode: '', token: '' }) }));
vi.mock('../retrieval-panel.vue', () => ({ default: { template: '<div>检索测试面板</div>' } }));
vi.mock('../source-preview.vue', () => ({ default: { template: '<div aria-label="原文件预览" />' } }));
vi.mock('../document-relations.vue', () => ({ __esModule: true, default: { template: '<div aria-label="文档关联视图" />' } }));
vi.mock('@vueuse/core', async (importOriginal) => ({ ...(await importOriginal<typeof import('@vueuse/core')>()), useMediaQuery: () => ref(true) }));
vi.mock('naive-ui', () => ({
  NSpin: { template: '<div><slot /></div>' },
  NDropdown: { template: '<div />' },
  NTree: {
    props: ['data'],
    emits: ['update:selected-keys'],
    template: '<div><button v-for="node in data" :key="node.key" @click="$emit(\'update:selected-keys\', [node.key], [node])">{{ node.label }}</button></div>',
  },
}));
vi.mock('../index.api', () => ({
  Api: { list: vi.fn(), getOne: vi.fn(), getTree: vi.fn(), getStatus: vi.fn(), getDetail: vi.fn(), getContent: vi.fn(), retryCompile: vi.fn() },
}));
/** 固定两个可见文档，排除模型和实际上传影响。 */
function detail(id: number): KnowledgeDetail {
  return {
    document: { id, knowledgeID: 38, parentID: 0, nodeType: 'file', name: `文档${id}.md`, path: `文档${id}.md` },
    processingStages: ['content', 'analysis', 'multimodal'].map((stage) => ({ stage, status: 'notApplicable' })),
  };
}
/** 登记每次挂载，释放工作台轮询及监听。 */
const wrappers: ReturnType<typeof mount>[] = [];
async function render(query = '', mode: 'platform' | 'tenant' = 'platform') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/kb/:id', component: { template: '<div />' } }] });
  await router.push(`/kb/38${query}`);
  await router.isReady();
  const wrapper = mount(Workbench, { props: { mode }, global: { plugins: [router] } });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, router };
}
/** 查找生产路由，防止仅测试手工构造的 meta 而漏掉两端真实配置。 */
function findDetailRoute(routes: RouteRecordRaw[], name: string): RouteRecordRaw | undefined {
  for (const route of routes) {
    if (route.name === name) return route;
    if (route.children?.length) {
      const found = findDetailRoute(route.children, name);
      if (found) return found;
    }
  }
  return undefined;
}

/** 按实际布局 getTabKey 渲染工作台，覆盖 query 引起的整页卸载与重复页签。 */
async function renderWithLayout(route: RouteRecordRaw, mode: 'platform' | 'tenant') {
  const pinia = createPinia();
  const store = useTabbarStore(pinia);
  const path = route.path.replace(':id', '38');
  // 测试专用页面与路由宿主放在同一夹具，不增加生产组件。
  // eslint-disable-next-line vue/one-component-per-file
  const page = defineComponent({ name: 'KnowledgeRouteTestPage', setup: () => () => h(Workbench, { mode }) });
  const router = createRouter({ history: createMemoryHistory(), routes: [{ ...route, component: page }] });
  router.afterEach((current) => store.addTab(current));
  await router.push(`${path}?tab=content&doc=1&view=source`);
  await router.isReady();
  // eslint-disable-next-line vue/one-component-per-file
  const layout = defineComponent({
    setup: () => () =>
      h(RouterView, null, {
        default: ({ Component, route: current }: { Component: VNode; route: typeof router.currentRoute.value }) => h(Component, { key: getTabKey(current) }),
      }),
  });
  const wrapper = mount(layout, { global: { plugins: [router, pinia] } });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, router, store, path };
}
/** 模拟用户键盘激活真实 Tabs，不直接修改组件内部状态。 */
async function tab(wrapper: ReturnType<typeof mount>, name: string) {
  const trigger = wrapper.findAll('[role="tab"]').find((node) => node.text() === name);
  if (!trigger) throw new Error(`缺少标签 ${name}`);
  await trigger.trigger('keydown', { key: 'Enter' });
  await flushPromises();
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Api.getOne).mockResolvedValue({ id: 38, name: '共享手册', scope: 'platform', status: 'success' } as never);
  vi.mocked(Api.getTree).mockResolvedValue({ nodes: [detail(1).document, detail(2).document] });
  vi.mocked(Api.getStatus).mockResolvedValue({ knowledgeID: 38, documentCount: 2, compiledDocumentCount: 2, failedDocumentCount: 0 });
  vi.mocked(Api.getDetail).mockImplementation(async (id) => detail(id));
  vi.mocked(Api.getContent).mockResolvedValue({ parsedFullText: '解析正文' });
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});
describe('文档工作区路由与状态', () => {
  it.each([
    ['平台', platformRoutes, 'AiCenterKnowledgeBaseDetail', 'platform'],
    ['企业', orgRoutes, 'OrgSystemManageKnowledgeBaseDetail', 'tenant'],
  ] as const)('%s端查询参数切换复用工作区，不重复初始化或创建页签，不同库保持隔离', async (_name, routes, routeName, mode) => {
    const route = findDetailRoute(routes, routeName);
    if (!route) throw new Error(`缺少生产路由 ${routeName}`);
    const { wrapper, router, store, path } = await renderWithLayout(route, mode);
    // Vue Test Utils 会包装 vm 代理；比较底层实例，避免将不同测试代理误判为页面重建。
    const instance = wrapper.findComponent(Workbench).vm.$;
    const header = wrapper.get('.kb-workbench h1').element;
    for (const query of [
      { tab: 'retrieval', doc: '1', view: 'source' },
      { tab: 'settings', doc: '1', view: 'source' },
      { tab: 'content', doc: '1', view: 'reading' },
      { tab: 'content', doc: '1', view: 'relations' },
      { tab: 'content', doc: '2', view: 'source' },
    ]) {
      await router.push({ path, query });
      await flushPromises();
      expect(wrapper.findComponent(Workbench).vm.$).toBe(instance);
      expect(wrapper.get('.kb-workbench h1').element).toBe(header);
    }
    expect(Api.getOne).toHaveBeenCalledTimes(1);
    expect(Api.getTree).toHaveBeenCalledTimes(1);
    expect(Api.getStatus).toHaveBeenCalledTimes(1);
    expect(Api.getDetail).toHaveBeenCalledTimes(2);
    expect(store.tabs).toHaveLength(mode === 'platform' ? 1 : 0);
    router.back();
    await flushPromises();
    expect(router.currentRoute.value.query.view).toBe('relations');
    expect(wrapper.findComponent(Workbench).vm.$).toBe(instance);
    router.forward();
    await flushPromises();
    expect(router.currentRoute.value.query.doc).toBe('2');
    expect(wrapper.findComponent(Workbench).vm.$).toBe(instance);
    const oldKey = getTabKey(router.currentRoute.value);
    await router.push(path.replace('/38', '/39'));
    await flushPromises();
    expect(getTabKey(router.currentRoute.value)).not.toBe(oldKey);
    expect(wrapper.findComponent(Workbench).vm.$).not.toBe(instance);
    expect(Api.getOne).toHaveBeenCalledTimes(2);
  });
  it('默认首个文档原文件，不提前请求解析全文，也没有旧处理结果入口', async () => {
    const { wrapper } = await render();
    expect(wrapper.find('[aria-label="原文件预览"]').exists()).toBe(true);
    expect(Api.getDetail).toHaveBeenCalledWith(1);
    expect(Api.getContent).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('查看处理结果');
    expect(Api.retryCompile).not.toHaveBeenCalled();
  });
  it('深链接恢复文档和阅读视图，切文档保留视图且前进后退恢复', async () => {
    const { wrapper, router } = await render('?tab=content&doc=2&view=reading');
    expect(Api.getContent).toHaveBeenCalledWith(2);
    await wrapper
      .findAll('.kb-directory button')
      .find((node) => node.text() === '文档1.md')
      ?.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ doc: '1', view: 'reading' });
    expect(Api.getContent).toHaveBeenCalledWith(1);
    router.back();
    await flushPromises();
    expect(router.currentRoute.value.query.doc).toBe('2');
    router.forward();
    await flushPromises();
    expect(router.currentRoute.value.query.doc).toBe('1');
  });
  it('关联临时收起目录，退出恢复先前展开或收起状态', async () => {
    const { wrapper } = await render();
    expect(wrapper.find('.kb-directory').exists()).toBe(true);
    await tab(wrapper, '文档关联');
    expect(wrapper.find('.kb-directory').exists()).toBe(false);
    await tab(wrapper, '原文件');
    expect(wrapper.find('.kb-directory').exists()).toBe(true);
    await wrapper.get('[aria-label="收起文档目录"]').trigger('click');
    await tab(wrapper, '文档关联');
    await tab(wrapper, '原文件');
    expect(wrapper.find('.kb-directory').exists()).toBe(false);
  });
  it('乱序详情不得盖掉新文档；共享库没有上传操作', async () => {
    let resolveOld!: (value: KnowledgeDetail) => void;
    vi.mocked(Api.getDetail).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const { wrapper, router } = await render('', 'tenant');
    await router.push('/kb/38?doc=2');
    await flushPromises();
    resolveOld(detail(1));
    await flushPromises();
    expect(wrapper.get('.kb-document-toolbar h2').text()).toBe('文档2.md');
    expect(wrapper.text()).not.toContain('上传文档');
    expect(Api.getContent).not.toHaveBeenCalled();
  });
});
