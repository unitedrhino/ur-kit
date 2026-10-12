import { config } from '../config';
import { logger, type HttpLogMeta } from './logger';
import { getRequestContext } from './request-context';
import { eventBus } from './event-bus';
import { localStorage } from '../data/datasources/local-storage.datasource';

interface RequestOptions {
  /** omitProjectContext 用于查询本人跨项目成员资格，避免旧选中项目限制列表。 */
  omitProjectContext?: boolean;
  url: string;
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  timeout?: number;
  /** baseUrl 用于覆盖默认 apiBaseUrl，用于某些公开接口需要独立域名的场景。 */
  baseUrl?: string;
  /** expectedApiCodes 表示调用方会作为业务分支处理的错误码，不作为异常上报。 */
  expectedApiCodes?: number[];
  /** expectedApiErrors 表示调用方会按 code + message 精确处理的错误，不作为异常上报。 */
  expectedApiErrors?: ExpectedApiErrorMatcher[];
}

interface ExpectedApiErrorMatcher {
  code: number;
  /** message 用于收窄同一业务码下的可预期错误，避免吞掉真正异常。 */
  message?: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 业务接口错误：携带后端返回的业务 code，便于上层按 code 分支处理（例如配网绑定的 2000007）。
 */
export class ApiError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** 判断 unknown 是否为携带 code 的 ApiError。 */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function isApiResponse<T = unknown>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Record<string, unknown>;
  // 只要求 code 为数字即可（错误响应可能不含 data 字段，不应吞掉真实错误信息）
  return typeof payload.code === 'number';
}

/** describeValueType 返回适合日志记录的值类型名称，不展开具体响应内容。 */
function describeValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** getHeaderValue 按大小写不敏感方式读取响应头字段。 */
function getHeaderValue(headers: unknown, key: string): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined;
  const lowerKey = key.toLowerCase();
  const matched = Object.entries(headers as Record<string, unknown>).find(([name]) => name.toLowerCase() === lowerKey);
  const value = matched?.[1];
  return typeof value === 'string' ? value : undefined;
}

/** summarizeUnexpectedResponse 只记录响应形态，不记录响应正文，便于定位非业务 JSON 响应。 */
function summarizeUnexpectedResponse(value: unknown, headers: unknown): Partial<HttpLogMeta> {
  const responseType = describeValueType(value);
  const summary: Partial<HttpLogMeta> = {
    contentType: getHeaderValue(headers, 'content-type'),
    responseType,
  };

  if (Array.isArray(value)) {
    summary.responseLength = value.length;
    return summary;
  }

  if (value && typeof value === 'object') {
    const payload = value as Record<string, unknown>;
    summary.responseKeys = Object.keys(payload).slice(0, 20);
    summary.responseCodeType = describeValueType(payload.code);
    summary.responseMsgType = describeValueType(payload.msg);
    summary.responseDataType = describeValueType(payload.data);
  }

  if (typeof value === 'string') {
    summary.responseLength = value.length;
  }

  return summary;
}

/** 获取本地存储的 token */
function getToken(): string {
  return uni.getStorageSync('token') || '';
}

const LOGIN_URL = '/packageUser/pages/login/index';
const LOGIN_PATH = 'packageUser/pages/login/index';

/** 防止并发 401 触发多次跳转 */
let redirectingToLogin = false;
let requestSequence = 0;

/** confirmsAuthenticatedSession 判断接口成功是否足以证明本地 token 仍被服务端接受。 */
function confirmsAuthenticatedSession(url: string): boolean {
  return url.startsWith('/api/v1/things/')
    || url === '/api/v1/system/user/self/get-one'
    || url === '/api/v1/system/user/self/refresh-token'
    || url === '/api/v1/system/user/self/update'
    || url === '/api/v1/system/user/self/bind-account'
    || url === '/api/v1/system/user/self/change-pwd';
}

/** createRequestId 生成前端请求编号，用于关联本地日志和 调试事件。 */
function createRequestId(): string {
  requestSequence += 1;
  return `m-${Date.now().toString(36)}-${requestSequence.toString(36)}`;
}

/** 当前是否已经在登录页 */
function isOnLoginPage(): boolean {
  try {
    const pages = getCurrentPages();
    if (!pages || pages.length === 0) return false;
    const top = pages[pages.length - 1];
    // route 形如 'packageUser/pages/login/index'
    return !!top && (top as { route?: string }).route === LOGIN_PATH;
  } catch {
    return false;
  }
}

/**
 * 处理登录态失效（HTTP 401）。
 * - hadToken=true 表示请求时本地存在 token，属于"登录失效"，需要清凭据并跳登录页；
 * - hadToken=false 表示游客浏览阶段，后端拒绝是预期行为，不跳登录、不打扰用户。
 */
function handleTokenExpired(hadToken: boolean): void {
  uni.removeStorageSync('token');
  uni.removeStorageSync('user');
  localStorage.remove('user');
  if (!hadToken) return;
  eventBus.emit('auth:token-expired');
  if (redirectingToLogin) return;
  if (isOnLoginPage()) return;
  redirectingToLogin = true;
  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
  uni.redirectTo({
    url: LOGIN_URL,
    complete: () => {
      redirectingToLogin = false;
    },
  });
}

function recordRequestBreadcrumb(message: string, level: 'info' | 'warn' | 'error', meta: HttpLogMeta): void {
  logger.addBreadcrumb({
    category: 'http',
    message,
    level,
    data: meta,
  });
}

