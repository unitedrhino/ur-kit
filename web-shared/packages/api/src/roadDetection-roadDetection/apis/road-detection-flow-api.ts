import type { FlowResolveActorsReq } from '../models';
import type { PostApiV1RoadDetectionFlowResolveActors200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionFlowApi - axios parameter creator
 */

/**
* 业务说明：流程引擎 businessResolver 审批节点回调本端点按岗位编码解析办理人，入参 param 为岗位编码【tester/checker/reviewer/approver】，返回该业务租户持有该岗位的用户列表；本端点免登【authType=public】，配置 Flow.ResolveSecret 后强制 HMAC-SHA256 验签【X-Flow-Timestamp 毫秒时间戳 + X-Flow-Signature 签名，5 分钟时效】，岗位无成员或验签失败时返回业务错误码【HTTP 200 但 body code!=0】，引擎以 code 判定并终止流转
* @summary 流程办理人解析回调
* @param {FlowResolveActorsReq} flowResolveActorsReq  FlowResolveActorsReq 引擎办理人回调请求（字段与 syssvr remoteAssignee 回调契约对齐）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionFlowResolveActors (
flowResolveActorsReq: FlowResolveActorsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/flow/resolve-actors`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionFlowResolveActors200Response>>(localVarPath, flowResolveActorsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionFlowResolveActors operation in RoadDetectionFlowApi.
 */
export interface RoadDetectionFlowApiPostApiV1RoadDetectionFlowResolveActorsRequest {
    /**
     *  FlowResolveActorsReq 引擎办理人回调请求（字段与 syssvr remoteAssignee 回调契约对齐）
     */
    readonly flowResolveActorsReq: FlowResolveActorsReq
}
