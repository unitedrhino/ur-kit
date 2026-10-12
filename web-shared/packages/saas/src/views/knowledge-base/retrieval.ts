/**
 * 文件说明：知识库检索测试的共享数据结构与展示辅助函数。
 */

import { $t } from '../../locales';
export interface KnowledgeSearchOption {
  label: string;
  value: number;
}

export interface KnowledgeSearchDocument {
  chunkCount?: number;
  documentID: number;
  documentName: string;
  knowledgeID: number;
  path: string;
  score: number;
  snippet?: string;
}

export interface KnowledgeSearchHit {
  artifactID: number;
  charEnd?: number;
  charStart?: number;
  chunkIndex?: number;
  content?: string;
  documentID: number;
  documentName: string;
  knowledgeID: number;
  /** 来源页码（0 基）；证据 chip 打开文档时作为 PDF 定位先验透传。 */
  pageIdx?: number;
  path: string;
  relationType?: string;
  /** 关联补充切片的关系判定依据（关系生成时记录的证据文案）；直接命中为空。 */
  relationEvidence?: string;
  /** 关联补充切片的关系综合分；直接命中缺省，展示时回退 score。 */
  relationScore?: number;
  score: number;
  snippet?: string;
  sourceArtifactID?: number;
  sourceType?: string;
}

export interface KnowledgeSearchResponse {
  chunks: KnowledgeSearchHit[];
  confidenceBand?: string;
  documents: KnowledgeSearchDocument[];
  expandedChunks: KnowledgeSearchHit[];
  list?: KnowledgeSearchHit[];
  originalQuery?: string;
  rewrittenQuery?: string;
  searchReady?: boolean;
  /** 后端返回的候选总数；大于返回切片数说明有候选被阈值过滤，未返回时与切片数一致。 */
  total?: number;
}

export interface KnowledgeSearchEmptyState {
  /** 候选数；仅低于阈值空态下有效。 */
  candidateCount: number;
  /** 空态种类：below-threshold 有候选未达阈值；no-results 真无结果。 */
  kind: 'below-threshold' | 'no-results';
}

/**
 * resolveKnowledgeSearchEmptyState 判定空结果属于"有候选低于阈值"还是"无结果"。
 * 判据是响应 total 与实际返回切片数之差：total 更大说明检索找到了候选但被
 * 相关度阈值过滤，应提示调低 minScore 而不是换知识库。total 缺省（如聊天
 * SSE 旧载荷）时按无结果处理，后端补充候选计数后此分支自动生效。
 */
export function resolveKnowledgeSearchEmptyState(result: { chunks?: unknown[]; total?: number }): KnowledgeSearchEmptyState {
  const returned = result.chunks?.length ?? 0;
  const total = Number(result.total ?? returned);
  if (Number.isFinite(total) && total > returned) return { candidateCount: total, kind: 'below-threshold' };
  return { candidateCount: 0, kind: 'no-results' };
}

/** emptyStateHint 把空态判定转成检索测试空态区的标题与建议文案键；文案由调用方经 $t 渲染以支持多语言。 */
export function emptyStateHint(state: KnowledgeSearchEmptyState): {
  descriptionKey: string;
  titleKey: string;
  /** 标题/描述键所需的插值参数，如低阈值候选数。 */
  values?: Record<string, unknown>;
} {
  if (state.kind === 'below-threshold') {
    return {
      descriptionKey: 'knowledgeBase.searchBelowThresholdDescription',
      titleKey: 'knowledgeBase.searchBelowThresholdTitle',
      values: { count: state.candidateCount },
    };
  }
  return { descriptionKey: 'knowledgeBase.searchNoResultsDescription', titleKey: 'knowledgeBase.text_460e4a284678' };
}

export interface KnowledgeSearchDocumentContent {
  documentID: number;
  /** 每个 chunk 在当前解析全文中的实时定位锚点（码点下标）；旧后端不返回。 */
  chunkAnchors?: Array<{
    artifactID: number;
    charEnd: number;
    charStart: number;
    chunkIndex: number;
    pageIdx?: number;
  }>;
  parsedFullText?: string;
  sourceTextReady?: boolean;
}

export interface KnowledgeSearchChunkRelation {
  evidence?: string;
  id: number;
  relationType: string;
  score: number;
  targetArtifact?: {
    chunkIndex?: number;
    content?: string;
    id: number;
  };
  targetDocument?: {
    id: number;
    name: string;
    path: string;
  };
}

export interface KnowledgeSearchChunkRelationResponse {
  artifact?: {
    chunkIndex?: number;
    content?: string;
    id: number;
  };
  relations?: KnowledgeSearchChunkRelation[];
}

/** confidenceLabel 将后端置信度枚举转为用户可读文案，并避免已有证据时误显示“无命中”。 */
export function confidenceLabel(confidenceBand?: string, hasHits = false) {
  switch (confidenceBand) {
    case 'high': {
      return $t('knowledgeBase.text_1c9755ee5b45');
    }
    case 'low': {
      return $t('knowledgeBase.text_d684e38577ec');
    }
    case 'medium': {
      return $t('knowledgeBase.text_66d3ac6c618c');
    }
    case 'none': {
      return hasHits ? $t('knowledgeBase.text_d684e38577ec') : $t('knowledgeBase.text_66b53e752425');
    }
    default: {
      return confidenceBand || '-';
    }
  }
}

/** sourceTypeLabel 将证据来源类型转为用户可读文案。 */
export function sourceTypeLabel(sourceType?: string) {
  switch (sourceType) {
    case 'direct': {
      return $t('knowledgeBase.text_05b3051b1e50');
    }
    case 'related': {
      return $t('knowledgeBase.text_48dad3382f39');
    }
    default: {
      return sourceType || '-';
    }
  }
}

/** buildKnowledgeSearchPayload 统一构造检索参数，固定库模式不会透传智能体。 */
export function buildKnowledgeSearchPayload(options: {
  agentID?: number;
  fixedKnowledgeID?: number;
  knowledgeBaseIDs?: number[];
  minScore?: number;
  query: string;
  topK?: number;
}) {
  const knowledgeBaseIDs = options.fixedKnowledgeID ? [options.fixedKnowledgeID] : options.knowledgeBaseIDs?.filter((id) => id > 0);

  return {
    agentID: knowledgeBaseIDs?.length ? undefined : options.agentID,
    knowledgeBaseIDs: knowledgeBaseIDs?.length ? knowledgeBaseIDs : undefined,
    minScore: options.minScore,
    query: options.query.trim(),
    topK: options.topK,
  };
}
