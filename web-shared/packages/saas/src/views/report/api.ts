/**
 * 报表模块 API 封装（共享包 @vben/saas 内，供 iot 等宿主应用复用）。
 * 覆盖：数据源/数据集/企业/区域/报表全部接口；页面组件统一从本文件取 API，
 * 不再内联 requestClient 调用。
 */
import { getRequestClient } from '@vben/api';

// ---------- 数据源 ----------

export interface DatasourceInfo {
  id: string;
  name: string;
  type: string;
  status?: number;
}

export const DatasourceApi = {
  async list(page: number, pageSize: number) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ list: DatasourceInfo[] }>(
      '/api/v1/view/datasource/get-list',
      { page: { page, size: pageSize } },
    );
  },
};

// ---------- 数据集 ----------

export interface DatasetInfo {
  id: string;
  name: string;
  type: string;
  sourceId?: string;
  dynamicParams?: string; // 动态参数 JSON（{name:{label,type,default,options?,required?}} 对象结构）
}

export interface DatasetPreviewResp {
  rows: string;
  fields: string;
}

export const DatasetApi = {
  async list(page: number, pageSize: number, sourceId?: string, scene?: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ list: DatasetInfo[] }>('/api/v1/view/dataset/get-list', {
      page: { page, size: pageSize },
      ...(sourceId ? { sourceId } : {}),
      ...(scene ? { scene } : {}),
    });
  },
  async preview(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<DatasetPreviewResp>('/api/v1/view/dataset/preview', { id });
  },
  // 按 ID 读取数据集详情（含 dynamicParams 动态参数配置）
  async getOne(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<DatasetInfo>('/api/v1/view/dataset/get-one', { id });
  },
};

// ---------- 设备数据（区域树 → 设备列表 → 最新属性） ----------

export interface DeviceFieldSample {
  name: string;
  sample: string;
}

export interface DeviceRow {
  deviceName: string;
  deviceAlias?: string;
  productName?: string;
  isOnline?: number;
  status?: number;
  withProperties?: Record<string, { dataName?: string; timestamp: string; value: string }>;
}

export const DeviceApi = {
  // 按区域（及可选产品/品类）查询设备列表，并带最新属性（withProperties 空列表 = 拉全部属性）。
  // 复用 @vben/saas 的 getRequestClient（带 token/app-id/tenant-code 认证拦截器），
  // 不直接使用 ThingsApi（其内部为裸 requestClient，不带认证头，会导致 401）。
  async list(params: Record<string, any> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ list: DeviceRow[]; total: number }>(
      '/api/v1/things/device/info/get-list',
      {
        page: { page: 1, size: 999 },
        withProperties: [],
        ...params,
      },
    );
  },
};

// 设备固定字段（渲染时后端按这些字段组装行）
export const DEVICE_FIXED_FIELDS: string[] = [
  'deviceName',
  'deviceAlias',
  'productName',
  'isOnline',
  'status',
];

// ---------- 平台上下文（企业/项目/区域名称） ----------

export const TenantApi = {
  async getOne(code: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ name?: string }>('/api/v1/system/tenant/info/get-one', {
      code,
    });
  },
};

export const AreaApi = {
  async list(params: Record<string, any> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ list?: { areaID?: string; areaName?: string; parentAreaID?: string }[] }>(
      '/api/v1/things/area/info/get-list',
      params,
    );
  },
};

// ---------- 报表 ----------

export interface ReportInfo {
  id: string;
  projectID?: string;
  name?: string;
  desc?: string;
  status?: number;
  createdTime?: string;
  updatedTime?: string;
}

export interface RenderWarning {
  sheetName: string;
  row: number;
  col: number;
  token: string;
  reason: string;
}

export interface RenderResp {
  content: string;
  warnings?: RenderWarning[];
}

export const ReportApi = {
  async render(content: string, params: Record<string, string> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<RenderResp>('/api/v1/view/report/render', { content, params });
  },
  // 设计器内导出：按设计内容直接渲染导出
  async exportXlsx(content: string, params: Record<string, string> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ url: string }>('/api/v1/view/report/export', {
      content,
      params,
    });
  },
  // 列表页导出：按报表 ID 加载内容渲染导出
  async exportById(id: string, params: Record<string, string> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ url: string }>('/api/v1/view/report/export-by-id', {
      id,
      params,
    });
  },
  async create(data: { projectID?: string; name: string; desc?: string; status?: number }) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string }>('/api/v1/view/report/create', data);
  },
  async getList(params: Record<string, any> = {}) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ list: ReportInfo[]; total: number }>(
      '/api/v1/view/report/get-list',
      params,
    );
  },
  async update(data: { id: string; name?: string; desc?: string; status?: number; projectID?: string }) {
    const requestClient = getRequestClient();
    return await requestClient.post('/api/v1/view/report/update', data);
  },
  async detailGetOne(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post<{ id: string; content: string }>(
      '/api/v1/view/report/detail/get-one',
      { id },
    );
  },
  async detailUpdate(id: string, content: string) {
    const requestClient = getRequestClient();
    return await requestClient.post('/api/v1/view/report/detail/update', { id, content });
  },
  async delete(id: string) {
    const requestClient = getRequestClient();
    return await requestClient.post('/api/v1/view/report/delete', { id });
  },
};
