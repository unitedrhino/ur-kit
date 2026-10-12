/** 文件说明：字段级引用的纯逻辑——方向判定、定位摘要、分组排序、搜索过滤、定位预填与表单校验，供面板、表单、视图与测试复用。 */

import { $t } from '../../locales';
import type { KnowledgeArtifact, KnowledgeFieldEndpoint, KnowledgeFieldLocator, KnowledgeFieldReference } from './data';

/** 引用相对当前文档的方向：outgoing 为本文引用外部段落，incoming 为外部段落引用本文（影响分析）。 */
export type KnowledgeFieldReferenceDirection = 'incoming' | 'outgoing';

/** 引用端点提交结构：documentID 必填；locator 为展开的定位对象。 */
export interface KnowledgeFieldEndpointInput {
  artifactID?: number;
  documentID: number;
  locator: KnowledgeFieldLocator;
}

/** 被编辑/新挂一侧的既有端点快照；locator 与 documentID 允许缺失（历史数据未记录定位）。 */
export interface KnowledgeFieldReferenceAnchor {
  artifactID?: number;
  documentID?: number;
  locator?: KnowledgeFieldLocator;
}

/** 字段引用表单的定位类型：与契约 kind 取值一致，键名小驼峰。 */
export type KnowledgeFieldReferenceKind = 'chunk_section' | 'equation' | 'table_formula';

/** 表单可选的定位类型及当前语言标签。 */
export const fieldReferenceKindOptions: Array<{ label: string; value: KnowledgeFieldReferenceKind }> = [
  {
    /** 按当前界面语言返回章节定位名称。 */
    get label() {
      return $t('knowledgeBase.text_f82fcf82e847');
    },
    value: 'chunk_section',
  },
  {
    /** 按当前界面语言返回表格公式定位名称。 */
    get label() {
      return $t('knowledgeBase.text_1bd2cc5021ec');
    },
    value: 'table_formula',
  },
  {
    /** 按当前界面语言返回独立公式定位名称。 */
    get label() {
      return $t('knowledgeBase.text_99d6f7284050');
    },
    value: 'equation',
  },
];

/** 字段引用表单值：定位字段全部保留为文本，提交时按 kind 装配。 */
export interface KnowledgeFieldReferenceFormValues {
  /** 选中的目标章节（切片）产物 id；0 表示未选，chunk_section 提交前必须选中以锚定产物。 */
  artifactID: number;
  cell: string;
  documentID: number;
  evidence: string;
  formula: string;
  headingPath: string;
  kind: KnowledgeFieldReferenceKind;
  latex: string;
  /** 页码从 1 开始的展示文本；空串表示未填。 */
  pageIdx: string;
  /** 逗号分隔的参数名。 */
  paramNames: string;
  sheet: string;
}

/** 字段引用表单提交载荷：新增走 create 载荷，编辑/重挂走带 id 与 side 的 update 载荷。 */
export type KnowledgeFieldReferenceSubmitPayload =
  | { data: { evidence: string; from: KnowledgeFieldEndpointInput; to: KnowledgeFieldEndpointInput }; kind: 'create' }
  | { data: { endpoint: KnowledgeFieldEndpointInput; evidence: string; id: number; side: 'from' | 'to' }; kind: 'update' };

/** fieldReferenceDirection 判定引用相对当前文档的方向；两端都不是当前文档时返回 undefined。 */
export function fieldReferenceDirection(reference: KnowledgeFieldReference, documentID: number): KnowledgeFieldReferenceDirection | undefined {
  if (reference.from?.documentID === documentID) return 'outgoing';
  if (reference.to?.documentID === documentID) return 'incoming';
  return undefined;
}

