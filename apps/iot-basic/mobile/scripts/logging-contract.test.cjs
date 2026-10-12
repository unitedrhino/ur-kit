// 文件说明：校验两个 uni-app 工程的调试桥契约与 Sentry 移除状态。
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');

test('调试桥只在会话内用独立请求上报，且原始包需精确选择', () => {
  const service = read('src/services/client-debug.service.ts');
  const logger = read('src/utils/logger.ts');
  const ws = read('src/data/datasources/websocket.datasource.ts');
  assert.match(service, /MAX_BATCH = 10/);
  assert.match(service, /}, 1000\)/);
  assert.match(service, /uni\.request\(/);
  assert.match(service, /'device-id': this\.getInstanceID\(\)/);
  assert.match(service, /controlGranted/);
  // 当前合同是一次会话授权；逐动作弹窗回归由真实服务用例覆盖。
  assert.match(service, /后续不再弹窗/);
  assert.doesNotMatch(service, /确认诊断动作/);
  assert.match(service, /ble/);
  assert.match(logger, /installConsoleErrorCapture/);
  assert.match(logger, /reportGlobalError/);
  assert.match(logger, /stack: value\.stack/);
  assert.match(ws, /ws:user\.notify/);
});

test('Sentry 已从入口、依赖及构建配置中移除', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['sentry-uniapp'], undefined);
  assert.equal(existsSync(path.join(root, 'src/utils/observability.ts')), false);
  assert.doesNotMatch(read('src/main.ts'), /Sentry|initObservability/);
  assert.doesNotMatch(read('vite.config.ts'), /sentry/i);
  assert.doesNotMatch(read('src/config.ts'), /sentry/i);
});
