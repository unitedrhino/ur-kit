/** 文件说明：知识库工作台的业务视图类型，来源证据沿用后端生成合同。 */

import { $t } from '../../locales';
import type { CoreAi } from '@vben/api';

/** 分阶段状态及版本化证据，不在页面解析内部 JSON。 */
export type KnowledgeProcessingStage = CoreAi.KnowledgeProcessingStageInfo;
export type KnowledgeSourceReference = CoreAi.KnowledgeSourceReferenceInfo;
export type KnowledgeStatus = 'failed' | 'pending' | 'processing' | 'success';

export interface KnowledgeItem {
  compiledDocumentCount: number;
  desc: string;
  documentCount: number;
  failedDocumentCount: number;
  id: number;
  lastCompileTime?: number;
  name: string;
  // 归属层级：platform=平台公共库（common，租户端只读），tenant=租户级库
  scope?: 'platform' | 'tenant' | string;
  status: KnowledgeStatus;
  tenantCode?: string;
}

export interface KnowledgeTreeNode {
  children?: KnowledgeTreeNode[];
  compileStatus?: string;
  id: number;
  knowledgeID: number;
  lastError?: string;
  name: string;
  nodeType: 'file' | 'folder';
  parentID: number;
  parseStatus?: string;
  path: string;
  uri?: string;
}

export interface KnowledgeArtifact {
  artifactType: 'article' | 'chunk' | 'concept' | 'equation' | 'image' | 'summary' | 'table';
  bboxJSON?: string;
  caption?: string;
  charEnd?: number;
  charStart?: number;
  chunkIndex?: number;
  content: string;
  createdTime?: number;
  /** 原始产物的 AI 描述及本次生成状态。 */
  description?: string;
  descriptionStatus?: string;
  documentID: number;
  extraJSON?: string;
  /** source 为原文证据，ai 为生成内容；空值表示历史记录未标注。 */
  generationMethod?: string;
  headingPath?: string;
  id: number;
  knowledgeID: number;
  // 多模态 artifact 媒体字段
  mediaURI?: string;
  mimeType?: string;
  pageIdx?: number;
  relatedCount?: number;
  sourceDocumentIDs?: number[];
  sources?: KnowledgeSourceReference[];
  sourceVersion?: string;
  title: string;
  tokenEstimate?: number;
  updatedTime?: number;
}

export interface KnowledgeCompileTask {
  createdTime?: number;
  errorMessage?: string;
  finishedTime?: number;
  id: number;
  knowledgeID: number;
  relationMessage?: string;
  relationStatus?: 'deferred' | 'failed' | 'pending' | 'processing' | 'success' | string;
  startedTime?: number;
  status: KnowledgeStatus;
  triggerType: string;
  updatedTime?: number;
}

export interface KnowledgeDetail {
  articles?: KnowledgeArtifact[];
  chunks?: KnowledgeArtifact[];
  compileStatus?: string;
  concepts?: KnowledgeArtifact[];
  document: KnowledgeTreeNode;
  lastCompileTask?: KnowledgeCompileTask;
  lastError?: string;
  multimodalArtifacts?: KnowledgeArtifact[];
  previewText?: string;
  processingStages?: KnowledgeProcessingStage[];
  sourceDownloadURL?: string;
  // 预览专用签名 URL（inline + 补齐 Content-Type），用于原文 Tab 的 iframe/img 预览
  sourcePreviewURL?: string;
  /** 当前来源版本及高级处理阶段状态。 */
  sourceVersion?: string;
  summary?: KnowledgeArtifact;
}

export interface KnowledgeCompileStatusResp {
  compiledDocumentCount: number;
  currentTask?: KnowledgeCompileTask;
  documentCount: number;
  failedDocumentCount: number;
  knowledgeID: number;
  relationMessage?: string;
  relationStatus?: 'deferred' | 'failed' | 'pending' | 'processing' | 'success' | string;
}

export interface KnowledgeFailedDocumentResp {
  list: KnowledgeTreeNode[];
  total: number;
}

export interface KnowledgeExportStatusResp {
  downloadURL?: string;
  /** 导入完成时的成功文件数（仅导入任务返回，进度弹窗展示用） */
  importedCount?: number;
  status: KnowledgeStatus | string;
  taskID: number;
}

export interface KnowledgeChunkRelation {
  cosineScore?: number;
  evidence?: string;
  fromArtifactID: number;
  fromDocumentID: number;
  id: number;
  lexicalOverlap?: number;
  llmConfidence?: number;
  relationType: 'duplicate' | 'reference' | 'similar' | string;
  score: number;
  /** 文档关系查询中，当前文档侧的原文证据。 */
  sourceArtifact?: KnowledgeArtifact;
  targetArtifact?: KnowledgeArtifact;
  targetDocument?: KnowledgeTreeNode;
  toArtifactID: number;
  toDocumentID: number;
}

