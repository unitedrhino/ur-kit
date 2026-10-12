import type { RequestClientConfig } from '@vben/request';

import { RequestClient } from '@vben/request';

export let requestClient = new RequestClient({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

/** 与 openapi-generator axios 模板中数组 query 的 join 分隔符一致 */
export const COLLECTION_FORMATS: Record<string, string> = {
  csv: ',',
  ssv: '%20',
  tsv: '%09',
  pipes: '|',
  multi: '&',
};

/**
 * 将 query / header 合并进 axios config（生成代码使用）。
 * 未传或空对象时原样返回 config。
 */
export function mergeApiConfig(
  config: RequestClientConfig | undefined,
  query?: Record<string, unknown>,
  headers?: Record<string, string>,
): RequestClientConfig | undefined {
  const q = query && Object.keys(query).length > 0 ? query : undefined;
  const h = headers && Object.keys(headers).length > 0 ? headers : undefined;
  if (!q && !h) {
    return config;
  }
  const next: RequestClientConfig = { ...config };
  if (q) {
    const prev =
      config?.params && typeof config.params === 'object' && !Array.isArray(config.params)
        ? (config.params as Record<string, unknown>)
        : {};
    next.params = { ...prev, ...q };
  }
  if (h) {
    next.headers = { ...(config?.headers as Record<string, string>), ...h };
  }
  return next;
}

// 提供设置 RequestClient 的方法，供具体项目使用
export function setRequestClient(client: RequestClient) {
  requestClient = client;
}

// 提供获取当前 RequestClient 的方法
export function getRequestClient(): RequestClient {
  return requestClient;
}
