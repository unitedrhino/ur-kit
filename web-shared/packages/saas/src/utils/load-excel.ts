// ExcelJS 仅在文件导入、导出时加载，多个入口共享同一加载结果。
import { createLazyResource } from './lazy-resource';

/** 加载 ExcelJS 默认导出；失败向调用方传播并允许下次操作重试。 */
export const loadExcel = createLazyResource(async () => (await import('exceljs')).default);
