import { getRequestClient } from '@vben/api';

export interface AssetInfo {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  tags?: string;
  size?: number;
  groupId?: string;
  createdTime?: number;
  updatedTime?: number;
}

export interface AssetListResponse {
  list: AssetInfo[];
  total: number;
  num?: number;
}

const BASE_URL = '/api/v1/view/asset';

export const AssetApi = {
  async list(
    page: number,
    pageSize: number,
    params: {
      name?: string;
      type?: string;
      groupId?: string;
      format?: string;
    } = {},
  ) {
    const requestClient = getRequestClient();
    return await requestClient.post<AssetListResponse>(
      `${BASE_URL}/get-list`,
      { page: { page, size: pageSize }, ...params },
    );
  },

  async upload(data: Partial<AssetInfo>) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/upload`, data);
  },

  async update(data: AssetInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/update`, {
      ...data,
      id: data.id ? String(data.id) : data.id,
    });
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
    });
  },
};
