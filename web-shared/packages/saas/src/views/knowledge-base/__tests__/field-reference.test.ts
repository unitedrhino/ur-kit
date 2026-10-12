/** 文件说明：字段级引用的状态映射、方向分组、定位摘要、表单校验与面板交互回归测试。 */
import type { KnowledgeArtifact, KnowledgeDetail, KnowledgeFieldReference } from '../data';

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fieldReferenceReviewLabel,
  fieldReferenceReviewVariant,
  fieldReferenceSourceLabel,
  fieldReferenceStatusLabel,
  fieldReferenceStatusVariant,
} from '../data';
import {
  artifactLocator,
  emptyFieldReferenceForm,
  fieldLocatorSummary,
  filterFieldReferences,
  filterKnowledgeSections,
  formValuesFromEndpoint,
  groupFieldReferences,
  knowledgeSectionOptionLabel,
  parseParamNames,
  referenceEditableSide,
  tableParamNamesFromContent,
  toFormLocator,
  validateFieldReferenceForm,
} from '../field-reference';
import FieldReferencePanel from '../field-reference-panel.vue';
import { Api } from '../index.api';

vi.mock('../index.api', () => ({ Api: { getFieldReferences: vi.fn(), getTree: vi.fn() } }));
// Sheet 弹层保持真实交互，这里只隔离标题注入，避免重复 id 干扰断言。
vi.mock('@unitedrhino/saas-ui/ui/sheet', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@unitedrhino/saas-ui/ui/sheet')>()),
  SheetTitle: { template: '<h2><slot /></h2>' },
  SheetDescription: { template: '<p><slot /></p>' },
}));

/** reference 生成一条 43 引用 48 的确认记录，按需覆写方向与状态。 */
function reference(overrides: Partial<KnowledgeFieldReference> = {}): KnowledgeFieldReference {
  return {
    id: 1,
    source: 'ai',
    status: 'confirmed',
    reviewStatus: 'up_to_date',
    score: 0.92,
    evidence: '参数系数来自公约计费公式',
    from: { documentID: 43, artifactID: 450, locator: { kind: 'table_formula', sheet: 'Sheet1', cell: 'B12', paramNames: ['系数'] } },
    to: { documentID: 48, artifactID: 580, locator: { kind: 'equation', latex: '单价 = 基价 * 系数' } },
    fromDocumentName: '报价表.xlsx',
    toDocumentName: '行业公约.md',
    ...overrides,
  };
}

/** incomingReference 生成一条 48 引用 43 的记录（影响分析方向）。 */
function incomingReference(overrides: Partial<KnowledgeFieldReference> = {}): KnowledgeFieldReference {
  return reference({
    id: 3,
    from: { documentID: 48, artifactID: 580, locator: { kind: 'equation', latex: '单价 = 基价 * 系数' } },
    to: { documentID: 43, artifactID: 450, locator: { kind: 'table_formula', sheet: 'Sheet1', cell: 'B12', paramNames: ['系数'] } },
    fromDocumentName: '行业公约.md',
    toDocumentName: '报价表.xlsx',
    ...overrides,
  });
}

const documentID = 43;
const wrappers: ReturnType<typeof mount>[] = [];

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

describe('字段引用状态与来源文案', () => {
  it('状态徽章覆盖确认、待确认、已拒绝与未知值', () => {
    expect(fieldReferenceStatusLabel('confirmed')).toBe('已确认');
    expect(fieldReferenceStatusLabel('candidate')).toBe('待确认');
    expect(fieldReferenceStatusLabel('rejected')).toBe('已拒绝');
    expect(fieldReferenceStatusLabel('other')).toBe('other');
    expect(fieldReferenceStatusLabel(undefined)).toBe('-');
    expect(fieldReferenceStatusVariant('confirmed')).toBe('default');
    expect(fieldReferenceStatusVariant('candidate')).toBe('secondary');
    expect(fieldReferenceStatusVariant('rejected')).toBe('outline');
  });

  it('同步状态徽章区分失效与无变化，来源区分 AI 自动与人工', () => {
    expect(fieldReferenceReviewLabel('pending_review')).toBe('失效');
    expect(fieldReferenceReviewLabel('up_to_date')).toBe('无变化');
    expect(fieldReferenceReviewVariant('pending_review')).toBe('destructive');
    expect(fieldReferenceReviewVariant('up_to_date')).toBe('outline');
    expect(fieldReferenceSourceLabel('ai')).toBe('AI 自动');
    expect(fieldReferenceSourceLabel('manual')).toBe('人工');
    expect(fieldReferenceSourceLabel(undefined)).toBe('AI 自动');
  });
});

