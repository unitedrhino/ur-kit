/** 文件说明：验证文档关系优先、双侧证据、懒加载切片及过期请求隔离，不断言样式字符串。 */
import type { KnowledgeArtifact, KnowledgeChunkRelation, KnowledgeDetail, KnowledgeFieldReference } from '../data';

import { flushPromises, mount } from '@vue/test-utils';
import { computed, reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chunkOptionLabel, groupDocumentRelations } from '../document-relations';
import DocumentRelations from '../document-relations.vue';
import { Api } from '../index.api';
import ProcessingResults from '../processing-results.vue';

vi.mock('../index.api', () => ({
  Api: {
    deleteFieldReference: vi.fn(),
    getChunkRelations: vi.fn(),
    getDocumentRelations: vi.fn(),
    getFieldReferences: vi.fn(),
    getTree: vi.fn(),
    reviewFieldReference: vi.fn(),
    updateFieldReference: vi.fn(),
  },
}));
// 高级内容在页面中有 Dialog 宿主；此处只隔离标题注入，不替换交互控件。
vi.mock('@unitedrhino/saas-ui/ui/dialog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@unitedrhino/saas-ui/ui/dialog')>()),
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
}));
/** 模拟真实容器尺寸而非 CSS class，验证宽窄切换及按高度分页。 */
const geometry = reactive({ main: 1200, width: 800, height: 600 });
vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vueuse/core')>()),
  useElementSize: (target: { value?: HTMLElement }) => ({
    width: computed(() => (target.value?.getAttribute('aria-label') === '文档关系浏览' ? geometry.main : geometry.width)),
    height: computed(() => geometry.height),
  }),
}));

/** fixture 用少量合成原文验证文档与切片的层次，不依赖真实模型。 */
function fixture(): KnowledgeDetail {
  return {
    document: { id: 43, knowledgeID: 38, nodeType: 'file', name: 'GB28181.md', path: 'GB28181.md' },
    chunks: [{ id: 450, knowledgeID: 38, documentID: 43, artifactType: 'chunk', chunkIndex: 42, title: '重复文件名', content: '绑定字段 avDeviceID' }],
  };
}

/** sourceChunk 返回已校验的测试切片，缺失时明确报告夹具错误。 */
function sourceChunk(): KnowledgeArtifact {
  const chunk = fixture().chunks?.[0];
  if (!chunk) throw new Error('测试夹具缺少切片');
  return chunk;
}

/** relation 返回当前文档的出边；原文与模型关联理由分开。 */
function relation(): KnowledgeChunkRelation {
  return {
    id: 1,
    fromDocumentID: 43,
    toDocumentID: 48,
    fromArtifactID: 450,
    toArtifactID: 580,
    score: 0.88,
    relationType: 'similar',
    evidence: '共享绑定与自动回收机制',
    sourceArtifact: sourceChunk(),
    targetDocument: { id: 48, knowledgeID: 38, nodeType: 'file', name: 'RTSP-RTMP.md', path: 'RTSP-RTMP.md' },
    targetArtifact: { id: 580, knowledgeID: 38, documentID: 48, artifactType: 'chunk', content: '解绑后回收 iot_ 设备' },
  };
}

/** wrappers 用于在每个用例结束时清理监听器及未完成请求。 */
const wrappers: ReturnType<typeof mount>[] = [];
/** render 挂载真实关系面板，登记清理。 */
function render(detail = fixture()) {
  const wrapper = mount(DocumentRelations, { props: { detail } });
  wrappers.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  Object.assign(geometry, { main: 1200, width: 800, height: 600 });
  vi.clearAllMocks();
  vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations: [relation()] });
  vi.mocked(Api.getChunkRelations).mockResolvedValue({ relations: [] });
});
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

