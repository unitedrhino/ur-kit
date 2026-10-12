import type { PostApiV1AiAgentGroupCreate200Response } from '../models';
import type { PostApiV1AiAgentGroupDelete200Response } from '../models';
import type { PostApiV1AiToolExport200Response } from '../models';
import type { PostApiV1AiToolGetList200Response } from '../models';
import type { PostApiV1AiToolGetOne200Response } from '../models';
import type { ToolCreateReq } from '../models';
import type { ToolExportReq } from '../models';
import type { ToolGetListReq } from '../models';
import type { ToolGetOneReq } from '../models';
import type { ToolImportReq } from '../models';
import type { ToolSaveArtifactReq } from '../models';
import type { ToolUpdateReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AiToolApi - axios parameter creator
 */

/**
* 业务说明：创建新的AI工具，设置编码、名称、描述并关联AgentGroup。创建后自动初始化空三件套到S3，状态为草稿。创建完成后可通过编辑页完善工具内容。
* @summary 创建工具
* @param {ToolCreateReq} toolCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolCreate (
toolCreateReq: ToolCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/create`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, toolCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：软删除指定工具，工具记录标记删除时间戳，不物理删除数据。删除后工具不再出现在列表中，但历史执行记录保留。
* @summary 删除工具
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将已发布工具停用，状态变更为已停用。停用后工具不可被规则引擎调用，但历史执行记录和工具定义保留。可重新发布恢复使用。
* @summary 停用工具
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolDisable (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/disable`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：导出当前工具的三件套内容为zip包，包含executor.js、manifest.json、skill.md，用于备份和离线编辑。
* @summary 导出工具zip包
* @param {ToolExportReq} toolExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolExport (
toolExportReq: ToolExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/export`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolExport200Response>>(localVarPath, toolExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询AI工具列表，支持按名称、AgentGroup、状态过滤。返回工具基本信息列表，包含编码、名称、版本、状态等。用于工具管理页面展示。
* @summary 获取工具列表
* @param {ToolGetListReq} toolGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolGetList (
toolGetListReq: ToolGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolGetList200Response>>(localVarPath, toolGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据工具ID查询完整信息，包含工具元数据和三件套内容（executor.js、document.md、manifest.json）。用于工具编辑页回显、详情查看等场景。
* @summary 获取工具详情
* @param {ToolGetOneReq} toolGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolGetOne (
toolGetOneReq: ToolGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AiToolGetOne200Response>>(localVarPath, toolGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在工具详情页导入zip包，覆盖当前工具的executor.js、manifest.json、skill.md三件套。仅草稿状态允许覆盖三件套，已发布或停用工具拒绝写入。
* @summary 导入工具zip包
* @param {ToolImportReq} toolImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolImport (
toolImportReq: ToolImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/import`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupCreate200Response>>(localVarPath, toolImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：将草稿状态工具发布上线，版本号加1，状态变更为已发布。发布后工具可被规则引擎引用执行。已发布工具不能修改三件套内容，需重新创建新版本。
* @summary 发布工具
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolPublish (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/publish`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存工具的三件套内容（executor.js、document.md、manifest.json）到S3存储。用于工具编辑页保存代码和文档内容。仅草稿状态工具可保存。
* @summary 保存三件套
* @param {ToolSaveArtifactReq} toolSaveArtifactReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolSaveArtifact (
toolSaveArtifactReq: ToolSaveArtifactReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/save-artifact`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, toolSaveArtifactReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改工具基础信息，支持更新名称和描述。部分更新，空值字段保持原值。不支持修改code和agentGroupID。
* @summary 更新工具
* @param {ToolUpdateReq} toolUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AiToolUpdate (
toolUpdateReq: ToolUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/ai/tool/update`;
    return requestClient.post<ExtractDataType<PostApiV1AiAgentGroupDelete200Response>>(localVarPath, toolUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1AiToolCreate operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolCreateRequest {
    readonly toolCreateReq: ToolCreateReq
}

/**
 * Request parameters for postApiV1AiToolDelete operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiToolDisable operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolDisableRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiToolExport operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolExportRequest {
    readonly toolExportReq: ToolExportReq
}

/**
 * Request parameters for postApiV1AiToolGetList operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolGetListRequest {
    readonly toolGetListReq: ToolGetListReq
}

/**
 * Request parameters for postApiV1AiToolGetOne operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolGetOneRequest {
    readonly toolGetOneReq: ToolGetOneReq
}

/**
 * Request parameters for postApiV1AiToolImport operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolImportRequest {
    readonly toolImportReq: ToolImportReq
}

/**
 * Request parameters for postApiV1AiToolPublish operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolPublishRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1AiToolSaveArtifact operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolSaveArtifactRequest {
    readonly toolSaveArtifactReq: ToolSaveArtifactReq
}

/**
 * Request parameters for postApiV1AiToolUpdate operation in AiToolApi.
 */
export interface AiToolApiPostApiV1AiToolUpdateRequest {
    readonly toolUpdateReq: ToolUpdateReq
}
