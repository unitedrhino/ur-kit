import type { AssetDeleteReq } from '../models';
import type { AssetGetListReq } from '../models';
import type { AssetUpdateReq } from '../models';
import type { AssetUploadReq } from '../models';
import type { PostApiV1ViewAssetDelete200Response } from '../models';
import type { PostApiV1ViewAssetGetList200Response } from '../models';
import type { PostApiV1ViewAssetUploadZip200Response } from '../models';
import type { PostApiV1ViewAssetUploadZipRequest } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ViewAssetApi - axios parameter creator
 */

/**
* 业务说明：删除可视化资源库中的素材记录。用于清理不再使用的资源。
* @summary 删除资源
* @param {AssetDeleteReq} assetDeleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewAssetDelete (
assetDeleteReq: AssetDeleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/asset/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, assetDeleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询可视化资源列表，支持按名称、类型、分组和格式筛选。用于素材库浏览。
* @summary 获取资源列表
* @param {AssetGetListReq} assetGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewAssetGetList (
assetGetListReq: AssetGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/asset/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetGetList200Response>>(localVarPath, assetGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：更新可视化资源的名称、类型或标签信息，用于素材维护。
* @summary 更新资源
* @param {AssetUpdateReq} assetUpdateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewAssetUpdate (
assetUpdateReq: AssetUpdateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/asset/update`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, assetUpdateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：上传或登记可视化项目使用的资源文件，包含图片、视频、音频等素材。用于项目素材管理。
* @summary 上传资源
* @param {AssetUploadReq} assetUploadReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewAssetUpload (
assetUploadReq: AssetUploadReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/asset/upload`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetDelete200Response>>(localVarPath, assetUploadReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：通过multipart/formdata上传内嵌页面zip页面包（file字段），平台解压托管到对象存储私有桶并登记场景包资产，返回入口页面URL供内嵌页面组件引用。formdata参数：screenId（必传，归属大屏/模板id，按其归属鉴权）、assetId（可选，传则覆盖既有场景包）、name（可选，资产名称）。zip需含index.html（根目录或唯一一级子目录），仅允许静态资源扩展名，大小与文件数受平台限制。
* @summary 上传内嵌页面包
* @param {PostApiV1ViewAssetUploadZipRequest} postApiV1ViewAssetUploadZipRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ViewAssetUploadZip (
postApiV1ViewAssetUploadZipRequest?: PostApiV1ViewAssetUploadZipRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/view/asset/upload-zip`;
    return requestClient.post<ExtractDataType<PostApiV1ViewAssetUploadZip200Response>>(localVarPath, postApiV1ViewAssetUploadZipRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ViewAssetDelete operation in ViewAssetApi.
 */
export interface ViewAssetApiPostApiV1ViewAssetDeleteRequest {
    readonly assetDeleteReq: AssetDeleteReq
}

/**
 * Request parameters for postApiV1ViewAssetGetList operation in ViewAssetApi.
 */
export interface ViewAssetApiPostApiV1ViewAssetGetListRequest {
    readonly assetGetListReq: AssetGetListReq
}

/**
 * Request parameters for postApiV1ViewAssetUpdate operation in ViewAssetApi.
 */
export interface ViewAssetApiPostApiV1ViewAssetUpdateRequest {
    readonly assetUpdateReq: AssetUpdateReq
}

/**
 * Request parameters for postApiV1ViewAssetUpload operation in ViewAssetApi.
 */
export interface ViewAssetApiPostApiV1ViewAssetUploadRequest {
    readonly assetUploadReq: AssetUploadReq
}

/**
 * Request parameters for postApiV1ViewAssetUploadZip operation in ViewAssetApi.
 */
export interface ViewAssetApiPostApiV1ViewAssetUploadZipRequest {
    readonly postApiV1ViewAssetUploadZipRequest?: PostApiV1ViewAssetUploadZipRequest
}