describe('文档优先关系浏览', () => {
  it('首屏一次查询文档，图谱直接可见且不请求切片', async () => {
    const wrapper = render();
    await flushPromises();
    expect(Api.getDocumentRelations).toHaveBeenCalledExactlyOnceWith(43);
    expect(Api.getChunkRelations).not.toHaveBeenCalled();
    expect(wrapper.get('svg[aria-label="当前文档的关联图"]').exists()).toBe(true);
    expect(wrapper.find('select').exists()).toBe(false);
    expect(wrapper.find('[aria-label="关联原文证据"]').exists()).toBe(false);
  });
  it('键盘激活连线展示理由及两端原文，保留入边方向', async () => {
    vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations: [{ ...relation(), fromDocumentID: 48, toDocumentID: 43 }] });
    const wrapper = render();
    await flushPromises();
    await wrapper.get('path[role="button"]').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    const panel = wrapper.get('[aria-label="关联原文证据"]');
    expect(panel.text()).toContain('共享绑定与自动回收机制');
    expect(panel.text()).toContain('绑定字段 avDeviceID');
    expect(panel.text()).toContain('解绑后回收 iot_ 设备');
    expect(panel.text()).toContain('关联文档 → 当前文档');
  });
  it('高级信息搜索切片按需加载而非铺满按钮', async () => {
    const wrapper = mount(ProcessingResults, { props: { detail: fixture() } });
    wrappers.push(wrapper);
    await flushPromises();
    expect(Api.getChunkRelations).not.toHaveBeenCalled();
    await wrapper.get('input[aria-label="搜索切片"]').setValue('绑定');
    expect(wrapper.get('select').text()).toContain('#42 · 绑定字段');
    await wrapper.get('select').setValue('450');
    await flushPromises();
    expect(Api.getChunkRelations).toHaveBeenCalledExactlyOnceWith(450, { limit: 20, minScore: 0 });
    expect(wrapper.text()).toContain('当前切片暂无关系');
  });
  it('错误不冒充空结果，支持重试及截断提示', async () => {
    vi.mocked(Api.getDocumentRelations).mockRejectedValueOnce(new Error('network'));
    const wrapper = render();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败');
    expect(wrapper.text()).not.toContain('暂无跨文档关联');
    vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations: [relation()], hasMore: true });
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('不是全量统计');
  });
  it('切换文档时过期响应不能覆盖新文档空状态', async () => {
    let resolveOld!: (value: { relations: KnowledgeChunkRelation[] }) => void;
    vi.mocked(Api.getDocumentRelations).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const wrapper = render();
    vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations: [] });
    await wrapper.setProps({ detail: { ...fixture(), document: { ...fixture().document, id: 99 } } });
    await flushPromises();
    resolveOld({ relations: [relation()] });
    await flushPromises();
    // 空态文案随阶段未生成合并为「语义关联尚未生成」，过期的高分关系不得覆盖
    expect(wrapper.text()).toContain('语义关联尚未生成');
    expect(wrapper.text()).not.toContain('RTSP-RTMP.md');
  });
  it('同文档刷新自动更新关系，无需再次打开图谱', async () => {
    const wrapper = render();
    await flushPromises();
    vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations: [] });
    await wrapper.setProps({ detail: { ...fixture() } });
    await flushPromises();
    expect(Api.getDocumentRelations).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('语义关联尚未生成');
  });
  it('高级信息只读状态不提供重试，关系阶段不沿用文档成功状态', async () => {
    const wrapper = mount(ProcessingResults, {
      props: {
        detail: {
          ...fixture(),
          lastCompileTask: { id: 1, knowledgeID: 38, status: 'success', triggerType: 'manual', relationStatus: 'failed', relationMessage: '关系处理失败记录' },
        },
        initialSection: 'status',
        canRetry: false,
      },
    });
    wrappers.push(wrapper);
    await flushPromises();
    expect(wrapper.text()).toContain('关系处理失败记录');
    expect(wrapper.text()).not.toContain('重新处理');
    expect(Api.getChunkRelations).not.toHaveBeenCalled();
  });
  it('有章节标题的切片仍可按完整正文搜索，不受摘要截断影响', async () => {
    const wrapper = mount(ProcessingResults, {
      props: { detail: { ...fixture(), chunks: [{ ...sourceChunk(), headingPath: '设备绑定', content: `${'正文'.repeat(60)} avDeviceID` }] } },
    });
    wrappers.push(wrapper);
    await flushPromises();
    await wrapper.get('input[aria-label="搜索切片"]').setValue('avDeviceID');
    expect(wrapper.find('option[value="450"]').exists()).toBe(true);
  });
  it('多文档分页和搜索不重复请求接口', async () => {
    const relations = Array.from({ length: 7 }, (_, index) => ({
      ...relation(),
      id: index + 1,
      targetDocument: { ...fixture().document, id: 100 + index, name: `协议 ${index}.md` },
      targetArtifact: { ...sourceChunk(), id: 600 + index, documentID: 100 + index },
    }));
    vi.mocked(Api.getDocumentRelations).mockResolvedValue({ relations });
    const wrapper = render();
    await flushPromises();
    expect(wrapper.findAll('path[role="button"]')).toHaveLength(6);
    const next = wrapper.findAll('button').find((button) => button.text() === '下一页');
    await next?.trigger('click');
    expect(wrapper.findAll('path[role="button"]')).toHaveLength(1);
    await wrapper.get('input[aria-label="搜索关联文档"]').setValue('协议 0');
    expect(wrapper.get('path[role="button"]').attributes('aria-label')).toContain('协议 0');
    expect(Api.getDocumentRelations).toHaveBeenCalledTimes(1);
  });
  it('实际画布窄于 640 时改为列表，窄主区的证据使用可关闭侧栏', async () => {
    Object.assign(geometry, { main: 900, width: 500, height: 360 });
    const wrapper = render();
    await flushPromises();
    expect(wrapper.find('svg').exists()).toBe(false);
    await wrapper.get('[aria-label="文档关联列表"] button').trigger('click');
    await flushPromises();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('绑定字段 avDeviceID');
    const close = [...document.querySelectorAll('button')].find((button) => button.textContent === '关闭证据');
    close?.click();
    await flushPromises();
    expect(wrapper.find('aside').exists()).toBe(false);
  });
  it('切片选择乱序不覆盖新的关联结果', async () => {
    let resolveOld!: (value: { relations: KnowledgeChunkRelation[] }) => void;
    vi.mocked(Api.getChunkRelations).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const wrapper = mount(ProcessingResults, { props: { detail: { ...fixture(), chunks: [sourceChunk(), { ...sourceChunk(), id: 451 }] } } });
    wrappers.push(wrapper);
    await wrapper.get('select').setValue('450');
    await wrapper.get('select').setValue('451');
    await flushPromises();
    resolveOld({ relations: [relation()] });
    await flushPromises();
    expect(wrapper.text()).not.toContain('共享绑定与自动回收机制');
    expect(wrapper.text()).toContain('当前切片暂无关系');
  });
});

