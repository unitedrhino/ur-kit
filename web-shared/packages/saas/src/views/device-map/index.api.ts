import { ThingsApi } from '@vben/api';

function getProjectRequestOptions(projectID?: null | string) {
  const normalizedProjectID = String(projectID ?? '').trim();
  if (!normalizedProjectID) return undefined;
  return {
    headers: {
      'project-id': normalizedProjectID,
    },
  };
}

function extractList<T>(resp: unknown): T[] {
  const r = resp as any;
  return r?.list ?? r?.data?.list ?? r?.data?.data?.list ?? [];
}

export const ProjectDeviceMapApi = {
  async listAreas(projectID: string) {
    const res = await ThingsApi.postApiV1ThingsAreaInfoGetList(
      {
        page: {
          page: 1,
          size: 500,
          orders: [
            { field: 'sort', sort: 1 },
            { field: 'areaName', sort: 1 },
          ],
        },
        projectID,
      } as any,
      getProjectRequestOptions(projectID),
    );
    return extractList<ThingsApi.AreaInfo>(res);
  },

  async listDevices(areaID: string, projectID: string) {
    const res = await ThingsApi.postApiV1ThingsDeviceInfoGetList(
      {
        areaID,
        page: { page: 1, size: 1000 },
        withArea: true,
        withProperties: [],
      },
      getProjectRequestOptions(projectID),
    );
    return extractList<ThingsApi.DeviceInfo>(res);
  },

  async listControlSchemas(productID: string, deviceName: string, projectID: string) {
    const res = await ThingsApi.postApiV1ThingsDeviceSchemaGetList(
      {
        deviceName,
        funcGroup: 1,
        page: { page: 1, size: 500 },
        productID,
        propertyMode: 'rw',
        type: 1,
        withProductSchema: true,
      },
      getProjectRequestOptions(projectID),
    );
    return extractList<ThingsApi.DeviceSchema>(res);
  },

  async readDevice(productID: string, deviceName: string, projectID: string) {
    return await ThingsApi.postApiV1ThingsDeviceInfoGetOne(
      {
        deviceName,
        productID,
        propertyIgnoreEmpty: true,
        withArea: true,
        withGateway: true,
        withProperties: [],
      } as any,
      getProjectRequestOptions(projectID),
    );
  },

  async readProfile(areaID: string, code: string, projectID: string) {
    return await ThingsApi.postApiV1ThingsAreaProfileGetOne(
      { areaID, code },
      getProjectRequestOptions(projectID),
    );
  },

  async sendPropertyControl(params: {
    data: Record<string, unknown>;
    deviceName: string;
    productID: string;
    projectID: string;
  }) {
    return await ThingsApi.postApiV1ThingsDeviceInteractPropertyControlSend(
      {
        data: JSON.stringify(params.data),
        deviceName: params.deviceName,
        productID: params.productID,
        shadowControl: 0,
      },
      getProjectRequestOptions(params.projectID),
    );
  },

  async updateProfile(areaID: string, code: string, params: string, projectID: string) {
    return await ThingsApi.postApiV1ThingsAreaProfileUpdate(
      { areaID, code, params },
      getProjectRequestOptions(projectID),
    );
  },
};

export { getProjectRequestOptions as getProjectDeviceMapRequestOptions };
