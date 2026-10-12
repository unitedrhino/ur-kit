import type { KnowledgeChunkRelationReq } from '../models';
import type { KnowledgeDocumentContentReq } from '../models';
import type { KnowledgeDocumentCreateFolderReq } from '../models';
import type { KnowledgeDocumentDeleteReq } from '../models';
import type { KnowledgeDocumentDetailReq } from '../models';
import type { KnowledgeDocumentImportReq } from '../models';
import type { KnowledgeDocumentMoveReq } from '../models';
import type { KnowledgeDocumentTreeReq } from '../models';
import type { KnowledgeFailedDocumentReq } from '../models';
import type { KnowledgeFieldReferenceCreateReq } from '../models';
import type { KnowledgeFieldReferenceDeleteReq } from '../models';
import type { KnowledgeFieldReferenceListReq } from '../models';
import type { KnowledgeFieldReferencePendingSummaryReq } from '../models';
import type { KnowledgeFieldReferenceReviewReq } from '../models';
import type { KnowledgeFieldReferenceUpdateReq } from '../models';
import type { KnowledgeZipImportReq } from '../models';
import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentChunkRelationGetList200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentCreateFolder200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentDelete200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentFieldReferenceGetList200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentFieldReferencePendingSummary200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentGetContent200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentGetDetail200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentGetFailedList200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentGetTree200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentImport200Response } from '../models';
import type { PostApiV1AiKnowledgeDocumentImportZip200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiKnowledgeDocumentApi - axios parameter creator
 */

/**
* 业务说明：流式代理返回知识库文档源文件，用于页面内联预览。COS 默认域名对浏览器直接访问一律强制 Content-Disposition: attachment（签名 URL 的 response-* 覆盖被忽略），故由后端签名拉取对象并流式回传，按扩展名重写 Content-Type、强制 inline、透传 Range 支持 PDF 分段加载。iframe 无法自定义请求头，token/app-id/tenant-code 通过查询参数传递（CheckTokenWare 中间件支持查询参数取参）。
* @summary 预览文档源文件
* @param {number} [bodyParam.documentID]
* @param {string} [bodyParam.filename]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1AiKnowledgeDocumentSourcePreviewFilename (bodyParam: { documentID: number; filename: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/source-preview/{filename}`
    .replace(`{${"filename"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['filename'] ?? '')));
        if ((bodyParam as Record<string, unknown>)['documentID'] !== undefined) {
            localVarQueryParameter['documentID'] = (bodyParam as Record<string, unknown>)['documentID'];
        }
    return requestClient.get<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定切片关联到的其他文档切片，用于图谱和相关切片工作台。
* @summary 获取切片关联列表
* @param {KnowledgeChunkRelationReq} knowledgeChunkRelationReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentChunkRelationGetList (
knowledgeChunkRelationReq: KnowledgeChunkRelationReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/chunk/relation/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentChunkRelationGetList200Response>>(localVarPath, knowledgeChunkRelationReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在知识库文档树中创建文件夹节点，支持指定父文件夹，同级名称唯一。
* @summary 新建文件夹
* @param {KnowledgeDocumentCreateFolderReq} knowledgeDocumentCreateFolderReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentCreateFolder (
knowledgeDocumentCreateFolderReq: KnowledgeDocumentCreateFolderReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/create-folder`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentCreateFolder200Response>>(localVarPath, knowledgeDocumentCreateFolderReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除文件或文件夹，文件夹级联删除后代节点；同步清理编译产物、切片向量、对象存储源文件及中间产物。
* @summary 删除文档节点
* @param {KnowledgeDocumentDeleteReq} knowledgeDocumentDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentDelete (
knowledgeDocumentDeleteReq: KnowledgeDocumentDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentDelete200Response>>(localVarPath, knowledgeDocumentDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：人工建立字段级引用（如 Excel 公式引用公约段落），服务端快照双侧内容版本用于更新比对。
* @summary 手工新增字段级引用
* @param {KnowledgeFieldReferenceCreateReq} knowledgeFieldReferenceCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferenceCreate (
knowledgeFieldReferenceCreateReq: KnowledgeFieldReferenceCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeFieldReferenceCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删字段级引用记录。
* @summary 删除字段级引用
* @param {KnowledgeFieldReferenceDeleteReq} knowledgeFieldReferenceDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferenceDelete (
knowledgeFieldReferenceDeleteReq: KnowledgeFieldReferenceDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeFieldReferenceDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按引用方/被引用方反查字段级引用（公式/参数项粒度），toDocumentID 即影响分析；写操作对平台共享库只读用户拒绝。
* @summary 获取字段级引用列表
* @param {KnowledgeFieldReferenceListReq} knowledgeFieldReferenceListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferenceGetList (
knowledgeFieldReferenceListReq: KnowledgeFieldReferenceListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentFieldReferenceGetList200Response>>(localVarPath, knowledgeFieldReferenceListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按知识库聚合各文档的待复核字段级引用数量，供文档列表角标展示。
* @summary 获取文档引用待复核计数
* @param {KnowledgeFieldReferencePendingSummaryReq} knowledgeFieldReferencePendingSummaryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferencePendingSummary (
knowledgeFieldReferencePendingSummaryReq: KnowledgeFieldReferencePendingSummaryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/pending-summary`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentFieldReferencePendingSummary200Response>>(localVarPath, knowledgeFieldReferencePendingSummaryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：confirm/reject 处理 AI 候选，markReviewed 将待复核引用恢复 up_to_date。
* @summary 确认或拒绝字段级引用
* @param {KnowledgeFieldReferenceReviewReq} knowledgeFieldReferenceReviewReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferenceReview (
knowledgeFieldReferenceReviewReq: KnowledgeFieldReferenceReviewReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/review`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeFieldReferenceReviewReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 side（from/to）整体替换引用单侧定位，用于失效后人工重挂到新产物。
* @summary 修改字段级引用单侧端点
* @param {KnowledgeFieldReferenceUpdateReq} knowledgeFieldReferenceUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentFieldReferenceUpdate (
knowledgeFieldReferenceUpdateReq: KnowledgeFieldReferenceUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/field-reference/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, knowledgeFieldReferenceUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取知识库文档解析后的完整正文，用于原文预览和定位。
* @summary 获取文档全文
* @param {KnowledgeDocumentContentReq} knowledgeDocumentContentReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentGetContent (
knowledgeDocumentContentReq: KnowledgeDocumentContentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/get-content`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentGetContent200Response>>(localVarPath, knowledgeDocumentContentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个知识库文档的摘要、切片、概念、文章和最近编译任务信息。
* @summary 获取文档详情
* @param {KnowledgeDocumentDetailReq} knowledgeDocumentDetailReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentGetDetail (
knowledgeDocumentDetailReq: KnowledgeDocumentDetailReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/get-detail`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentGetDetail200Response>>(localVarPath, knowledgeDocumentDetailReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取当前知识库编译失败的文档明细，返回路径、状态和错误信息。
* @summary 获取失败文档列表
* @param {KnowledgeFailedDocumentReq} knowledgeFailedDocumentReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentGetFailedList (
knowledgeFailedDocumentReq: KnowledgeFailedDocumentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/get-failed-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentGetFailedList200Response>>(localVarPath, knowledgeFailedDocumentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取指定知识库的目录树结构，用于文档浏览和详情导航。
* @summary 获取知识库目录树
* @param {KnowledgeDocumentTreeReq} knowledgeDocumentTreeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentGetTree (
knowledgeDocumentTreeReq: KnowledgeDocumentTreeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/get-tree`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentGetTree200Response>>(localVarPath, knowledgeDocumentTreeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：向知识库导入文件或文件夹，并触发后续编译任务。
* @summary 导入知识库文档
* @param {KnowledgeDocumentImportReq} knowledgeDocumentImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentImport (
knowledgeDocumentImportReq: KnowledgeDocumentImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/import`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentImport200Response>>(localVarPath, knowledgeDocumentImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从ZIP压缩包导入知识库完整数据（含原文、编译产物、向量），同名文件更新，新文件追加。
* @summary ZIP导入知识库
* @param {KnowledgeZipImportReq} knowledgeZipImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentImportZip (
knowledgeZipImportReq: KnowledgeZipImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/import-zip`;
    return requestClient.post<ExtractDataType<PostApiV1AiKnowledgeDocumentImportZip200Response>>(localVarPath, knowledgeZipImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：移动文件或文件夹到目标文件夹，后代节点路径同步重写；仅修改树结构，对象存储文件不搬移、不触发重编译。
* @summary 移动文档节点
* @param {KnowledgeDocumentMoveReq} knowledgeDocumentMoveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiKnowledgeDocumentMove (
knowledgeDocumentMoveReq: KnowledgeDocumentMoveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/knowledge/document/move`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, knowledgeDocumentMoveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getApiV1AiKnowledgeDocumentSourcePreviewFilename operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiGetApiV1AiKnowledgeDocumentSourcePreviewFilenameRequest {
    readonly documentID: number

    readonly filename: string
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentChunkRelationGetList operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentChunkRelationGetListRequest {
    readonly knowledgeChunkRelationReq: KnowledgeChunkRelationReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentCreateFolder operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentCreateFolderRequest {
    readonly knowledgeDocumentCreateFolderReq: KnowledgeDocumentCreateFolderReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentDelete operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentDeleteRequest {
    readonly knowledgeDocumentDeleteReq: KnowledgeDocumentDeleteReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferenceCreate operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferenceCreateRequest {
    readonly knowledgeFieldReferenceCreateReq: KnowledgeFieldReferenceCreateReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferenceDelete operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferenceDeleteRequest {
    readonly knowledgeFieldReferenceDeleteReq: KnowledgeFieldReferenceDeleteReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferenceGetList operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferenceGetListRequest {
    readonly knowledgeFieldReferenceListReq: KnowledgeFieldReferenceListReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferencePendingSummary operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferencePendingSummaryRequest {
    readonly knowledgeFieldReferencePendingSummaryReq: KnowledgeFieldReferencePendingSummaryReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferenceReview operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferenceReviewRequest {
    readonly knowledgeFieldReferenceReviewReq: KnowledgeFieldReferenceReviewReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentFieldReferenceUpdate operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentFieldReferenceUpdateRequest {
    readonly knowledgeFieldReferenceUpdateReq: KnowledgeFieldReferenceUpdateReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentGetContent operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentGetContentRequest {
    readonly knowledgeDocumentContentReq: KnowledgeDocumentContentReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentGetDetail operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentGetDetailRequest {
    readonly knowledgeDocumentDetailReq: KnowledgeDocumentDetailReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentGetFailedList operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentGetFailedListRequest {
    readonly knowledgeFailedDocumentReq: KnowledgeFailedDocumentReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentGetTree operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentGetTreeRequest {
    readonly knowledgeDocumentTreeReq: KnowledgeDocumentTreeReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentImport operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentImportRequest {
    readonly knowledgeDocumentImportReq: KnowledgeDocumentImportReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentImportZip operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentImportZipRequest {
    readonly knowledgeZipImportReq: KnowledgeZipImportReq
}

/**
 * Request parameters for postApiV1AiKnowledgeDocumentMove operation in AiKnowledgeDocumentApi.
 */
export interface AiKnowledgeDocumentApiPostApiV1AiKnowledgeDocumentMoveRequest {
    readonly knowledgeDocumentMoveReq: KnowledgeDocumentMoveReq
}
