import { ThingsApi } from '@vben/api';

export const Api = {
  /**
   * 获取分组列表（一次性加载全部，用于树形展示）
   */
  async list(formValues?: any) {
    return await ThingsApi.postApiV1ThingsGroupInfoGetList({
      page: {
        page: 1,
        size: 500,
        orders: [{ field: 'name', sort: 1 }],
      },
      ...formValues,
    });
  },

  /**
   * 更新分组信息
   * /api/v1/things/group/info/update
   */
  async update(data: ThingsApi.GroupInfo) {
    return await ThingsApi.postApiV1ThingsGroupInfoUpdate({
      // groupID: id,
      // id: id,
      // ...(data.name ? { name: data.name } : {}),
      // ...(data.desc ? { desc: data.desc } : {}),

      // parentID: 1
      ...data,
    });
  },

  /**
   * 创建分组
   * /api/v1/things/group/info/create
   */
  async create(data: ThingsApi.GroupInfo) {
    return await ThingsApi.postApiV1ThingsGroupInfoCreate(data);
  },

  /**
   * 删除分组
   * /api/v1/things/group/info/delete
   */
  async delete(id: string) {
    return await ThingsApi.postApiV1ThingsGroupInfoDelete({
      id: id,
    });
  },

  /**
   * 获取分组详情信息
   * /api/v1/things/group/info/read
   */
  async groupInfoRead(id: string, data: ThingsApi.GroupInfo) {
    return await ThingsApi.postApiV1ThingsGroupInfoGetOne({
      id: id,
      ...data,
    });
  },


  /**
   * 获取待添加设备列表
   */
  async getAddDevicesList(page: number, pageSize: number, formValues: any) {
    return await ThingsApi.postApiV1ThingsDeviceInfoGetList({
      page: {
        page: page,
        size: pageSize,
      },
      ...formValues,
    });
  },


  /**
   * 添加分组设备
   * /api/v1/things/group/device/multi-create
   */
  async addGroupDevice(groupID: string, list: ThingsApi.DeviceCore[]) {
    return await ThingsApi.postApiV1ThingsGroupDeviceBatchCreate({
      groupID: groupID as any, //TODO: 后端后面还会改成 string  先number  后面再改
      list: list,
    });
  },

  /**
   * 删除分组设备
   */
  async deleteGroupDevice(groupID: string, list: ThingsApi.DeviceCore[]) {
    return await ThingsApi.postApiV1ThingsGroupDeviceBatchDelete({
      groupID: groupID,
      list: list,
    });
  },
};
