/** 时间展示回归：当前毫秒时间不能再次乘以千，旧秒接口保持兼容。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/utils/timestamp.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const target = {};
new Function('exports', code)(target);
test('秒与毫秒产生同一日期，零值和非法值不会生成错误年份', () => {
  const milliseconds = Date.UTC(2026, 10, 4, 10, 0, 0);
  assert.equal(target.timestampMillis(milliseconds / 1000), milliseconds);
  assert.equal(target.timestampMillis(milliseconds), milliseconds);
  for (const value of [0, -1, NaN, Infinity]) assert.equal(target.timestampMillis(value), 0);
});
