/**
 * 大屏端到端测试脚本
 *
 * 用途：自动化登录 → 选租户 → 选项目 → 进入大屏，截图验证并捕获 API 响应。
 * 可用于大屏改造后快速验证数据加载、图表切换等功能。
 *
 * 使用方式：
 *   1. 先启动 dev server:  pnpm vite --mode development --port 3006
 *      (或在 apps/org-iot-client 目录下 pnpm dev)
 *   2. 运行本脚本: node dashboard-e2e.mjs [--port 3006] [--headed]
 *
 * 依赖：
 *   - Playwright (使用仓库 e2e 目录下已安装的版本)
 *   - Chrome for Testing (ms-playwright 安装的 chromium)
 *
 * 环境变量（可选）：
 *   DASHBOARD_PORT   - dev server 端口，默认 3006
 *   DASHBOARD_USER   - 登录用户名，默认 administrator
 *   DASHBOARD_PASS   - 登录密码，默认 iThings666
 *   DASHBOARD_TENANT - 租户名，默认 豪廷中心
 *   DASHBOARD_PROJECT- 项目名，默认 豪庭测试项目
 */

// ---- 配置 ----
const PORT = process.env.DASHBOARD_PORT || '3006';
const USER = process.env.DASHBOARD_USER || 'administrator';
const PASS = process.env.DASHBOARD_PASS || 'iThings666';
const TENANT = process.env.DASHBOARD_TENANT || '豪廷中心';
const PROJECT = process.env.DASHBOARD_PROJECT || '豪庭测试项目';
const BASE = `http://localhost:${PORT}`;
const HEADED = process.argv.includes('--headed');
const FORCE_DEFAULT_DASHBOARD = process.env.DASHBOARD_FORCE_DEFAULT !== '0';

// ---- Playwright 导入 ----
// 使用仓库已安装的 playwright，避免全局安装
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../../../../../../');

// 动态查找 playwright
let chromium;
try {
  const playwrightPath = resolve(repoRoot, 'e2e/node_modules/playwright/index.mjs');
  const pw = await import(playwrightPath);
  chromium = pw.chromium;
} catch {
  // fallback: 全局 playwright
  const pw = await import('playwright');
  chromium = pw.chromium;
}

// ---- 工具函数 ----
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function ensureDefaultDashboard(page) {
  if (!FORCE_DEFAULT_DASHBOARD) {
    log('已关闭默认大屏强制切换（DASHBOARD_FORCE_DEFAULT=0）');
    return;
  }

  const title = page.locator('.dashboard__title-text:has-text("能源管理数据大屏")');
  if (await title.count()) {
    log('当前已是默认大屏');
    return;
  }

  log('当前不是默认大屏，尝试通过 ccd() 打开配置并切回默认大屏');
  await page.evaluate(() => {
    if (typeof window.ccd === 'function') {
      window.ccd();
      return;
    }
    if (typeof window.openEnergyDashboardSetting === 'function') {
      window.openEnergyDashboardSetting();
      return;
    }
    if (typeof window.__energyDashboardSetting === 'function') {
      window.__energyDashboardSetting();
    }
  });

  const settingModal = page.locator('.n-modal:has-text("能源大屏配置")').first();
  await settingModal.waitFor({ state: 'visible', timeout: 10_000 });

  const defaultRadio = settingModal.locator('label:has-text("默认大屏")').first();
  if (await defaultRadio.count()) {
    await defaultRadio.click();
  }

  const saveButton = settingModal.locator('button:has-text("保存")').last();
  await saveButton.click();
  await page.waitForTimeout(2500);

  await title.waitFor({ state: 'visible', timeout: 15_000 });
  log('已切回默认大屏');
}

// ---- 主流程 ----
const apiResponses = [];
const outputDir = resolve(__dirname, '../../../../../../../.temp/dashboard-screenshots');

