import type {
  KnowledgeChunkRelationResp,
  KnowledgeCompileStatusResp,
  KnowledgeDetail,
  KnowledgeExportStatusResp,
  KnowledgeFailedDocumentResp,
  KnowledgeFieldReferenceListResp,
  KnowledgeItem,
  KnowledgeTreeNode,
} from './data';
import type { KnowledgeFieldEndpointInput } from './field-reference';

/** 文件说明：知识库业务请求；高级处理相关接口使用生成客户端保持合同同步。 */
import { CoreAi, requestClient } from '@vben/api';

export const Api = {
  async list(page = 1, pageSize = 50, formValues?: Record<string, any>) {
    return await requestClient.post<{ list: KnowledgeItem[]; total: number }>('/api/v1/ai/knowledge/info/get-list', {
      page: {
        page,
        pageSize,
      },
      ...formValues,
    });
  },

  /** getOne 按 ID 直连知识库详情，供工作台深链获取头部与设置信息，无需拉全量列表。 */
  async getOne(knowledgeID: number): Promise<KnowledgeItem> {
    const response = (await CoreAi.postApiV1AiKnowledgeInfoGetOne({ id: knowledgeID })) as CoreAi.KnowledgeBaseInfo;
    return {
      compiledDocumentCount: response.compiledDocumentCount ?? 0,
      desc: response.desc ?? '',
      documentCount: response.documentCount ?? 0,
      failedDocumentCount: response.failedDocumentCount ?? 0,
      id: response.id ?? knowledgeID,
      lastCompileTime: response.lastCompileTime,
      name: response.name,
      scope: response.scope,
      status: (response.status ?? 'pending') as KnowledgeItem['status'],
      tenantCode: response.tenantCode,
    };
  },

  async create(data: Pick<KnowledgeItem, 'desc' | 'name'>) {
    return await requestClient.post<{ id: number }>('/api/v1/ai/knowledge/info/create', data);
  },

  async update(data: { desc?: string; id: number; name: string }) {
    return await requestClient.post<{ id: number }>('/api/v1/ai/knowledge/info/update', data);
  },

  async importDocuments(knowledgeID: number, items: Array<{ filePath?: string; name?: string; path: string }>, parentID = 0) {
    return await requestClient.post<{ importedCount: number; taskID: number }>('/api/v1/ai/knowledge/document/import', {
      knowledgeID,
      parentID,
      items,
    });
  },

  async createFolder(knowledgeID: number, name: string, parentID = 0) {
    return await requestClient.post<{ node: KnowledgeTreeNode }>('/api/v1/ai/knowledge/document/create-folder', {
      knowledgeID,
      parentID,
      name,
    });
  },

  async moveNode(nodeID: number, targetParentID: number) {
    return await requestClient.post('/api/v1/ai/knowledge/document/move', {
      nodeID,
      targetParentID,
    });
  },

  async deleteNode(nodeID: number) {
    return await requestClient.post<{ deletedCount: number }>('/api/v1/ai/knowledge/document/delete', {
      nodeID,
    });
  },

  async uploadTempFile(file: File) {
    return await requestClient.upload<{ filePath: string; fileUri: string }>('/api/v1/system/common/upload-file', { file }, { timeout: 120_000 });
  },

  async getTree(knowledgeID: number) {
    return await requestClient.post<{ knowledgeID: number; nodes: KnowledgeTreeNode[] }>('/api/v1/ai/knowledge/document/get-tree', {
      knowledgeID,
    });
  },

  async getDetail(documentID: number) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentGetDetail({ documentID })) as KnowledgeDetail;
  },

  async getContent(documentID: number) {
    return await requestClient.post<{
      chunkAnchors?: Array<{ artifactID: number; charEnd: number; charStart: number; chunkIndex: number; pageIdx?: number }>;
      documentID: number;
      parsedFullText?: string;
      sourceTextReady?: boolean;
    }>('/api/v1/ai/knowledge/document/get-content', {
      documentID,
    });
  },

  async getChunkRelations(artifactID: number, options?: { limit?: number; minScore?: number; relationTypes?: string[] }) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentChunkRelationGetList({
      artifactID,
      relationTypes: options?.relationTypes,
      minScore: options?.minScore,
      limit: options?.limit,
    })) as KnowledgeChunkRelationResp;
  },

  /** getDocumentRelations 一次读取当前文档的跨文档证据，不逐切片发起请求。 */
  async getDocumentRelations(documentID: number) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentChunkRelationGetList({ documentID, limit: 300 })) as KnowledgeChunkRelationResp;
  },

  /** createFieldReference 人工建立字段级引用，服务端计算定位哈希并快照双侧版本。 */
  async createFieldReference(data: { evidence?: string; from: KnowledgeFieldEndpointInput; knowledgeID: number; to: KnowledgeFieldEndpointInput }) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferenceCreate(data)) as { id: number };
  },

  /** updateFieldReference 整体替换引用单侧端点（side 指定 from/to），另一侧保持不变，用于编辑与重挂。 */
  async updateFieldReference(data: { endpoint: KnowledgeFieldEndpointInput; evidence?: string; id: number; side: string }) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferenceUpdate(data)) as { id: number };
  },

  /** reviewFieldReference 执行复核动作：confirm 确认、reject 拒绝、markReviewed 标记无影响。 */
  async reviewFieldReference(id: number, action: 'confirm' | 'markReviewed' | 'reject') {
    return (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferenceReview({ action, id })) as { id: number };
  },

  /** deleteFieldReference 软删一条字段级引用。 */
  async deleteFieldReference(id: number) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferenceDelete({ id })) as { id: number };
  },

  /** getFieldReferences 按知识库与可选的组合条件查询引用，artifactID 匹配 from 或 to 任一侧。 */
  async getFieldReferences(options: {
    artifactID?: number;
    fromDocumentID?: number;
    knowledgeID: number;
    page?: number;
    reviewStatus?: string;
    size?: number;
    status?: string;
    toDocumentID?: number;
  }) {
    return (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferenceGetList(options)) as KnowledgeFieldReferenceListResp;
  },

  /** getFieldReferencePendingSummary 返回知识库内各文档的失效（自动重锚定失败）引用数量。 */
  async getFieldReferencePendingSummary(knowledgeID: number) {
    const response = (await CoreAi.postApiV1AiKnowledgeDocumentFieldReferencePendingSummary({ knowledgeID })) as {
      items?: Array<{ count?: number; documentID?: number }>;
    };
    return (response.items ?? []).map((item) => ({ count: item.count ?? 0, documentID: item.documentID ?? 0 }));
  },

  async getStatus(knowledgeID: number) {
    return (await CoreAi.postApiV1AiKnowledgeCompileGetStatus({ knowledgeID })) as KnowledgeCompileStatusResp;
  },

  /** retryCompile 兼容旧重试调用，可限定当前文档和高级阶段。 */
  async retryCompile(knowledgeID: number, mode: 'all' | 'failed_only' = 'failed_only', options?: { documentID?: number; stages?: string[] }) {
    return await CoreAi.postApiV1AiKnowledgeCompileRetry({
      knowledgeID,
      mode,
      ...options,
    });
  },

  async getFailedDocuments(knowledgeID: number, page = 1, pageSize = 50) {
    return await requestClient.post<KnowledgeFailedDocumentResp>('/api/v1/ai/knowledge/document/get-failed-list', {
      knowledgeID,
      page: {
        page,
        pageSize,
      },
    });
  },

  async createExport(knowledgeID: number) {
    return await requestClient.post<{ id: number }>('/api/v1/ai/knowledge/export/create', {
      knowledgeID,
    });
  },

  async getExportStatus(taskID: number) {
    return await requestClient.post<KnowledgeExportStatusResp>('/api/v1/ai/knowledge/export/get-status', { taskID });
  },

  async exportZip(knowledgeID: number) {
    return await requestClient.post<{ downloadURL?: string; taskID: number }>('/api/v1/ai/knowledge/export/export-zip', { knowledgeID });
  },

  async importZip(knowledgeID: number, fileURL: string) {
    return await requestClient.post<{ importedCount: number; taskID: number }>(
      '/api/v1/ai/knowledge/document/import-zip',
      { knowledgeID, fileURL },
      { timeout: 60_000 },
    );
  },

  async delete(id: number) {
    return await requestClient.post('/api/v1/ai/knowledge/info/delete', { id });
  },
};
