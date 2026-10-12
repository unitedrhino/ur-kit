import { getRequestClient } from '@vben/api';

export interface TemplateInfo {
  createdTime?: number;
  createdUserID?: string;
  desc?: string;
  id?: string;
  indexImage?: string;
  isSystem?: boolean;
  name?: string;
  projectID?: string;
  resolution?: string;
  source?: string;
  status?: number;
  tags?: string[];
  type?: string;
  updatedTime?: number;
}

export interface TemplateListResponse {
  list: TemplateInfo[];
  num?: number;
  total: number;
}

const BASE_URL = '/api/v1/view/project';

export const TemplateApi = {
  async list(page: number, pageSize: number, formValues: Record<string, any>) {
    const requestClient = getRequestClient();
    const res = await requestClient.post<TemplateListResponse>(`${BASE_URL}/get-list`, {
      page: {
        page,
        size: pageSize,
      },
      ...formValues,
      type: 'template',
    });
    return {
      ...res,
      list: (res.list ?? [])
        .filter((item) => item.type === 'template')
        .map((item) => ({
          ...item,
          source: item.source || (item.isSystem ? 'system' : 'custom'),
        })),
    };
  },

  async create(data: TemplateInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/create`, {
      ...data,
      type: 'template',
    });
  },

  async update(data: TemplateInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/update`, {
      ...data,
      id: data.id ? String(data.id) : data.id,
      type: 'template',
    });
  },

  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post(`${BASE_URL}/delete`, {
      id: String(id),
      type: 'template',
    });
  },
};
