/** 文件说明：验证同源H5在独立路径及转发域名下读取当前源站，原生端配置与显式域名不受影响。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** loadConfig 编译真实配置的目标平台分支，只替换环境变量与平台API。 */
function loadConfig(platform, env, origin = 'https://panel.invalid') {
  let enabled = true;
  const stack = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/config.ts'), 'utf8').split('\n').filter((line) => {
    const open = line.match(/^\s*\/\/ #ifdef (.+)$/);
    if (open) { stack.push(enabled); enabled = enabled && open[1].split(' || ').includes(platform); return false; }
    if (/^\s*\/\/ #endif/.test(line)) { enabled = stack.pop(); return false; }
    return enabled;
  }).join('\n').replaceAll('import.meta.env', JSON.stringify(env));
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'uni', output)(
    () => ({ resolveThemeTokens: () => ({}) }), module, module.exports,
    origin ? { location: new URL(origin) } : undefined, { getSystemInfoSync: () => ({ platform: 'android' }) },
  );
  return module.exports.config;
}

test('H5同源配置跟随实际浏览器源站，组织接口与WebSocket保持同源', () => {
  for (const origin of ['https://panel.invalid', 'http://localhost:51999']) {
    const config = loadConfig('H5', { VITE_API_BASE_URL: 'same-origin' }, origin);
    assert.equal(config.apiBaseUrl, origin);
    assert.equal(config.tenantApiBaseUrl, origin);
    assert.equal(config.wsBaseUrl, origin.replace(/^http/, 'ws'));
    assert.equal(config.appId, '700');
  }
});
test('显式接口地址和独立组织接口地址仍优先使用配置', () => {
  const config = loadConfig('H5', { VITE_API_BASE_URL: 'https://api.invalid/', VITE_TENANT_API_BASE_URL: 'https://org.invalid/' });
  assert.equal(config.apiBaseUrl, 'https://api.invalid');
  assert.equal(config.tenantApiBaseUrl, 'https://org.invalid');
});
test('App无浏览器源站时使用原有默认配置，不将same-origin作为域名', () => {
  const baseline = loadConfig('APP-PLUS', {});
  assert.equal(loadConfig('APP-PLUS', { VITE_API_BASE_URL: 'same-origin' }, null).apiBaseUrl, baseline.apiBaseUrl);
});
