/** 接收分享前的负责人项目门禁契约，避免小程序绕过创建项目直接授权。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('分享接收页仅在微信小程序检查负责人项目并支持创建后恢复', () => {
  const source = read('src/packageDevice/pages/share-accept/index.vue');
  assert.match(source, /#ifdef MP-WEIXIN[\s\S]*getOwnedProjects/, '负责人项目检查必须只进入微信小程序编译分支');
  assert.match(source, /没有负责人项目|需要创建项目/, '没有负责人项目时必须给出创建引导');
  assert.match(source, /user\?\.nickName \|\| user\?\.userName/, '创建项目默认名称应优先使用用户名称');
  assert.match(source, /pending_device_share_accept/, '创建项目期间必须保存短时接收草稿');
  assert.match(source, /onShow\(\(\) => \{ void resumeAfterProject\(\); \}\)/, '创建项目返回后必须恢复接收流程');
});
