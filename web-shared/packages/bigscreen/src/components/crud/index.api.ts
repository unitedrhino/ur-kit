// import type { linkModeMapping, typeMapping } from './utils/constants'

import { ThingsApi } from '@vben/api';

// type TypeEnum = keyof typeof typeMapping
// type LinkModeEnum = keyof typeof linkModeMapping

// export interface Product extends ThingsApi.ProductInfo {}

export const Api = {
  /**
   * 查询所有产品
   */
  async list(page: number, pageSize: number, formValues: any) {
    return await ThingsApi.postApiV1ThingsProductInfoGetList({
      page: {
        page,
        size: pageSize,
      },
      ...formValues,
    });
  },

  /**
   * 更新产品
   */
  async update(id: string, data: ThingsApi.ProductInfo) {
    return await ThingsApi.postApiV1ThingsProductInfoUpdate({
      productID: id,
      // id: id,
      // ...(data.name ? { name: data.name } : {}),
      // ...(data.desc ? { desc: data.desc } : {}),

      // parentID: 1
      ...data,
    });
  },

  /**
   * 创建产品
   */
  async create(data: ThingsApi.ProductInfo) {
    return await ThingsApi.postApiV1ThingsProductInfoCreate(data);
  },

  /**
   * 删除产品
   */
  async delete(productID: string) {
    return await ThingsApi.postApiV1ThingsProductInfoDelete({
      productID,
    });
  },
};
