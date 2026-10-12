import type { PostApiV1ThingsAiMcpMessage200Response } from '../models';
import type { PostApiV1ThingsProductCategoryBatchImport200Response } from '../models';
import type { PostApiV1ThingsProductInfoBatchExport200Response } from '../models';
import type { PostApiV1ThingsProductInfoCreate200Response } from '../models';
import type { PostApiV1ThingsProductInfoGetList200Response } from '../models';
import type { PostApiV1ThingsProductInfoGetOne200Response } from '../models';
import type { ProductID } from '../models';
import type { ProductInfo } from '../models';
import type { ProductInfoExportReq } from '../models';
import type { ProductInfoGetListReq } from '../models';
import type { ProductInfoGetOneReq } from '../models';
import type { ProductInfoImportReq } from '../models';
import type { ProductInitReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * ThingsProductInfoApi - axios parameter creator
 */

/**
* 业务说明：将选中的产品数据导出为ZIP压缩包。压缩包包含产品配置、物模型、自定义UI等。用于产品数据备份、跨平台迁移
* @summary 批量导出产品
* @param {ProductInfoExportReq} productInfoExportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoBatchExport (
productInfoExportReq: ProductInfoExportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/batch-export`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductInfoBatchExport200Response>>(localVarPath, productInfoExportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从ZIP压缩包批量导入产品数据。压缩包包含产品配置JSON、物模型定义、自定义UI等。用于产品模板部署、批量产品创建
* @summary 批量导入产品
* @param {ProductInfoImportReq} productInfoImportReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoBatchImport (
productInfoImportReq: ProductInfoImportReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/batch-import`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductCategoryBatchImport200Response>>(localVarPath, productInfoImportReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：创建物联网产品，定义设备类型【直连设备、网关、子设备】、认证方式、通讯方式、协议类型等。产品是设备的抽象模板，设备必须归属某个产品。产品创建后自动生成产品ID和产品秘钥用于设备认证
* @summary 新增产品
* @param {ProductInfo} productInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoCreate (
productInfo: ProductInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductInfoCreate200Response>>(localVarPath, productInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除物联网产品。如产品下有设备，需先删除设备或迁移到其他产品。删除后设备无法再接入平台
* @summary 删除产品
* @param {ProductID} productID
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoDelete (
productID: ProductID,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：分页查询产品列表。支持按产品名称、设备类型、协议类型、状态【启用、禁用、开发中】过滤。返回产品基本信息、协议详情、品类信息。用于产品管理界面展示
* @summary 获取产品信息列表
* @param {ProductInfoGetListReq} productInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoGetList (
productInfoGetListReq: ProductInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductInfoGetList200Response>>(localVarPath, productInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据产品ID查询产品完整配置信息。返回产品基本信息、认证方式、协议配置、物模型模式、设备初始化配置等。可选择同时加载协议详情和品类详情
* @summary 获取产品详情
* @param {ProductInfoGetOneReq} productInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoGetOne (
productInfoGetOneReq: ProductInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsProductInfoGetOne200Response>>(localVarPath, productInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：批量初始化产品的基础配置，包括设备初始化默认分配的租户、项目、区域等。用于产品首次启用前的快速配置
* @summary 初始化产品
* @param {ProductInitReq} productInitReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoInit (
productInitReq: ProductInitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/init`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productInitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改产品名称、图片、描述、认证方式、协议配置等属性。支持部分更新，空值字段保持原值不变。产品ID不可修改
* @summary 更新产品
* @param {ProductInfo} productInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ThingsProductInfoUpdate (
productInfo: ProductInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/things/product/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1ThingsAiMcpMessage200Response>>(localVarPath, productInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ThingsProductInfoBatchExport operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoBatchExportRequest {
    readonly productInfoExportReq: ProductInfoExportReq
}

/**
 * Request parameters for postApiV1ThingsProductInfoBatchImport operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoBatchImportRequest {
    readonly productInfoImportReq: ProductInfoImportReq
}

/**
 * Request parameters for postApiV1ThingsProductInfoCreate operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoCreateRequest {
    readonly productInfo: ProductInfo
}

/**
 * Request parameters for postApiV1ThingsProductInfoDelete operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoDeleteRequest {
    readonly productID: ProductID
}

/**
 * Request parameters for postApiV1ThingsProductInfoGetList operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoGetListRequest {
    readonly productInfoGetListReq: ProductInfoGetListReq
}

/**
 * Request parameters for postApiV1ThingsProductInfoGetOne operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoGetOneRequest {
    readonly productInfoGetOneReq: ProductInfoGetOneReq
}

/**
 * Request parameters for postApiV1ThingsProductInfoInit operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoInitRequest {
    readonly productInitReq: ProductInitReq
}

/**
 * Request parameters for postApiV1ThingsProductInfoUpdate operation in ThingsProductInfoApi.
 */
export interface ThingsProductInfoApiPostApiV1ThingsProductInfoUpdateRequest {
    readonly productInfo: ProductInfo
}
