import { getRequestClient } from '@vben/api';

export interface GroupInfo {
  id?: string;
  name?: string;
  type?: string;
  sort?: number;
  createdTime?: number;
  updatedTime?: number;
}

export interface GroupListResponse {
  list: GroupInfo[];
  total: number;
  num?: number;
}

const BASE_URL = '/api/v1/view/group';

export const GroupApi = {
  async list(type: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<GroupListResponse>(
      `${BASE_URL}/get-list`,
      { type },
    );
  },

  async create(data: { name: string; type: string; sort?: number }) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string }>(
      `${BASE_URL}/create`,
      data,
    );
  },

  async update(data: { id: string; name?: string; sort?: number }) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/update`, {
      ...data,
      id: String(data.id),
    });
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
    });
  },
};