describe('字段引用分组与过滤', () => {
  it('按方向拆分并去重，失效置顶', () => {
    const groups = groupFieldReferences(documentID, [reference(), reference(), reference({ id: 2, reviewStatus: 'pending_review' }), incomingReference()]);
    expect(groups.outgoing.map((item) => item.id)).toEqual([2, 1]);
    expect(groups.incoming.map((item) => item.id)).toEqual([3]);
  });

  it('两端都不在当前文档的记录不进入分组', () => {
    const groups = groupFieldReferences(documentID, [reference({ from: { documentID: 90, locator: {} }, to: { documentID: 91, locator: {} } })]);
    expect(groups.outgoing).toHaveLength(0);
    expect(groups.incoming).toHaveLength(0);
  });

  it('搜索匹配对端文档名、参数名与定位摘要', () => {
    const other = reference({
      id: 9,
      from: { documentID: 43, locator: { kind: 'chunk_section' } },
      to: { documentID: 50, locator: { kind: 'chunk_section', headingPath: '第 3 章 计费' } },
      toDocumentName: '收费标准.md',
    });
    const items = [reference(), other];
    expect(filterFieldReferences(items, '公约')).toHaveLength(1);
    expect(filterFieldReferences(items, '系数')).toHaveLength(1);
    expect(filterFieldReferences(items, '收费标准')).toHaveLength(1);
    expect(filterFieldReferences(items, '第 3 章')).toHaveLength(1);
    expect(filterFieldReferences(items, '不存在')).toHaveLength(0);
    expect(filterFieldReferences(items, '')).toHaveLength(2);
  });
});

