import type { CommissionCreateReq } from '../models';
import type { CommissionGetListReq } from '../models';
import type { CommissionRejectReq } from '../models';
import type { CommissionUpdateReq } from '../models';
import type { PostApiV1RoadDetectionCommissionApprove200Response } from '../models';
import type { PostApiV1RoadDetectionCommissionDelete200Response } from '../models';
import type { PostApiV1RoadDetectionCommissionGetList200Response } from '../models';
import type { PostApiV1RoadDetectionCommissionGetOne200Response } from '../models';
import type { PostApiV1RoadDetectionCommissionGetWbs200Response } from '../models';
import type { PostApiV1RoadDetectionCommissionProtocolGetOne200Response } from '../models';
import type { ProtocolRenderReq } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * RoadDetectionCommissionApi - axios parameter creator
 */

/**
* 委托状态流转：待审核 → 待接样（作业树实例化为 P1.2 扩展点）
* @summary 审核通过
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionApprove (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/approve`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 委托状态流转：检测中 → 已完成
* @summary 完成检测
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionComplete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/complete`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 创建检测委托（单次委托 WT 或工程合同 HT），一次落主表+详情+检测项，自动按序列表生成委托编号
* @summary 创建委托
* @param {CommissionCreateReq} commissionCreateReq  委托创建请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionCreate (
commissionCreateReq: CommissionCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/create`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, commissionCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 删除委托及其详情、检测项、批次、日志（仅草稿状态允许删除）
* @summary 删除委托
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/delete`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 分页查询委托列表，支持关键字（编号/委托单位/工程名称）、状态、类型筛选
* @summary 获取委托列表
* @param {CommissionGetListReq} commissionGetListReq  委托列表请求
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionGetList (
commissionGetListReq: CommissionGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionGetList200Response>>(localVarPath, commissionGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按 ID 聚合返回委托主表、详情、检测项、见证批次与操作日志
* @summary 获取委托详情
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 按委托 ID 返回 WBS 作业树（审核通过时按 PKG-CONCRETE-MIX 种子实例化，扁平节点按父编码组树），节点状态 wait/doing/done
* @summary 获取委托作业树
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionGetWbs (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/get-wbs`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionGetWbs200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回委托最新协议固化记录【approve 时快照主表+详情+items 与模板版本】，status=done 时 pdfUrl 为固化 PDF 的 OSS 签名下载地址（1 小时有效），pending/failed 供前端展示固化进度与重试入口
* @summary 获取协议固化记录
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionProtocolGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/protocol/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionProtocolGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按固化版本返回 data_snapshot 快照内容（CommissionDetailResp 结构），供 chromedp 打印路由渲染；本端点免登【authType=public】，安全性由一次性打印 token 强校验兜底——token 为 HMAC-SHA256(委托ID+固化版本+过期时间, 服务端密钥)，300 秒时效且与委托、版本绑定，校验失败拒绝访问，仅暴露固化快照只读数据，无任何业务写面
* @summary 协议快照免登渲染
* @param {ProtocolRenderReq} protocolRenderReq  协议快照免登渲染请求（打印路由 token 模式）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionProtocolRender (
protocolRenderReq: ProtocolRenderReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/protocol/render`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionGetOne200Response>>(localVarPath, protocolRenderReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对 pending/failed 状态的协议固化记录重新触发生成（chromedp 生成 PDF 上传 OSS）；done/generating 状态拒绝重试
* @summary 重试协议固化
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionProtocolRetry (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/protocol/retry`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 委托状态流转：待接样 → 检测中
* @summary 接样
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionReceive (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/receive`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：流程审批模式下驳回委托【委托存在进行中的引擎审批绑定时走引擎驳回并终止流程，本地状态回退草稿并关闭绑定】；未接入流程审批的委托不支持本端点，请走本地状态机端点
* @summary 审核驳回
* @param {CommissionRejectReq} commissionRejectReq  委托审核驳回请求（P7 流程审批模式：引擎驳回并终止流程，本地回退草稿）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionReject (
commissionRejectReq: CommissionRejectReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/reject`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, commissionRejectReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 委托状态流转：草稿 → 待审核
* @summary 提交审核
* @param {WithID} withID  ID（数值型主键）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionSubmit (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/submit`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionApprove200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 更新委托基础信息、详情与检测项（仅草稿状态允许修改）
* @summary 更新委托
* @param {CommissionUpdateReq} commissionUpdateReq  委托更新请求（仅草稿状态允许）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1RoadDetectionCommissionUpdate (
commissionUpdateReq: CommissionUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/roadDetection/commission/update`;
    return requestClient.post<ExtractDataType<PostApiV1RoadDetectionCommissionDelete200Response>>(localVarPath, commissionUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1RoadDetectionCommissionApprove operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionApproveRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionComplete operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionCompleteRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionCreate operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionCreateRequest {
    /**
     *  委托创建请求
     */
    readonly commissionCreateReq: CommissionCreateReq
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionDelete operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionDeleteRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionGetList operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionGetListRequest {
    /**
     *  委托列表请求
     */
    readonly commissionGetListReq: CommissionGetListReq
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionGetOne operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionGetWbs operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionGetWbsRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionProtocolGetOne operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionProtocolGetOneRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionProtocolRender operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionProtocolRenderRequest {
    /**
     *  协议快照免登渲染请求（打印路由 token 模式）
     */
    readonly protocolRenderReq: ProtocolRenderReq
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionProtocolRetry operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionProtocolRetryRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionReceive operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionReceiveRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionReject operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionRejectRequest {
    /**
     *  委托审核驳回请求（P7 流程审批模式：引擎驳回并终止流程，本地回退草稿）
     */
    readonly commissionRejectReq: CommissionRejectReq
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionSubmit operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionSubmitRequest {
    /**
     *  ID（数值型主键）
     */
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1RoadDetectionCommissionUpdate operation in RoadDetectionCommissionApi.
 */
export interface RoadDetectionCommissionApiPostApiV1RoadDetectionCommissionUpdateRequest {
    /**
     *  委托更新请求（仅草稿状态允许）
     */
    readonly commissionUpdateReq: CommissionUpdateReq
}
