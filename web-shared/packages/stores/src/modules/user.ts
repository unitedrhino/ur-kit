import { acceptHMRUpdate, defineStore } from 'pinia';

function normalizeRoleCodes(roles: any[] = []) {
  return roles
    .map((item: any) => {
      if (typeof item === 'string') return item;
      return item?.code ?? item?.role?.code ?? '';
    })
    .filter(Boolean);
}

function extractTenantRoleCodes(userInfo: BasicUserInfo | null, tenantCode?: string) {
  if (!userInfo) return [];

  const directRoles = normalizeRoleCodes(userInfo.roles ?? []);
  if (directRoles.length > 0) {
    return directRoles;
  }
  if (!tenantCode) {
    return [];
  }

  const tenant = (userInfo.tenants ?? []).find((item: any) => item?.tenantCode === tenantCode);
  return normalizeRoleCodes(tenant?.roles ?? []);
}

interface BasicUserInfo {
  [key: string]: any;
  /**
   * 头像
   */
  avatar: string;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 用户角色
   */
  // roles?: string[];
  /**
   * 用户id
   */
  userID: string;
  /**
   * 用户名
   */
  userName: string;
}

interface AccessState {
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;
  /**
   * 用户角色
   */
  userRoles: string[];
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null, tenantCode?: string) {
      // 设置用户信息
      this.userInfo = userInfo;
      this.setUserRoles(extractTenantRoleCodes(userInfo, tenantCode));
    },
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
    syncUserRolesByTenant(tenantCode?: string) {
      this.setUserRoles(extractTenantRoleCodes(this.userInfo, tenantCode));
    },
  },
  persist: {
    // 持久化用户信息和角色
    pick: ['userInfo', 'userRoles'],
  },
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
