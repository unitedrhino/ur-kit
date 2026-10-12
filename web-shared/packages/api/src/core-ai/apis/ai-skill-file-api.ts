import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiSkillFileGetList200Response } from '../models';
import type { PostApiV1AiSkillFileGetOne200Response } from '../models';
import type { SkillFileAddReq } from '../models';
import type { SkillFileDeleteReq } from '../models';
import type { SkillFileGetReq } from '../models';
import type { SkillFileListReq } from '../models';
import type { SkillFileUpdateReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiSkillFileApi - axios parameter creator
 */

/**
* 业务说明：在技能包中新增文件或目录，支持创建提示词文件、配置文件、示例文件等。新文件立即存储到OSS，更新技能包内容。用于技能内容编辑、增量更新等场景。
* @summary 创建技能文件
* @param {SkillFileAddReq} skillFileAddReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillFileCreate (
skillFileAddReq: SkillFileAddReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/file/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, skillFileAddReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除技能包中的指定文件或目录，同步删除OSS存储。删除前需确认文件引用关系，避免删除关键配置文件导致技能失效。删除后技能包内容更新。
* @summary 删除文件
* @param {SkillFileDeleteReq} skillFileDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillFileDelete (
skillFileDeleteReq: SkillFileDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/file/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, skillFileDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询技能包指定目录下的文件和子目录列表，返回路径、大小、是否目录、更新时间等。用于技能包文件浏览、目录导航等场景。默认列出根目录，可指定子目录路径。
* @summary 列出技能包内文件
* @param {SkillFileListReq} skillFileListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillFileGetList (
skillFileListReq: SkillFileListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/file/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillFileGetList200Response>>(localVarPath, skillFileListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询技能包中指定文件的完整内容，返回文件文本内容、大小、路径等。用于文件编辑回显、内容查看、调试等场景。仅支持文本文件，二进制文件返回错误。
* @summary 获取文件内容
* @param {SkillFileGetReq} skillFileGetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillFileGetOne (
skillFileGetReq: SkillFileGetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/file/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillFileGetOne200Response>>(localVarPath, skillFileGetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改技能包中已存在文件的内容，立即同步到OSS存储。用于技能内容编辑、配置调整等场景。更新后技能包版本不变，需手动发布新版本才能生效。
* @summary 更新文件内容
* @param {SkillFileUpdateReq} skillFileUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillFileUpdate (
skillFileUpdateReq: SkillFileUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/file/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, skillFileUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiSkillFileCreate operation in AiSkillFileApi.
 */
export interface AiSkillFileApiPostApiV1AiSkillFileCreateRequest {
    readonly skillFileAddReq: SkillFileAddReq
}

/**
 * Request parameters for postApiV1AiSkillFileDelete operation in AiSkillFileApi.
 */
export interface AiSkillFileApiPostApiV1AiSkillFileDeleteRequest {
    readonly skillFileDeleteReq: SkillFileDeleteReq
}

/**
 * Request parameters for postApiV1AiSkillFileGetList operation in AiSkillFileApi.
 */
export interface AiSkillFileApiPostApiV1AiSkillFileGetListRequest {
    readonly skillFileListReq: SkillFileListReq
}

/**
 * Request parameters for postApiV1AiSkillFileGetOne operation in AiSkillFileApi.
 */
export interface AiSkillFileApiPostApiV1AiSkillFileGetOneRequest {
    readonly skillFileGetReq: SkillFileGetReq
}

/**
 * Request parameters for postApiV1AiSkillFileUpdate operation in AiSkillFileApi.
 */
export interface AiSkillFileApiPostApiV1AiSkillFileUpdateRequest {
    readonly skillFileUpdateReq: SkillFileUpdateReq
}