const browser = await chromium.launch({
  headless: !HEADED,
  // 优先查找 ms-playwright 安装的 chromium
  executablePath: (() => {
    const candidates = [
      resolve(process.env.HOME || '', 'Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      resolve(process.env.HOME || '', '.cache/ms-playwright/chromium-1208/chrome-linux/chrome'),
    ];
    for (const p of candidates) {
      try { import('node:fs').then(fs => fs.accessSync(p)); return p; } catch { /* next */ }
    }
    return undefined; // 让 playwright 自行查找
  })(),
});

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// 捕获 API 响应
page.on('response', async (response) => {
  const url = response.url();
  if (!url.includes('/api/v1/')) return;
  if (url.includes('.ts') || url.includes('.js')) return;
  const shortUrl = url.split('/api/v1/')[1] || url;
  try {
    const body = await response.json();
    apiResponses.push({
      url: shortUrl,
      status: response.status(),
      body: JSON.stringify(body).substring(0, 800),
    });
  } catch { /* ignore non-JSON */ }
});

try {
  // 1. 打开页面
  log(`打开 ${BASE}`);
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 2. 登录
  const pwdInput = page.locator('input[type="password"]');
  if (await pwdInput.count() > 0) {
    log(`登录: ${USER}`);
    await page.locator('input').first().fill(USER);
    await pwdInput.fill(PASS);
    await page.locator('button:has-text("登录")').click();
    await page.waitForTimeout(5000);
    log(`登录后 URL: ${page.url()}`);
  }

  // 3. 选租户
  if (page.url().includes('tenant-choose')) {
    log(`选择租户: ${TENANT}`);
    await page.waitForTimeout(2000);
    const tenant = page.locator(`text=${TENANT}`);
    if (await tenant.count() > 0) {
      await tenant.first().click();
      await page.waitForTimeout(5000);
    }
    log(`选择租户后 URL: ${page.url()}`);
  }

  // 4. 选项目
  await page.waitForTimeout(3000);
  const proj = page.locator(`text=${PROJECT}`);
  if (await proj.count() > 0) {
    log(`选择项目: ${PROJECT}`);
    await proj.first().click();
    await page.waitForTimeout(8000);
  }
  log(`当前 URL: ${page.url()}`);

  // 5. 确保在大屏页面
  if (!page.url().includes('large-screen')) {
    log('跳转到 /large-screen');
    await page.goto(`${BASE}/large-screen`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }

  await ensureDefaultDashboard(page);

  // 6. 截图——默认视图
  // 确保输出目录存在
  const fs = await import('node:fs');
  fs.mkdirSync(outputDir, { recursive: true });

  await page.screenshot({ path: resolve(outputDir, '01-default.png'), fullPage: true });
  log('截图: 01-default.png（默认视图）');

  // 7. 用电量分析——切换各粒度
  const energyBtnGroup = page
    .locator('.chart-panel:has(.chart-panel__head:has-text("用电量分析"))')
    .locator('.btn-group')
    .first();
  for (const label of ['时', '日', '月', '年']) {
    const btn = energyBtnGroup.locator(`button:has-text("${label}")`);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: resolve(outputDir, `02-energy-${label}.png`),
        fullPage: true,
      });
      log(`截图: 02-energy-${label}.png`);
    }
  }

  // 8. 功率趋势——切换各范围
  const powerBtnGroup = page
    .locator('.chart-panel:has(.chart-panel__head:has-text("功率趋势"))')
    .locator('.btn-group')
    .first();
  for (const label of ['今日', '昨日', '本周']) {
    const btn = powerBtnGroup.locator(`button:has-text("${label}")`);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: resolve(outputDir, `03-power-${label}.png`),
        fullPage: true,
      });
      log(`截图: 03-power-${label}.png`);
    }
  }

  // 9. 输出 API 摘要
  log(`\n共捕获 ${apiResponses.length} 个 API 响应：`);
  const summary = {};
  for (const r of apiResponses) {
    const key = r.url.split('?')[0];
    summary[key] = (summary[key] || 0) + 1;
  }
  for (const [url, count] of Object.entries(summary)) {
    console.log(`  ${url}: ${count}次`);
  }

  log(`\n截图已保存到: ${outputDir}`);
} catch (e) {
  console.error('测试失败:', e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
