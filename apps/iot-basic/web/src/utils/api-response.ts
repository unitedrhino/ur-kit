/**
 * 从 API 响应中提取 list 数组。
 * 兼容不同层级的响应结构：
 * - unwrapped: { list: [...] }
 * - body (JSON): { code, msg, data: { list: [...] } }
 * - raw AxiosResponse: { data: { code, msg, data: { list: [...] } } }
 */
export function extractList<T = any>(resp: unknown): T[] {
  const r = resp as any;
  return r?.list ?? r?.data?.list ?? r?.data?.data?.list ?? [];
}
