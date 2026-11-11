/** 首页下拉刷新契约：同时更新项目、设备和区域数据。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/home/index.vue'), 'utf8');

test('首页滚动容器启用下拉刷新并绑定刷新状态', () => {
  assert.match(source, /refresher-enabled="loggedIn"/);
  assert.match(source, /:refresher-triggered="refreshing"/);
  assert.match(source, /@refresherrefresh="handlePullDownRefresh"/);
});

test('首页下拉刷新同时读取项目、设备和区域', () => {
  assert.match(source, /async function handlePullDownRefresh\(\)/);
  assert.match(source, /projectProvider\.loadFirst\(\)/);
  assert.match(source, /deviceListProvider\.loadFirst\(\)/);
  assert.match(source, /refreshHomeAreasAndDevices\(\)/);
  assert.match(source, /uni\.stopPullDownRefresh\(\)/);
});
