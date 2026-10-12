export interface ApiError extends Error {
  code?: number | string;
  msg?: string;
  response?: {
    data?: {
      code?: number | string;
      message?: string;
      msg?: string;
    };
    status?: number;
  };
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    return error as ApiError;
  }

  if (typeof error === 'object' && error !== null) {
    return error as ApiError;
  }

  return new Error(String(error)) as ApiError;
}

export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  const normalized = normalizeError(error);
  return normalized.msg || normalized.response?.data?.msg || normalized.message || normalized.response?.data?.message || fallback;
}

export function getFriendlyErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  const normalized = normalizeError(error);
  const message = getErrorMessage(error, fallback);
  const status = normalized.response?.status;
  const code = normalized.code || normalized.response?.data?.code;

  if (status === 401 || status === 403) {
    return '登录状态已失效，请重新登录后重试';
  }

  if (status === 404) {
    return '请求的资源不存在或已被删除';
  }

  if (typeof status === 'number' && status >= 500) {
    return '服务暂时不可用，请稍后重试';
  }

  if (typeof code === 'number' && code >= 500) {
    return '服务暂时不可用，请稍后重试';
  }

  if (/timeout|超时/i.test(message)) {
    return '请求超时，请稍后重试';
  }

  if (/network|failed to fetch|网络/i.test(message)) {
    return '网络异常，请检查连接后重试';
  }

  if (/sql|语法|schema|参数|config|配置|连接/i.test(message)) {
    return '请求配置有误，请检查后重试';
  }

  return fallback;
}

export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
