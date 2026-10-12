import type { FirmwareCreateReq } from '../models';
import type { FirmwareGetListReq } from '../models';
import type { FirmwareUpdateReq } from '../models';
import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsGroupInfoCreate200Response } from '../models';
import type { PostApiV1ThingsOtaFirmwareInfoGetList200Response } from '../models';
import type { PostApiV1ThingsOtaFirmwareInfoGetOne200Response } from '../models';
import type { WithID } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsOtaFirmwareInfoApi - axios parameter creator
 */

/**
* 业务说明：创建OTA升级包并上传固件文件。支持整包升级和差分升级两种类型，需指定签名方式（MD5/SHA256）验证文件完整性。创建后可基于升级包发起批量升级任务。适用于：发布新版本固件、安全补丁更新、功能升级发布。上传的文件存放在OSS，返回升级包ID用于后续任务创建。
* @summary 添加升级包
* @param {FirmwareCreateReq} firmwareCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareInfoCreate (
firmwareCreateReq: FirmwareCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, firmwareCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除OTA升级包及其关联的固件文件。删除前需确认该升级包下无进行中的升级任务批次。删除后升级包ID失效，历史升级记录中关联该升级包的信息可能受影响。适用于：废弃旧版本固件、清理测试升级包、回收存储空间。注意：删除操作不可恢复，OSS文件同步删除。
* @summary 删除升级包
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareInfoDelete (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询产品的所有OTA升级包列表。返回升级包基本信息（版本号、整包/差分类型、签名方式、创建时间、状态等），支持按产品ID和名称过滤。用于管理界面展示固件版本清单、创建升级任务时选择目标版本、版本发布管理。
* @summary 升级包列表
* @param {FirmwareGetListReq} firmwareGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareInfoGetList (
firmwareGetListReq: FirmwareGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaFirmwareInfoGetList200Response>>(localVarPath, firmwareGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：获取单个OTA升级包的完整详情。包括版本信息、签名配置、文件列表（文件名、路径、MD5签名）、是否需要验证、关联模块编码等。用于升级包详情查看、创建升级任务前确认包信息、升级失败排查时查看文件签名。
* @summary 查询升级包
* @param {WithID} withID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareInfoGetOne (
withID: WithID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsOtaFirmwareInfoGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新OTA升级包的元信息。可修改升级包名称、描述、扩展数据等属性。注意：版本号、签名方式、文件列表等核心属性创建后不可修改（影响升级任务执行）。用于升级包说明更新、发布备注补充、元数据维护。
* @summary 修改升级包
* @param {FirmwareUpdateReq} firmwareUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsOtaFirmwareInfoUpdate (
firmwareUpdateReq: FirmwareUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/ota/firmware/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsGroupInfoCreate200Response>>(localVarPath, firmwareUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsOtaFirmwareInfoCreate operation in ThingsOtaFirmwareInfoApi.
 */
export interface ThingsOtaFirmwareInfoApiPostApiV1ThingsOtaFirmwareInfoCreateRequest {
    readonly firmwareCreateReq: FirmwareCreateReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareInfoDelete operation in ThingsOtaFirmwareInfoApi.
 */
export interface ThingsOtaFirmwareInfoApiPostApiV1ThingsOtaFirmwareInfoDeleteRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareInfoGetList operation in ThingsOtaFirmwareInfoApi.
 */
export interface ThingsOtaFirmwareInfoApiPostApiV1ThingsOtaFirmwareInfoGetListRequest {
    readonly firmwareGetListReq: FirmwareGetListReq
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareInfoGetOne operation in ThingsOtaFirmwareInfoApi.
 */
export interface ThingsOtaFirmwareInfoApiPostApiV1ThingsOtaFirmwareInfoGetOneRequest {
    readonly withID: WithID
}

/**
 * Request parameters for postApiV1ThingsOtaFirmwareInfoUpdate operation in ThingsOtaFirmwareInfoApi.
 */
export interface ThingsOtaFirmwareInfoApiPostApiV1ThingsOtaFirmwareInfoUpdateRequest {
    readonly firmwareUpdateReq: FirmwareUpdateReq
}
