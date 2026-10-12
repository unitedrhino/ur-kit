import { ThingsApi } from '@vben/api';
import { ENERGY_PRODUCT_CATEGORY_CODE } from '#/utils/energy-constants';

export const Api = {
  async list(page: number, pageSize: number, formValues: any) {
    return await ThingsApi.postApiV1ThingsDeviceInfoGetList({
      page: { page, size: pageSize },
      productCategoryCode: ENERGY_PRODUCT_CATEGORY_CODE,
      ...formValues,
    });
  },

  async create(data: ThingsApi.DeviceInfo) {
    return await ThingsApi.postApiV1ThingsDeviceInfoCreate(data);
  },

  async delete(productID: string, deviceName: string) {
    return await ThingsApi.postApiV1ThingsDeviceInfoDelete({
      productID,
      deviceName,
    });
  },
};
