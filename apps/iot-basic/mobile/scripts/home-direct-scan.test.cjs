/** 首页扫一扫入口在微信小程序直接打开系统相机。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/home/index.vue'), 'utf8');

test('首页扫一扫不先跳转添加设备页', () => {
  const fn = source.match(/async function handleScan\(\)[\s\S]*?\n\}/)?.[0] || '';
  assert.match(fn, /ensureScanCameraReady/);
  assert.match(fn, /uni\.scanCode/);
  assert.match(fn, /scanResult=/);
  assert.match(fn, /parseDeviceShareQr/);
  assert.match(fn, /parseProjectInviteQr/);
});
