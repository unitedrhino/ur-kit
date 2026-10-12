import type { ApiBatchAggReq } from '../models';
import type { GetApiV1SystemCommonDebug200Response } from '../models';
import type { NtpGetOneReq } from '../models';
import type { PostApiV1SystemAgreementDelete200Response } from '../models';
import type { PostApiV1SystemCommonApiBatchAgg200Response } from '../models';
import type { PostApiV1SystemCommonInitUploadFile200Response } from '../models';
import type { PostApiV1SystemCommonInitUploadFileRequest } from '../models';
import type { PostApiV1SystemCommonMapRuntime200Response } from '../models';
import type { PostApiV1SystemCommonNtpGetOne200Response } from '../models';
import type { PostApiV1SystemCommonQrCodeGetOne200Response } from '../models';
import type { PostApiV1SystemCommonSysConfigCoreGetOne200Response } from '../models';
import type { PostApiV1SystemCommonSysConfigOauthKeyGenerate200Response } from '../models';
import type { PostApiV1SystemCommonSystemInit200Response } from '../models';
import type { PostApiV1SystemCommonThirdDeptGetList200Response } from '../models';
import type { PostApiV1SystemCommonThirdDeptGetOne200Response } from '../models';
import type { PostApiV1SystemCommonUploadUrlCreate200Response } from '../models';
import type { PostApiV1SystemCommonWeatherGetOne200Response } from '../models';
import type { QRCodeGetOneReq } from '../models';
import type { SysConfigInfo } from '../models';
import type { SystemInitReq } from '../models';
import type { ThirdDeptInfoGetListReq } from '../models';
import type { ThirdDeptInfoGetOneReq } from '../models';
import type { UploadUrlCreateReq } from '../models';
import type { WeatherGetOneReq } from '../models';

import { requestClient, mergeApiConfig } from "../../base";
import type { RequestClientConfig } from "@vben/request";

// 辅助类型：从响应类型中提取data字段的类型，如果没有data字段则返回原类型
type ExtractDataType<T> = T extends { data?: infer D } ? (D extends undefined ? T : D) : T;

/**
 * SystemCommonApi - axios parameter creator
 */

