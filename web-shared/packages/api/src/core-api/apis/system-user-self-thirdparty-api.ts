import type { PostApiV1SystemUserSelfThirdpartySetupCheck200Response } from '../models';
import type { PostApiV1SystemUserSelfThirdpartySetupComplete200Response } from '../models';
import type { PostApiV1SystemUserSelfThirdpartySetupInit200Response } from '../models';
import type { ThirdpartySetupCheckReq } from '../models';
import type { ThirdpartySetupCompleteReq } from '../models';
import type { ThirdpartySetupInitReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemUserSelfThirdpartyApi - axios parameter creator
 */

/**
* 第三方客户端轮询接口，public 无需登录，通过 setup_code 查询绑定结果
* @summary 查询第三方客户端绑定状态
* @param {ThirdpartySetupCheckReq} thirdpartySetupCheckReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdpartySetupCheck (
thirdpartySetupCheckReq: ThirdpartySetupCheckReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/thirdparty/setup-check`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfThirdpartySetupCheck200Response>>(localVarPath, thirdpartySetupCheckReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 前端在访问令牌创建成功后调用，将 AK/SK 与 setup_code 关联写入 Redis
* @summary 完成第三方客户端绑定
* @param {ThirdpartySetupCompleteReq} thirdpartySetupCompleteReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdpartySetupComplete (
thirdpartySetupCompleteReq: ThirdpartySetupCompleteReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/thirdparty/setup-complete`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfThirdpartySetupComplete200Response>>(localVarPath, thirdpartySetupCompleteReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 第三方客户端生成绑定码后先调用本接口在后端登记（TTL 600 秒），使绑定码有效期从生成时刻起算；【完成第三方客户端绑定】时会校验本登记是否存在
* @summary 登记第三方客户端绑定码
* @param {ThirdpartySetupInitReq} thirdpartySetupInitReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemUserSelfThirdpartySetupInit (
thirdpartySetupInitReq: ThirdpartySetupInitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/user/self/thirdparty/setup-init`;
    return requestClient.post<ExtractDataType<PostApiV1SystemUserSelfThirdpartySetupInit200Response>>(localVarPath, thirdpartySetupInitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for postApiV1SystemUserSelfThirdpartySetupCheck operation in SystemUserSelfThirdpartyApi.
 */
export interface SystemUserSelfThirdpartyApiPostApiV1SystemUserSelfThirdpartySetupCheckRequest {
    readonly thirdpartySetupCheckReq: ThirdpartySetupCheckReq
}

/**
 * Request parameters for postApiV1SystemUserSelfThirdpartySetupComplete operation in SystemUserSelfThirdpartyApi.
 */
export interface SystemUserSelfThirdpartyApiPostApiV1SystemUserSelfThirdpartySetupCompleteRequest {
    readonly thirdpartySetupCompleteReq: ThirdpartySetupCompleteReq
}

/**
 * Request parameters for postApiV1SystemUserSelfThirdpartySetupInit operation in SystemUserSelfThirdpartyApi.
 */
export interface SystemUserSelfThirdpartyApiPostApiV1SystemUserSelfThirdpartySetupInitRequest {
    readonly thirdpartySetupInitReq: ThirdpartySetupInitReq
}
