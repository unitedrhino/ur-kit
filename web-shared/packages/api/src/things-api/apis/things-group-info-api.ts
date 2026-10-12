import type { GroupInfo } from '../models';
import type { GroupInfoGetListReq } from '../models';
import type { GroupInfoGetOneReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsGroupInfoGetList200Response } from '../models';
import type { PostApiV1ThingsGroupInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsGroupInfoApi - axios parameter creator
 */

/**
* 业务说明：创建设备分组，用于批量管理和分类设备。分组可设置父分组实现层级结构，绑定产品和区域限制分组内设备范围。分组用途可通过purpose字段自定义
* @summary 创建分组
* @param {GroupInfo} groupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupInfoCreate (
groupInfo: GroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, groupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除设备分组。删除后分组内的设备关系同步解除，设备本身不受影响。如分组有子分组，需先删除子分组
* @summary 删除分组
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询设备分组列表。支持按区域、父分组、产品、名称过滤。返回分组基本信息、设备数量统计、层级关系。可加载子分组树形结构
* @summary 获取分组列表
* @param {GroupInfoGetListReq} groupInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupInfoGetList (
groupInfoGetListReq: GroupInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoGetList200Response>>(localVarPath, groupInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据分组ID查询分组完整信息。返回分组名称、描述、产品绑定、设备列表、层级路径。可选择同时加载子分组列表
* @summary 获取分组详情信息
* @param {GroupInfoGetOneReq} groupInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupInfoGetOne (
groupInfoGetOneReq: GroupInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoGetOne200Response>>(localVarPath, groupInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改分组名称、描述、父分组、区域绑定等属性。支持部分更新，空值字段保持原值不变。分组内的设备关系需通过分组设备接口单独管理
* @summary 更新分组信息
* @param {GroupInfo} groupInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsGroupInfoUpdate (
groupInfo: GroupInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/group/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, groupInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsGroupInfoCreate operation in ThingsGroupInfoApi.
 */
export interface ThingsGroupInfoApiPostApiV1ThingsGroupInfoCreateRequest {
    readonly groupInfo: GroupInfo
}

/**
 * Request parameters for postApiV1ThingsGroupInfoDelete operation in ThingsGroupInfoApi.
 */
export interface ThingsGroupInfoApiPostApiV1ThingsGroupInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsGroupInfoGetList operation in ThingsGroupInfoApi.
 */
export interface ThingsGroupInfoApiPostApiV1ThingsGroupInfoGetListRequest {
    readonly groupInfoGetListReq: GroupInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsGroupInfoGetOne operation in ThingsGroupInfoApi.
 */
export interface ThingsGroupInfoApiPostApiV1ThingsGroupInfoGetOneRequest {
    readonly groupInfoGetOneReq: GroupInfoGetOneReq
}

/**
 * Request parameters for postApiV1ThingsGroupInfoUpdate operation in ThingsGroupInfoApi.
 */
export interface ThingsGroupInfoApiPostApiV1ThingsGroupInfoUpdateRequest {
    readonly groupInfo: GroupInfo
}
