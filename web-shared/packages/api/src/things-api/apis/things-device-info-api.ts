import type { DeviceBindTokenGetOneReq } from '../models';
import type { DeviceCloneCreateReq } from '../models';
import type { DeviceCountReq } from '../models';
import type { DeviceInfo } from '../models';
import type { DeviceInfoBatchBindReq } from '../models';
import type { DeviceInfoBatchUpdateReq } from '../models';
import type { DeviceInfoBindReq } from '../models';
import type { DeviceInfoCanBindReq } from '../models';
import type { DeviceInfoDeleteReq } from '../models';
import type { DeviceInfoGetListReq } from '../models';
import type { DeviceInfoGetOneReq } from '../models';
import type { DeviceInfoTransferReq } from '../models';
import type { DeviceInfoUnbindReq } from '../models';
import type { DeviceMoveReq } from '../models';
import type { DeviceOtaUpgradeReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoBatchBind200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoBatchImport200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoBatchImportRequest } from '../models';
import type { PostApiV1ThingsDeviceInfoBatchUpdateImport200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoBindTokenCreate200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoCanBind200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoCloneCreate200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoCount200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoGetOne200Response } from '../models';
import type { PostApiV1ThingsDeviceInfoOtaUpgrade200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceInfoApi - axios parameter creator
 */

/**
* 批量将多个设备绑定给当前用户或指定区域。适用于批量添加设备到项目的场景。返回绑定结果，包括成功列表和失败详情。
* @summary 批量绑定
* @param {DeviceInfoBatchBindReq} deviceInfoBatchBindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBatchBind (
deviceInfoBatchBindReq: DeviceInfoBatchBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/batch-bind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoBatchBind200Response>>(localVarPath, deviceInfoBatchBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 通过Excel/CSV文件批量创建设备。文件中包含产品ID、设备名、别名、秘钥、网关绑定等信息。系统解析后批量创建设备记录。返回导入结果，包括成功数、失败数及失败明细。适用于大规模设备初始化场景。
* @summary 批量导入设备
* @param {PostApiV1ThingsDeviceInfoBatchImportRequest} postApiV1ThingsDeviceInfoBatchImportRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBatchImport (
postApiV1ThingsDeviceInfoBatchImportRequest?: PostApiV1ThingsDeviceInfoBatchImportRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoBatchImport200Response>>(localVarPath, postApiV1ThingsDeviceInfoBatchImportRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量修改多个设备的属性。可统一设置区域、额定功率等公共属性，减少逐个更新的接口调用。适用于批量调整设备归属、批量设置属性的场景。
* @summary 批量更新设备
* @param {DeviceInfoBatchUpdateReq} deviceInfoBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBatchUpdate (
deviceInfoBatchUpdateReq: DeviceInfoBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfoBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 通过Excel/CSV文件批量导入设备更新信息。文件中包含设备ID和要更新的属性值，系统解析后批量执行更新。返回导入总数、成功数、失败数及失败详情。适用于大规模设备属性批量修改。
* @summary 导入批量更新设备
* @param {PostApiV1ThingsDeviceInfoBatchImportRequest} postApiV1ThingsDeviceInfoBatchImportRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBatchUpdateImport (
postApiV1ThingsDeviceInfoBatchImportRequest?: PostApiV1ThingsDeviceInfoBatchImportRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/batch-update-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoBatchUpdateImport200Response>>(localVarPath, postApiV1ThingsDeviceInfoBatchImportRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将设备绑定给当前用户或指定区域。绑定后用户获得设备的操作权限，设备归属于用户的项目/区域。支持使用配网Token（中绑定）或直接绑定（强制绑定）。绑定成功后设备首次绑定时间被记录。
* @summary 绑定
* @param {DeviceInfoBindReq} deviceInfoBindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBind (
deviceInfoBindReq: DeviceInfoBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/bind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfoBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 生成配网Token，用于设备中绑定流程。用户发起配网时创建Token，设备上报携带此Token完成绑定验证。Token有效期内可使用，绑定成功或超时后失效。
* @summary 创建绑定token
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBindTokenCreate (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/bind/token/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoBindTokenCreate200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询配网Token的状态信息。Token用于设备中绑定流程，设备上报后Token状态从初始变为已上报。用于配网流程状态跟踪，判断设备是否已响应绑定请求。
* @summary 绑定token状态查询
* @param {DeviceBindTokenGetOneReq} deviceBindTokenGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoBindTokenGetOne (
deviceBindTokenGetOneReq: DeviceBindTokenGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/bind/token/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoBindTokenCreate200Response>>(localVarPath, deviceBindTokenGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 检查指定设备是否可以被绑定。验证设备的绑定限制（如是否已被他人绑定、是否属于其他租户、是否在线等）。在绑定操作前调用，提前发现绑定障碍。
* @summary 是否可以绑定设备
* @param {DeviceInfoCanBindReq} deviceInfoCanBindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoCanBind (
deviceInfoCanBindReq: DeviceInfoCanBindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/can-bind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoCanBind200Response>>(localVarPath, deviceInfoCanBindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 为未绑定智能体分身的设备创建或复用分身并绑定。适用于动态注册等未走绑定流程的设备；已绑定分身时幂等返回。创建成功后设备详情展示分身信息，对话开始积累记忆。
* @summary 创建设备智能体分身
* @param {DeviceCloneCreateReq} deviceCloneCreateReq  DeviceCloneCreateReq 设备智能体分身创建请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoCloneCreate (
deviceCloneCreateReq: DeviceCloneCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/clone-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoCloneCreate200Response>>(localVarPath, deviceCloneCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 统计设备的数量分布信息。可按区域、分组维度统计设备总数、在线数、离线数、未激活数、异常数，以及设备类型（直连设备、网关、子设备）分布。用于大屏展示、报表统计、监控概览。
* @summary 设备统计详情
* @param {DeviceCountReq} deviceCountReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoCount (
deviceCountReq: DeviceCountReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/count`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoCount200Response>>(localVarPath, deviceCountReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建新设备记录。设备必须属于某个产品（productID），设备名称（deviceName）为产品内唯一标识。创建后设备处于未激活状态，等待首次连接激活。支持设置设备别名、标签、位置、区域等属性。
* @summary 新增设备
* @param {DeviceInfo} deviceInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoCreate (
deviceInfo: DeviceInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除设备记录及其关联数据。删除前需确保设备已解绑（无用户绑定关系）。删除后设备的历史数据、物模型配置、分组关系等均会被清除。谨慎操作，数据不可恢复。
* @summary 删除设备
* @param {DeviceInfoDeleteReq} deviceInfoDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoDelete (
deviceInfoDeleteReq: DeviceInfoDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfoDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备列表，支持丰富的过滤条件：产品、设备名/别名、在线状态、区域、分组、标签、物模型属性值等。支持分页查询，可选择是否同时获取属性最新值、区域信息、分组信息、网关信息等。用于设备管理列表页展示。
* @summary 获取设备列表
* @param {DeviceInfoGetListReq} deviceInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoGetList (
deviceInfoGetListReq: DeviceInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoGetList200Response>>(localVarPath, deviceInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取单个设备的完整信息，包括基本信息、在线状态、位置、标签、物模型别名、协议配置等。可选择同时获取属性最新值、配置信息（profile）、所属区域、所属分组、绑定的网关等关联信息。
* @summary 获取设备详情
* @param {DeviceInfoGetOneReq} deviceInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoGetOne (
deviceInfoGetOneReq: DeviceInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoGetOne200Response>>(localVarPath, deviceInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将设备的数据和配置转移到新设备上。用于设备更换场景，保留原设备的配置（profile）、物模型别名等。转移后原设备被替换为新设备。
* @summary 转移设备到新设备上
* @param {DeviceMoveReq} deviceMoveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoMove (
deviceMoveReq: DeviceMoveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/move`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceMoveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 手动触发设备OTA升级。传入设备当前版本，系统查询是否有可用升级包。如有新版本，返回升级包信息（版本号、文件地址、MD5校验、签名等）。设备可下载升级包进行固件更新。
* @summary 设备升级,获取升级包手动升级
* @param {DeviceOtaUpgradeReq} deviceOtaUpgradeReq  DeviceOtaUpgradeReq OTA升级请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoOtaUpgrade (
deviceOtaUpgradeReq: DeviceOtaUpgradeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/ota/upgrade`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceInfoOtaUpgrade200Response>>(localVarPath, deviceOtaUpgradeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 将设备转让给其他用户或转移到其他项目。支持清除数据选项（转让后清除设备历史数据）。用于设备归属变更、项目间设备迁移等场景。
* @summary 转让设备
* @param {DeviceInfoTransferReq} deviceInfoTransferReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoTransfer (
deviceInfoTransferReq: DeviceInfoTransferReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/transfer`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfoTransferReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 解除用户与设备的绑定关系。解绑后用户失去设备操作权限，设备恢复为未绑定状态。支持强制解绑（使用设备秘钥签名验证），用于设备转让、设备废弃等场景。
* @summary 解绑设备
* @param {DeviceInfoUnbindReq} deviceInfoUnbindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoUnbind (
deviceInfoUnbindReq: DeviceInfoUnbindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfoUnbindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 修改设备的属性信息，如设备别名、标签、位置、区域、日志级别、物模型别名等。支持部分更新，未传值的字段保持不变。不修改设备核心标识（productID、deviceName）。
* @summary 更新设备
* @param {DeviceInfo} deviceInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceInfoUpdate (
deviceInfo: DeviceInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceInfoBatchBind operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBatchBindRequest {
    readonly deviceInfoBatchBindReq: DeviceInfoBatchBindReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoBatchImport operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBatchImportRequest {
    readonly postApiV1ThingsDeviceInfoBatchImportRequest?: PostApiV1ThingsDeviceInfoBatchImportRequest
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoBatchUpdate operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBatchUpdateRequest {
    readonly deviceInfoBatchUpdateReq: DeviceInfoBatchUpdateReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoBatchUpdateImport operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBatchUpdateImportRequest {
    readonly postApiV1ThingsDeviceInfoBatchImportRequest?: PostApiV1ThingsDeviceInfoBatchImportRequest
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoBind operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBindRequest {
    readonly deviceInfoBindReq: DeviceInfoBindReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoBindTokenGetOne operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoBindTokenGetOneRequest {
    readonly deviceBindTokenGetOneReq: DeviceBindTokenGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoCanBind operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoCanBindRequest {
    readonly deviceInfoCanBindReq: DeviceInfoCanBindReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoCloneCreate operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoCloneCreateRequest {
    /**
     *  DeviceCloneCreateReq 设备智能体分身创建请求
     */
    readonly deviceCloneCreateReq: DeviceCloneCreateReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoCount operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoCountRequest {
    readonly deviceCountReq: DeviceCountReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoCreate operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoCreateRequest {
    readonly deviceInfo: DeviceInfo
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoDelete operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoDeleteRequest {
    readonly deviceInfoDeleteReq: DeviceInfoDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoGetList operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoGetListRequest {
    readonly deviceInfoGetListReq: DeviceInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoGetOne operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoGetOneRequest {
    readonly deviceInfoGetOneReq: DeviceInfoGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoMove operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoMoveRequest {
    readonly deviceMoveReq: DeviceMoveReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoOtaUpgrade operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoOtaUpgradeRequest {
    /**
     *  DeviceOtaUpgradeReq OTA升级请求
     */
    readonly deviceOtaUpgradeReq: DeviceOtaUpgradeReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoTransfer operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoTransferRequest {
    readonly deviceInfoTransferReq: DeviceInfoTransferReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoUnbind operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoUnbindRequest {
    readonly deviceInfoUnbindReq: DeviceInfoUnbindReq
}

/**
 * Request parameters for postApiV1ThingsDeviceInfoUpdate operation in ThingsDeviceInfoApi.
 */
export interface ThingsDeviceInfoApiPostApiV1ThingsDeviceInfoUpdateRequest {
    readonly deviceInfo: DeviceInfo
}
