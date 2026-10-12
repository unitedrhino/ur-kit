import type { GetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID200Response } from '../models';
import type { NotifyReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RuleApi - axios parameter creator
 */

/**
* 业务说明：处理腾讯云侧的通知握手或通知查询请求，用于协议接入初始化与联调。
* @summary 获取腾讯云通知
* @param {string} [bodyParam.tenantCode]
* @param {string} [bodyParam.projectID]
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID (bodyParam: { tenantCode: string; projectID: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/protocol/cloud/tencent/rule/notify/{tenantCode}/{projectID}`
    .replace(`{${"tenantCode"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['tenantCode'] ?? '')))
    .replace(`{${"projectID"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['projectID'] ?? '')));
    return requestClient.get<ExtractDataType<GetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收腾讯云 IoT/视频能力推送的设备通知消息，并转交平台内部处理。
* @summary 接收腾讯云通知
* @param {string} tenantCode
* @param {string} projectID
* @param {NotifyReq} notifyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID (
tenantCode: string,
projectID: string,
notifyReq: NotifyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/protocol/cloud/tencent/rule/notify/{tenantCode}/{projectID}`
    .replace(`{${"tenantCode"}}`, encodeURIComponent(String(tenantCode)))
    .replace(`{${"projectID"}}`, encodeURIComponent(String(projectID)));
    return requestClient.post<ExtractDataType<GetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID200Response>>(localVarPath, notifyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for getApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID operation in RuleApi.
 */
export interface RuleApiGetApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectIDRequest {
    readonly tenantCode: string

    readonly projectID: string
}

/**
 * Request parameters for postApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectID operation in RuleApi.
 */
export interface RuleApiPostApiV1ProtocolCloudTencentRuleNotifyTenantCodeProjectIDRequest {
    readonly tenantCode: string

    readonly projectID: string

    readonly notifyReq: NotifyReq
}
