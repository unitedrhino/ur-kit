// 文件说明：运行真实 logger.ts，验证控制台报错、堆栈、去重和脱敏。
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const loggerPath = path.resolve(__dirname, '../src/utils/logger.ts');
function loadLogger() {
  const source = readFileSync(loggerPath, 'utf8').replace('import.meta.env.MODE', JSON.stringify('test'));
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: loggerPath }).outputText;
  const module = { exports: {} };
  const storage = new Map();
  const uni = { getStorageSync: (key) => storage.get(key), setStorageSync: (key, value) => storage.set(key, value), removeStorageSync: (key) => storage.delete(key) };
  const listeners = new Map();
  const window = { addEventListener: (name, callback) => listeners.set(name, callback) };
  Function('module', 'exports', 'require', 'uni', 'window', compiled)(module, module.exports, require, uni, window);
  module.exports.configureLogger({ persistHistory: false });
  return { logger: module.exports, listeners };
}

test('直接 console.error(Error) 保留原输出并捕获一次堆栈', () => {
  const original = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);
  try {
    const { logger } = loadLogger();
    logger.installConsoleErrorCapture();
    const error = new Error('console failure');
    console.error(error);
    logger.reportGlobalError(error, 'app.error');
    const captured = logger.getLogHistory().filter((item) => item.name === 'console.error');
    assert.equal(captured.length, 1);
    assert.match(captured[0].data.args[0].stack, /console failure/);
    assert.equal(calls.length >= 1, true);
    assert.equal(logger.getLogHistory().filter((item) => item.name === 'app.error').length, 0);
  } finally { console.error = original; }
});

test('Vue 错误和未处理拒绝保留 stack；敏感字段被脱敏', () => {
  const { logger, listeners } = loadLogger();
  const original = console.error;
  logger.installConsoleErrorCapture();
  logger.reportGlobalError(new Error('vue failure'), 'vue.error');
  logger.reportGlobalError(new Error('Error: vue failure'), 'app.error');
  listeners.get('unhandledrejection')({ reason: new Error('promise failure') });
  logger.logger.error('request.failure', 'token=secret phone=13800138000', { token: 'secret', nested: { password: 'private' } });
  const entries = logger.getLogHistory();
  assert.match(entries.find((item) => item.name === 'vue.error').data.stack, /vue failure/);
  assert.equal(entries.filter((item) => item.name === 'app.error').length, 0);
  assert.match(entries.find((item) => item.name === 'promise.unhandled').data.stack, /promise failure/);
  assert.equal(entries.find((item) => item.name === 'request.failure').message, 'token=[Filtered] phone=[Filtered]');
  assert.equal(entries.find((item) => item.name === 'request.failure').data.token, '[Filtered]');
  assert.equal(entries.find((item) => item.name === 'request.failure').data.nested.password, '[Filtered]');
  console.error = original;
});
