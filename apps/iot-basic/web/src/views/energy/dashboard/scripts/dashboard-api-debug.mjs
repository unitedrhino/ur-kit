/**
 * 大屏 API 响应诊断脚本
 *
 * 用途：登录后针对特定 API 捕获完整响应体，用于排查数据结构、
 *       重复 timeWindow、字段缺失等问题。
 *
 * 使用方式：
 *   node dashboard-api-debug.mjs [--api area|energy|power|device|alarm]
 *
 * 默认捕获所有 dashboard 相关 API。
 */

const PORT = process.env.DASHBOARD_PORT || '3006';
const USER = process.env.DASHBOARD_USER || 'administrator';
const PASS = process.env.DASHBOARD_PASS || 'iThings666';
const TENANT = process.env.DASHBOARD_TENANT || '豪廷中心';
const PROJECT = process.env.DASHBOARD_PROJECT || '豪庭测试项目';
const BASE = `http://localhost:${PORT}`;
const FORCE_DEFAULT_DASHBOARD = process.env.DASHBOARD_FORCE_DEFAULT !== '0';

// 过滤关键字
const API_FILTER = process.argv.find(a => a.startsWith('--api='))?.split('=')[1] || '';
const KEYWORDS = {
  area: 'area/info',
  energy: 'property-log-agg',
  power: 'property-log-agg',
  device: 'data/query',
  alarm: 'alarm/event',
};
const filterUrl = KEYWORDS[API_FILTER] || '';

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../../../../../../');

let chromium;
try {
  const pw = await import(resolve(repoRoot, 'e2e/node_modules/playwright/index.mjs'));
  chromium = pw.chromium;
} catch {
  const pw = await import('playwright');
  chromium = pw.chromium;
}

const browser = await chromium.launch({
  headless: false,
  executablePath: (() => {
    const candidates = [
      resolve(process.env.HOME || '', 'Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      resolve(process.env.HOME || '', '.cache/ms-playwright/chromium-1208/chrome-linux/chrome'),
    ];
    for (const p of candidates) {
      try { import('node:fs').then(fs => fs.accessSync(p)); return p; } catch { /* next */ }
    }
    return undefined;
  })(),
});

const context = await browser.newContext();
const page = await context.newPage();

const captured = [];

page.on('request', (req) => {
  const url = req.url();
  if (!url.includes('/api/v1/')) return;
  if (filterUrl && !url.includes(filterUrl)) return;
  if (url.includes('property-log') || url.includes('property-latest') || url.includes('area/info') || url.includes('data/query') || url.includes('alarm/event')) {
    const headers = req.headers();
    console.log(`\n[REQ] ${url.split('/api/v1/')[1]}`);
    console.log(`  project-id: ${headers['project-id'] || 'NOT SET'}`);
    if (req.postData()) {
      console.log(`  body: ${req.postData().substring(0, 300)}`);
    }
  }
});

page.on('response', async (response) => {
  const url = response.url();
  if (!url.includes('/api/v1/')) return;
  if (filterUrl && !url.includes(filterUrl)) return;
  const shortUrl = url.split('/api/v1/')[1] || url;
  if (shortUrl.includes('.ts') || shortUrl.includes('.js')) return;

  try {
    const body = await response.json();
    captured.push({ url: shortUrl, status: response.status(), body });
    console.log(`[RES] ${shortUrl} [${response.status()}]`);

    // 分析 timeWindow 重复情况
    const list = body?.data?.list;
    if (Array.isArray(list) && list.length > 0 && list[0]?.values) {
      const values = list[0].values;
      const tws = values.map(v => v.timeWindow);
      const unique = new Set(tws);
      if (unique.size < tws.length) {
        console.log(`  ⚠️ timeWindow 重复! total=${tws.length} unique=${unique.size}`);
      } else {
        console.log(`  ✅ timeWindow 无重复 (${tws.length} 条)`);
      }
    }
  } catch { /* ignore */ }
});

async function ensureDefaultDashboard() {
  if (!FORCE_DEFAULT_DASHBOARD) {
    console.log('[MODE] 已关闭默认大屏强制切换（DASHBOARD_FORCE_DEFAULT=0）');
    return;
  }

  const title = page.locator('.dashboard__title-text:has-text("能源管理数据大屏")');
  if (await title.count()) {
    console.log('[MODE] 当前已是默认大屏');
    return;
  }

  console.log('[MODE] 当前不是默认大屏，尝试切回默认大屏');
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
  console.log('[MODE] 已切回默认大屏');
}

// 登录流程
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const pwdInput = page.locator('input[type="password"]');
if (await pwdInput.count() > 0) {
  await page.locator('input').first().fill(USER);
  await pwdInput.fill(PASS);
  await page.locator('button:has-text("登录")').click();
  await page.waitForTimeout(5000);
}

if (page.url().includes('tenant-choose')) {
  const tenant = page.locator(`text=${TENANT}`);
  if (await tenant.count() > 0) await tenant.first().click();
  await page.waitForTimeout(5000);
}

await page.waitForTimeout(3000);
const proj = page.locator(`text=${PROJECT}`);
if (await proj.count() > 0) {
  await proj.first().click();
  await page.waitForTimeout(5000);
}

// 导航到大屏页面
await page.goto(`${BASE}/large-screen`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(10000);
await ensureDefaultDashboard();

// 输出完整响应
console.log('\n\n========== FULL CAPTURED RESPONSES ==========');
for (const r of captured) {
  console.log(`\n--- ${r.url} [${r.status}] ---`);
  const json = JSON.stringify(r.body, null, 2);
  console.log(json.substring(0, 3000));
  if (json.length > 3000) console.log(`  ... (truncated, total ${json.length} chars)`);
}

await browser.close();
console.log('\nDone');