describe('定位摘要与预填', () => {
  it('表格输出 Sheet!单元格，公式输出 LaTeX，章节输出标题与页码', () => {
    expect(fieldLocatorSummary({ kind: 'table_formula', sheet: 'Sheet1', cell: 'B12' })).toBe('Sheet1!B12');
    expect(fieldLocatorSummary({ kind: 'equation', latex: 'E = mc^2' })).toBe('E = mc^2');
    expect(fieldLocatorSummary({ kind: 'chunk_section', headingPath: '第 3 章 计费', pageIdx: 2 })).toBe('第 3 章 计费 · 第 3 页');
    expect(fieldLocatorSummary({ kind: 'external', app: 'MES', refType: 'tag', paramKey: 'rate' })).toBe('MES · tag · rate');
    expect(fieldLocatorSummary(undefined)).toBe('');
  });

  it('公式产物预填正文 LaTeX，表格产物读取解析 meta、提取参数表并忽略损坏 JSON', () => {
    // KVM 实测：equation 产物正文即 LaTeX；table 产物的 extra_json 只有处理元数据，xlsx 原始公式不在产物上
    const equation = { id: 1, documentID: 43, artifactType: 'equation', content: ' E = mc^2 ', headingPath: '附录', pageIdx: 1 } as KnowledgeArtifact;
    expect(artifactLocator(equation)).toEqual({ headingPath: '附录', kind: 'equation', latex: 'E = mc^2', pageIdx: 1 });
    const table = {
      id: 2,
      documentID: 43,
      artifactType: 'table',
      content: '|月份|单价|',
      extraJSON: '{"sheet":"Sheet1","cell":"B12","formula":"=ROUND(面积*单价,2)"}',
    } as KnowledgeArtifact;
    expect(artifactLocator(table)).toMatchObject({ cell: 'B12', formula: '=ROUND(面积*单价,2)', kind: 'table_formula', sheet: 'Sheet1' });
    const broken = { id: 3, documentID: 43, artifactType: 'table', content: 'x', extraJSON: 'not-json' } as KnowledgeArtifact;
    expect(artifactLocator(broken)).toEqual({ kind: 'table_formula' });
  });

  it('参数表产物提取参数名列表，非参数表与噪音行不产生参数名', () => {
    // 对齐 KVM id=75 产物：参数名/取值两列表格，「来源」说明行不作为参数
    const paramTable = {
      id: 4,
      documentID: 43,
      artifactType: 'table',
      content: '| 参数名 | 取值 |\n| --- | --- |\n| 系数K | 1.05 |\n| 密度ρ(kg/m³) | 2400 |\n| 来源 | 行业公约（测试样本）4.2 计费系数 |',
    } as KnowledgeArtifact;
    expect(artifactLocator(paramTable)).toEqual({ kind: 'table_formula', paramNames: ['系数K', '密度ρ(kg/m³)'] });
    // 表头非「参数」的普通数据表不提取，kind 仍保留
    const plainTable = {
      id: 5,
      documentID: 43,
      artifactType: 'table',
      content: '| 构件报价测算表（测试样本） |  |  |  |\n| --- | --- | --- | --- |\n| 项目 | 单价(元/m³) | 方量(m³) | 计费金额(元) |',
    } as KnowledgeArtifact;
    expect(artifactLocator(plainTable)).toEqual({ kind: 'table_formula' });
    expect(tableParamNamesFromContent('| 参数 | 数值 |\n| --- | --- |\n| 系数K | 1.05 |\n| 系数K | 1.05 |')).toEqual(['系数K']);
  });
});

