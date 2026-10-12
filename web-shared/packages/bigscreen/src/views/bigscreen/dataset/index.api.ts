/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import { getRequestClient } from '@vben/api';

export interface DatasetInfo {
  id?: string;
  name?: string;
  type?: string;
  groupId?: string;
  sourceId?: string;
  sourceName?: string;
  config?: string;
  requestScript?: string;
  responseScript?: string;
  dynamicParams?: string;
  outputFields?: string;
  tags?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  schema?: string;
  desc?: string;
  createdTime?: number;
  updatedTime?: number;
}

export interface DatasetListResponse {
  list: DatasetInfo[];
  total: number;
  num?: number;
}

export const datasetTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionHttpRequest'); }, value: 'http' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionStaticJson'); }, value: 'json' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionSqlQuery'); }, value: 'sql' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionRawData'); }, value: 'raw' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionStoredProcedure'); }, value: 'procedure' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionJavascriptScript'); }, value: 'js' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.customScript'); }, value: 'script' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionIotData'); }, value: 'iot' },
];

const BASE_URL = '/api/v1/view/dataset';

export const DatasetApi = {
  async list(
    page: number,
    pageSize: number,
    formValues: Record<string, any>,
  ) {
    const requestClient = getRequestClient();
    return await requestClient.post<DatasetListResponse>(
      `${BASE_URL}/get-list`,
      {
        page: { page, size: pageSize },
        ...formValues,
      },
    );
  },

  async getOne(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<DatasetInfo>(
      `${BASE_URL}/get-one`,
      { id: String(id) },
    );
  },

  async create(data: DatasetInfo) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string }>(
      `${BASE_URL}/create`,
      data,
    );
  },

  async update(data: DatasetInfo) {
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

  async preview(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<{
      rows: string;
      fields: string;
    }>(`${BASE_URL}/preview`, { id: String(id) });
  },
};
