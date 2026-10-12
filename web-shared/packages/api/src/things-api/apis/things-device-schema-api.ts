import type { DeviceSchema } from '../models';
import type { DeviceSchemaBatchCreateReq } from '../models';
import type { DeviceSchemaBatchDeleteReq } from '../models';
import type { DeviceSchemaGetListReq } from '../models';
import type { DeviceSchemaTslGetOneReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsDeviceSchemaGetList200Response } from '../models';
import type { PostApiV1ThingsDeviceSchemaTslRead200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceSchemaApi - axios parameter creator
 */

/**
* 批量导入设备物模型条目。支持两种方式：1）通过标识符列表从产品物模型继承定义；2）直接传入自定义的物模型列表。用于快速为设备配置多个物模型功能。
* @summary 批量创建设备物模型
* @param {DeviceSchemaBatchCreateReq} deviceSchemaBatchCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaBatchCreate (
deviceSchemaBatchCreateReq: DeviceSchemaBatchCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/batch-create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceSchemaBatchCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 批量删除设备的物模型条目。通过标识符列表指定要删除的功能定义。删除后设备将恢复使用产品物模型的默认定义。注意：必选标签（tag=3）的物模型不可删除。
* @summary 批量删除设备物模型
* @param {DeviceSchemaBatchDeleteReq} deviceSchemaBatchDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaBatchDelete (
deviceSchemaBatchDeleteReq: DeviceSchemaBatchDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/batch-delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceSchemaBatchDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 为设备新增一个物模型条目（属性、事件或行为）。用于设备有产品物模型之外的个性化功能，或需要修改产品物模型中的默认定义。创建后设备将拥有该功能定义。
* @summary 创建设备物模型
* @param {DeviceSchema} deviceSchema /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaCreate (
deviceSchema: DeviceSchema,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceSchema, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 查询设备的物模型条目列表。支持按类型（属性/事件/行为）、标签（自定义/可选/必选）、标识符等条件筛选。可选择是否同时获取产品物模型用于对比。用于设备物模型管理、功能配置查询。
* @summary 获取设备物模型列表
* @param {DeviceSchemaGetListReq} deviceSchemaGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaGetList (
deviceSchemaGetListReq: DeviceSchemaGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceSchemaGetList200Response>>(localVarPath, deviceSchemaGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 获取设备的完整物模型TSL（Thing Specification Language）描述。TSL是物联网平台定义的物模型描述语言，包含属性、事件、行为的完整定义。返回JSON格式的TSL字符串，用于设备调试、物模型导入导出。
* @summary 获取设备物模型tsl
* @param {DeviceSchemaTslGetOneReq} deviceSchemaTslGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaTslRead (
deviceSchemaTslGetOneReq: DeviceSchemaTslGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/tsl-read`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceSchemaTslRead200Response>>(localVarPath, deviceSchemaTslGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新设备的单个物模型条目（属性、事件或行为）。设备物模型用于覆盖或补充产品物模型，实现设备级别的个性化配置。修改后立即生效，影响该设备的数据解析和控制逻辑。
* @summary 更新设备物模型
* @param {DeviceSchema} deviceSchema /_*物模型条目*_/
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceSchemaUpdate (
deviceSchema: DeviceSchema,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/schema/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, deviceSchema, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceSchemaBatchCreate operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaBatchCreateRequest {
    readonly deviceSchemaBatchCreateReq: DeviceSchemaBatchCreateReq
}

/**
 * Request parameters for postApiV1ThingsDeviceSchemaBatchDelete operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaBatchDeleteRequest {
    readonly deviceSchemaBatchDeleteReq: DeviceSchemaBatchDeleteReq
}

/**
 * Request parameters for postApiV1ThingsDeviceSchemaCreate operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaCreateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly deviceSchema: DeviceSchema
}

/**
 * Request parameters for postApiV1ThingsDeviceSchemaGetList operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaGetListRequest {
    readonly deviceSchemaGetListReq: DeviceSchemaGetListReq
}

/**
 * Request parameters for postApiV1ThingsDeviceSchemaTslRead operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaTslReadRequest {
    readonly deviceSchemaTslGetOneReq: DeviceSchemaTslGetOneReq
}

/**
 * Request parameters for postApiV1ThingsDeviceSchemaUpdate operation in ThingsDeviceSchemaApi.
 */
export interface ThingsDeviceSchemaApiPostApiV1ThingsDeviceSchemaUpdateRequest {
    /**
     * /_*物模型条目*_/
     */
    readonly deviceSchema: DeviceSchema
}
