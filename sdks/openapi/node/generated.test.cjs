// 本文件验证生成的 Things HTTP 客户端以字符串无损发送大整数 ID。
const assert = require('node:assert/strict');
const test = require('node:test');
const { Configuration, ThingsAlarmInfoApi, ThingsProjectAlarmSourceApi } = require('./dist/things/index.js');

test('Things 告警 ID 列表保持大整数原文并携带认证头', async () => {
  let called = false;
  const api = new ThingsAlarmInfoApi(new Configuration({
    basePath: 'http://local.test',
    headers: { Authorization: 'Bearer local-token' },
    fetchApi: async (url, init) => {
      called = true;
      assert.equal(url, 'http://local.test/api/v1/things/alarm/info/evaluate-trigger');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers.Authorization, 'Bearer local-token');
      const body = JSON.parse(init.body);
      assert.deepEqual(body.alarmIDStrings, ['9007199254740993']);
      return new Response(JSON.stringify({ code: 0, msg: 'ok', data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  }));
  await api.postApiV1ThingsAlarmInfoEvaluateTrigger({
    alarmEvaluateTriggerReq: { alarmIDStrings: ['9007199254740993'] },
  });
  assert.equal(called, true);
});

test('Things 结构来源接口保留项目 ID 字符串且只生成一个写入方法', async () => {
  const seen = [];
  const api = new ThingsProjectAlarmSourceApi(new Configuration({
    basePath: 'http://local.test',
    headers: { Authorization: 'Bearer service-token' },
    fetchApi: async (url, init) => {
      seen.push([url, init.method, init.headers.Authorization, JSON.parse(init.body)]);
      return new Response(JSON.stringify({ code: 200, data: { alarmStatus: 5 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  }));
  const result = await api.postApiV1ThingsProjectAlarmSourceStructureSet({
    projectAlarmSourceSetReq: { projectID: '9007199254740993', level: 4 },
  });
  assert.equal(result.data?.alarmStatus, 5);
  assert.deepEqual(seen, [[
    'http://local.test/api/v1/things/project/alarm-source/structure-set',
    'POST',
    'Bearer service-token',
    { projectID: '9007199254740993', level: 4 },
  ]]);
  assert.equal('postApiV1ThingsProjectAlarmSourceStructureSet_1' in api, false);
});

test('Things 结构事件通知接口保留两个大整数 ID 且只生成一个方法', async () => {
  const seen = [];
  const api = new ThingsProjectAlarmSourceApi(new Configuration({
    basePath: 'http://local.test',
    headers: { Authorization: 'Bearer service-token' },
    fetchApi: async (url, init) => {
      seen.push([url, init.method, init.headers.Authorization, JSON.parse(init.body)]);
      return new Response(JSON.stringify({ code: 200, data: { recipientCount: 2 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  }));
  const result = await api.postApiV1ThingsProjectAlarmSourceStructureNotify({
    projectStructureEventNotifyReq: { projectID: '9007199254740993', eventID: '9007199254740995', level: 'red', title: '桥梁预警' },
  });
  assert.equal(result.data?.recipientCount, 2);
  assert.deepEqual(seen, [[
    'http://local.test/api/v1/things/project/alarm-source/structure-notify',
    'POST',
    'Bearer service-token',
    { projectID: '9007199254740993', eventID: '9007199254740995', level: 'red', title: '桥梁预警' },
  ]]);
  assert.equal('postApiV1ThingsProjectAlarmSourceStructureNotify_1' in api, false);
});

test('Core 应用注册保持应用、菜单与父节点字符串 ID', async () => {
  const { Configuration, SystemAppInfoApi } = require('./dist/core/index.js');
  const request = {app: {id: '9007199254740993'}, menus: [{id: '9007199254740994', appID: '9007199254740993', parentID: '1'}]};
  let called = false;
  const api = new SystemAppInfoApi(new Configuration({
    basePath: 'http://local.test', headers: {'ithings-token': 'bootstrap-admin'},
    fetchApi: async (url, init) => {
      called = true;
      assert.equal(url, 'http://local.test/api/v1/system/app/info/batch-import');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers['ithings-token'], 'bootstrap-admin');
      assert.deepEqual(JSON.parse(init.body), request);
      return new Response(JSON.stringify({code: 200, data: {id: request.app.id}}), {status: 200, headers: {'Content-Type': 'application/json'}});
    },
  }));
  await api.postApiV1SystemAppInfoBatchImport({appMenuBatchImportReq: request});
  assert.equal(called, true);
});
