import type { PostApiV1ThingsDeviceEdgeSendHandleType200Response } from '../models';
import type { PostApiV1ThingsDeviceEdgeUploadFile200Response } from '../models';
import type { PostApiV1ThingsDeviceEdgeUploadFileRequest } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsDeviceEdgeApi - axios parameter creator
 */

/**
* 设备通过HTTP协议与云端进行物模型交互（替代MQTT）。设备在HTTP请求头中使用Basic Auth携带MQTT格式的账号密码进行身份验证。路径参数handle指定交互类型（thing/ota/config等），type指定操作类型（property/event/action等）。适用于不支持MQTT的设备或需要HTTP直连的场景。
* @summary 设备使用http协议用云端交互,需要在http头中带上mqtt的账号密码(basic auth)
* @param {string} handle 对应 mqtt topic的第一个 thing ota config 等等
* @param {string} type 操作类型 从topic中提取 物模型下就是   property属性 event事件 action行为
* @param {string} authorization basic auth  账号密码使用mqtt格式生成的账号密码
* @param {object} body
* @param {string} productID 如果网关类型要操作子设备的topic,需要指定子设备的产品ID和设备ID,如果没有填写则默认是账号里的设备
* @param {string} deviceName 如果网关类型要操作子设备的topic,需要指定子设备的产品ID和设备ID,如果没有填写则默认是账号里的设备
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceEdgeSendHandleType (
handle: string,
type: string,
authorization: string,
body: object,
productID?: string,
deviceName?: string,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/edge/send/{handle}/{type}`
    .replace(`{${"handle"}}`, encodeURIComponent(String(handle)))
    .replace(`{${"type"}}`, encodeURIComponent(String(type)));
            if (productID !== undefined) {
                localVarHeaderParameter['productID'] = String(productID);
            }
            if (deviceName !== undefined) {
                localVarHeaderParameter['deviceName'] = String(deviceName);
            }
            if (authorization !== undefined) {
                localVarHeaderParameter['authorization'] = String(authorization);
            }
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceEdgeSendHandleType200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 设备通过HTTP直接上传文件到云端OSS。设备使用Basic Auth进行身份验证，上传文件后返回文件存储路径和访问URI。适用于设备上报日志文件、图片、录音等文件数据的场景。
* @summary 设备文件直传,需要在http头中带上mqtt的账号密码(basic auth)
* @param {string} authorization  basic auth 账号密码使用mqtt格式生成的账号密码
* @param {PostApiV1ThingsDeviceEdgeUploadFileRequest} postApiV1ThingsDeviceEdgeUploadFileRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsDeviceEdgeUploadFile (
authorization: string,
postApiV1ThingsDeviceEdgeUploadFileRequest?: PostApiV1ThingsDeviceEdgeUploadFileRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/device/edge/upload-file`;
            if (authorization !== undefined) {
                localVarHeaderParameter['authorization'] = String(authorization);
            }
    return requestClient.post<ExtractDataType<PostApiV1ThingsDeviceEdgeUploadFile200Response>>(localVarPath, postApiV1ThingsDeviceEdgeUploadFileRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsDeviceEdgeSendHandleType operation in ThingsDeviceEdgeApi.
 */
export interface ThingsDeviceEdgeApiPostApiV1ThingsDeviceEdgeSendHandleTypeRequest {
    /**
     * 对应 mqtt topic的第一个 thing ota config 等等
     */
    readonly handle: string

    /**
     * 操作类型 从topic中提取 物模型下就是   property属性 event事件 action行为
     */
    readonly type: string

    /**
     * basic auth  账号密码使用mqtt格式生成的账号密码
     */
    readonly authorization: string

    readonly body: object

    /**
     * 如果网关类型要操作子设备的topic,需要指定子设备的产品ID和设备ID,如果没有填写则默认是账号里的设备
     */
    readonly productID?: string

    /**
     * 如果网关类型要操作子设备的topic,需要指定子设备的产品ID和设备ID,如果没有填写则默认是账号里的设备
     */
    readonly deviceName?: string
}

/**
 * Request parameters for postApiV1ThingsDeviceEdgeUploadFile operation in ThingsDeviceEdgeApi.
 */
export interface ThingsDeviceEdgeApiPostApiV1ThingsDeviceEdgeUploadFileRequest {
    /**
     *  basic auth 账号密码使用mqtt格式生成的账号密码
     */
    readonly authorization: string

    readonly postApiV1ThingsDeviceEdgeUploadFileRequest?: PostApiV1ThingsDeviceEdgeUploadFileRequest
}
