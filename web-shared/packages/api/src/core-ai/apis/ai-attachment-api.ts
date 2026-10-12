import type { ChatAttachmentReq } from '../models';
import type { PostApiV1AiChatAttachmentDownload200Response } from '../models';
import type { PostApiV1AiChatAttachmentGetOne200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiAttachmentApi - axios parameter creator
 */

/**
* 业务说明：鉴权并确认私有对象存在后签发最长一小时链接，文件有效期为七天，原件过期后须重新上传或生成。
* @summary 获取对话附件下载链接
* @param {ChatAttachmentReq} chatAttachmentReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatAttachmentDownload (
chatAttachmentReq: ChatAttachmentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/attachment/download`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatAttachmentDownload200Response>>(localVarPath, chatAttachmentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前用户、应用和实际数据权限查询附件状态，不返回 OSS 凭据或对象键。
* @summary 获取对话附件
* @param {ChatAttachmentReq} chatAttachmentReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatAttachmentGetOne (
chatAttachmentReq: ChatAttachmentReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/attachment/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatAttachmentGetOne200Response>>(localVarPath, chatAttachmentReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：multipart 表单携带 file 和 requestID，限额检查真实格式后上传私有 OSS，仅在对象和附件登记完成后返回可用状态。
* @summary 上传对话附件
* @param {File} [bodyParam.file]
* @param {string} [bodyParam.requestID] 上传幂等键，同一键不能替换内容
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiChatAttachmentUpload (bodyParam: { file: File; requestID: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/chat/attachment/upload`;
    return requestClient.post<ExtractDataType<PostApiV1AiChatAttachmentGetOne200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiChatAttachmentDownload operation in AiAttachmentApi.
 */
export interface AiAttachmentApiPostApiV1AiChatAttachmentDownloadRequest {
    readonly chatAttachmentReq: ChatAttachmentReq
}

/**
 * Request parameters for postApiV1AiChatAttachmentGetOne operation in AiAttachmentApi.
 */
export interface AiAttachmentApiPostApiV1AiChatAttachmentGetOneRequest {
    readonly chatAttachmentReq: ChatAttachmentReq
}

/**
 * Request parameters for postApiV1AiChatAttachmentUpload operation in AiAttachmentApi.
 */
export interface AiAttachmentApiPostApiV1AiChatAttachmentUploadRequest {
    readonly file: File

    /**
     * 上传幂等键，同一键不能替换内容
     */
    readonly requestID: string
}