describe('表单校验与载荷装配', () => {
  it('逐字段校验文档、章节产物、参数名与定位必填项', () => {
    const errors = validateFieldReferenceForm({ ...emptyFieldReferenceForm() });
    expect(Object.keys(errors).sort()).toEqual(['artifactID', 'documentID', 'paramNames']);
    expect(errors.documentID).toContain('选择目标文档');
    // 章节引用必须锚定切片产物，未选章节时优先提示选择章节而非填写标题路径
    const chunkErrors = validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), paramNames: '系数' });
    expect(chunkErrors.artifactID).toContain('选择目标章节');
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), artifactID: 580, paramNames: '系数' }).headingPath).toContain('章节');
    // 表格公式在产物上常不可得：有参数名明细即可保存，完全没有定位明细时仍要求补填
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), kind: 'table_formula', paramNames: '系数' }).formula).toBeUndefined();
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), kind: 'table_formula' }).formula).toContain('公式');
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), kind: 'equation', paramNames: '系数' }).latex).toContain('LaTeX');
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), paramNames: '系数', pageIdx: '-2' }).pageIdx).toContain('页码');
    expect(validateFieldReferenceForm({ ...emptyFieldReferenceForm(48), artifactID: 580, headingPath: '第 3 章', paramNames: '系数', pageIdx: '3' })).toEqual(
      {},
    );
  });

  it('参数名支持中英文逗号分隔并去重保序', () => {
    expect(parseParamNames('系数，单价, 系数;折损')).toEqual(['系数', '单价', '折损']);
  });

  it('从既有端点回填表单并装配回契约定位器', () => {
    const values = formValuesFromEndpoint({
      documentID: 48,
      artifactID: 580,
      locator: { kind: 'table_formula', sheet: 'Sheet1', cell: 'B12', paramNames: ['系数', '单价'], pageIdx: 0 },
    });
    expect(values).toMatchObject({
      artifactID: 580,
      cell: 'B12',
      documentID: 48,
      kind: 'table_formula',
      pageIdx: '0',
      paramNames: '系数, 单价',
      sheet: 'Sheet1',
    });
    expect(toFormLocator(values)).toEqual({ cell: 'B12', kind: 'table_formula', pageIdx: 0, paramNames: ['系数', '单价'], sheet: 'Sheet1' });
    expect(toFormLocator(emptyFieldReferenceForm(48))).toEqual({ kind: 'chunk_section', paramNames: [] });
    // 缺失 artifactID 的历史端点回填为 0，不阻塞编辑
    expect(formValuesFromEndpoint({ documentID: 48, locator: { kind: 'equation', latex: 'E=mc^2' } }).artifactID).toBe(0);
  });

  it('章节选项文案与按关键词过滤', () => {
    const heading: KnowledgeArtifact = {
      artifactType: 'chunk',
      content: '4.2 计费系数 K 取 0.85',
      documentID: 48,
      headingPath: '行业公约 > 4 计费参数 > 4.2 计费系数',
      id: 581,
      knowledgeID: 2,
      title: '行业公约-测试.docx chunk 7',
    };
    const plain: KnowledgeArtifact = {
      artifactType: 'chunk',
      content: '背景说明段落',
      documentID: 48,
      id: 582,
      knowledgeID: 2,
      title: '行业公约-测试.docx chunk 8',
    };
    const indexed: KnowledgeArtifact = { artifactType: 'chunk', chunkIndex: 3, content: 'x', documentID: 48, id: 583, knowledgeID: 2, title: '' };
    expect(knowledgeSectionOptionLabel(heading)).toBe('行业公约 > 4 计费参数 > 4.2 计费系数');
    expect(knowledgeSectionOptionLabel(indexed)).toBe('第 4 片');
    expect(filterKnowledgeSections([heading, plain, indexed], '计费系数')).toEqual([heading]);
    // 正文关键词也能命中，标题过滤不漏内容匹配
    expect(filterKnowledgeSections([heading, plain, indexed], '背景说明')).toEqual([plain]);
    expect(filterKnowledgeSections([heading, plain, indexed], '  ')).toEqual([heading, plain, indexed]);
  });

  it('编辑侧优先选择属于当前文档的一侧', () => {
    expect(referenceEditableSide(reference(), 43)).toBe('from');
    expect(referenceEditableSide(reference(), 48)).toBe('to');
    expect(referenceEditableSide(reference(), 99)).toBe('from');
  });
});

