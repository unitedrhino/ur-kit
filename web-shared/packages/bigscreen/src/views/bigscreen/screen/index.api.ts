import { getRequestClient } from '@vben/api';

export interface ScreenInfo {
  createdTime?: number;
  createdUserID?: string;
  desc?: string;
  id?: string;
  indexImage?: string;
  isSystem?: boolean;
  name?: string;
  projectID?: string;
  resolution?: string;
  status?: number;
  type?: string;
  updatedTime?: number;
}

export interface PublishResponse {
  publishTime: string;
  publishUrl: string;
}

export interface ScreenListResponse {
  list: ScreenInfo[];
  num?: number;
  total: number;
}

const BASE_URL = '/api/v1/view/project';

export const ScreenApi = {
  async list(page: number, pageSize: number, formValues: Record<string, any>) {
    const requestClient = getRequestClient();
    const res = await requestClient.post<ScreenListResponse>(`${BASE_URL}/get-list`, {
      page: {
        page,
        size: pageSize,
      },
      type: 'screen',
      ...formValues,
    });
    return {
      ...res,
      list: (res.list ?? []).filter((item) => !item.type || item.type === 'screen'),
    };
  },

  async detail(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<ScreenInfo>(`${BASE_URL}/get-one`, {
      id: String(id),
    });
  },

  async create(data: ScreenInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/create`, {
      ...data,
      type: 'screen',
    });
  },

  async update(data: ScreenInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/update`, {
      ...data,
      id: data.id ? String(data.id) : data.id,
      type: 'screen',
    });
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
      type: 'screen',
    });
  },

  async publish(id: string) {
    const requestClient = getRequestClient();
    // 使用 update 接口将 status 改为 1（已发布）
    return await requestClient.post<PublishResponse>(`${BASE_URL}/update`, {
      id: String(id),
      status: 1,
    });
  },

  async unpublish(id: string) {
    const requestClient = getRequestClient();
    // 使用 update 接口将 status 改为 2（未发布/草稿）
    return await requestClient.post(`${BASE_URL}/update`, {
      id: String(id),
      status: 2,
    });
  },

  async getPublishInfo(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<PublishResponse>(`${BASE_URL}/publish-info`, {
      id: String(id),
    });
  },
};
