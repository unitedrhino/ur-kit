import { ThingsApi } from '@vben/api';

function getProjectSceneRequestOptions(projectId?: null | string) {
  const normalizedProjectId = String(projectId ?? '').trim();
  if (!normalizedProjectId) return undefined;

  return {
    headers: {
      'project-id': normalizedProjectId,
    },
  };
}

export const Api = {
  /** 获取场景列表 */
  async list(page: number, pageSize: number, formValues: any, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoGetList(
      {
        page: { page, size: pageSize },
        ...formValues,
      },
      getProjectSceneRequestOptions(projectId),
    );
  },

  /** 获取场景详情 */
  async read(id: string, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoGetOne({ id }, getProjectSceneRequestOptions(projectId));
  },

  /** 新增场景 */
  async create(data: any, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoCreate(data, getProjectSceneRequestOptions(projectId));
  },

  /** 更新场景 */
  async update(data: any, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoUpdate(data, getProjectSceneRequestOptions(projectId));
  },

  /** 删除场景 */
  async delete(id: string, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoDelete({ id }, getProjectSceneRequestOptions(projectId));
  },

  /** 手动触发场景 */
  async manuallyTrigger(id: string, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoManuallyTrigger({ id }, getProjectSceneRequestOptions(projectId));
  },

  /** 获取场景日志列表 */
  async logIndex(params: any, projectId?: string) {
    return await ThingsApi.postApiV1ThingsSceneLogGetList(params, getProjectSceneRequestOptions(projectId));
  },

  /** 获取设备列表 */
  async deviceIndex(params: any) {
    return await ThingsApi.postApiV1ThingsDeviceInfoGetList(params);
  },

  /** 获取设备物模型 */
  async deviceSchemaIndex(params: any) {
    return await ThingsApi.postApiV1ThingsDeviceSchemaGetList(params);
  },

  /** 获取产品物模型 */
  async productSchemaIndex(params: any) {
    return await ThingsApi.postApiV1ThingsProductSchemaGetList(params);
  },
};
