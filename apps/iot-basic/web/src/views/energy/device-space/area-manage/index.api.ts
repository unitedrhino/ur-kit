import { ThingsApi } from '@vben/api';

export const Api = {
  /**
   * 获取当前项目的区域列表（树形）
   */
  async list(projectID: string) {
    return await ThingsApi.postApiV1ThingsAreaInfoGetList(
      { page: { page: 1, size: 500, orders: [{ field: 'sort', sort: 1 }, { field: 'areaName', sort: 1 }] }, projectID },
      { headers: { 'project-id': projectID } },
    );
  },

  /**
   * 创建区域
   */
  async create(data: ThingsApi.AreaInfo) {
    return await ThingsApi.postApiV1ThingsAreaInfoCreate(
      data,
      data.projectID ? { headers: { 'project-id': data.projectID } } : undefined,
    );
  },

  /**
   * 更新区域
   */
  async update(data: ThingsApi.AreaInfo) {
    return await ThingsApi.postApiV1ThingsAreaInfoUpdate(
      data,
      data.projectID ? { headers: { 'project-id': data.projectID } } : undefined,
    );
  },

  /**
   * 删除区域
   */
  async delete(areaID: string, projectID?: string) {
    return await ThingsApi.postApiV1ThingsAreaInfoDelete(
      { areaID },
      projectID ? { headers: { 'project-id': projectID } } : undefined,
    );
  },

  /**
   * 获取设备列表（区域设备弹窗用）
   */
  async getDevicesList(page: number, pageSize: number, formValues: any) {
    return await ThingsApi.postApiV1ThingsDeviceInfoGetList({
      page: { page, size: pageSize },
      ...formValues,
    });
  },

  /**
   * 批量更新设备区域（添加/解绑设备到区域）
   */
  async batchUpdateDevices(devices: ThingsApi.DeviceCore[], areaID: string) {
    return await ThingsApi.postApiV1ThingsDeviceInfoBatchUpdate({
      devices,
      areaID,
    });
  },

  /**
   * 获取分组列表（按区域过滤）
   */
  async getGroupList(page: number, pageSize: number, formValues: any) {
    return await ThingsApi.postApiV1ThingsGroupInfoGetList({
      page: { page, size: pageSize },
      ...formValues,
    });
  },

  /**
   * 创建分组
   */
  async createGroup(data: ThingsApi.GroupInfo) {
    return await ThingsApi.postApiV1ThingsGroupInfoCreate(data);
  },

  /**
   * 更新分组
   */
  async updateGroup(data: ThingsApi.GroupInfo) {
    return await ThingsApi.postApiV1ThingsGroupInfoUpdate(data);
  },

  /**
   * 删除分组
   */
  async deleteGroup(id: string) {
    return await ThingsApi.postApiV1ThingsGroupInfoDelete({ id });
  },
};
