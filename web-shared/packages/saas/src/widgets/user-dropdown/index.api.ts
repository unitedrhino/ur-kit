import { CoreApi } from '@vben/api';

export const Api = {
  /**
   * 获取用户所处的租户列表
   * /api/v1/system/user/self/tenant/get-list
   */
  async getTenantList() {
    return await CoreApi.postApiV1SystemUserSelfTenantGetList({
      // userID: userID,
      withRole: true, // 不需要角色信息
    });
  },
};
