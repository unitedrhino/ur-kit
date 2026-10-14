// 本文件验证生成的 Things HTTP 客户端以字符串无损发送大整数 ID。
const assert = require('node:assert/strict');
const test = require('node:test');
const { Configuration, ThingsAlarmInfoApi } = require('./dist/things/index.js');

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
