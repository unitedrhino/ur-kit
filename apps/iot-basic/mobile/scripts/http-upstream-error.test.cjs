/** 文件说明：执行两端真实请求层，验证公网超时与业务JSON分开提示，且不重试或清理认证。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
/** harness 仅替换平台网络、存储和日志边界；业务响应解析使用实际源码。 */
function harness(app, response) {
  const module = { exports: {} }, logs = [], removed = [], events = [];
  let requests = 0;
  const source = fs.readFileSync(path.resolve(__dirname, '../../', 'mobile', 'src/utils/request.ts'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const deps = {
    '/config': { config: { apiBaseUrl: 'https://example.test', appId: '700' } },
    '/logger': { logger: { debug() {}, info() {}, addBreadcrumb() {}, warn: (...args) => logs.push(args), captureException() {} } },
    'request-context': { getRequestContext: () => ({ tenantCode: 'org', projectID: 'project' }) },
    'event-bus': { eventBus: { emit: (...args) => events.push(args) } },
    'local-storage.datasource': { localStorage: { remove: (key) => removed.push(key) } },
  };
  const uni = {
    getStorageSync: () => 'synthetic-session', removeStorageSync: key => removed.push(key),
    request: options => { requests++; options.success(response); },
  };
  const requireMock = name => {
    for (const [key, value] of Object.entries(deps)) if (name.endsWith(key)) return value;
    throw new Error('未替换外部边界 ' + name);
  };
  new Function('require', 'module', 'exports', 'uni', output)(requireMock, module, module.exports, uni);
  return { request: module.exports.request, logs, removed, events, count: () => requests };
}
for (const app of ['mobile-uniapp']) {
  test(`${app} 522空响应明确提示连接超时，不报JSON格式错误、不重发或注销`, async () => {
    const h = harness(app, { statusCode: 522, data: '', header: { 'Eo-Log-Uuid': '17745059668763503554', 'Server': 'edgeone', 'Set-Cookie': 'private-cookie' } });
    await assert.rejects(h.request({ url: '/api/v1/system/user/self/login' }), /服务连接超时（HTTP 522）/);
    assert.equal(h.count(), 1); assert.deepEqual(h.removed, []); assert.deepEqual(h.events, []);
    assert.equal(h.logs[0][2].statusCode, 522); assert.equal(h.logs[0][2].responseType, 'string');
    assert.equal(h.logs[0][2].responseLength, 0);
    assert.equal(h.logs[0][2].edgeTrace, '17745059668763503554');
    assert.equal(h.logs[0][2].edgeServer, 'edgeone');
    assert.ok(!JSON.stringify(h.logs).includes('private-cookie'));
  });
  test(`${app} 不记录不符合格式的网关标识`, async () => {
    const h = harness(app, { statusCode: 522, data: '', header: { 'eo-log-uuid': 'private value with spaces' } });
    await assert.rejects(h.request({ url: '/test' }));
    assert.equal(h.logs[0][2].edgeTrace, undefined);
    assert.ok(!JSON.stringify(h.logs).includes('private value with spaces'));
  });
  test(`${app} 代理HTML只提示HTTP故障，日志不包含页面正文`, async () => {
    const h = harness(app, { statusCode: 502, data: '<html>upstream-private-body</html>', header: { 'Content-Type': 'text/html' } });
    await assert.rejects(h.request({ url: '/test' }), /HTTP 502/);
    assert.ok(!JSON.stringify(h.logs).includes('upstream-private-body'));
    assert.equal(h.logs[0][2].contentType, 'text/html'); assert.equal(h.count(), 1);
  });
  test(`${app} 真实业务JSON和HTTP200格式错误保留原解析规则`, async () => {
    const ok = harness(app, { statusCode: 200, data: { code: 200, msg: 'success', data: { accepted: true } } });
    assert.deepEqual(await ok.request({ url: '/test' }), { accepted: true });
    const business = harness(app, { statusCode: 503, data: { code: 100024, msg: '业务正在执行' } });
    await assert.rejects(business.request({ url: '/test' }), e => e.code === 100024 && e.message === '业务正在执行');
    const malformed = harness(app, { statusCode: 200, data: '' });
    await assert.rejects(malformed.request({ url: '/test' }), /响应数据格式错误/);
  });
}
