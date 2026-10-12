import type { AvDeviceChannelCreateReq } from '../models';
import type { AvDeviceChannelDeleteReq } from '../models';
import type { AvDeviceChannelGetListReq } from '../models';
import type { AvDeviceChannelGetOneReq } from '../models';
import type { AvDeviceChannelSetRecordModeReq } from '../models';
import type { AvDeviceChannelUpdateReq } from '../models';
import type { AvDeviceInfoCreateReq } from '../models';
import type { AvDeviceInfoDeleteReq } from '../models';
import type { AvDeviceInfoGetListReq } from '../models';
import type { AvDeviceInfoGetOneReq } from '../models';
import type { AvDeviceInfoUpdateReq } from '../models';
import type { AvDeviceIotBindGetOneReq } from '../models';
import type { AvDeviceIotBindSaveReq } from '../models';
import type { AvDeviceIotBindUnbindReq } from '../models';
import type { AvDownloadProgressReq } from '../models';
import type { AvDownloadStartReq } from '../models';
import type { AvEventGetListReq } from '../models';
import type { AvMediaServerCreateReq } from '../models';
import type { AvMediaServerDeleteReq } from '../models';
import type { AvMediaServerGetListReq } from '../models';
import type { AvMediaServerGetOneReq } from '../models';
import type { AvMediaServerUpdateReq } from '../models';
import type { AvNvrRecordQueryReq } from '../models';
import type { AvOnvifDiscoverReq } from '../models';
import type { AvOnvifImportReq } from '../models';
import type { AvOnvifPresetReq } from '../models';
import type { AvOnvifProbeReq } from '../models';
import type { AvOnvifPtzControlReq } from '../models';
import type { AvPlayLiveKeepaliveReq } from '../models';
import type { AvPlayLiveStartReq } from '../models';
import type { AvPlayLiveStopReq } from '../models';
import type { AvPlayLiveStreamListReq } from '../models';
import type { AvPlaybackControlReq } from '../models';
import type { AvPlaybackStartReq } from '../models';
import type { AvPlaybackStopReq } from '../models';
import type { AvPtzControlReq } from '../models';
import type { AvPtzCruiseReq } from '../models';
import type { AvPtzPresetReq } from '../models';
import type { AvRecordCalendarReq } from '../models';
import type { AvRecordDeleteReq } from '../models';
import type { AvRecordDownloadReq } from '../models';
import type { AvRecordGetListReq } from '../models';
import type { AvRecordMonthlyReq } from '../models';
import type { AvRecordPlanReq } from '../models';
import type { AvRecordPlayStartReq } from '../models';
import type { AvRecordStartReq } from '../models';
import type { AvRecordStopReq } from '../models';
import type { AvRecordTimelineReq } from '../models';
import type { AvSipConfigSaveReq } from '../models';
import type { AvSnapReq } from '../models';
import type { AvTalkStartReq } from '../models';
import type { AvTalkStopReq } from '../models';
import type { AvWebhookPlayReq } from '../models';
import type { AvWebhookPublishReq } from '../models';
import type { AvWebhookRecordMp4Req } from '../models';
import type { AvWebhookRtpServerTimeoutReq } from '../models';
import type { AvWebhookServerKeepaliveReq } from '../models';
import type { AvWebhookServerShutdownReq } from '../models';
import type { AvWebhookServerStartedReq } from '../models';
import type { AvWebhookStreamChangedReq } from '../models';
import type { AvWebhookStreamNoneReaderReq } from '../models';
import type { AvWebhookStreamNotFoundReq } from '../models';
import type { PostApiV1AvConfigSipGetOne200Response } from '../models';
import type { PostApiV1AvConfigSipSave200Response } from '../models';
import type { PostApiV1AvDeviceChannelCreate200Response } from '../models';
import type { PostApiV1AvDeviceChannelGetList200Response } from '../models';
import type { PostApiV1AvDeviceChannelRecordMode200Response } from '../models';
import type { PostApiV1AvDeviceInfoCreate200Response } from '../models';
import type { PostApiV1AvDeviceInfoGetList200Response } from '../models';
import type { PostApiV1AvDeviceIotBindGetOne200Response } from '../models';
import type { PostApiV1AvDeviceIotBindSave200Response } from '../models';
import type { PostApiV1AvEventGetList200Response } from '../models';
import type { PostApiV1AvMediaServerCreate200Response } from '../models';
import type { PostApiV1AvMediaServerGetList200Response } from '../models';
import type { PostApiV1AvOnvifDiscover200Response } from '../models';
import type { PostApiV1AvOnvifImport200Response } from '../models';
import type { PostApiV1AvOnvifPresetAdd200Response } from '../models';
import type { PostApiV1AvOnvifPresetList200Response } from '../models';
import type { PostApiV1AvOnvifProbe200Response } from '../models';
import type { PostApiV1AvPlayLiveStart200Response } from '../models';
import type { PostApiV1AvPlayLiveStreamList200Response } from '../models';
import type { PostApiV1AvPlaybackDownloadProgress200Response } from '../models';
import type { PostApiV1AvRecordCalendar200Response } from '../models';
import type { PostApiV1AvRecordDownload200Response } from '../models';
import type { PostApiV1AvRecordGetList200Response } from '../models';
import type { PostApiV1AvRecordMonthly200Response } from '../models';
import type { PostApiV1AvRecordNvrQuery200Response } from '../models';
import type { PostApiV1AvRecordTimeline200Response } from '../models';
import type { PostApiV1AvSnap200Response } from '../models';
import type { PostApiV1AvWebhookPlay200Response } from '../models';
import type { PostApiV1AvWebhookStreamNoneReader200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * AvApiApi - axios parameter creator
 */

/**
* 业务说明：设置指定通道的录像模式，可选 always/ai/none。
* @summary 设置通道录像模式
* @param {AvDeviceChannelSetRecordModeReq} avDeviceChannelSetRecordModeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  mode (
avDeviceChannelSetRecordModeReq: AvDeviceChannelSetRecordModeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/record_mode`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceChannelRecordMode200Response>>(localVarPath, avDeviceChannelSetRecordModeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：读取当前 GB28181 SIP 平台配置。
* @summary 获取 SIP 平台配置
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvConfigSipGetOne (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/config/sip/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipGetOne200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：保存 GB28181 SIP 平台配置，覆盖原有配置。
* @summary 保存 SIP 平台配置
* @param {AvSipConfigSaveReq} avSipConfigSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvConfigSipSave (
avSipConfigSaveReq: AvSipConfigSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/config/sip/save`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avSipConfigSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建一条音视频设备通道，支持 RTSP/RTMP/GB28181/ONVIF 等协议。传入 deviceName 时可自动创建对应协议设备。
* @summary 创建音视频通道
* @param {AvDeviceChannelCreateReq} avDeviceChannelCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceChannelCreate (
avDeviceChannelCreateReq: AvDeviceChannelCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/create`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceChannelCreate200Response>>(localVarPath, avDeviceChannelCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道 ID 删除音视频通道及其关联配置。
* @summary 删除音视频通道
* @param {AvDeviceChannelDeleteReq} avDeviceChannelDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceChannelDelete (
avDeviceChannelDeleteReq: AvDeviceChannelDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avDeviceChannelDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备、名称、状态等条件分页查询音视频通道列表。
* @summary 获取音视频通道列表
* @param {AvDeviceChannelGetListReq} avDeviceChannelGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceChannelGetList (
avDeviceChannelGetListReq: AvDeviceChannelGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceChannelGetList200Response>>(localVarPath, avDeviceChannelGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道 ID 查询单条音视频通道详情。
* @summary 获取音视频通道详情
* @param {AvDeviceChannelGetOneReq} avDeviceChannelGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceChannelGetOne (
avDeviceChannelGetOneReq: AvDeviceChannelGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceChannelCreate200Response>>(localVarPath, avDeviceChannelGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道 ID 更新音视频通道信息，支持部分字段更新。
* @summary 更新音视频通道
* @param {AvDeviceChannelUpdateReq} avDeviceChannelUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceChannelUpdate (
avDeviceChannelUpdateReq: AvDeviceChannelUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/channel/update`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceChannelCreate200Response>>(localVarPath, avDeviceChannelUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建一条音视频设备记录，用于管理摄像头、NVR、流媒体设备等。
* @summary 创建音视频设备
* @param {AvDeviceInfoCreateReq} avDeviceInfoCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceInfoCreate (
avDeviceInfoCreateReq: AvDeviceInfoCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceInfoCreate200Response>>(localVarPath, avDeviceInfoCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备 ID 删除音视频设备及其关联通道。
* @summary 删除音视频设备
* @param {AvDeviceInfoDeleteReq} avDeviceInfoDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceInfoDelete (
avDeviceInfoDeleteReq: AvDeviceInfoDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avDeviceInfoDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按名称、协议、状态等条件分页查询音视频设备列表。
* @summary 获取音视频设备列表
* @param {AvDeviceInfoGetListReq} avDeviceInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceInfoGetList (
avDeviceInfoGetListReq: AvDeviceInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceInfoGetList200Response>>(localVarPath, avDeviceInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备 ID 查询单条音视频设备详情。
* @summary 获取音视频设备详情
* @param {AvDeviceInfoGetOneReq} avDeviceInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceInfoGetOne (
avDeviceInfoGetOneReq: AvDeviceInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceInfoCreate200Response>>(localVarPath, avDeviceInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备 ID 更新音视频设备信息，支持部分字段更新。
* @summary 更新音视频设备
* @param {AvDeviceInfoUpdateReq} avDeviceInfoUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceInfoUpdate (
avDeviceInfoUpdateReq: AvDeviceInfoUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceInfoCreate200Response>>(localVarPath, avDeviceInfoUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 IoT 产品 ID 与设备标识查询其绑定的音视频设备与通道，未绑定时 avDeviceID 返回空。
* @summary 查询音视频设备与 IoT 设备的绑定关系
* @param {AvDeviceIotBindGetOneReq} avDeviceIotBindGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceIotBindGetOne (
avDeviceIotBindGetOneReq: AvDeviceIotBindGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/iot-bind/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceIotBindGetOne200Response>>(localVarPath, avDeviceIotBindGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：mode=bind 绑定已有音视频设备与通道；mode=quick 按拉流地址自动建档音视频设备与通道后绑定。同一 IoT 设备重复绑定时先解绑旧绑定再建新绑定。
* @summary 保存音视频设备与 IoT 设备的绑定关系
* @param {AvDeviceIotBindSaveReq} avDeviceIotBindSaveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceIotBindSave (
avDeviceIotBindSaveReq: AvDeviceIotBindSaveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/iot-bind/save`;
    return requestClient.post<ExtractDataType<PostApiV1AvDeviceIotBindSave200Response>>(localVarPath, avDeviceIotBindSaveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：清除绑定列与 IoT 设备协议配置中的音视频绑定键；若音视频设备为快速建档且无其他引用则删除其通道与设备记录。
* @summary 解绑音视频设备与 IoT 设备的绑定关系
* @param {AvDeviceIotBindUnbindReq} avDeviceIotBindUnbindReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvDeviceIotBindUnbind (
avDeviceIotBindUnbindReq: AvDeviceIotBindUnbindReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/device/iot-bind/unbind`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avDeviceIotBindUnbindReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备、通道、事件类型等条件分页查询音视频事件列表。
* @summary 获取音视频事件列表
* @param {AvEventGetListReq} avEventGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvEventGetList (
avEventGetListReq: AvEventGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/event/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AvEventGetList200Response>>(localVarPath, avEventGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：新增 ZLM 等媒体服务器配置，用于推流、拉流、录像等能力调度。
* @summary 创建媒体服务器
* @param {AvMediaServerCreateReq} avMediaServerCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvMediaServerCreate (
avMediaServerCreateReq: AvMediaServerCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/media/server/create`;
    return requestClient.post<ExtractDataType<PostApiV1AvMediaServerCreate200Response>>(localVarPath, avMediaServerCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按服务 ID 删除媒体服务器配置。
* @summary 删除媒体服务器
* @param {AvMediaServerDeleteReq} avMediaServerDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvMediaServerDelete (
avMediaServerDeleteReq: AvMediaServerDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/media/server/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avMediaServerDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按名称、状态等条件分页查询媒体服务器列表。
* @summary 获取媒体服务器列表
* @param {AvMediaServerGetListReq} avMediaServerGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvMediaServerGetList (
avMediaServerGetListReq: AvMediaServerGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/media/server/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AvMediaServerGetList200Response>>(localVarPath, avMediaServerGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按服务 ID 查询单条媒体服务器配置详情。
* @summary 获取媒体服务器详情
* @param {AvMediaServerGetOneReq} avMediaServerGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvMediaServerGetOne (
avMediaServerGetOneReq: AvMediaServerGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/media/server/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1AvMediaServerCreate200Response>>(localVarPath, avMediaServerGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按服务 ID 更新媒体服务器配置，支持部分字段更新。
* @summary 更新媒体服务器
* @param {AvMediaServerUpdateReq} avMediaServerUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvMediaServerUpdate (
avMediaServerUpdateReq: AvMediaServerUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/media/server/update`;
    return requestClient.post<ExtractDataType<PostApiV1AvMediaServerCreate200Response>>(localVarPath, avMediaServerUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：在指定网段内广播发现 ONVIF 设备。
* @summary ONVIF 设备发现
* @param {AvOnvifDiscoverReq} avOnvifDiscoverReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifDiscover (
avOnvifDiscoverReq: AvOnvifDiscoverReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/discover`;
    return requestClient.post<ExtractDataType<PostApiV1AvOnvifDiscover200Response>>(localVarPath, avOnvifDiscoverReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：重新探测指定设备，并按用户选择的 Profile 原子创建设备与通道。
* @summary 导入 ONVIF 设备
* @param {AvOnvifImportReq} avOnvifImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifImport (
avOnvifImportReq: AvOnvifImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/import`;
    return requestClient.post<ExtractDataType<PostApiV1AvOnvifImport200Response>>(localVarPath, avOnvifImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：为指定通道添加 ONVIF 预置位。
* @summary ONVIF 添加预置位
* @param {AvOnvifPresetReq} avOnvifPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifPresetAdd (
avOnvifPresetReq: AvOnvifPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/preset/add`;
    return requestClient.post<ExtractDataType<PostApiV1AvOnvifPresetAdd200Response>>(localVarPath, avOnvifPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按预置位 ID 删除指定通道的 ONVIF 预置位。
* @summary ONVIF 删除预置位
* @param {AvOnvifPresetReq} avOnvifPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifPresetDelete (
avOnvifPresetReq: AvOnvifPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/preset/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avOnvifPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按摄像机返回的预置位 Token 调用指定 ONVIF 预置位。
* @summary ONVIF 调用预置位
* @param {AvOnvifPresetReq} avOnvifPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifPresetGoto (
avOnvifPresetReq: AvOnvifPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/preset/goto`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avOnvifPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定通道的 ONVIF 预置位列表。
* @summary ONVIF 获取预置位列表
* @param {AvOnvifPresetReq} avOnvifPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifPresetList (
avOnvifPresetReq: AvOnvifPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/preset/list`;
    return requestClient.post<ExtractDataType<PostApiV1AvOnvifPresetList200Response>>(localVarPath, avOnvifPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按 IP 和端口探测 ONVIF 设备，返回媒体 Profile 列表。
* @summary ONVIF 设备探测
* @param {AvOnvifProbeReq} avOnvifProbeReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifProbe (
avOnvifProbeReq: AvOnvifProbeReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/probe`;
    return requestClient.post<ExtractDataType<PostApiV1AvOnvifProbe200Response>>(localVarPath, avOnvifProbeReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：通过 ONVIF 协议控制指定通道云台方向与缩放。
* @summary ONVIF 云台控制
* @param {AvOnvifPtzControlReq} avOnvifPtzControlReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvOnvifPtzControl (
avOnvifPtzControlReq: AvOnvifPtzControlReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/onvif/ptz/control`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avOnvifPtzControlReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对指定播放流发送保活心跳，避免被服务端自动清理。
* @summary 实时播放保活
* @param {AvPlayLiveKeepaliveReq} avPlayLiveKeepaliveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlayLiveKeepalive (
avPlayLiveKeepaliveReq: AvPlayLiveKeepaliveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/play/live/keepalive`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPlayLiveKeepaliveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道 ID 启动实时播放，返回各协议播放地址。
* @summary 启动实时播放
* @param {AvPlayLiveStartReq} avPlayLiveStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlayLiveStart (
avPlayLiveStartReq: AvPlayLiveStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/play/live/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlayLiveStart200Response>>(localVarPath, avPlayLiveStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：停止指定通道的实时播放流。
* @summary 停止实时播放
* @param {AvPlayLiveStopReq} avPlayLiveStopReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlayLiveStop (
avPlayLiveStopReq: AvPlayLiveStopReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/play/live/stop`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPlayLiveStopReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按设备过滤分页查询当前活跃的实时流列表。
* @summary 获取实时流列表
* @param {AvPlayLiveStreamListReq} avPlayLiveStreamListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlayLiveStreamList (
avPlayLiveStreamListReq: AvPlayLiveStreamListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/play/live/stream/list`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlayLiveStreamList200Response>>(localVarPath, avPlayLiveStreamListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对进行中的历史回放发送控制信令，支持暂停、恢复、拖动与倍速。
* @summary 回放控制
* @param {AvPlaybackControlReq} avPlaybackControlReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlaybackControl (
avPlaybackControlReq: AvPlaybackControlReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/playback/control`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPlaybackControlReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询进行中的设备端录像下载进度，进度按媒体流已收时长占比计算。
* @summary 查询录像下载进度
* @param {AvDownloadProgressReq} avDownloadProgressReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlaybackDownloadProgress (
avDownloadProgressReq: AvDownloadProgressReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/playback/download/progress`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlaybackDownloadProgress200Response>>(localVarPath, avDownloadProgressReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道与起止时间启动 GB28181 设备端录像下载，设备推流至媒体服务器落盘为 MP4。
* @summary 启动录像下载
* @param {AvDownloadStartReq} avDownloadStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlaybackDownloadStart (
avDownloadStartReq: AvDownloadStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/playback/download/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avDownloadStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道与起止时间启动 GB28181 设备端录像历史回放，返回各协议播放地址。
* @summary 启动历史回放
* @param {AvPlaybackStartReq} avPlaybackStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlaybackStart (
avPlaybackStartReq: AvPlaybackStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/playback/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlayLiveStart200Response>>(localVarPath, avPlaybackStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：停止指定通道的历史回放流并清理回放会话。
* @summary 停止历史回放
* @param {AvPlaybackStopReq} avPlaybackStopReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPlaybackStop (
avPlaybackStopReq: AvPlaybackStopReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/playback/stop`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPlaybackStopReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：控制指定通道云台连续移动、停止或预置位操作。
* @summary 云台控制
* @param {AvPtzControlReq} avPtzControlReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPtzControl (
avPtzControlReq: AvPtzControlReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/ptz/control`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPtzControlReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：启动或停止指定通道的云台巡航组。
* @summary 云台巡航控制
* @param {AvPtzCruiseReq} avPtzCruiseReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPtzCruise (
avPtzCruiseReq: AvPtzCruiseReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/ptz/cruise`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPtzCruiseReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按预置位编号调用指定通道的预置位。
* @summary 调用云台预置位
* @param {AvPtzPresetReq} avPtzPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPtzPresetCall (
avPtzPresetReq: AvPtzPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/ptz/preset/call`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPtzPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按预置位编号删除指定通道的预置位。
* @summary 删除云台预置位
* @param {AvPtzPresetReq} avPtzPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPtzPresetDel (
avPtzPresetReq: AvPtzPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/ptz/preset/del`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPtzPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：为指定通道设置预置位。
* @summary 设置云台预置位
* @param {AvPtzPresetReq} avPtzPresetReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvPtzPresetSet (
avPtzPresetReq: AvPtzPresetReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/ptz/preset/set`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avPtzPresetReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定通道指定年月有录像的日期列表。
* @summary 获取录像日历
* @param {AvRecordCalendarReq} avRecordCalendarReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordCalendar (
avRecordCalendarReq: AvRecordCalendarReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/calendar`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordCalendar200Response>>(localVarPath, avRecordCalendarReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按录像 ID 删除指定录像文件及记录。
* @summary 删除录像
* @param {AvRecordDeleteReq} avRecordDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordDelete (
avRecordDeleteReq: AvRecordDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/delete`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avRecordDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按录像 ID 获取录像下载地址。
* @summary 获取录像下载地址
* @param {AvRecordDownloadReq} avRecordDownloadReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordDownload (
avRecordDownloadReq: AvRecordDownloadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/download`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordDownload200Response>>(localVarPath, avRecordDownloadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道、设备、时间范围等条件分页查询录像列表。
* @summary 获取录像列表
* @param {AvRecordGetListReq} avRecordGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordGetList (
avRecordGetListReq: AvRecordGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordGetList200Response>>(localVarPath, avRecordGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定通道指定年月的录像日期 bitmap。
* @summary 获取录像月历 bitmap
* @param {AvRecordMonthlyReq} avRecordMonthlyReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordMonthly (
avRecordMonthlyReq: AvRecordMonthlyReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/monthly`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordMonthly200Response>>(localVarPath, avRecordMonthlyReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：通过 GB28181 信令检索 NVR 设备端录像片段列表，按通道与起止时间查询。
* @summary 检索设备端录像
* @param {AvNvrRecordQueryReq} avNvrRecordQueryReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordNvrQuery (
avNvrRecordQueryReq: AvNvrRecordQueryReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/nvr/query`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordNvrQuery200Response>>(localVarPath, avNvrRecordQueryReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：设置指定通道是否启用录像及录像保留天数。
* @summary 保存录像计划
* @param {AvRecordPlanReq} avRecordPlanReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordPlan (
avRecordPlanReq: AvRecordPlanReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/plan`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avRecordPlanReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按录像 ID 启动录像回放并返回播放地址。
* @summary 启动录像回放
* @param {AvRecordPlayStartReq} avRecordPlayStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordPlayStart (
avRecordPlayStartReq: AvRecordPlayStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/play/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlayLiveStart200Response>>(localVarPath, avRecordPlayStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：立即启动指定通道的录像。
* @summary 启动通道录像
* @param {AvRecordStartReq} avRecordStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordStart (
avRecordStartReq: AvRecordStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avRecordStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：立即停止指定通道的录像。
* @summary 停止通道录像
* @param {AvRecordStopReq} avRecordStopReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordStop (
avRecordStopReq: AvRecordStopReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/stop`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avRecordStopReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询指定通道指定日期的录像片段列表。
* @summary 获取录像时间轴
* @param {AvRecordTimelineReq} avRecordTimelineReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvRecordTimeline (
avRecordTimelineReq: AvRecordTimelineReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/record/timeline`;
    return requestClient.post<ExtractDataType<PostApiV1AvRecordTimeline200Response>>(localVarPath, avRecordTimelineReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：对指定通道调用 ZLM 截图并返回 JPEG 图片 Base64 数据。
* @summary 通道实时截图
* @param {AvSnapReq} avSnapReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvSnap (
avSnapReq: AvSnapReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/snap`;
    return requestClient.post<ExtractDataType<PostApiV1AvSnap200Response>>(localVarPath, avSnapReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：ZLM 开启音频发流端口，SIP 邀请设备建立 s=Talk 会话，返回音频流播放地址。
* @summary 启动对讲
* @param {AvTalkStartReq} avTalkStartReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvTalkStart (
avTalkStartReq: AvTalkStartReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/talk/start`;
    return requestClient.post<ExtractDataType<PostApiV1AvPlayLiveStart200Response>>(localVarPath, avTalkStartReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：按通道停止对讲会话（BYE + 停止 ZLM 发流 + 删会话，幂等）。
* @summary 停止对讲
* @param {AvTalkStopReq} avTalkStopReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvTalkStop (
avTalkStopReq: AvTalkStopReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/talk/stop`;
    return requestClient.post<ExtractDataType<PostApiV1AvConfigSipSave200Response>>(localVarPath, avTalkStopReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 播放鉴权请求，返回 code=0 表示允许播放。
* @summary ZLM 播放鉴权事件回调
* @param {AvWebhookPlayReq} avWebhookPlayReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookPlay (
avWebhookPlayReq: AvWebhookPlayReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/play`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookPlayReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 推流鉴权请求，返回 code=0 表示允许推流。
* @summary ZLM 推流鉴权事件回调
* @param {AvWebhookPublishReq} avWebhookPublishReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookPublish (
avWebhookPublishReq: AvWebhookPublishReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/publish`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookPublishReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM MP4 录像完成事件，入库录像记录。
* @summary ZLM 录像完成事件回调
* @param {AvWebhookRecordMp4Req} avWebhookRecordMp4Req
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookRecordMp4 (
avWebhookRecordMp4Req: AvWebhookRecordMp4Req,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/record/mp4`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookRecordMp4Req, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM RTP 服务器超时事件。
* @summary ZLM RTP 服务器超时事件回调
* @param {AvWebhookRtpServerTimeoutReq} avWebhookRtpServerTimeoutReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookRtpServerTimeout (
avWebhookRtpServerTimeoutReq: AvWebhookRtpServerTimeoutReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/rtp/server/timeout`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookRtpServerTimeoutReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 心跳事件，更新媒体服务器在线状态。
* @summary ZLM 心跳事件回调
* @param {AvWebhookServerKeepaliveReq} avWebhookServerKeepaliveReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookServerKeepalive (
avWebhookServerKeepaliveReq: AvWebhookServerKeepaliveReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/server/keepalive`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookServerKeepaliveReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 关闭事件。
* @summary ZLM 关闭事件回调
* @param {AvWebhookServerShutdownReq} avWebhookServerShutdownReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookServerShutdown (
avWebhookServerShutdownReq: AvWebhookServerShutdownReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/server/shutdown`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookServerShutdownReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 启动完成事件。
* @summary ZLM 启动事件回调
* @param {AvWebhookServerStartedReq} avWebhookServerStartedReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookServerStarted (
avWebhookServerStartedReq: AvWebhookServerStartedReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/server/started`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookServerStartedReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 流注册/注销事件。
* @summary ZLM 流变更事件回调
* @param {AvWebhookStreamChangedReq} avWebhookStreamChangedReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookStreamChanged (
avWebhookStreamChangedReq: AvWebhookStreamChangedReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/stream/changed`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookStreamChangedReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 无观众事件，返回是否允许关闭流。
* @summary ZLM 无观众事件回调
* @param {AvWebhookStreamNoneReaderReq} avWebhookStreamNoneReaderReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookStreamNoneReader (
avWebhookStreamNoneReaderReq: AvWebhookStreamNoneReaderReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/stream/none/reader`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookStreamNoneReader200Response>>(localVarPath, avWebhookStreamNoneReaderReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：接收 ZLM 流不存在事件，触发按需拉流。
* @summary ZLM 流不存在事件回调
* @param {AvWebhookStreamNotFoundReq} avWebhookStreamNotFoundReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1AvWebhookStreamNotFound (
avWebhookStreamNotFoundReq: AvWebhookStreamNotFoundReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/av/webhook/stream/not/found`;
    return requestClient.post<ExtractDataType<PostApiV1AvWebhookPlay200Response>>(localVarPath, avWebhookStreamNotFoundReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for mode operation in AvApiApi.
 */
export interface AvApiApiModeRequest {
    readonly avDeviceChannelSetRecordModeReq: AvDeviceChannelSetRecordModeReq
}

/**
 * Request parameters for postApiV1AvConfigSipGetOne operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvConfigSipGetOneRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1AvConfigSipSave operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvConfigSipSaveRequest {
    readonly avSipConfigSaveReq: AvSipConfigSaveReq
}

/**
 * Request parameters for postApiV1AvDeviceChannelCreate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceChannelCreateRequest {
    readonly avDeviceChannelCreateReq: AvDeviceChannelCreateReq
}

/**
 * Request parameters for postApiV1AvDeviceChannelDelete operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceChannelDeleteRequest {
    readonly avDeviceChannelDeleteReq: AvDeviceChannelDeleteReq
}

/**
 * Request parameters for postApiV1AvDeviceChannelGetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceChannelGetListRequest {
    readonly avDeviceChannelGetListReq: AvDeviceChannelGetListReq
}

/**
 * Request parameters for postApiV1AvDeviceChannelGetOne operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceChannelGetOneRequest {
    readonly avDeviceChannelGetOneReq: AvDeviceChannelGetOneReq
}

/**
 * Request parameters for postApiV1AvDeviceChannelUpdate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceChannelUpdateRequest {
    readonly avDeviceChannelUpdateReq: AvDeviceChannelUpdateReq
}

/**
 * Request parameters for postApiV1AvDeviceInfoCreate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceInfoCreateRequest {
    readonly avDeviceInfoCreateReq: AvDeviceInfoCreateReq
}

/**
 * Request parameters for postApiV1AvDeviceInfoDelete operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceInfoDeleteRequest {
    readonly avDeviceInfoDeleteReq: AvDeviceInfoDeleteReq
}

/**
 * Request parameters for postApiV1AvDeviceInfoGetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceInfoGetListRequest {
    readonly avDeviceInfoGetListReq: AvDeviceInfoGetListReq
}

/**
 * Request parameters for postApiV1AvDeviceInfoGetOne operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceInfoGetOneRequest {
    readonly avDeviceInfoGetOneReq: AvDeviceInfoGetOneReq
}

/**
 * Request parameters for postApiV1AvDeviceInfoUpdate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceInfoUpdateRequest {
    readonly avDeviceInfoUpdateReq: AvDeviceInfoUpdateReq
}

/**
 * Request parameters for postApiV1AvDeviceIotBindGetOne operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceIotBindGetOneRequest {
    readonly avDeviceIotBindGetOneReq: AvDeviceIotBindGetOneReq
}

/**
 * Request parameters for postApiV1AvDeviceIotBindSave operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceIotBindSaveRequest {
    readonly avDeviceIotBindSaveReq: AvDeviceIotBindSaveReq
}

/**
 * Request parameters for postApiV1AvDeviceIotBindUnbind operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvDeviceIotBindUnbindRequest {
    readonly avDeviceIotBindUnbindReq: AvDeviceIotBindUnbindReq
}

/**
 * Request parameters for postApiV1AvEventGetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvEventGetListRequest {
    readonly avEventGetListReq: AvEventGetListReq
}

/**
 * Request parameters for postApiV1AvMediaServerCreate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvMediaServerCreateRequest {
    readonly avMediaServerCreateReq: AvMediaServerCreateReq
}

/**
 * Request parameters for postApiV1AvMediaServerDelete operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvMediaServerDeleteRequest {
    readonly avMediaServerDeleteReq: AvMediaServerDeleteReq
}

/**
 * Request parameters for postApiV1AvMediaServerGetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvMediaServerGetListRequest {
    readonly avMediaServerGetListReq: AvMediaServerGetListReq
}

/**
 * Request parameters for postApiV1AvMediaServerGetOne operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvMediaServerGetOneRequest {
    readonly avMediaServerGetOneReq: AvMediaServerGetOneReq
}

/**
 * Request parameters for postApiV1AvMediaServerUpdate operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvMediaServerUpdateRequest {
    readonly avMediaServerUpdateReq: AvMediaServerUpdateReq
}

/**
 * Request parameters for postApiV1AvOnvifDiscover operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifDiscoverRequest {
    readonly avOnvifDiscoverReq: AvOnvifDiscoverReq
}

/**
 * Request parameters for postApiV1AvOnvifImport operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifImportRequest {
    readonly avOnvifImportReq: AvOnvifImportReq
}

/**
 * Request parameters for postApiV1AvOnvifPresetAdd operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifPresetAddRequest {
    readonly avOnvifPresetReq: AvOnvifPresetReq
}

/**
 * Request parameters for postApiV1AvOnvifPresetDelete operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifPresetDeleteRequest {
    readonly avOnvifPresetReq: AvOnvifPresetReq
}

/**
 * Request parameters for postApiV1AvOnvifPresetGoto operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifPresetGotoRequest {
    readonly avOnvifPresetReq: AvOnvifPresetReq
}

/**
 * Request parameters for postApiV1AvOnvifPresetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifPresetListRequest {
    readonly avOnvifPresetReq: AvOnvifPresetReq
}

/**
 * Request parameters for postApiV1AvOnvifProbe operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifProbeRequest {
    readonly avOnvifProbeReq: AvOnvifProbeReq
}

/**
 * Request parameters for postApiV1AvOnvifPtzControl operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvOnvifPtzControlRequest {
    readonly avOnvifPtzControlReq: AvOnvifPtzControlReq
}

/**
 * Request parameters for postApiV1AvPlayLiveKeepalive operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlayLiveKeepaliveRequest {
    readonly avPlayLiveKeepaliveReq: AvPlayLiveKeepaliveReq
}

/**
 * Request parameters for postApiV1AvPlayLiveStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlayLiveStartRequest {
    readonly avPlayLiveStartReq: AvPlayLiveStartReq
}

/**
 * Request parameters for postApiV1AvPlayLiveStop operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlayLiveStopRequest {
    readonly avPlayLiveStopReq: AvPlayLiveStopReq
}

/**
 * Request parameters for postApiV1AvPlayLiveStreamList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlayLiveStreamListRequest {
    readonly avPlayLiveStreamListReq: AvPlayLiveStreamListReq
}

/**
 * Request parameters for postApiV1AvPlaybackControl operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlaybackControlRequest {
    readonly avPlaybackControlReq: AvPlaybackControlReq
}

/**
 * Request parameters for postApiV1AvPlaybackDownloadProgress operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlaybackDownloadProgressRequest {
    readonly avDownloadProgressReq: AvDownloadProgressReq
}

/**
 * Request parameters for postApiV1AvPlaybackDownloadStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlaybackDownloadStartRequest {
    readonly avDownloadStartReq: AvDownloadStartReq
}

/**
 * Request parameters for postApiV1AvPlaybackStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlaybackStartRequest {
    readonly avPlaybackStartReq: AvPlaybackStartReq
}

/**
 * Request parameters for postApiV1AvPlaybackStop operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPlaybackStopRequest {
    readonly avPlaybackStopReq: AvPlaybackStopReq
}

/**
 * Request parameters for postApiV1AvPtzControl operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPtzControlRequest {
    readonly avPtzControlReq: AvPtzControlReq
}

/**
 * Request parameters for postApiV1AvPtzCruise operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPtzCruiseRequest {
    readonly avPtzCruiseReq: AvPtzCruiseReq
}

/**
 * Request parameters for postApiV1AvPtzPresetCall operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPtzPresetCallRequest {
    readonly avPtzPresetReq: AvPtzPresetReq
}

/**
 * Request parameters for postApiV1AvPtzPresetDel operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPtzPresetDelRequest {
    readonly avPtzPresetReq: AvPtzPresetReq
}

/**
 * Request parameters for postApiV1AvPtzPresetSet operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvPtzPresetSetRequest {
    readonly avPtzPresetReq: AvPtzPresetReq
}

/**
 * Request parameters for postApiV1AvRecordCalendar operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordCalendarRequest {
    readonly avRecordCalendarReq: AvRecordCalendarReq
}

/**
 * Request parameters for postApiV1AvRecordDelete operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordDeleteRequest {
    readonly avRecordDeleteReq: AvRecordDeleteReq
}

/**
 * Request parameters for postApiV1AvRecordDownload operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordDownloadRequest {
    readonly avRecordDownloadReq: AvRecordDownloadReq
}

/**
 * Request parameters for postApiV1AvRecordGetList operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordGetListRequest {
    readonly avRecordGetListReq: AvRecordGetListReq
}

/**
 * Request parameters for postApiV1AvRecordMonthly operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordMonthlyRequest {
    readonly avRecordMonthlyReq: AvRecordMonthlyReq
}

/**
 * Request parameters for postApiV1AvRecordNvrQuery operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordNvrQueryRequest {
    readonly avNvrRecordQueryReq: AvNvrRecordQueryReq
}

/**
 * Request parameters for postApiV1AvRecordPlan operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordPlanRequest {
    readonly avRecordPlanReq: AvRecordPlanReq
}

/**
 * Request parameters for postApiV1AvRecordPlayStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordPlayStartRequest {
    readonly avRecordPlayStartReq: AvRecordPlayStartReq
}

/**
 * Request parameters for postApiV1AvRecordStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordStartRequest {
    readonly avRecordStartReq: AvRecordStartReq
}

/**
 * Request parameters for postApiV1AvRecordStop operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordStopRequest {
    readonly avRecordStopReq: AvRecordStopReq
}

/**
 * Request parameters for postApiV1AvRecordTimeline operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvRecordTimelineRequest {
    readonly avRecordTimelineReq: AvRecordTimelineReq
}

/**
 * Request parameters for postApiV1AvSnap operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvSnapRequest {
    readonly avSnapReq: AvSnapReq
}

/**
 * Request parameters for postApiV1AvTalkStart operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvTalkStartRequest {
    readonly avTalkStartReq: AvTalkStartReq
}

/**
 * Request parameters for postApiV1AvTalkStop operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvTalkStopRequest {
    readonly avTalkStopReq: AvTalkStopReq
}

/**
 * Request parameters for postApiV1AvWebhookPlay operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookPlayRequest {
    readonly avWebhookPlayReq: AvWebhookPlayReq
}

/**
 * Request parameters for postApiV1AvWebhookPublish operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookPublishRequest {
    readonly avWebhookPublishReq: AvWebhookPublishReq
}

/**
 * Request parameters for postApiV1AvWebhookRecordMp4 operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookRecordMp4Request {
    readonly avWebhookRecordMp4Req: AvWebhookRecordMp4Req
}

/**
 * Request parameters for postApiV1AvWebhookRtpServerTimeout operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookRtpServerTimeoutRequest {
    readonly avWebhookRtpServerTimeoutReq: AvWebhookRtpServerTimeoutReq
}

/**
 * Request parameters for postApiV1AvWebhookServerKeepalive operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookServerKeepaliveRequest {
    readonly avWebhookServerKeepaliveReq: AvWebhookServerKeepaliveReq
}

/**
 * Request parameters for postApiV1AvWebhookServerShutdown operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookServerShutdownRequest {
    readonly avWebhookServerShutdownReq: AvWebhookServerShutdownReq
}

/**
 * Request parameters for postApiV1AvWebhookServerStarted operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookServerStartedRequest {
    readonly avWebhookServerStartedReq: AvWebhookServerStartedReq
}

/**
 * Request parameters for postApiV1AvWebhookStreamChanged operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookStreamChangedRequest {
    readonly avWebhookStreamChangedReq: AvWebhookStreamChangedReq
}

/**
 * Request parameters for postApiV1AvWebhookStreamNoneReader operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookStreamNoneReaderRequest {
    readonly avWebhookStreamNoneReaderReq: AvWebhookStreamNoneReaderReq
}

/**
 * Request parameters for postApiV1AvWebhookStreamNotFound operation in AvApiApi.
 */
export interface AvApiApiPostApiV1AvWebhookStreamNotFoundRequest {
    readonly avWebhookStreamNotFoundReq: AvWebhookStreamNotFoundReq
}
