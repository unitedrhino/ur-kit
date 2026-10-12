import { requestClient } from './request';

/**
 * 获取当前登录用户的全部权限码（resource:action 格式）
 * 供各应用路由守卫中调用，结果存入 accessStore.setAccessCodes()
 */
export async function fetchUserAccessCodes(): Promise<string[]> {
  try {
    const resp = await requestClient.post<{
      list: Array<{ resource: string; action: string }>;
    }>('/api/v1/system/user/self/resource/action/get-list', {});
    return (resp.list ?? []).map((item) => `${item.resource}:${item.action}`);
  } catch {
    return [];
  }
}
