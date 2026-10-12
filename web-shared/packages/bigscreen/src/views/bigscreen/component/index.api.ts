import { getRequestClient } from '@vben/api';

export interface ComponentInfo {
  categoryId?: string;
  categoryName?: string;
  content?: string;
  cover?: string;
  createdTime?: number;
  createdUserID?: string;
  description?: string;
  entry?: string;
  groupId?: string;
  id?: string;
  name?: string;
  projectID?: string;
  source?: string;
  status?: number;
  tenantCode?: string;
  updatedTime?: number;
  version?: string;
}

export interface ComponentListResponse {
  list: ComponentInfo[];
  num?: number;
  total: number;
}

const BASE_URL = '/api/v1/view/component';

export const ComponentApi = {
  async list(page: number, pageSize: number, formValues: Record<string, any>) {
    const requestClient = getRequestClient();
    return await requestClient.post<ComponentListResponse>(`${BASE_URL}/get-list`, {
      page: { page, size: pageSize },
      ...formValues,
    });
  },

  async create(data: ComponentInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/create`, data);
  },

  async update(data: ComponentInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/update`, {
      ...data,
      id: data.id ? String(data.id) : data.id,
      projectID: data.projectID ? String(data.projectID) : data.projectID,
    });
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
    });
  },

  async copy(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/copy`, {
      id: String(id),
    });
  },
};