export interface KnowledgeChunkRelationResp {
  /** 达到关系查询上限时明确提示不完整，不能展示全量统计。 */
  hasMore?: boolean;
  artifact?: KnowledgeArtifact;
  relations?: KnowledgeChunkRelation[];
}

/** 字段级引用定位器：字段按 kind 取舍（table_formula/equation/chunk_section/external），前端使用展开结构而非原始 JSON 字符串。 */
export type KnowledgeFieldLocator = CoreAi.KnowledgeFieldLocatorInfo;

/** 字段级引用端点：from 为引用方（使用公式的一侧），to 为被引用方（定义参数的一侧）；external 引用方 artifactID 允许为 0。 */
export type KnowledgeFieldEndpoint = CoreAi.KnowledgeFieldEndpointInfo;

/** 字段级引用记录：一条「某文档某位置使用另一文档某位置定义的参数」的关系。 */
export type KnowledgeFieldReference = CoreAi.KnowledgeFieldReferenceInfo;

export interface KnowledgeFieldReferenceListResp {
  /** 达到返回上限时不能视为完整集合，界面需提示部分结果。 */
  hasMore?: boolean;
  references?: KnowledgeFieldReference[];
}

/** 引用失效汇总项：documentID 上失效（自动重锚定失败待人工处理）的引用数量。 */
export interface KnowledgeFieldReferencePendingSummaryItem {
  count: number;
  documentID: number;
}

/** 引用同步状态徽章的当前语言文案；失效表示自动重锚定失败需人工重新指定，up_to_date 表示已自动同步。 */
export function fieldReferenceReviewLabel(reviewStatus?: string): string {
  return (
    ((
      {
        pending_review: $t('knowledgeBase.text_47daa24eec17'),
        up_to_date: $t('knowledgeBase.text_208a9a7ed155'),
      } as Record<string, string>
    )[reviewStatus ?? ''] ??
      reviewStatus) ||
    '-'
  );
}

/** 引用同步状态徽章颜色：失效用警示色，其余不抢视觉焦点。 */
export function fieldReferenceReviewVariant(reviewStatus?: string): 'destructive' | 'outline' {
  return reviewStatus === 'pending_review' ? 'destructive' : 'outline';
}

/** 引用确认状态徽章的当前语言文案：candidate 待确认、confirmed 已确认、rejected 已拒绝。 */
export function fieldReferenceStatusLabel(status?: string): string {
  return (
    ((
      {
        candidate: $t('knowledgeBase.text_27b5842c971e'),
        confirmed: $t('knowledgeBase.text_d9fea67ad2be'),
        rejected: $t('knowledgeBase.text_4c7c52c70655'),
      } as Record<string, string>
    )[status ?? ''] ??
      status) ||
    '-'
  );
}

/** 引用确认状态徽章颜色：已确认为主要色，待确认次级，已拒绝弱化为描边。 */
export function fieldReferenceStatusVariant(status?: string): 'default' | 'outline' | 'secondary' {
  if (status === 'confirmed') return 'default';
  if (status === 'candidate') return 'secondary';
  return 'outline';
}

/** 引用来源徽章文案：AI 自动建链的引用标注「AI 自动」，人工标注「人工」。 */
export function fieldReferenceSourceLabel(source?: string): string {
  return source === 'manual' ? $t('knowledgeBase.text_80212d3591fe') : $t('knowledgeBase.text_ae1d5696abc4');
}

export function statusType(status: KnowledgeStatus) {
  switch (status) {
    case 'failed': {
      return 'error';
    }
    case 'processing': {
      return 'info';
    }
    case 'success': {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
}

export function statusLabel(status?: string) {
  switch (status) {
    case 'failed': {
      return $t('knowledgeBase.text_3e3c8068bb0e');
    }
    case 'pending': {
      return $t('knowledgeBase.text_59a9eb4e6574');
    }
    case 'processing': {
      return $t('knowledgeBase.text_fcb979ef0b91');
    }
    case 'success': {
      return $t('knowledgeBase.text_e99b48a29bdf');
    }
    default: {
      return status || '-';
    }
  }
}

/** 知识库文档上传白名单：与后端知识文档解析范围保持一致的扩展名集合（含前导点、小写）。 */
export const KNOWLEDGE_UPLOAD_EXTENSIONS: ReadonlySet<string> = new Set([
  '.bmp',
  '.csv',
  '.docx',
  '.dwf',
  '.dwfx',
  '.dwg',
  '.dxf',
  '.gif',
  '.glb',
  '.jpeg',
  '.jpg',
  '.md',
  '.pdf',
  '.png',
  '.svg',
  '.txt',
  '.webp',
  '.xlsx',
  '.xps',
]);

/** 知识库文档上传控件的 accept 值：由白名单常量派生，避免文件选择器与校验逻辑两处维护。 */
export const KNOWLEDGE_UPLOAD_ACCEPT = [...KNOWLEDGE_UPLOAD_EXTENSIONS].join(',');
