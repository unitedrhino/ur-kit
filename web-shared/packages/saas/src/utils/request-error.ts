/** 请求错误提示：保留服务端原因，并让请求层已处理的错误只提示一次。 */

import { $t } from '@vben/locales';

/** 已被请求层提示或交给登录、服务器错误流程处理的异常。 */
const handledErrors = new WeakSet<object>();

/** markRequestErrorHandled 标记异常已被请求层处理，不修改后端返回对象。 */
export function markRequestErrorHandled(error: unknown): void {
  if (error !== null && typeof error === 'object') handledErrors.add(error);
}

/** isRequestErrorHandled 判断异常是否已有提示；本地异常仍由页面负责提示。 */
export function isRequestErrorHandled(error: unknown): boolean {
  return error !== null && typeof error === 'object' && handledErrors.has(error);
}

/** getRequestErrorMessage 从响应或异常读取非空文字原因，缺失时使用调用方的多语言兜底。 */
export function getRequestErrorMessage(error: unknown, fallback: () => unknown): string {
  if (error !== null && typeof error === 'object') {
    const detail = error as { msg?: unknown; error?: unknown; message?: unknown; response?: { data?: { msg?: unknown; message?: unknown; error?: unknown } } };
    const data = detail.response?.data;
    for (const value of [data?.msg, data?.error, data?.message, detail.msg, detail.error, detail.message]) {
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  try {
    const value = fallback();
    return typeof value === 'string' && value.trim() ? value : $t('ui.fallback.http.internalServerError');
  } catch {
    // 页面历史兜底可能假定异常一定是 Error；未知异常不能再触发提示失败。
    return $t('ui.fallback.http.internalServerError');
  }
}

/** notifyRequestError 仅提示未处理的异常；延迟求值兜底，避免未知异常形态导致二次报错。 */
export function notifyRequestError(error: unknown, fallback: () => unknown, notify: (message: string) => unknown): void {
  if (isRequestErrorHandled(error)) return;
  notify(getRequestErrorMessage(error, fallback));
  markRequestErrorHandled(error);
}
