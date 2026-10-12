import type { KnowledgeBaseInfo } from '../models';
import type { KnowledgeGetListReq } from '../models';
import type { KnowledgeGetOneReq } from '../models';
import type { KnowledgeSearchReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiKnowledgeInfoGetList200Response } from '../models';
import type { PostApiV1AiKnowledgeInfoGetOne200Response } from '../models';
import type { PostApiV1AiKnowledgeInfoSearch200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiKnowledgeInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的知识库记录，用于后续导入文档、编译切片和知识检索。
* @summary 创建知识库
* @param {KnowledgeBaseInfo} knowledgeBaseInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoCreate (
knowledgeBaseInfo: KnowledgeBaseInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeBaseInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除知识库及其文档、编译产物和相关任务记录。
* @summary 删除知识库
* @param {KnowledgeGetOneReq} knowledgeGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoDelete (
knowledgeGetOneReq: KnowledgeGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, knowledgeGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询知识库列表，返回文档数、完成数、失败数和状态。
* @summary 获取知识库列表
* @param {KnowledgeGetListReq} knowledgeGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoGetList (
knowledgeGetListReq: KnowledgeGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeInfoGetList200Response>>(localVarPath, knowledgeGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按知识库 ID 查询基础信息，用于详情回显和管理页展示。
* @summary 获取知识库详情
* @param {KnowledgeGetOneReq} knowledgeGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoGetOne (
knowledgeGetOneReq: KnowledgeGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeInfoGetOne200Response>>(localVarPath, knowledgeGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：基于 Agent 绑定的知识库或显式指定的知识库列表检索相关切片，返回命中文档、切片和分数。
* @summary 搜索知识库切片
* @param {KnowledgeSearchReq} knowledgeSearchReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoSearch (
knowledgeSearchReq: KnowledgeSearchReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/search`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeInfoSearch200Response>>(localVarPath, knowledgeSearchReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新知识库名称和描述。
* @summary 更新知识库
* @param {KnowledgeBaseInfo} knowledgeBaseInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeInfoUpdate (
knowledgeBaseInfo: KnowledgeBaseInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeBaseInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiKnowledgeInfoCreate operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoCreateRequest {
    readonly knowledgeBaseInfo: KnowledgeBaseInfo
}

/**
 * Request parameters for postApiV1AiKnowledgeInfoDelete operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoDeleteRequest {
    readonly knowledgeGetOneReq: KnowledgeGetOneReq
}

/**
 * Request parameters for postApiV1AiKnowledgeInfoGetList operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoGetListRequest {
    readonly knowledgeGetListReq: KnowledgeGetListReq
}

/**
 * Request parameters for postApiV1AiKnowledgeInfoGetOne operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoGetOneRequest {
    readonly knowledgeGetOneReq: KnowledgeGetOneReq
}

/**
 * Request parameters for postApiV1AiKnowledgeInfoSearch operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoSearchRequest {
    readonly knowledgeSearchReq: KnowledgeSearchReq
}

/**
 * Request parameters for postApiV1AiKnowledgeInfoUpdate operation in AiKnowledgeInfoApi.
 */
export interface AiKnowledgeInfoApiPostApiV1AiKnowledgeInfoUpdateRequest {
    readonly knowledgeBaseInfo: KnowledgeBaseInfo
}
