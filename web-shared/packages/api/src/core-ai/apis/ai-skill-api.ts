import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiSkillApprove200Response } from '../models';
import type { PostApiV1AiSkillDownload200Response } from '../models';
import type { PostApiV1AiSkillGetList200Response } from '../models';
import type { PostApiV1AiSkillGetOne200Response } from '../models';
import type { PostApiV1AiSkillTest200Response } from '../models';
import type { PostApiV1AiSkillValidate200Response } from '../models';
import type { SkillApproveReq } from '../models';
import type { SkillGetListReq } from '../models';
import type { SkillInfo } from '../models';
import type { SkillPublishReq } from '../models';
import type { SkillReviewReq } from '../models';
import type { SkillSubmitReq } from '../models';
import type { SkillTestReq } from '../models';
import type { SkillUploadReq } from '../models';
import type { SkillValidateReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiSkillApi - axios parameter creator
 */

/**
* 业务说明：管理员对技能包进行最终审批，approved=true通过，false拒绝。可添加审批意见comment。审批通过后技能状态变为approved，可发布上线。用于技能上线前的最后把关。
* @summary 审批技能
* @param {SkillApproveReq} skillApproveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillApprove (
skillApproveReq: SkillApproveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/approve`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillApprove200Response>>(localVarPath, skillApproveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建新的技能包记录，定义技能编码、名称、描述、版本号等。技能包是AI能力的知识载体，包含提示词模板、工具定义、示例对话等。创建后可通过上传zip包添加技能内容。
* @summary 创建技能
* @param {SkillInfo} skillInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillCreate (
skillInfo: SkillInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, skillInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除指定的技能包记录及其关联的文件内容。删除前需检查是否有助手组正在使用该技能，如有则需先解除绑定后再删除。删除操作不可恢复，OSS存储的文件也会同步删除。
* @summary 删除技能
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：下载指定技能包的完整zip文件，包含所有技能内容和配置。用于技能包分发、离线查看、备份导出等场景。返回Base64编码的zip数据和OSS路径。
* @summary 下载技能zip包
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillDownload (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/download`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillDownload200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询技能包列表，支持按租户、名称、父技能ID、状态过滤。用于技能管理页面、助手组选择技能等场景。返回结果按排序权重排列，租户可看到本租户和common租户的技能。
* @summary 获取技能列表
* @param {SkillGetListReq} skillGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillGetList (
skillGetListReq: SkillGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillGetList200Response>>(localVarPath, skillGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据技能ID查询完整的技能包信息，包括编码、名称、版本、OSS路径、发布状态、审阅结果等。用于技能编辑回显、详情查看、版本管理等场景。manifest字段包含skill.yaml内容。
* @summary 获取技能详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将已审核通过的技能包发布为新版本，更新版本号，标记为published状态。发布后该版本技能可被助手组正式使用。发布前需确保技能已完成全部治理流程（验证、审阅、测试、审批）。
* @summary 发布新版本
* @param {SkillPublishReq} skillPublishReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillPublish (
skillPublishReq: SkillPublishReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/publish`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, skillPublishReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用AI自动审阅技能包内容，评估提示词质量、示例完整性、工具定义合理性等。审阅结果写入reviewResult字段。可设置force强制通过。用于技能质量把关。返回更新后的技能信息。
* @summary AI审阅
* @param {SkillReviewReq} skillReviewReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillReview (
skillReviewReq: SkillReviewReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/review`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillApprove200Response>>(localVarPath, skillReviewReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将技能包提交到治理流程，进入审核队列。提交后技能状态变为待审核，触发后续验证、审阅、测试、审批等流程。用于技能包准备完成后的上线申请。返回更新后的技能信息。
* @summary 提交审核
* @param {SkillSubmitReq} skillSubmitReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillSubmit (
skillSubmitReq: SkillSubmitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/submit`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillApprove200Response>>(localVarPath, skillSubmitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：执行技能包的功能测试，验证提示词效果、工具调用正确性等。可指定测试输入，返回测试输出、耗时、错误列表。测试通过后方可进入审批环节。用于技能功能验证。
* @summary 测试技能
* @param {SkillTestReq} skillTestReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillTest (
skillTestReq: SkillTestReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/test`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillTest200Response>>(localVarPath, skillTestReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改已存在的技能包元数据，支持更新名称、描述、版本号、排序、状态等。部分更新，空值字段不修改。技能内容更新需通过文件管理接口或重新上传zip包。
* @summary 更新技能
* @param {SkillInfo} skillInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillUpdate (
skillInfo: SkillInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, skillInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：上传技能包的zip压缩文件，包含skill.yaml配置、提示词文件、示例文件等。服务端解析zip内容，存储到OSS，更新技能记录。用于技能包初次上传、版本更新等场景。返回技能ID。
* @summary 上传技能zip包
* @param {SkillUploadReq} skillUploadReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillUpload (
skillUploadReq: SkillUploadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/upload`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, skillUploadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对技能包进行自动化验证，检查skill.yaml格式、文件完整性、配置正确性等。返回验证结果、错误列表、警告列表。验证通过后方可进入审阅环节。用于快速检测技能包质量。
* @summary 验证技能
* @param {SkillValidateReq} skillValidateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiSkillValidate (
skillValidateReq: SkillValidateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/skill/validate`;
    return requestClient.post<ExtractDataType<PostApiV1AiSkillValidate200Response>>(localVarPath, skillValidateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiSkillApprove operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillApproveRequest {
    readonly skillApproveReq: SkillApproveReq
}

/**
 * Request parameters for postApiV1AiSkillCreate operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillCreateRequest {
    readonly skillInfo: SkillInfo
}

/**
 * Request parameters for postApiV1AiSkillDelete operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSkillDownload operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillDownloadRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSkillGetList operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillGetListRequest {
    readonly skillGetListReq: SkillGetListReq
}

/**
 * Request parameters for postApiV1AiSkillGetOne operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiSkillPublish operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillPublishRequest {
    readonly skillPublishReq: SkillPublishReq
}

/**
 * Request parameters for postApiV1AiSkillReview operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillReviewRequest {
    readonly skillReviewReq: SkillReviewReq
}

/**
 * Request parameters for postApiV1AiSkillSubmit operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillSubmitRequest {
    readonly skillSubmitReq: SkillSubmitReq
}

/**
 * Request parameters for postApiV1AiSkillTest operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillTestRequest {
    readonly skillTestReq: SkillTestReq
}

/**
 * Request parameters for postApiV1AiSkillUpdate operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillUpdateRequest {
    readonly skillInfo: SkillInfo
}

/**
 * Request parameters for postApiV1AiSkillUpload operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillUploadRequest {
    readonly skillUploadReq: SkillUploadReq
}

/**
 * Request parameters for postApiV1AiSkillValidate operation in AiSkillApi.
 */
export interface AiSkillApiPostApiV1AiSkillValidateRequest {
    readonly skillValidateReq: SkillValidateReq
}
