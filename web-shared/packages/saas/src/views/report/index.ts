/**
 * 文件说明：报表管理共享页面导出。
 * 页面由物联（apps/iot）等宿主应用通过
 * `import('@vben/saas').then((m) => ({ default: m.ReportXxxPage }))` 复用；
 * 其他应用（如能源中心）后续照告警接入样板写自己的路由模块即可，无需改动本包。
 */
export { default as ReportListPage } from './list.vue';
export { default as ReportEditPage } from './edit.vue';
export { default as ReportPreviewPage } from './preview.vue';
export { DatasetApi, DatasourceApi, TenantApi, AreaApi, ReportApi } from './api';
export type { DatasetInfo, DatasourceInfo, ReportInfo, RenderResp, RenderWarning } from './api';
export { buildContextParams, ensureProject } from './context';
