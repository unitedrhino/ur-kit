import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareBatchCreate200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareBatchGetList200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareBatchGetTokenList200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareGetList200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareGetOne200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareShareCodeAccept200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareShareCodeGen200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareShareCodeGetInfo200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareShareCodeGetList200Response } from '../models';
import type { PostApiV1ThingsUserDeviceShareTokenCheck200Response } from '../models';
import type { UserDeviceShareBatchAcceptInfo } from '../models';
import type { UserDeviceShareBatchDeleteReq } from '../models';
import type { UserDeviceShareBatchDeleteTokenReq } from '../models';
import type { UserDeviceShareBatchInfo } from '../models';
import type { UserDeviceShareBatchToken } from '../models';
import type { UserDeviceShareCodeAcceptReq } from '../models';
import type { UserDeviceShareCodeDeleteReq } from '../models';
import type { UserDeviceShareCodeGenReq } from '../models';
import type { UserDeviceShareCodeGetInfoReq } from '../models';
import type { UserDeviceShareGetListReq } from '../models';
import type { UserDeviceShareGetOneReq } from '../models';
import type { UserDeviceShareInfo } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsUserDeviceShareApi - axios parameter creator
 */

/**
* 业务说明：用户确认接受批量分享的设备权限，将分享记录中的设备与当前用户建立关联关系。接受后用户获得设备相应权限（读/写/控制），可在设备列表中看到已分享设备。
* @summary 接受批量分享设备
* @param {UserDeviceShareBatchAcceptInfo} userDeviceShareBatchAcceptInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchAccept (
userDeviceShareBatchAcceptInfo: UserDeviceShareBatchAcceptInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-accept`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareBatchAcceptInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者批量选择多个设备生成分享二维码，其他用户扫码后可一次性接受多个设备的分享权限。适用于批量设备移交场景（如项目交付、设备群控）。返回分享Token用于二维码生成和后续验证。
* @summary 生成批量分享设备二维码
* @param {UserDeviceShareBatchInfo} userDeviceShareBatchInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchCreate (
userDeviceShareBatchInfo: UserDeviceShareBatchInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareBatchCreate200Response>>(localVarPath, userDeviceShareBatchInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者批量取消多个设备分享记录，可按分享ID列表或项目维度批量删除。适用于设备退役、项目关闭等需要清理分享关系的场景。
* @summary 批量取消分享设备
* @param {UserDeviceShareBatchDeleteReq} userDeviceShareBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchDelete (
userDeviceShareBatchDeleteReq: UserDeviceShareBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分享者手动删除自己生成的批量分享 Token，使其立即失效。删除后该 Token 不可再被接受，被分享者查询时返回【分享 Token 不存在或已过期】。
* @summary 删除批量分享 Token
* @param {UserDeviceShareBatchDeleteTokenReq} userDeviceShareBatchDeleteTokenReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchDeleteToken (
userDeviceShareBatchDeleteTokenReq: UserDeviceShareBatchDeleteTokenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-delete-token`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareBatchDeleteTokenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：用户扫描批量分享二维码后，通过分享Token查询待接受的设备列表及其权限配置详情，用于用户确认是否接受分享。返回设备信息、授权类型、权限范围、过期时间等。
* @summary 获取批量分享的设备列表
* @param {UserDeviceShareBatchToken} userDeviceShareBatchToken
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchGetList (
userDeviceShareBatchToken: UserDeviceShareBatchToken,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareBatchGetList200Response>>(localVarPath, userDeviceShareBatchToken, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前登录用户生成的所有有效批量分享 Token 列表，包括设备数量、授权类型、有效期等。用于分享者在管理页面查看自己发出的批量分享。列表自动过滤已过期的 Token。
* @summary 获取批量分享 Token 列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareBatchGetTokenList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/batch-get-token-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareBatchGetTokenList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者将设备权限分享给其他用户，支持全部授权（完整控制权限）和部分授权（指定功能权限）。可设置分享权限范围（物模型功能、系统功能）和过期时间，分享记录写入设备分享表。
* @summary 分享设备
* @param {UserDeviceShareInfo} userDeviceShareInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareCreate (
userDeviceShareInfo: UserDeviceShareInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, userDeviceShareInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者取消对单个用户的设备分享，删除分享记录，被分享用户立即失去该设备的访问权限。不影响设备所有者的所有权。
* @summary 取消分享设备
* @param {UserDeviceShareGetOneReq} userDeviceShareGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareDelete (
userDeviceShareGetOneReq: UserDeviceShareGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询设备分享记录列表，支持按设备维度筛选，可选同时返回被分享用户信息。用于分享管理页面展示当前用户作为分享者或被分享者的所有设备分享关系。
* @summary 获取分享设备列表
* @param {UserDeviceShareGetListReq} userDeviceShareGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareGetList (
userDeviceShareGetListReq: UserDeviceShareGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareGetList200Response>>(localVarPath, userDeviceShareGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单条设备分享记录的完整信息，包括设备信息、被分享用户、授权类型、权限配置、过期时间等。用于分享管理页面的详情查看或权限编辑前的数据获取。
* @summary 获取分享设备详情
* @param {UserDeviceShareGetOneReq} userDeviceShareGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareGetOne (
userDeviceShareGetOneReq: UserDeviceShareGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareGetOne200Response>>(localVarPath, userDeviceShareGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：用户输入分享码，验证有效性后将设备权限绑定到当前用户。验证通过后创建 dm_user_device_share 记录，并删除分享码（一次性使用）。支持单设备和批量设备接受。
* @summary 通过分享码接受设备
* @param {UserDeviceShareCodeAcceptReq} userDeviceShareCodeAcceptReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareShareCodeAccept (
userDeviceShareCodeAcceptReq: UserDeviceShareCodeAcceptReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/share-code-accept`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareShareCodeAccept200Response>>(localVarPath, userDeviceShareCodeAcceptReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分享者手动删除自己生成的分享码，使其立即失效。删除后该分享码不可再被接受，被分享者查询时返回【分享码不存在或已过期】。
* @summary 删除分享码
* @param {UserDeviceShareCodeDeleteReq} userDeviceShareCodeDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareShareCodeDelete (
userDeviceShareCodeDeleteReq: UserDeviceShareCodeDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/share-code-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareCodeDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者选择设备及权限配置后生成分享码，支持单设备或批量设备。分享码默认有效期24小时，最长72小时（3天），可通过纯文本方式分享给其他用户。被分享者输入分享码即可接受设备权限。
* @summary 生成设备分享码
* @param {UserDeviceShareCodeGenReq} userDeviceShareCodeGenReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareShareCodeGen (
userDeviceShareCodeGenReq: UserDeviceShareCodeGenReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/share-code-gen`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareShareCodeGen200Response>>(localVarPath, userDeviceShareCodeGenReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：无需登录，通过分享码查询对应的设备列表和分享权限信息。用于被分享者在未登录状态下预览即将接受的设备信息。分享码过期或无效时返回对应错误。
* @summary 通过分享码查询分享信息
* @param {UserDeviceShareCodeGetInfoReq} userDeviceShareCodeGetInfoReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareShareCodeGetInfo (
userDeviceShareCodeGetInfoReq: UserDeviceShareCodeGetInfoReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/share-code-get-info`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareShareCodeGetInfo200Response>>(localVarPath, userDeviceShareCodeGetInfoReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询当前登录用户生成的所有有效分享码列表，包括设备信息、权限配置、有效期等。用于分享者在管理页面查看自己发出的分享码。列表自动过滤已过期的分享码。
* @summary 获取分享码列表
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareShareCodeGetList (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/share-code-get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareShareCodeGetList200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：无需登录，通过分享 Token 查询链接是否仍然有效。仅返回有效状态、过期时间、用途和设备数量，不返回设备详情、权限配置或用户信息，用于公开分享承接页展示链接状态。
* @summary 校验批量分享 Token
* @param {UserDeviceShareBatchToken} userDeviceShareBatchToken
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareTokenCheck (
userDeviceShareBatchToken: UserDeviceShareBatchToken,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/token/check`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsUserDeviceShareTokenCheck200Response>>(localVarPath, userDeviceShareBatchToken, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设备所有者修改已分享设备的权限配置，包括调整授权类型、权限范围（物模型功能权限、系统功能权限）、过期时间等。更新后被分享用户的权限立即生效。
* @summary 更新分享设备信息
* @param {UserDeviceShareInfo} userDeviceShareInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsUserDeviceShareUpdate (
userDeviceShareInfo: UserDeviceShareInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/user/device/share/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, userDeviceShareInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsUserDeviceShareBatchAccept operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareBatchAcceptRequest {
    readonly userDeviceShareBatchAcceptInfo: UserDeviceShareBatchAcceptInfo
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareBatchCreate operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareBatchCreateRequest {
    readonly userDeviceShareBatchInfo: UserDeviceShareBatchInfo
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareBatchDelete operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareBatchDeleteRequest {
    readonly userDeviceShareBatchDeleteReq: UserDeviceShareBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareBatchDeleteToken operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareBatchDeleteTokenRequest {
    readonly userDeviceShareBatchDeleteTokenReq: UserDeviceShareBatchDeleteTokenReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareBatchGetList operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareBatchGetListRequest {
    readonly userDeviceShareBatchToken: UserDeviceShareBatchToken
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareCreate operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareCreateRequest {
    readonly userDeviceShareInfo: UserDeviceShareInfo
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareDelete operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareDeleteRequest {
    readonly userDeviceShareGetOneReq: UserDeviceShareGetOneReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareGetList operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareGetListRequest {
    readonly userDeviceShareGetListReq: UserDeviceShareGetListReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareGetOne operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareGetOneRequest {
    readonly userDeviceShareGetOneReq: UserDeviceShareGetOneReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareShareCodeAccept operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareShareCodeAcceptRequest {
    readonly userDeviceShareCodeAcceptReq: UserDeviceShareCodeAcceptReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareShareCodeDelete operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareShareCodeDeleteRequest {
    readonly userDeviceShareCodeDeleteReq: UserDeviceShareCodeDeleteReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareShareCodeGen operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareShareCodeGenRequest {
    readonly userDeviceShareCodeGenReq: UserDeviceShareCodeGenReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareShareCodeGetInfo operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareShareCodeGetInfoRequest {
    readonly userDeviceShareCodeGetInfoReq: UserDeviceShareCodeGetInfoReq
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareTokenCheck operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareTokenCheckRequest {
    readonly userDeviceShareBatchToken: UserDeviceShareBatchToken
}

/**
 * Request parameters for postApiV1ThingsUserDeviceShareUpdate operation in ThingsUserDeviceShareApi.
 */
export interface ThingsUserDeviceShareApiPostApiV1ThingsUserDeviceShareUpdateRequest {
    readonly userDeviceShareInfo: UserDeviceShareInfo
}
