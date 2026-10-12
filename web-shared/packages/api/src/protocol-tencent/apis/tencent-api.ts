import type { DescribeCloudStorageEventsReq } from '../models';
import type { DescribeCloudStorageThumbnailListReq } from '../models';
import type { PostApiV1ProtocolCloudTencentCloudStorageEvents200Response } from '../models';
import type { PostApiV1ProtocolCloudTencentCloudStorageThumbnailList200Response } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * TencentApi - axios parameter creator
 */

/**
* 业务说明：按设备、时间范围和上下文分页查询腾讯云存事件列表，供前端查看设备云录像事件。
* @summary 拉取云存事件列表
* @param {DescribeCloudStorageEventsReq} describeCloudStorageEventsReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ProtocolCloudTencentCloudStorageEvents (
describeCloudStorageEventsReq: DescribeCloudStorageEventsReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/protocol/cloud/tencent/cloud-storage-events`;
    return requestClient.post<ExtractDataType<PostApiV1ProtocolCloudTencentCloudStorageEvents200Response>>(localVarPath, describeCloudStorageEventsReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据腾讯云返回的缩略图标识批量换取可访问的缩略图 URL。
* @summary 批量拉取云存事件缩略图
* @param {DescribeCloudStorageThumbnailListReq} describeCloudStorageThumbnailListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1ProtocolCloudTencentCloudStorageThumbnailList (
describeCloudStorageThumbnailListReq: DescribeCloudStorageThumbnailListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/protocol/cloud/tencent/cloud-storage-thumbnail-list`;
    return requestClient.post<ExtractDataType<PostApiV1ProtocolCloudTencentCloudStorageThumbnailList200Response>>(localVarPath, describeCloudStorageThumbnailListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1ProtocolCloudTencentCloudStorageEvents operation in TencentApi.
 */
export interface TencentApiPostApiV1ProtocolCloudTencentCloudStorageEventsRequest {
    readonly describeCloudStorageEventsReq: DescribeCloudStorageEventsReq
}

/**
 * Request parameters for postApiV1ProtocolCloudTencentCloudStorageThumbnailList operation in TencentApi.
 */
export interface TencentApiPostApiV1ProtocolCloudTencentCloudStorageThumbnailListRequest {
    readonly describeCloudStorageThumbnailListReq: DescribeCloudStorageThumbnailListReq
}
