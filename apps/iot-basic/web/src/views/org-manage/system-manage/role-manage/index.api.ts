import { CoreApi } from '@vben/api';


export const Api = {
  /**
   * 获取角色列表
   * /api/v1/system/role/info/get-list
   */
  async list(page: number, pageSize: number, formValues: any) {
    return await CoreApi.postApiV1SystemRoleInfoGetList({
      page: {
        page: page,
        size: pageSize,
      },
      ...formValues,
    });
  },

  /**
   * 获取组织所有应用
   * /api/v1/system/tenant/app/get-list
   */
  async listTenantAllApps() {
    return await CoreApi.postApiV1SystemTenantAppGetList({
      useBy: 'admin',
      withApp: true});
  },

  /**
   * 更新APP权限
   * /api/v1/system/role/app/batch-update
   */
  async updateRoleApps(roleId: string, appIDs: string[]) {
    return await CoreApi.postApiV1SystemRoleAppBatchUpdate({
      id: roleId,
      appIDs: appIDs,
    });
  },

  /**
   * 获取APP权限列表
   * /api/v1/system/role/app/get-list
   */

  async listRoleApps(roleId: string) {
    return await CoreApi.postApiV1SystemRoleAppGetList({
      id: roleId,
    });
  },

  /**
   * 更新角色
   * /api/v1/system/role/info/update
   */
  async updateRole(data: CoreApi.RoleInfo) {
    return await CoreApi.postApiV1SystemRoleInfoUpdate(data);
  },

  /**
   * 创建角色
   * /api/v1/system/role/info/create
   */
  async createRole(data: CoreApi.RoleInfo) {
    return await CoreApi.postApiV1SystemRoleInfoCreate(data);
  },
}
