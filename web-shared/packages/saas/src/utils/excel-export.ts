/**
 * Excel 导出共享工具函数
 * 统一 5+ 个页面的 Excel 导出逻辑
 */
import { loadExcel } from './load-excel';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * 导出数据为 Excel 文件并触发下载
 * @param sheetName  工作表名称
 * @param columns    列定义数组
 * @param data       数据行数组
 * @param fileName   下载文件名（含 .xlsx 后缀）
 */
export async function exportToExcel(
  sheetName: string,
  columns: ExcelColumn[],
  data: Record<string, any>[],
  fileName: string,
): Promise<void> {
  // 点击导出后才加载工作簿引擎。
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = columns;
  data.forEach((row) => ws.addRow(row));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