function recordRequestSuccess(meta: HttpLogMeta): void {
  recordRequestBreadcrumb('request success', 'info', meta);
  logger.info('http', 'request:success', meta);
}

function recordRequestFailure(error: Error, meta: HttpLogMeta): void {
  const errorMeta = {
    ...meta,
    errorName: error.name,
    errorMessage: error.message,
  };
  recordRequestBreadcrumb('request failure', 'error', meta);
  logger.warn('http', 'request:failure', errorMeta);
  logger.captureException(error, {
    tags: {
      requestId: meta.requestId,
      endpoint: meta.url,
      apiCode: meta.apiCode,
      statusCode: meta.statusCode,
    },
    extra: errorMeta,
  });
}

function isExpectedApiCode(code: number, expectedApiCodes?: number[]): boolean {
  return !!expectedApiCodes?.includes(code);
}

/** isExpectedApiError 判断业务错误是否由调用方显式声明为可预期分支。 */
function isExpectedApiError(
  error: ApiError,
  expectedApiCodes?: number[],
  expectedApiErrors?: ExpectedApiErrorMatcher[],
): boolean {
  if (isExpectedApiCode(error.code, expectedApiCodes)) {
    return true;
  }
  return !!expectedApiErrors?.some((matcher) => {
    if (matcher.code !== error.code) return false;
    if (!matcher.message) return true;
    return error.message.includes(matcher.message);
  });
}

function recordExpectedApiResponse(error: Error, meta: HttpLogMeta): void {
  const errorMeta = {
    ...meta,
    errorName: error.name,
    errorMessage: error.message,
  };
  recordRequestBreadcrumb('request expected api response', 'info', meta);
  logger.info('http', 'request:expected-api-response', errorMeta);
}

/**
 * 统一 HTTP 请求封装
 * - 所有接口均使用 POST
 * - 自动注入 token / app-id 头
 * - 统一错误码处理
 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const token = getToken();
  const requestId = createRequestId();
  const startTime = Date.now();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    'app-id': config.appId,
    ...options.header,
  };
  if (token) {
    header['token'] = token;
  }
  const { tenantCode, projectID } = getRequestContext();
  if (tenantCode) {
    header['ithings-tenant-code'] = tenantCode;
  }
  // C 端使用：除登录/租户列表等启动期接口外，业务接口都需要 project-id（家庭/项目）。
  // 当前选中的家庭由 currentFamilyProvider 维护；未选中时不带，由后端按需校验。
  if (projectID && !options.omitProjectContext) {
    header['ithings-project-id'] = projectID;
  }
  const baseMeta: HttpLogMeta = {
    requestId,
    url: options.url,
    method: 'POST',
    hasToken: !!token,
    tenantCode: tenantCode || undefined,
    projectID: projectID || undefined,
  };
  logger.debug('http', 'request:start', baseMeta);
  recordRequestBreadcrumb('request start', 'info', baseMeta);

  return new Promise((resolve, reject) => {
    const requestBaseUrl = options.baseUrl || config.apiBaseUrl;
    uni.request({
      url: `${requestBaseUrl}${options.url}`,
      method: 'POST',
      data: options.data || {},
      header,
      timeout: options.timeout || 30000,
      success(res) {
        // 仅以 HTTP 401 作为强制登出信号；业务码（包括 1000007 未登录）不触发登出，
        // 仅把 msg 透传给调用方，由业务自行决定提示/降级。
        if (res.statusCode === 401) {
          // 区分"游客浏览"与"登录失效"：
          // - 请求时本地无 token：游客模式，不跳登录，由调用方按需降级；
          // - 请求时本地有 token：会话失效，清凭据并跳登录页。
          const hadToken = !!token;
          handleTokenExpired(hadToken);
          const error = new Error(hadToken ? '登录已过期，请重新登录' : '请先登录');
          recordRequestFailure(error, {
            ...baseMeta,
            statusCode: res.statusCode,
            duration: Date.now() - startTime,
          });
          reject(error);
          return;
        }
        const respData = res.data;
        if (!isApiResponse<T>(respData)) {
          const error = new Error('响应数据格式错误，请稍后重试');
          recordRequestFailure(error, {
            ...baseMeta,
            statusCode: res.statusCode,
            duration: Date.now() - startTime,
            ...summarizeUnexpectedResponse(respData, res.header),
          });
          reject(error);
          return;
        }
        const resp = respData;
        if (resp.code === 200) {
          if (token && confirmsAuthenticatedSession(options.url)) {
            eventBus.emit('auth:token-confirmed', token);
          }
          recordRequestSuccess({
            ...baseMeta,
            statusCode: res.statusCode,
            apiCode: resp.code,
            duration: Date.now() - startTime,
          });
          resolve(resp.data);
          return;
        }
        const error = new ApiError(resp.code, resp.msg || `请求失败(${resp.code})`);
        const errorMeta = {
          ...baseMeta,
          statusCode: res.statusCode,
          apiCode: resp.code,
          duration: Date.now() - startTime,
        };
        const expectedByCode = isExpectedApiCode(resp.code, options.expectedApiCodes);
        if (expectedByCode || isExpectedApiError(error, options.expectedApiCodes, options.expectedApiErrors)) {
          recordExpectedApiResponse(error, errorMeta);
        } else {
          recordRequestFailure(error, errorMeta);
        }
        reject(error);
      },
      fail(err) {
        const error = new Error(err.errMsg || '网络请求失败');
        recordRequestFailure(error, {
          ...baseMeta,
          duration: Date.now() - startTime,
        });
        reject(error);
      },
    });
  });
}
