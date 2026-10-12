import type { UserInfo } from '@vben/types';

import { requestClient } from '../request';

/**
 * 获取用户信息
 *
 * 注意：推荐使用 authStore.fetchUserInfo() 来获取用户信息，
 * 因为它提供了缓存机制，可以避免重复请求。
 *
 * @example
 * ```ts
 * import { useAuthStore } from '@/store/auth';
 *
 * const authStore = useAuthStore();
 * const userInfo = await authStore.fetchUserInfo(); // 使用缓存
 * ```
 */
export async function getUserInfoApi() {
  return requestClient.post<UserInfo>('/api/v1/system/user/self/get-one', {
    withRoles: true,
    withTenant: true,
    // withMenus: true,
    // withProjects:true
  });
}
