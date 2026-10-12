import type { CardRouteCreateReq } from '../models';
import type { CardRouteGetCapabilitiesReq } from '../models';
import type { CardRouteGetListReq } from '../models';
import type { CardRouteGetOptionReq } from '../models';
import type { CardRouteModifiedTerminalScheduleGetOneReq } from '../models';
import type { CardRouteModifiedTerminalScheduleResumeReq } from '../models';
import type { CardRouteModifiedTerminalScheduleUpdateReq } from '../models';
import type { CardRoutePackageGetListReq } from '../models';
import type { CardRoutePackageReplaceReq } from '../models';
import type { CardRoutePlatformGetListReq } from '../models';
import type { CardRouteSyncOfferingInfoListReq } from '../models';
import type { CardRouteTestConnectionReq } from '../models';
import type { CardRouteTriggerSyncReq } from '../models';
import type { CardRouteUpdateReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardBatchTaskCreate200Response } from '../models';
import type { PostApiV1ThingsCardInfoCreate200Response } from '../models';
import type { PostApiV1ThingsCardPackageRouteReplace200Response } from '../models';
import type { PostApiV1ThingsCardRouteGetCapabilities200Response } from '../models';
import type { PostApiV1ThingsCardRouteGetList200Response } from '../models';
import type { PostApiV1ThingsCardRouteGetOne200Response } from '../models';
import type { PostApiV1ThingsCardRouteGetOption200Response } from '../models';
import type { PostApiV1ThingsCardRouteModifiedTerminalScheduleGetOne200Response } from '../models';
import type { PostApiV1ThingsCardRoutePackageGetList200Response } from '../models';
import type { PostApiV1ThingsCardRoutePlatformGetList200Response } from '../models';
import type { PostApiV1ThingsCardRouteTestConnection200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardRouteApi - axios parameter creator
 */

/**
* 业务说明：新增通道
* @summary 新增通道
* @param {CardRouteCreateReq} cardRouteCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteCreate (
cardRouteCreateReq: CardRouteCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoCreate200Response>>(localVarPath, cardRouteCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除通道
* @summary 删除通道
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道类型返回支持与不支持能力及稳定原因，前端据此显示或禁用操作
* @summary 获取通道能力矩阵
* @param {CardRouteGetCapabilitiesReq} cardRouteGetCapabilitiesReq  CardRouteGetCapabilitiesReq 支持已保存通道或未保存平台模板的能力预览。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteGetCapabilities (
cardRouteGetCapabilitiesReq: CardRouteGetCapabilitiesReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/get-capabilities`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteGetCapabilities200Response>>(localVarPath, cardRouteGetCapabilitiesReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取通道列表
* @summary 获取通道列表
* @param {CardRouteGetListReq} cardRouteGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteGetList (
cardRouteGetListReq: CardRouteGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteGetList200Response>>(localVarPath, cardRouteGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取通道详情
* @summary 获取通道详情
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取通道下拉选项
* @summary 获取通道下拉选项
* @param {CardRouteGetOptionReq} cardRouteGetOptionReq  CardRouteGetOptionReq 按当前选择的平台资费组反向缩小通道选项。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteGetOption (
cardRouteGetOptionReq: CardRouteGetOptionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/get-option`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteGetOption200Response>>(localVarPath, cardRouteGetOptionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回通道增量周期、运行状态、成功水位与活动任务；自动/仅手动模式仍由通道更新接口维护
* @summary 获取联通修改终端周期调度
* @param {CardRouteModifiedTerminalScheduleGetOneReq} cardRouteModifiedTerminalScheduleGetOneReq  CardRouteModifiedTerminalScheduleGetOneReq 查询联通修改终端周期调度状态。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteModifiedTerminalScheduleGetOne (
cardRouteModifiedTerminalScheduleGetOneReq: CardRouteModifiedTerminalScheduleGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/modified-terminal-schedule/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteModifiedTerminalScheduleGetOne200Response>>(localVarPath, cardRouteModifiedTerminalScheduleGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：管理员处理凭据或冲突后，从原成功水位恢复暂停的自动增量调度
* @summary 恢复联通修改终端自动调度
* @param {CardRouteModifiedTerminalScheduleResumeReq} cardRouteModifiedTerminalScheduleResumeReq  CardRouteModifiedTerminalScheduleResumeReq 从暂停状态恢复自动增量调度。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteModifiedTerminalScheduleResume (
cardRouteModifiedTerminalScheduleResumeReq: CardRouteModifiedTerminalScheduleResumeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/modified-terminal-schedule/resume`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteModifiedTerminalScheduleGetOne200Response>>(localVarPath, cardRouteModifiedTerminalScheduleResumeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：仅允许调整 15/30/60 分钟执行周期，不接受账户标识或水位字段
* @summary 更新联通修改终端周期
* @param {CardRouteModifiedTerminalScheduleUpdateReq} cardRouteModifiedTerminalScheduleUpdateReq  CardRouteModifiedTerminalScheduleUpdateReq 仅调整增量周期分钟数。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteModifiedTerminalScheduleUpdate (
cardRouteModifiedTerminalScheduleUpdateReq: CardRouteModifiedTerminalScheduleUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/modified-terminal-schedule/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteModifiedTerminalScheduleGetOne200Response>>(localVarPath, cardRouteModifiedTerminalScheduleUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询当前企业指定通道可见的平台资费组，返回已选状态、组合引用数及可移除原因
* @summary 获取通道关联平台资费组
* @param {CardRoutePackageGetListReq} cardRoutePackageGetListReq  CardRoutePackageGetListReq 查询一个通道可见及已选的平台资费组。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRoutePackageGetList (
cardRoutePackageGetListReq: CardRoutePackageGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/package/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRoutePackageGetList200Response>>(localVarPath, cardRoutePackageGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在当前企业内原子替换指定通道的全部平台资费组关系，空集合表示清空可移除关系
* @summary 替换通道关联平台资费组
* @param {CardRoutePackageReplaceReq} cardRoutePackageReplaceReq  CardRoutePackageReplaceReq 原子替换一个通道的全部平台资费组关系。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRoutePackageReplace (
cardRoutePackageReplaceReq: CardRoutePackageReplaceReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/package/replace`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardPackageRouteReplace200Response>>(localVarPath, cardRoutePackageReplaceReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：返回 IoTLink v2.2.6 官方固定顺序的 30 项通道模板、动态凭据字段、能力及验收状态，测试适配器不包含在该目录
* @summary 获取官方通道目录
* @param {CardRoutePlatformGetListReq} cardRoutePlatformGetListReq  CardRoutePlatformGetListReq 查询固定官方通道目录。
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRoutePlatformGetList (
cardRoutePlatformGetListReq: CardRoutePlatformGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/platform/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRoutePlatformGetList200Response>>(localVarPath, cardRoutePlatformGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：同步上游套餐数据
* @summary 同步上游套餐数据
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteSyncOffering (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/sync-offering`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道同步该通道下所有物联卡的已订购套餐
* @summary 同步已订购套餐数据
* @param {CardRouteSyncOfferingInfoListReq} cardRouteSyncOfferingInfoListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteSyncOfferingInfoList (
cardRouteSyncOfferingInfoListReq: CardRouteSyncOfferingInfoListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/sync-offering-info-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardRouteSyncOfferingInfoListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：同步上游卡号数据
* @summary 同步上游卡号数据
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteSyncUpstream (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/sync-upstream`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：使用已保存凭据执行受支持的卡状态、APN 和在线状态只读查询
* @summary 测试通道连通性
* @param {CardRouteTestConnectionReq} cardRouteTestConnectionReq  CardRouteTestConnectionReq 使用已保存通道配置执行只读连通测试。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteTestConnection (
cardRouteTestConnectionReq: CardRouteTestConnectionReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/test-connection`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardRouteTestConnection200Response>>(localVarPath, cardRouteTestConnectionReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：手动触发通道异步同步，支持 status/usage/monthly-usage/modified-terminals/usage-details/audit-trail/provisioning-result/offering/all
* @summary 手动触发通道轮询同步
* @param {CardRouteTriggerSyncReq} cardRouteTriggerSyncReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteTriggerSync (
cardRouteTriggerSyncReq: CardRouteTriggerSyncReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/trigger-sync`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCreate200Response>>(localVarPath, cardRouteTriggerSyncReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新通道
* @summary 更新通道
* @param {CardRouteUpdateReq} cardRouteUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardRouteUpdate (
cardRouteUpdateReq: CardRouteUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/route/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardRouteUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardRouteCreate operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteCreateRequest {
    readonly cardRouteCreateReq: CardRouteCreateReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteDelete operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardRouteGetCapabilities operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteGetCapabilitiesRequest {
    /**
     *  CardRouteGetCapabilitiesReq 支持已保存通道或未保存平台模板的能力预览。
     */
    readonly cardRouteGetCapabilitiesReq: CardRouteGetCapabilitiesReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteGetList operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteGetListRequest {
    readonly cardRouteGetListReq: CardRouteGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardRouteGetOne operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardRouteGetOption operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteGetOptionRequest {
    /**
     *  CardRouteGetOptionReq 按当前选择的平台资费组反向缩小通道选项。
     */
    readonly cardRouteGetOptionReq: CardRouteGetOptionReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteModifiedTerminalScheduleGetOne operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteModifiedTerminalScheduleGetOneRequest {
    /**
     *  CardRouteModifiedTerminalScheduleGetOneReq 查询联通修改终端周期调度状态。
     */
    readonly cardRouteModifiedTerminalScheduleGetOneReq: CardRouteModifiedTerminalScheduleGetOneReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteModifiedTerminalScheduleResume operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteModifiedTerminalScheduleResumeRequest {
    /**
     *  CardRouteModifiedTerminalScheduleResumeReq 从暂停状态恢复自动增量调度。
     */
    readonly cardRouteModifiedTerminalScheduleResumeReq: CardRouteModifiedTerminalScheduleResumeReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteModifiedTerminalScheduleUpdate operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteModifiedTerminalScheduleUpdateRequest {
    /**
     *  CardRouteModifiedTerminalScheduleUpdateReq 仅调整增量周期分钟数。
     */
    readonly cardRouteModifiedTerminalScheduleUpdateReq: CardRouteModifiedTerminalScheduleUpdateReq
}

/**
 * Request parameters for postApiV1ThingsCardRoutePackageGetList operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRoutePackageGetListRequest {
    /**
     *  CardRoutePackageGetListReq 查询一个通道可见及已选的平台资费组。
     */
    readonly cardRoutePackageGetListReq: CardRoutePackageGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardRoutePackageReplace operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRoutePackageReplaceRequest {
    /**
     *  CardRoutePackageReplaceReq 原子替换一个通道的全部平台资费组关系。
     */
    readonly cardRoutePackageReplaceReq: CardRoutePackageReplaceReq
}

/**
 * Request parameters for postApiV1ThingsCardRoutePlatformGetList operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRoutePlatformGetListRequest {
    /**
     *  CardRoutePlatformGetListReq 查询固定官方通道目录。
     */
    readonly cardRoutePlatformGetListReq: CardRoutePlatformGetListReq

    /**
     *  页码
     */
    readonly page?: number

    /**
     *  每页大小
     */
    readonly size?: number
}

/**
 * Request parameters for postApiV1ThingsCardRouteSyncOffering operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteSyncOfferingRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardRouteSyncOfferingInfoList operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteSyncOfferingInfoListRequest {
    readonly cardRouteSyncOfferingInfoListReq: CardRouteSyncOfferingInfoListReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteSyncUpstream operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteSyncUpstreamRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardRouteTestConnection operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteTestConnectionRequest {
    /**
     *  CardRouteTestConnectionReq 使用已保存通道配置执行只读连通测试。
     */
    readonly cardRouteTestConnectionReq: CardRouteTestConnectionReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteTriggerSync operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteTriggerSyncRequest {
    readonly cardRouteTriggerSyncReq: CardRouteTriggerSyncReq
}

/**
 * Request parameters for postApiV1ThingsCardRouteUpdate operation in CardRouteApi.
 */
export interface CardRouteApiPostApiV1ThingsCardRouteUpdateRequest {
    readonly cardRouteUpdateReq: CardRouteUpdateReq
}