/** fieldLocatorSummary 把定位器压缩成一行摘要：Sheet1!B12、章节标题 · 第 N 页、LaTeX 等，展开证据里仍有完整字段。 */
export function fieldLocatorSummary(locator?: KnowledgeFieldLocator): string {
  if (!locator) return '';
  if (locator.kind === 'table_formula') {
    if (locator.sheet && locator.cell) return `${locator.sheet}!${locator.cell}`;
    return locator.formula || locator.sheet || locator.cell || '';
  }
  if (locator.kind === 'equation') return locator.latex || locator.formula || '';
  if (locator.kind === 'external') return [locator.app, locator.refType, locator.paramKey].filter(Boolean).join(' · ');
  const heading = locator.headingPath || '';
  const page = typeof locator.pageIdx === 'number' && locator.pageIdx >= 0 ? $t('knowledgeBase.text_547001430c9e', { arg0: locator.pageIdx + 1 }) : '';
  return [heading, page].filter(Boolean).join(' · ');
}

/** referenceParamNames 取引用的参数名：优先引用方，缺省回退被引用方。 */
export function referenceParamNames(reference: KnowledgeFieldReference): string[] {
  return reference.from?.locator?.paramNames?.length ? reference.from.locator.paramNames : (reference.to?.locator?.paramNames ?? []);
}

/** 排序权重：失效置顶，其余按 id 稳定排列，保证跨刷新顺序一致。 */
function pendingRank(reference: KnowledgeFieldReference): number {
  return reference.reviewStatus === 'pending_review' ? 0 : 1;
}

function compareReferences(left: KnowledgeFieldReference, right: KnowledgeFieldReference): number {
  return pendingRank(left) - pendingRank(right) || (left.id ?? 0) - (right.id ?? 0);
}

/** 字段引用按方向拆分后的两个分组；引用自身（from 与 to 同文档）会同时出现在两侧。 */
export interface KnowledgeFieldReferenceGroups {
  incoming: KnowledgeFieldReference[];
  outgoing: KnowledgeFieldReference[];
}

/** groupFieldReferences 按方向拆分并去重，失效置顶；列表装配的记录缺少方向时丢弃。 */
export function groupFieldReferences(documentID: number, references: KnowledgeFieldReference[]): KnowledgeFieldReferenceGroups {
  const groups: KnowledgeFieldReferenceGroups = { incoming: [], outgoing: [] };
  for (const reference of references) {
    const direction = fieldReferenceDirection(reference, documentID);
    if (!direction) continue;
    const bucket = groups[direction];
    if (bucket.some((item) => item.id === reference.id)) continue;
    bucket.push(reference);
  }
  groups.incoming.sort(compareReferences);
  groups.outgoing.sort(compareReferences);
  return groups;
}

