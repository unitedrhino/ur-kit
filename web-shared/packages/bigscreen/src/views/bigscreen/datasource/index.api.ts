import { getRequestClient } from '@vben/api';

export interface DataSourceInfo {
  id?: string;
  name?: string;
  type?: string;
  config?: Record<string, any>;
  status?: number;
  desc?: string;
  lastCheckTime?: number;
  lastErrorMsg?: string;
  createdTime?: number;
  updatedTime?: number;
}

export interface DataSourceListResponse {
  list: DataSourceInfo[];
  total: number;
  num?: number;
}

const BASE_URL = '/api/v1/view/datasource';

function parseConfig(item: any): DataSourceInfo {
  if (item && typeof item.config === 'string' && item.config) {
    try {
      item.config = JSON.parse(item.config);
    } catch {
      item.config = {};
    }
  }
  return item;
}

function serializeConfig(data: DataSourceInfo): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if (data.config && typeof data.config === 'object') {
    payload.config = JSON.stringify(data.config);
  }
  return payload;
}

export const DataSourceApi = {
  async list(page: number, pageSize: number, formValues: Record<string, any>) {
    const requestClient = getRequestClient();
    const res = await requestClient.post<DataSourceListResponse>(`${BASE_URL}/get-list`, {
      page: { page, size: pageSize },
      ...formValues,
    });
    if (res.list) {
      res.list = res.list.map((item) => parseConfig(item));
    }
    return res;
  },

  async detail(id: string) {
    const requestClient = getRequestClient();
    const res = await requestClient.post<DataSourceInfo>(`${BASE_URL}/get-one`, { id: String(id) });
    return parseConfig(res);
  },

  async create(data: DataSourceInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string }>(`${BASE_URL}/create`, serializeConfig(data));
  },

  async update(data: DataSourceInfo) {
    const requestClient = getRequestClient();
    const payload = serializeConfig(data);
    payload.id = data.id ? String(data.id) : data.id;
    return await requestClient.post(`${BASE_URL}/update`, payload);
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
    });
  },

  async test(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<{
      duration?: number;
      message?: string;
      success: boolean;
    }>(`${BASE_URL}/test`, { id: String(id) });
  },

  async testConnection(type: string, config: Record<string, any>) {
    const requestClient = getRequestClient();
    const payload = {
      type,
      config: JSON.stringify(config),
    };
    return await requestClient.post<{
      duration?: number;
      message?: string;
      success: boolean;
    }>(`${BASE_URL}/test-connection`, payload);
  },
};
