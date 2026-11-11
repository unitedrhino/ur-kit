/** 项目成员管理中的账号添加、二维码生成与无项目引导契约。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('成员管理保留账号搜索并在微信小程序增加扫码邀请', () => {
  const page = read('src/packageUser/pages/family-members/index.vue');
  assert.match(page, /账号添加/);
  assert.match(page, /扫码添加/);
  assert.match(page, /handleSearchUser/);
  assert.match(page, /生成项目邀请二维码/);
  assert.match(page, /canManage/);
  assert.match(page, /#ifdef MP-WEIXIN/);
});

test('项目邀请二维码使用十分钟凭证并支持撤销', () => {
  const service = read('src/services/project-invite.service.ts');
  const qr = read('src/packageUser/components/project-invite-qr/project-invite-qr.vue');
  const page = read('src/packageUser/pages/project-invite/index.vue');
  assert.match(service, /invite\/create/);
  assert.match(service, /invite\/accept/);
  assert.match(service, /invite\/revoke/);
  assert.match(service, /lianxi-project-invite:v1/);
  assert.match(qr, /二维码有效期 10 分钟/);
  assert.match(qr, /handleRevoke/);
  assert.match(page, /确认加入项目/);
  assert.match(page, /checkProjectInvite/);
  assert.match(page, /clearPendingRoute/);
  assert.match(page, /switchTab\(\{ url: '\/pages\/home\/index' \}\)/);
});

test('无项目入口提供创建和扫码加入，不创建共享临时项目', () => {
  const guard = read('src/providers/app-context.provider.ts');
  const entry = read('src/packageUser/pages/project-entry/index.vue');
  assert.match(guard, /project-entry\/index/);
  assert.doesNotMatch(guard, /共享设备/);
  assert.match(entry, /创建项目/);
  assert.match(entry, /扫码加入项目/);
  assert.match(entry, /parseProjectInviteQr/);
});
