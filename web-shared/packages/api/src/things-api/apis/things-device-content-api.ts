import type { DeviceContentCompleteReq } from '../models';
import type { DeviceContentPrepareReq } from '../models';
import type { PostApiV1ThingsDeviceEdgeContentComplete200Response } from '../models';
import type { PostApiV1ThingsDeviceEdgeContentPrepare200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceContentApi - axios parameter creator
 */

/**
* 私有存储直传后提交原租约收据；重新核验设备主人、连接代次、会话及模型授权，再由AISVR核验真实文件内容。
* @summary 完成设备会话附件
* @param {string} authorization  设备Basic凭据。
* @param {DeviceContentCompleteReq} deviceContentCompleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceEdgeContentComplete (
authorization: string,
deviceContentCompleteReq: DeviceContentCompleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/edge/content/complete`;
            if (authorization !== undefined) {
                localVarHeaderParameter['authorization'] = String(authorization);
            }
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceEdgeContentComplete200Response>>(localVarPath, deviceContentCompleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 设备Basic认证后由当前DMS主人和连接代次申请本人AI会话附件；只返回短期私有PUT地址与加密收据，不转运原件。
* @summary 准备设备会话附件
* @param {string} authorization  仅接收Basic设备凭据，不是会话权限。
* @param {DeviceContentPrepareReq} deviceContentPrepareReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceEdgeContentPrepare (
authorization: string,
deviceContentPrepareReq: DeviceContentPrepareReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/edge/content/prepare`;
            if (authorization !== undefined) {
                localVarHeaderParameter['authorization'] = String(authorization);
            }
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceEdgeContentPrepare200Response>>(localVarPath, deviceContentPrepareReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceEdgeContentComplete operation in ThingsDeviceContentApi.
 */
export interface ThingsDeviceContentApiPostApiV1ThingsDeviceEdgeContentCompleteRequest {
    /**
     *  设备Basic凭据。
     */
    readonly authorization: string

    readonly deviceContentCompleteReq: DeviceContentCompleteReq
}

/**
 * Request parameters for postApiV1ThingsDeviceEdgeContentPrepare operation in ThingsDeviceContentApi.
 */
export interface ThingsDeviceContentApiPostApiV1ThingsDeviceEdgeContentPrepareRequest {
    /**
     *  仅接收Basic设备凭据，不是会话权限。
     */
    readonly authorization: string

    readonly deviceContentPrepareReq: DeviceContentPrepareReq
}
