// @vitest-environment node
// 使用真实 ExcelJS 往返 XLSX，确认动态导出的模块形态与格式能力。
import { expect, it } from 'vitest';
import { loadExcel } from '../load-excel';

it('延迟加载后保留表头、值、样式和合并单元格', async () => {
  const ExcelJS = await loadExcel();
  expect(await loadExcel()).toBe(ExcelJS);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('验证');
  sheet.addRow(['标题', '值']);
  sheet.addRow(['设备', 42]);
  sheet.getCell('A1').font = { bold: true };
  sheet.mergeCells('A3:B3');
  sheet.getCell('A3').value = '合并';
  const bytes = await workbook.xlsx.writeBuffer();
  const readback = new ExcelJS.Workbook();
  await readback.xlsx.load(bytes);
  const result = readback.getWorksheet('验证')!;
  expect(result.getCell('B2').value).toBe(42);
  expect(result.getCell('A1').font.bold).toBe(true);
  expect(result.getCell('B3').master.address).toBe('A3');
});