describe('字段引用面板交互', () => {
  it('渲染方向文案、状态与来源徽章，展开可见双侧定位', async () => {
    const wrapper = mount(FieldReferencePanel, { props: { documentID, references: [reference()] } });
    wrappers.push(wrapper);
    const row = wrapper.get('[data-ref-row="1"]');
    expect(row.text()).toContain('引用《行业公约.md》');
    expect(row.text()).toContain('参数「系数」');
    expect(row.text()).toContain('已确认');
    expect(row.text()).toContain('AI 自动');
    expect(row.attributes('aria-expanded')).toBe('false');
    await row.trigger('click');
    expect(row.attributes('aria-expanded')).toBe('true');
    const evidence = wrapper.get(`#${row.attributes('aria-controls')}`);
    expect(evidence.text()).toContain('引用方 · 报价表.xlsx');
    expect(evidence.text()).toContain('Sheet1!B12');
    expect(evidence.text()).toContain('单价 = 基价 * 系数');
    expect(evidence.text()).toContain('引用分数 0.92');
  });

  it('只读不渲染操作，可写时按状态提供动作并上报宿主', async () => {
    const wrapper = mount(FieldReferencePanel, {
      props: { canWrite: true, documentID, references: [reference({ status: 'candidate', reviewStatus: 'pending_review' })] },
    });
    wrappers.push(wrapper);
    const labels = wrapper.findAll('button').map((button) => button.text());
    expect(labels).toContain('确认');
    expect(labels).toContain('拒绝');
    expect(labels).toContain('重新指定');
    expect(labels).toContain('标记无影响');
    expect(labels).toContain('编辑');
    expect(labels).toContain('删除');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '确认')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重新指定')!
      .trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('review')?.[0]?.[0]).toMatchObject({ id: 1 });
    const readonly = mount(FieldReferencePanel, { props: { canWrite: false, documentID, references: [reference()] } });
    wrappers.push(readonly);
    expect(readonly.findAll('button').map((button) => button.text())).not.toContain('删除');
  });

  it('方向过滤只保留对应侧，错误态可重试，失效行带警示样式', async () => {
    const wrapper = mount(FieldReferencePanel, { props: { documentID, direction: 'all', filterable: true, references: [reference(), incomingReference()] } });
    wrappers.push(wrapper);
    expect(wrapper.text()).toContain('全部 2');
    await wrapper.setProps({ direction: 'incoming' });
    expect(wrapper.text()).toContain('《行业公约.md》引用本文');
    expect(wrapper.text()).not.toContain('引用《行业公约.md》');
    await wrapper.setProps({ direction: 'outgoing', error: '加载失败' });
    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败');
    await wrapper.setProps({ error: '' });
    const pending = mount(FieldReferencePanel, { props: { documentID, references: [reference({ reviewStatus: 'pending_review' })] } });
    wrappers.push(pending);
    expect(pending.get('li').classes().join(' ')).toContain('border-destructive');
  });

  it('revealPending 展开并聚焦第一条失效记录', async () => {
    const wrapper = mount(FieldReferencePanel, { props: { documentID, references: [reference(), reference({ id: 2, reviewStatus: 'pending_review' })] } });
    wrappers.push(wrapper);
    const row = wrapper.get('[data-ref-row="2"]');
    const focusSpy = vi.spyOn(row.element as HTMLElement, 'focus');
    await (wrapper.vm as unknown as { revealPending: () => Promise<void> }).revealPending();
    await flushPromises();
    expect(row.attributes('aria-expanded')).toBe('true');
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('空列表与加载态按语义角色呈现', async () => {
    const wrapper = mount(FieldReferencePanel, { props: { canWrite: true, documentID, loading: true, references: [] } });
    wrappers.push(wrapper);
    expect(wrapper.get('[role="status"]').text()).toContain('正在加载');
    await wrapper.setProps({ loading: false });
    expect(wrapper.text()).toContain('暂无字段引用');
    expect(wrapper.text()).toContain('引用外部段落');
  });
});

describe('字段引用条目懒加载', () => {
  it('展开条目时才查询引用，关闭后再展开重新加载并隔离错误', async () => {
    const DocumentReading = (await import('../document-reading.vue')).default;
    const detail: KnowledgeDetail = {
      document: { id: 43, knowledgeID: 38, nodeType: 'file', name: '报价表.xlsx', parentID: 0, path: '报价表.xlsx' },
      multimodalArtifacts: [{ id: 450, knowledgeID: 38, documentID: 43, artifactType: 'table', title: '计费表', content: '|月份|单价|' }],
    };
    vi.mocked(Api.getFieldReferences).mockResolvedValue({ references: [reference()], hasMore: false });
    const wrapper = mount(DocumentReading, { props: { canWrite: true, detail, text: '正文' } });
    wrappers.push(wrapper);
    expect(Api.getFieldReferences).not.toHaveBeenCalled();
    const toggle = () => wrapper.get('button[aria-controls^="artifact-references-"]').trigger('click');
    await toggle();
    await flushPromises();
    expect(Api.getFieldReferences).toHaveBeenCalledExactlyOnceWith({ artifactID: 450, knowledgeID: 38, size: 300 });
    expect(wrapper.text()).toContain('谁引用了我');
    expect(wrapper.text()).toContain('引用《行业公约.md》');
    vi.mocked(Api.getFieldReferences).mockRejectedValueOnce(new Error('network'));
    await toggle();
    await toggle();
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('字段引用加载失败');
  });
});
