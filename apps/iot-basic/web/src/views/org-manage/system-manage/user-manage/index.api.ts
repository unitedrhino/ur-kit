import { CoreApi } from '@vben/api';

export const Api = {
  /**
   * 获取组织用户列表
   * api/v1/system/tenant/user/get-list
   */
  async list(page: number, pageSize: number, formValues: any) {
    return await CoreApi.postApiV1SystemTenantUserGetList({
      page: {
        page: page,
        size: pageSize,
      },
      ...formValues,
    });
  },

  /**
   * 更新组织用户
   * api/v1/system/tenant/user/update
   */
  async update(userID: string, data: CoreApi.UserTenant) {
    return await CoreApi.postApiV1SystemTenantUserUpdate({
      userID: userID,
      ...data,
    });
  },

  /**
   * 删除组织用户
   * api/v1/system/tenant/user/delete
   */
  async delete(userID: string) {
    return await CoreApi.postApiV1SystemTenantUserDelete({
      userID: userID,
    });
  },

  /**
   * 创建组织用户
   * api/v1/system/tenant/user/create
   */
  async create(data: CoreApi.TenantUserBatchCreateReq) {
    return await CoreApi.postApiV1SystemTenantUserBatchCreate(data);
  },


  /**
   * 批量添加用户加入组织
   * /api/v1/system/tenant/user/multiCreate
   */
  async multiCreate(data: CoreApi.TenantUserBatchCreateReq) {
    return await CoreApi.postApiV1SystemTenantUserBatchCreate(data);
  },

  /**
   * 精准搜索用户
   * /api/v1/system/user/self/user/search
   */
  async searchUser(account: string) {
    return await CoreApi.postApiV1SystemUserSelfUserSearch({
      account: account,
    });
  },
  /**
   * 获取组织用户详情,会同时返回所拥有的角色列表
   * /api/v1/system/tenant/user/get-one
   */
  async read(userID: string) {
    return await CoreApi.postApiV1SystemTenantUserGetOne({
      userID: userID,
    });
  },
};
