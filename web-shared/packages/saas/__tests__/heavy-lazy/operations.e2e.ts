// 真实文件引擎与 Excel 导出的浏览器回归，使用独立生产构建样例。
import { expect, test } from '@playwright/test';
import ExcelJS from 'exceljs';
import { resolve } from 'node:path';

for (const format of ['pdf', 'docx', 'xlsx', 'csv', 'md', 'svg', 'dxf']) {
  test(`${format} 预览按操作加载且资源无失败`, async ({ page }) => {
    const failures: string[] = [];
    const errors: string[] = [];
    const scripts: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failures.push(response.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: format, exact: true })).toBeVisible();
    expect(scripts.filter((url) => /exceljs|pdf-|wordDoc|spreadsheet|cad-/i.test(url))).toEqual([]);
    await page.getByRole('button', { name: format, exact: true }).click();
    await expect(page.getByTestId('source-preview')).toBeVisible();
    await expect(page.getByText('正在加载预览', { exact: true })).toHaveCount(0);
    // 引擎的加载发生于内部 Shadow DOM/iframe，等待文件响应及渲染稳定后检查故障。
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert')).toHaveCount(0);
    const manifest = await (await page.request.get('/.vite/manifest.json')).json();
    const loaded = Object.entries(manifest).filter(([, entry]) => scripts.some((url) => url.endsWith((entry as { file: string }).file)));
    const engines = [...new Set(loaded.map(([key]) => key.match(/@file-viewer\/renderer-([^/]+)/)?.[1]).filter(Boolean))];
    const expected = { pdf: 'pdf', docx: 'word', xlsx: 'spreadsheet', csv: 'spreadsheet', md: 'text', svg: 'image', dxf: 'cad' };
    expect(engines).toEqual([expected[format as keyof typeof expected]]);
    expect(failures).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`${format}.png`) });
  });
}
for (const label of ['表格导出', '共享导出']) {
  test(`${label} 首次及重复导出文件内容一致`, async ({ page }) => {
    await page.goto('/');
    for (let index = 0; index < 2; index++) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: label, exact: true }).click();
      const download = await pending;
      const path = test.info().outputPath(`${index}.xlsx`);
      await download.saveAs(path);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(path);
      expect(workbook.worksheets[0]?.getCell('A1').value).toBe('名称');
      expect(workbook.worksheets[0]?.getCell('A2').value).toBe('设备');
      if (label === '表格导出') expect(workbook.worksheets[0]?.getCell('B2').value).toBe(42);
    }
    await expect(page.locator('#error')).toBeEmpty();
  });
}

test('VXE 实际 XLSX 导入使用延迟插件并完成数据回填', async ({ page }) => {
  await page.goto('/');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: '表格导入', exact: true }).click();
  await (await chooser).setFiles(resolve(import.meta.dirname, 'public/sample.xlsx'));
  await expect(page.getByText('imported', { exact: true })).toBeVisible();
  await expect(page.locator('#error')).toBeEmpty();
});
