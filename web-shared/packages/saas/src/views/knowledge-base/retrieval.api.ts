/**
 * 文件说明：共享知识检索面板的 API 封装，服务详情工作台固定库与自由多库/智能体检索。
 */
import type { KnowledgeSearchChunkRelationResponse, KnowledgeSearchDocumentContent, KnowledgeSearchResponse } from './retrieval';

import { requestClient } from '@vben/api';

export const RetrievalApi = {
  /** listAgents 返回自由检索模式下可选的智能体选项。 */
  async listAgents() {
    const res = await requestClient.post<{
      list: Array<{ id: number; name: string }>;
      total: number;
    }>('/api/v1/ai/agent/info/get-list', {
      page: { page: 1, pageSize: 200 },
    });
    return (res.list ?? []).map((item) => ({
      label: item.name,
      value: item.id,
    }));
  },

  /** listKnowledgeBases 返回自由检索模式下可选的知识库。 */
  async listKnowledgeBases() {
    const res = await requestClient.post<{
      list: Array<{ id: number; name: string }>;
      total: number;
    }>('/api/v1/ai/knowledge/info/get-list', {
      page: { page: 1, pageSize: 200 },
    });
    return (res.list ?? []).map((item) => ({
      label: item.name,
      value: item.id,
    }));
  },

  /** search 执行知识库或智能体作用域检索。 */
  async search(payload: { agentID?: number; knowledgeBaseIDs?: number[]; minScore?: number; query: string; topK?: number }) {
    return await requestClient.post<KnowledgeSearchResponse>('/api/v1/ai/knowledge/tool/search', payload);
  },

  /** getDocumentContent 按文档读取解析全文。 */
  async getDocumentContent(documentID: number) {
    return await requestClient.post<KnowledgeSearchDocumentContent>('/api/v1/ai/knowledge/tool/get-document-content', { documentID });
  },

  /** getChunkRelations 按切片读取关联证据。 */
  async getChunkRelations(artifactID: number, limit = 5) {
    return await requestClient.post<KnowledgeSearchChunkRelationResponse>('/api/v1/ai/knowledge/tool/get-chunk-relations', { artifactID, limit });
  },
};