/**
* 仅代理地图初始化和地理编码白名单，校验当前平台 Web Key，并由服务端注入安全码；禁止任意上游。
* @summary 高德 JS API 安全代理
* @param {string} [bodyParam.version]  白名单版本
* @param {string} [bodyParam.service]  白名单服务
* @param {string} [bodyParam.operation]  白名单操作
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  aMapServiceVersionServiceOperation (bodyParam: { version: string; service: string; operation: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/map/_AMapService/{version}/{service}/{operation}`
    .replace(`{${"version"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['version'] ?? '')))
    .replace(`{${"service"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['service'] ?? '')))
    .replace(`{${"operation"}}`, encodeURIComponent(String((bodyParam as Record<string, unknown>)['operation'] ?? '')));
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：开发调试专用接口（GET方式），返回请求URI、Headers等完整信息。用于API调试、中间件验证、请求格式检查等开发场景。生产环境建议禁用或限制访问。
* @summary 调试接口GET
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1SystemCommonDebug (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/debug`;
    return requestClient.get<ExtractDataType<GetApiV1SystemCommonDebug200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：腾讯云服务连通性测试接口。用于验证腾讯云API调用、密钥配置、网络连通等。适用于短信服务、对象存储等腾讯云集成调试场景。
* @summary 腾讯云调试接口
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1SystemCommonDebugTencent (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/debug-tencent`;
    return requestClient.get<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从服务器本地文件系统下载文件。用于导出报表、下载日志、获取配置文件等场景。私有文件需签名验证，签名通过URL参数传递。支持各种文件类型的下载响应。
* @summary 下载本地文件
* @param {string} [bodyParam.filePath] 文件的路径
* @param {string} [bodyParam.sign] 签名.如果是私有的需要填此参数
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1SystemCommonDownloadFile (bodyParam: { filePath: string; sign?: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/download-file`;
        if ((bodyParam as Record<string, unknown>)['filePath'] !== undefined) {
            localVarQueryParameter['filePath'] = (bodyParam as Record<string, unknown>)['filePath'];
        }
        if ((bodyParam as Record<string, unknown>)['sign'] !== undefined) {
            localVarQueryParameter['sign'] = (bodyParam as Record<string, unknown>)['sign'];
        }
    return requestClient.get<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：流式代理返回本站对象存储公开桶/临时桶中的文件，用于浏览器跨域拉取文件字节受限的场景（如大屏 CAD 渲染器 fetch COS 文件被 CORS 拦截）。仅接受当前环境配置的公开桶/临时桶 URL，私有桶与任意外部 URL 一律拒绝，无 SSRF 面。需登录。
* @summary 对象存储文件代理
* @param {string} [bodyParam.url] 文件完整地址（仅限本站对象存储公开桶/临时桶 URL）
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1SystemCommonFileProxy (bodyParam: { url: string; [key: string]: unknown }, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/file-proxy`;
        if ((bodyParam as Record<string, unknown>)['url'] !== undefined) {
            localVarQueryParameter['url'] = (bodyParam as Record<string, unknown>)['url'];
        }
    return requestClient.get<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：建立WebSocket长连接用于实时消息推送。连接建立后自动订阅用户通知频道，支持接收告警推送、系统通知、实时数据更新等消息。适用于监控大屏、实时状态展示、即时通知等场景。
* @summary websocket连接
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  getApiV1SystemCommonWebsocketConnect (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/websocket/connect`;
    return requestClient.get<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：一次请求调用多个API接口并聚合返回结果。用于前端页面初始化时减少请求次数、仪表盘数据聚合加载等场景。支持并行请求提升响应速度，减少网络往返开销。
* @summary 批量聚合接口请求
* @param {ApiBatchAggReq} apiBatchAggReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonApiBatchAgg (
apiBatchAggReq: ApiBatchAggReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/api/batch-agg`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonApiBatchAgg200Response>>(localVarPath, apiBatchAggReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：开发调试专用接口，返回请求URI、Headers、Body等完整信息。用于API调试、中间件验证、请求格式检查等开发场景。生产环境建议禁用或限制访问。
* @summary 调试接口POST
* @param {Record<string, any>} [bodyParam] 请求体
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonDebug (bodyParam?: Record<string, any>, config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/debug`;
    return requestClient.post<ExtractDataType<GetApiV1SystemCommonDebug200Response>>(localVarPath, bodyParam, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：系统未初始化时的文件上传接口（无需登录）。用于初始化流程上传Logo等OEM定制资源。初始化完成后此接口禁用，应使用标准upload-file接口。该接口继续禁止上传svg。
* @summary 初始化上传文件
* @param {PostApiV1SystemCommonInitUploadFileRequest} postApiV1SystemCommonInitUploadFileRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonInitUploadFile (
postApiV1SystemCommonInitUploadFileRequest?: PostApiV1SystemCommonInitUploadFileRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/init-upload-file`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonInitUploadFile200Response>>(localVarPath, postApiV1SystemCommonInitUploadFileRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：登录用户读取当前启用地图的浏览器公开参数和同源代理地址，不返回安全密钥；每次进入地图按运行配置生效。
* @summary 读取业务地图运行配置
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonMapRuntime (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/map/runtime`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonMapRuntime200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：网络时间协议接口，用于客户端与服务器时间同步。返回设备发送时间、服务器接收时间、服务器发送时间，客户端可据此计算网络延迟并校正本地时钟。适用于物联网设备时间校准、分布式系统时钟同步。
* @summary ntp时间同步
* @param {NtpGetOneReq} ntpGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonNtpGetOne (
ntpGetOneReq: NtpGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/ntp/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonNtpGetOne200Response>>(localVarPath, ntpGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：生成微信小程序二维码图片。用于扫码进入指定页面、设备绑定二维码、分享推广等场景。支持指定页面路径、场景参数、环境版本（开发/体验/正式）。返回二维码图片Buffer数据。
* @summary 获取小程序二维码
* @param {QRCodeGetOneReq} qRCodeGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonQrCodeGetOne (
qRCodeGetOneReq: QRCodeGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/qr-code/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonQrCodeGetOne200Response>>(localVarPath, qRCodeGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：公开接口获取系统基础配置（OEM定制信息）。用于登录页、注册页在未登录状态下展示Logo、标题、页脚等。不返回敏感配置，仅返回用户可见的界面定制信息。
* @summary 读取系统配置信息(无需登录)
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonSysConfigCoreGetOne (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/sys-config/core/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonSysConfigCoreGetOne200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员查询系统全局配置详情。返回完整配置包括OEM、短信、邮件、地图、天气、用户策略等。用于配置管理页面展示和编辑初始化。敏感信息（如短信密钥）仅平台超管可见。
* @summary 读取系统配置信息
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonSysConfigInfoGetOne (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/sys-config/info/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonSysConfigCoreGetOne200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员修改系统全局配置。包括OEM定制（Logo/标题/页脚）、短信配置、邮件配置、地图配置、天气配置等。修改后立即生效，影响所有租户用户体验。
* @summary 更新系统配置信息
* @param {SysConfigInfo} sysConfigInfo
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonSysConfigInfoUpdate (
sysConfigInfo: SysConfigInfo,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/sys-config/info/update`;
    return requestClient.post<ExtractDataType<PostApiV1SystemAgreementDelete200Response>>(localVarPath, sysConfigInfo, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：平台管理员生成新的RS256签名私钥（RSA-2048，PKCS8 PEM格式），用于OIDC/OAuth2 Provider签发ID Token。生成结果返回给前端填入表单，点击保存后生效。生成新密钥后，使用旧密钥签发的ID Token将失效，接入方需重新获取公钥。
* @summary 生成OAuth Provider RSA私钥
* @param {object} body
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonSysConfigOauthKeyGenerate (
body: object,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/sys-config/oauth/key/generate`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonSysConfigOauthKeyGenerate200Response>>(localVarPath, body, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：系统首次部署时的初始化接口。创建平台超级管理员用户、平台租户、默认角色（admin/client/supper）、写入OEM配置。仅在sys_user_info表为空时可执行，已初始化系统调用会报错。
* @summary 初始化系统
* @param {SystemInitReq} systemInitReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonSystemInit (
systemInitReq: SystemInitReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/system/init`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonSystemInit200Response>>(localVarPath, systemInitReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从钉钉、企业微信等第三方平台获取部门列表。用于部门同步、组织架构导入等场景。支持按父节点筛选获取下级部门，实现递归同步完整组织架构。
* @summary 获取第三方部门列表
* @param {ThirdDeptInfoGetListReq} thirdDeptInfoGetListReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonThirdDeptGetList (
thirdDeptInfoGetListReq: ThirdDeptInfoGetListReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/third/dept/get-list`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonThirdDeptGetList200Response>>(localVarPath, thirdDeptInfoGetListReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：从钉钉、企业微信等第三方平台获取单个部门信息。用于部门同步、组织架构对接等场景。Children只返回一层，需递归调用获取完整树结构。支持获取父级和子级部门。
* @summary 获取第三方部门详情
* @param {ThirdDeptInfoGetOneReq} thirdDeptInfoGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonThirdDeptGetOne (
thirdDeptInfoGetOneReq: ThirdDeptInfoGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/third/dept/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonThirdDeptGetOne200Response>>(localVarPath, thirdDeptInfoGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：通过multipart/formdata直接上传文件。isPublic=false走临时桶返回临时路径；isPublic=true走公开桶返回永久fileUrl。公开桶需传business(业务)、scene(场景)、useBy(用途)。useBy=user路径前缀user/{userID}；useBy=tenant需租户管理员权限路径前缀tenant/{tenantCode}；useBy=platform需平台管理员权限路径前缀platform/。禁止上传html/php/jsp等危险文件。
* @summary 文件直传
* @param {PostApiV1SystemCommonInitUploadFileRequest} postApiV1SystemCommonInitUploadFileRequest
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonUploadFile (
postApiV1SystemCommonInitUploadFileRequest?: PostApiV1SystemCommonInitUploadFileRequest,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/upload-file`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonInitUploadFile200Response>>(localVarPath, postApiV1SystemCommonInitUploadFileRequest, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：生成OSS预签名上传URL，用于前端直传文件场景。返回uploadUri供前端PUT上传，filePath用于后续关联业务。支持文件重命名、公开/私有桶选择等配置。
* @summary 获取文件上传地址
* @param {UploadUrlCreateReq} uploadUrlCreateReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonUploadUrlCreate (
uploadUrlCreateReq: UploadUrlCreateReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/upload-url/create`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonUploadUrlCreate200Response>>(localVarPath, uploadUrlCreateReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
* 业务说明：根据地理位置或项目ID获取实时天气和空气质量数据。用于物联网设备环境展示、户外作业提醒、能耗分析辅助等场景。数据来源于配置的天气API服务。
* @summary 获取天气情况
* @param {WeatherGetOneReq} weatherGetOneReq
* @param {RequestClientConfig} [config] Override http request option.
*/
export async function  postApiV1SystemCommonWeatherGetOne (
weatherGetOneReq: WeatherGetOneReq,
 config?: RequestClientConfig) {
    const localVarQueryParameter: Record<string, unknown> = {};
    const localVarHeaderParameter: Record<string, string> = {};
    const localVarPath = `/api/v1/system/common/weather/get-one`;
    return requestClient.post<ExtractDataType<PostApiV1SystemCommonWeatherGetOne200Response>>(localVarPath, weatherGetOneReq, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));
}
/**
 * Request parameters for aMapServiceVersionServiceOperation operation in SystemCommonApi.
 */
