import type { DeptInfo } from '../models';
import type { DeptInfoGetListReq } from '../models';
import type { DeptInfoGetOneReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemCommonThirdDeptGetList200Response } from '../models';
import type { PostApiV1SystemCommonThirdDeptGetOne200Response } from '../models';
import type { PostApiV1SystemDeptInfoCreate200Response } from '../models';
import type { WithIDStr } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemDeptInfoApi - axios parameter creator
 */

/**
* 业务说明：创建新的部门组织。部门用于组织架构管理和人员归属，支持多级树形结构。创建时需指定父部门，自动生成ID路径。用于企业组织架构搭建、人员分组管理等场景。
* @summary 添加部门详情
* @param {DeptInfo} deptInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptInfoCreate (
deptInfo: DeptInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/info/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemDeptInfoCreate200Response>>(localVarPath, deptInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：删除部门。删除前需确保部门下无用户，否则删除失败。用于组织架构调整、部门合并等场景。删除后用户归属需重新分配。
* @summary 删除部门
* @param {WithIDStr} withIDStr
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptInfoDelete (
withIDStr: WithIDStr,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/info/delete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, withIDStr, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询部门列表，支持按父节点、名称、状态筛选。用于部门选择器、组织架构展示、人员归属选择等场景。返回分页结果包含部门基本信息和用户统计。
* @summary 获取部门列表
* @param {DeptInfoGetListReq} deptInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptInfoGetList (
deptInfoGetListReq: DeptInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/info/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonThirdDeptGetList200Response>>(localVarPath, deptInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：查询单个部门的完整信息。支持获取父级和子级部门用于展示完整上下文。用于部门编辑、查看部门详情、组织架构导航等场景。
* @summary 获取部门详情
* @param {DeptInfoGetOneReq} deptInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptInfoGetOne (
deptInfoGetOneReq: DeptInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonThirdDeptGetOne200Response>>(localVarPath, deptInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：修改部门信息。可调整部门名称、状态、排序、描述等属性。父部门通常不可修改以保持组织架构稳定性。更新后立即生效，关联用户权限自动同步。
* @summary 更新部门
* @param {DeptInfo} deptInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemDeptInfoUpdate (
deptInfo: DeptInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/dept/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, deptInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemDeptInfoCreate operation in SystemDeptInfoApi.
 */
export interface SystemDeptInfoApiPostApiV1SystemDeptInfoCreateRequest {
    readonly deptInfo: DeptInfo
}

/**
 * Request parameters for postApiV1SystemDeptInfoDelete operation in SystemDeptInfoApi.
 */
export interface SystemDeptInfoApiPostApiV1SystemDeptInfoDeleteRequest {
    readonly withIDStr: WithIDStr
}

/**
 * Request parameters for postApiV1SystemDeptInfoGetList operation in SystemDeptInfoApi.
 */
export interface SystemDeptInfoApiPostApiV1SystemDeptInfoGetListRequest {
    readonly deptInfoGetListReq: DeptInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemDeptInfoGetOne operation in SystemDeptInfoApi.
 */
export interface SystemDeptInfoApiPostApiV1SystemDeptInfoGetOneRequest {
    readonly deptInfoGetOneReq: DeptInfoGetOneReq
}

/**
 * Request parameters for postApiV1SystemDeptInfoUpdate operation in SystemDeptInfoApi.
 */
export interface SystemDeptInfoApiPostApiV1SystemDeptInfoUpdateRequest {
    readonly deptInfo: DeptInfo
}
