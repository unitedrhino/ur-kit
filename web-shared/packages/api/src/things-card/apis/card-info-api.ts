import type { CardInfoBatchSettingReq } from '../models';
import type { CardInfoBatchUpdateReq } from '../models';
import type { CardInfoChangeGetListReq } from '../models';
import type { CardInfoCreateReq } from '../models';
import type { CardInfoExpandUpdateReq } from '../models';
import type { CardInfoExportReq } from '../models';
import type { CardInfoGetListReq } from '../models';
import type { CardInfoGetOneReq } from '../models';
import type { CardInfoImportReq } from '../models';
import type { CardInfoStatusChangeReq } from '../models';
import type { CardInfoSyncActiveDateReq } from '../models';
import type { CardInfoUpdateReq } from '../models';
import type { CardSnapshotRefreshReq } from '../models';
import type { CardTerminalPropertiesUpdateReq } from '../models';
import type { ICCIDReq } from '../models';
import type { PostApiV1ThingsCardBatchTaskCancel200Response } from '../models';
import type { PostApiV1ThingsCardInfoChangeGetList200Response } from '../models';
import type { PostApiV1ThingsCardInfoCreate200Response } from '../models';
import type { PostApiV1ThingsCardInfoExpandGetOne200Response } from '../models';
import type { PostApiV1ThingsCardInfoExport200Response } from '../models';
import type { PostApiV1ThingsCardInfoGetList200Response } from '../models';
import type { PostApiV1ThingsCardInfoGetOne200Response } from '../models';
import type { PostApiV1ThingsCardInfoImport200Response } from '../models';
import type { PostApiV1ThingsCardInfoSnapshotRefresh200Response } from '../models';
import type { PostApiV1ThingsCardInfoStatusChange200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * CardInfoApi - axios parameter creator
 */

/**
* 业务说明：对选中的物联卡批量设置资费组、通道、超量停机阈值、未订购资费断网、轮询开关、IMEI 等属性，并写入变更记录
* @summary 物联卡批量设置
* @param {CardInfoBatchSettingReq} cardInfoBatchSettingReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoBatchSetting (
cardInfoBatchSettingReq: CardInfoBatchSettingReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/batch-setting`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardInfoBatchSettingReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量更新物联卡
* @summary 批量更新物联卡
* @param {CardInfoBatchUpdateReq} cardInfoBatchUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoBatchUpdate (
cardInfoBatchUpdateReq: CardInfoBatchUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/batch-update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardInfoBatchUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取卡状态变更记录列表
* @summary 获取卡状态变更记录列表
* @param {CardInfoChangeGetListReq} cardInfoChangeGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoChangeGetList (
cardInfoChangeGetListReq: CardInfoChangeGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/change/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoChangeGetList200Response>>(localVarPath, cardInfoChangeGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：新增物联卡
* @summary 新增物联卡
* @param {CardInfoCreateReq} cardInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoCreate (
cardInfoCreateReq: CardInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoCreate200Response>>(localVarPath, cardInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除物联卡
* @summary 删除物联卡
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取卡扩展信息
* @summary 获取卡扩展信息
* @param {ICCIDReq} iCCIDReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoExpandGetOne (
iCCIDReq: ICCIDReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/expand/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoExpandGetOne200Response>>(localVarPath, iCCIDReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新卡扩展信息
* @summary 更新卡扩展信息
* @param {CardInfoExpandUpdateReq} cardInfoExpandUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoExpandUpdate (
cardInfoExpandUpdateReq: CardInfoExpandUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/expand/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardInfoExpandUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按筛选条件导出物联卡列表，生成 Excel 后上传到 OSS 返回下载地址
* @summary 导出物联卡
* @param {CardInfoExportReq} cardInfoExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoExport (
cardInfoExportReq: CardInfoExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoExport200Response>>(localVarPath, cardInfoExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取物联卡列表
* @summary 获取物联卡列表
* @param {CardInfoGetListReq} cardInfoGetListReq
* @param {number} page  页码
* @param {number} size  每页大小
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoGetList (
cardInfoGetListReq: CardInfoGetListReq,
page?: number,
size?: number,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/get-list`;
        if (page !== undefined) {
            localVarQueryParameter['page'] = page;
        }
        if (size !== undefined) {
            localVarQueryParameter['size'] = size;
        }
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoGetList200Response>>(localVarPath, cardInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取物联卡详情
* @summary 获取物联卡详情
* @param {CardInfoGetOneReq} cardInfoGetOneReq  CardInfoGetOneReq 按当前企业内主键、ICCID 或两者一致组合查询卡详情。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoGetOne (
cardInfoGetOneReq: CardInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoGetOne200Response>>(localVarPath, cardInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量导入物联卡
* @summary 批量导入物联卡
* @param {CardInfoImportReq} cardInfoImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoImport (
cardInfoImportReq: CardInfoImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoImport200Response>>(localVarPath, cardInfoImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：上传正式模板版本 1 批量导入物联卡；ICCID 按行校验并按租户业务键 UPSERT，失败行写入任务明细供受控下载
* @summary Excel 导入物联卡
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoImportExcel (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/import-excel`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoImport200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：下载带模板版本和 ICCID 文本格式的正式 Excel 导入模板
* @summary 下载物联卡导入模板
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoImportTemplate (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/import-template`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按当前企业物联卡主键读取运营商在线、禁用及锁定状态并保存本地快照，供列表快速展示
* @summary 刷新物联卡状态快照
* @param {CardSnapshotRefreshReq} cardSnapshotRefreshReq  CardSnapshotRefreshReq 刷新当前页指定物联卡的运营商状态快照。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoSnapshotRefresh (
cardSnapshotRefreshReq: CardSnapshotRefreshReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/snapshot/refresh`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoSnapshotRefresh200Response>>(localVarPath, cardSnapshotRefreshReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量变更物联卡状态，支持停机(stop)、复机(start)、断网(breakNet)、开网(openNet)，会真实下发到上游通道
* @summary 批量变更物联卡状态
* @param {CardInfoStatusChangeReq} cardInfoStatusChangeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoStatusChange (
cardInfoStatusChangeReq: CardInfoStatusChangeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/status-change`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardInfoStatusChange200Response>>(localVarPath, cardInfoStatusChangeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：调用上游通道查询指定 ICCID 的激活日期并更新本地卡信息；该能力不代表查询开卡日期
* @summary 同步物联卡激活日期
* @param {CardInfoSyncActiveDateReq} cardInfoSyncActiveDateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoSyncActiveDate (
cardInfoSyncActiveDateReq: CardInfoSyncActiveDateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/sync-active-date`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardInfoSyncActiveDateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按白名单把单卡设备ID、调制解调器ID、SIM卡状态、资费计划、子账户、用量限额重置及复制规则真实下发到运营商平台；effectiveDate 非空时创建预定变更
* @summary 更新运营商终端属性
* @param {CardTerminalPropertiesUpdateReq} cardTerminalPropertiesUpdateReq  CardTerminalPropertiesUpdateReq 提交单卡终端属性即时或预定变更。
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoTerminalPropertiesUpdate (
cardTerminalPropertiesUpdateReq: CardTerminalPropertiesUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/terminal-properties/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardTerminalPropertiesUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新物联卡
* @summary 更新物联卡
* @param {CardInfoUpdateReq} cardInfoUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsCardInfoUpdate (
cardInfoUpdateReq: CardInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/card/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsCardBatchTaskCancel200Response>>(localVarPath, cardInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsCardInfoBatchSetting operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoBatchSettingRequest {
    readonly cardInfoBatchSettingReq: CardInfoBatchSettingReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoBatchUpdate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoBatchUpdateRequest {
    readonly cardInfoBatchUpdateReq: CardInfoBatchUpdateReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoChangeGetList operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoChangeGetListRequest {
    readonly cardInfoChangeGetListReq: CardInfoChangeGetListReq

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
 * Request parameters for postApiV1ThingsCardInfoCreate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoCreateRequest {
    readonly cardInfoCreateReq: CardInfoCreateReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoDelete operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsCardInfoExpandGetOne operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoExpandGetOneRequest {
    readonly iCCIDReq: ICCIDReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoExpandUpdate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoExpandUpdateRequest {
    readonly cardInfoExpandUpdateReq: CardInfoExpandUpdateReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoExport operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoExportRequest {
    readonly cardInfoExportReq: CardInfoExportReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoGetList operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoGetListRequest {
    readonly cardInfoGetListReq: CardInfoGetListReq

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
 * Request parameters for postApiV1ThingsCardInfoGetOne operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoGetOneRequest {
    /**
     *  CardInfoGetOneReq 按当前企业内主键、ICCID 或两者一致组合查询卡详情。
     */
    readonly cardInfoGetOneReq: CardInfoGetOneReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoImport operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoImportRequest {
    readonly cardInfoImportReq: CardInfoImportReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoSnapshotRefresh operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoSnapshotRefreshRequest {
    /**
     *  CardSnapshotRefreshReq 刷新当前页指定物联卡的运营商状态快照。
     */
    readonly cardSnapshotRefreshReq: CardSnapshotRefreshReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoStatusChange operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoStatusChangeRequest {
    readonly cardInfoStatusChangeReq: CardInfoStatusChangeReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoSyncActiveDate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoSyncActiveDateRequest {
    readonly cardInfoSyncActiveDateReq: CardInfoSyncActiveDateReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoTerminalPropertiesUpdate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoTerminalPropertiesUpdateRequest {
    /**
     *  CardTerminalPropertiesUpdateReq 提交单卡终端属性即时或预定变更。
     */
    readonly cardTerminalPropertiesUpdateReq: CardTerminalPropertiesUpdateReq
}

/**
 * Request parameters for postApiV1ThingsCardInfoUpdate operation in CardInfoApi.
 */
export interface CardInfoApiPostApiV1ThingsCardInfoUpdateRequest {
    readonly cardInfoUpdateReq: CardInfoUpdateReq
}