export interface SystemCommonApiAMapServiceVersionServiceOperationRequest {
    /**
     *  白名单版本
     */
    readonly version: string

    /**
     *  白名单服务
     */
    readonly service: string

    /**
     *  白名单操作
     */
    readonly operation: string
}

/**
 * Request parameters for getApiV1SystemCommonDownloadFile operation in SystemCommonApi.
 */
export interface SystemCommonApiGetApiV1SystemCommonDownloadFileRequest {
    /**
     * 文件的路径
     */
    readonly filePath: string

    /**
     * 签名.如果是私有的需要填此参数
     */
    readonly sign?: string
}

/**
 * Request parameters for getApiV1SystemCommonFileProxy operation in SystemCommonApi.
 */
export interface SystemCommonApiGetApiV1SystemCommonFileProxyRequest {
    /**
     * 文件完整地址（仅限本站对象存储公开桶/临时桶 URL）
     */
    readonly url: string
}

/**
 * Request parameters for postApiV1SystemCommonApiBatchAgg operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonApiBatchAggRequest {
    readonly apiBatchAggReq: ApiBatchAggReq
}

/**
 * Request parameters for postApiV1SystemCommonInitUploadFile operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonInitUploadFileRequest {
    readonly postApiV1SystemCommonInitUploadFileRequest?: PostApiV1SystemCommonInitUploadFileRequest
}

/**
 * Request parameters for postApiV1SystemCommonMapRuntime operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonMapRuntimeRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1SystemCommonNtpGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonNtpGetOneRequest {
    readonly ntpGetOneReq: NtpGetOneReq
}

/**
 * Request parameters for postApiV1SystemCommonQrCodeGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonQrCodeGetOneRequest {
    readonly qRCodeGetOneReq: QRCodeGetOneReq
}

/**
 * Request parameters for postApiV1SystemCommonSysConfigCoreGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonSysConfigCoreGetOneRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1SystemCommonSysConfigInfoGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonSysConfigInfoGetOneRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1SystemCommonSysConfigInfoUpdate operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonSysConfigInfoUpdateRequest {
    readonly sysConfigInfo: SysConfigInfo
}

/**
 * Request parameters for postApiV1SystemCommonSysConfigOauthKeyGenerate operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonSysConfigOauthKeyGenerateRequest {
    readonly body: object
}

/**
 * Request parameters for postApiV1SystemCommonSystemInit operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonSystemInitRequest {
    readonly systemInitReq: SystemInitReq
}

/**
 * Request parameters for postApiV1SystemCommonThirdDeptGetList operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonThirdDeptGetListRequest {
    readonly thirdDeptInfoGetListReq: ThirdDeptInfoGetListReq
}

/**
 * Request parameters for postApiV1SystemCommonThirdDeptGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonThirdDeptGetOneRequest {
    readonly thirdDeptInfoGetOneReq: ThirdDeptInfoGetOneReq
}

/**
 * Request parameters for postApiV1SystemCommonUploadFile operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonUploadFileRequest {
    readonly postApiV1SystemCommonInitUploadFileRequest?: PostApiV1SystemCommonInitUploadFileRequest
}

/**
 * Request parameters for postApiV1SystemCommonUploadUrlCreate operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonUploadUrlCreateRequest {
    readonly uploadUrlCreateReq: UploadUrlCreateReq
}

/**
 * Request parameters for postApiV1SystemCommonWeatherGetOne operation in SystemCommonApi.
 */
export interface SystemCommonApiPostApiV1SystemCommonWeatherGetOneRequest {
    readonly weatherGetOneReq: WeatherGetOneReq
}