describe('文档聚合边界', () => {
  it('重复记录不重复计数，缺证据和同文档关系不混入文档图', () => {
    const valid = relation();
    expect(
      groupDocumentRelations(43, [valid, valid, { ...valid, id: 2, sourceArtifact: undefined }, { ...valid, id: 3, targetDocument: fixture().document }]),
    ).toHaveLength(1);
    expect(groupDocumentRelations(43, [valid, valid])[0]?.relations).toHaveLength(1);
    expect(chunkOptionLabel(sourceChunk())).toContain('绑定字段');
  });
});

/** fieldReference 返回一条失效（自动重锚定失败）的入边引用：外部文档引用本文。 */
function fieldReference(): KnowledgeFieldReference {
  return {
    id: 71,
    source: 'ai',
    status: 'confirmed',
    reviewStatus: 'pending_review',
    score: 0.9,
    evidence: '对端内容已更新',
    from: { documentID: 48, artifactID: 580, locator: { kind: 'equation', latex: '单价 = 基价 * 系数', paramNames: ['系数'] } },
    to: { documentID: 43, artifactID: 450, locator: { kind: 'table_formula', sheet: 'Sheet1', cell: 'B12', paramNames: ['系数'] } },
    fromDocumentName: '行业公约.md',
    toDocumentName: 'GB28181.md',
  };
}

describe('字段引用子视图', () => {
  it('默认保持语义图谱，切换后才正反各查一次并分组展示', async () => {
    const wrapper = render();
    await flushPromises();
    expect(Api.getFieldReferences).not.toHaveBeenCalled();
    vi.mocked(Api.getFieldReferences).mockImplementation(async (options: { fromDocumentID?: number; toDocumentID?: number }) =>
      options.fromDocumentID ? { references: [] } : { references: [fieldReference()] },
    );
    await wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.text().includes('字段引用'))!
      .trigger('mousedown');
    await flushPromises();
    expect(wrapper.text()).toContain('本文引用的外部段落');
    expect(wrapper.text()).toContain('引用本文的位置');
    expect(wrapper.text()).toContain('《行业公约.md》引用本文');
    expect(wrapper.text()).toContain('⚠ 含失效');
    expect(Api.getFieldReferences).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).not.toContain('正在加载文档关联');
  });

  it('失效提示条只在有计数时出现，查看跳转反向分组并展开失效条目', async () => {
    vi.mocked(Api.getFieldReferences).mockResolvedValue({ references: [fieldReference()] });
    const wrapper = render();
    await flushPromises();
    expect(wrapper.text()).not.toContain('处字段引用失效');
    await wrapper.setProps({ pendingCount: 2 });
    const notice = wrapper.findAll('[role="status"]').find((item) => item.text().includes('处字段引用失效'));
    expect(notice).toBeDefined();
    vi.mocked(Api.getFieldReferences).mockImplementation(async (options: { fromDocumentID?: number; toDocumentID?: number }) =>
      options.fromDocumentID ? { references: [] } : { references: [fieldReference()] },
    );
    await notice!.get('button').trigger('click');
    await flushPromises();
    const pendingRow = wrapper.get('[data-ref-row="71"]');
    expect(pendingRow.attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('对端内容已更新');
  });

  it('重新指定打开重挂表单，保存只替换 to 侧并自动刷新', async () => {
    vi.mocked(Api.getFieldReferences).mockImplementation(async (options: { fromDocumentID?: number; toDocumentID?: number }) =>
      options.fromDocumentID ? { references: [] } : { references: [fieldReference()] },
    );
    const wrapper = mount(DocumentRelations, { props: { canWrite: true, detail: fixture() } });
    wrappers.push(wrapper);
    await flushPromises();
    await wrapper
      .findAll('[role="tab"]')
      .find((tab) => tab.text().includes('字段引用'))!
      .trigger('mousedown');
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重新指定')!
      .trigger('click');
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('重挂被引用位置');
    vi.mocked(Api.updateFieldReference).mockResolvedValue({ id: 71 });
    const save = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === '保存');
    save?.click();
    await flushPromises();
    expect(Api.updateFieldReference).toHaveBeenCalledExactlyOnceWith({
      endpoint: { artifactID: 450, documentID: 43, locator: { cell: 'B12', kind: 'table_formula', paramNames: ['系数'], sheet: 'Sheet1' } },
      evidence: '对端内容已更新',
      id: 71,
      side: 'to',
    });
    expect(Api.getFieldReferences).toHaveBeenCalledTimes(4);
  });
});