/** filterFieldReferences 按关键词匹配对端文档名、参数名和定位摘要，用于与语义关联共用的搜索框。 */
export function filterFieldReferences(references: KnowledgeFieldReference[], keyword: string): KnowledgeFieldReference[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return references;
  return references.filter((reference) => {
    const haystack = [
      reference.fromDocumentName,
      reference.toDocumentName,
      ...referenceParamNames(reference),
      fieldLocatorSummary(reference.from?.locator),
      fieldLocatorSummary(reference.to?.locator),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

/** 参数表噪音行：来源/备注/单位等说明性第一列不作为参数名。 */
const tableParamNoisePattern = /^(来源|来源依据|备注|说明|参考|单位)$/;

/** isMarkdownSeparatorRow 判断表格行是否为 `---` 分隔行。 */
function isMarkdownSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => cell === '' || /^:?-{2,}:?$/.test(cell));
}

/** parseMarkdownRow 解析一行 Markdown 表格的单元格；非表格行返回空数组。 */
function parseMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || trimmed.length < 2) return [];
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

/** tableParamNamesFromContent 从 Markdown 表格提取参数名：仅识别第一列为「参数」的表头，取数据行第一列并过滤分隔行与噪音行；非参数表返回空数组。 */
export function tableParamNamesFromContent(content: string): string[] {
  const names: string[] = [];
  let collecting = false;
  for (const line of (content ?? '').split('\n')) {
    const cells = parseMarkdownRow(line);
    if (cells.length === 0) continue;
    if (!collecting) {
      collecting = (cells[0] ?? '').includes('参数');
      continue;
    }
    if (isMarkdownSeparatorRow(cells)) continue;
    const name = cells[0] ?? '';
    if (!name || tableParamNoisePattern.test(name) || names.includes(name)) continue;
    names.push(name);
  }
  return names;
}

/** artifactLocator 从解析产物预填引用定位：公式取正文为 LaTeX；表格优先读取解析 meta 的公式与单元格，并从「参数」表头的 Markdown 表格提取参数名；提取不到的字段留空由人工补全（契约字段均可选，kind 必须保留）。 */
export function artifactLocator(artifact: KnowledgeArtifact): KnowledgeFieldLocator {
  const locator: KnowledgeFieldLocator =
    artifact.artifactType === 'equation' ? { kind: 'equation', latex: artifact.content?.trim() || '' } : { kind: 'table_formula' };
  if (artifact.artifactType !== 'equation') {
    if (artifact.extraJSON) {
      try {
        const meta = JSON.parse(artifact.extraJSON) as Record<string, unknown>;
        for (const key of ['cell', 'formula', 'sheet'] as const) {
          const value = meta[key];
          if (typeof value === 'string' && value.trim()) locator[key] = value.trim();
        }
      } catch {
        // extraJSON 并非保证是 JSON 的解析 meta，解析失败时静默放弃预填，不阻塞人工填写
      }
    }
    // xlsx 原始公式只存在于 content_list 解析层，产物上通常没有 sheet/cell；参数表（参数名/取值表头）是产物上可稳定提取的定位明细
    const paramNames = tableParamNamesFromContent(artifact.content ?? '');
    if (paramNames.length > 0) locator.paramNames = paramNames;
  }
  if (artifact.headingPath) locator.headingPath = artifact.headingPath;
  if (typeof artifact.pageIdx === 'number' && artifact.pageIdx >= 0) locator.pageIdx = artifact.pageIdx;
  return locator;
}

/** emptyFieldReferenceForm 返回指定文档下的空白表单值。 */
export function emptyFieldReferenceForm(documentID = 0): KnowledgeFieldReferenceFormValues {
  return {
    artifactID: 0,
    cell: '',
    documentID,
    evidence: '',
    formula: '',
    headingPath: '',
    kind: 'chunk_section',
    latex: '',
    pageIdx: '',
    paramNames: '',
    sheet: '',
  };
}

/** parseParamNames 拆分中英文逗号、分号分隔的参数名，去空白并去重，保持填写顺序。 */
export function parseParamNames(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[,，;；]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

/** validateFieldReferenceForm 返回逐字段错误文案；全部通过返回空对象。定位要求随 kind 切换。 */
export function validateFieldReferenceForm(values: KnowledgeFieldReferenceFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isSafeInteger(values.documentID) || values.documentID <= 0) errors.documentID = $t('knowledgeBase.text_b1b714249c2e');
  if (parseParamNames(values.paramNames).length === 0) errors.paramNames = $t('knowledgeBase.text_09dc43de4250');
  // 章节引用必须锚定到切片产物（服务端按 artifactID 校验归属并快照版本），标题路径随章节选择自动回填
  if (values.kind === 'chunk_section') {
    if (!Number.isSafeInteger(values.artifactID) || values.artifactID <= 0) errors.artifactID = $t('knowledgeBase.text_9afdbb3b553f');
    else if (!values.headingPath.trim()) errors.headingPath = $t('knowledgeBase.text_f997e8690102');
  }
  // xlsx 原始公式/单元格只在 content_list 解析层，产物上常不可得；已有参数名等定位明细时不再强制补填公式
  if (
    values.kind === 'table_formula' &&
    !values.formula.trim() &&
    !values.cell.trim() &&
    !values.sheet.trim() &&
    parseParamNames(values.paramNames).length === 0
  ) {
    errors.formula = $t('knowledgeBase.text_8711bd84b74f');
  }
  if (values.kind === 'equation' && !values.latex.trim()) errors.latex = $t('knowledgeBase.text_20c1df14d36e');
  if (values.pageIdx.trim() && !/^\d+$/.test(values.pageIdx.trim())) errors.pageIdx = $t('knowledgeBase.text_d62400e1c7f7');
  return errors;
}

/** toFormLocator 把表单值装配成契约定位器对象；未填字段不携带，便于服务端按 kind 校验。 */
export function toFormLocator(values: KnowledgeFieldReferenceFormValues): KnowledgeFieldLocator {
  const locator: KnowledgeFieldLocator = { kind: values.kind, paramNames: parseParamNames(values.paramNames) };
  if (values.pageIdx.trim()) locator.pageIdx = Number(values.pageIdx.trim());
  if (values.kind === 'table_formula') {
    if (values.cell.trim()) locator.cell = values.cell.trim();
    if (values.formula.trim()) locator.formula = values.formula.trim();
    if (values.sheet.trim()) locator.sheet = values.sheet.trim();
  }
  if (values.kind === 'equation' && values.latex.trim()) locator.latex = values.latex.trim();
  if (values.kind === 'chunk_section' && values.headingPath.trim()) locator.headingPath = values.headingPath.trim();
  return locator;
}

/** formValuesFromEndpoint 从既有端点回填表单，供编辑与重挂场景初始值使用（含产物 id 预填）。 */
export function formValuesFromEndpoint(endpoint: KnowledgeFieldEndpoint | undefined, fallbackDocumentID = 0): KnowledgeFieldReferenceFormValues {
  const locator = endpoint?.locator;
  const values = emptyFieldReferenceForm(endpoint?.documentID || fallbackDocumentID);
  values.artifactID = endpoint?.artifactID ?? 0;
  if (!locator) return values;
  values.kind = locator.kind === 'table_formula' || locator.kind === 'equation' ? locator.kind : 'chunk_section';
  values.cell = locator.cell ?? '';
  values.formula = locator.formula ?? '';
  values.headingPath = locator.headingPath ?? '';
  values.latex = locator.latex ?? '';
  values.sheet = locator.sheet ?? '';
  values.pageIdx = typeof locator.pageIdx === 'number' && locator.pageIdx >= 0 ? String(locator.pageIdx) : '';
  values.paramNames = (locator.paramNames ?? []).join(', ');
  return values;
}

/** knowledgeSectionOptionLabel 输出章节选择器的选项文案：优先标题路径，回退产物标题，再回退切片序号。 */
export function knowledgeSectionOptionLabel(artifact: KnowledgeArtifact): string {
  return (
    artifact.headingPath?.trim() ||
    artifact.title?.trim() ||
    (artifact.chunkIndex !== undefined
      ? $t('knowledgeBase.text_9ca6cb0254ba', { arg0: artifact.chunkIndex + 1 })
      : $t('knowledgeBase.text_8ee6268edb9e', { arg0: artifact.id }))
  );
}

/** filterKnowledgeSections 按关键词过滤章节切片：匹配标题路径、产物标题与正文摘要，空关键词返回原列表。 */
export function filterKnowledgeSections(sections: KnowledgeArtifact[], keyword: string): KnowledgeArtifact[] {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return sections;
  return sections.filter((section) =>
    [knowledgeSectionOptionLabel(section), section.content?.slice(0, 200) ?? ''].join('\n').toLowerCase().includes(normalized),
  );
}

/** referenceEditableSide 返回属于当前文档的一侧，编辑该侧不会触碰对端文档的快照；无法判定时回退 from。 */
export function referenceEditableSide(reference: KnowledgeFieldReference, documentID: number): 'from' | 'to' {
  return reference.to?.documentID === documentID && reference.from?.documentID !== documentID ? 'to' : 'from';
}
