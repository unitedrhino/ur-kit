import type { KnowledgeChunkRelationReq } from '../models';
import type { KnowledgeDocumentContentReq } from '../models';
import type { KnowledgeSearchReq } from '../models';
import type { PostApiV1AiKnowledgeDocumentChunkRelationGetList200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentGetContent200Response } from '../models';
import type { PostApiV1AiKnowledgeInfoSearch200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiKnowledgeToolApi - axios parameter creator
 */

/**
* 业务说明：供 CLI、调试工作台或外部编排直接根据 artifactID 查询切片关联结果，用于复杂问题在直接证据不足时继续扩展上下文。
* @summary CLI/调试-获取切片关联
* @param {KnowledgeChunkRelationReq} knowledgeChunkRelationReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeToolGetChunkRelations (
knowledgeChunkRelationReq: KnowledgeChunkRelationReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/tool/get-chunk-relations`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentChunkRelationGetList200Response>>(localVarPath, knowledgeChunkRelationReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：供 CLI、调试工作台或外部编排直接根据 documentID 获取知识库文档全文，用于复杂问题二次取数、全文审查和上下文扩展。
* @summary CLI/调试-获取文档全文
* @param {KnowledgeDocumentContentReq} knowledgeDocumentContentReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeToolGetDocumentContent (
knowledgeDocumentContentReq: KnowledgeDocumentContentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/tool/get-document-content`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentGetContent200Response>>(localVarPath, knowledgeDocumentContentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：供 CLI、调试工作台或外部编排直接调用的知识库搜索接口。返回改写后的 query、命中文档、直接命中切片和关联补充切片，适合不经过聊天链路单独调试检索效果。
* @summary CLI/调试-搜索知识库
* @param {KnowledgeSearchReq} knowledgeSearchReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeToolSearch (
knowledgeSearchReq: KnowledgeSearchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/tool/search`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeInfoSearch200Response>>(localVarPath, knowledgeSearchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiKnowledgeToolGetChunkRelations operation in AiKnowledgeToolApi.
 */
export interface AiKnowledgeToolApiPostApiV1AiKnowledgeToolGetChunkRelationsRequest {
    readonly knowledgeChunkRelationReq: KnowledgeChunkRelationReq
}

/**
 * Request parameters for postApiV1AiKnowledgeToolGetDocumentContent operation in AiKnowledgeToolApi.
 */
export interface AiKnowledgeToolApiPostApiV1AiKnowledgeToolGetDocumentContentRequest {
    readonly knowledgeDocumentContentReq: KnowledgeDocumentContentReq
}

/**
 * Request parameters for postApiV1AiKnowledgeToolSearch operation in AiKnowledgeToolApi.
 */
export interface AiKnowledgeToolApiPostApiV1AiKnowledgeToolSearchRequest {
    readonly knowledgeSearchReq: KnowledgeSearchReq
}
