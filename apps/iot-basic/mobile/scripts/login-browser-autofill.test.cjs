/** 模拟浏览器直接设置输入框值但不触发输入事件，验证登录前读取实际值。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('无输入事件的浏览器自动填充值在登录前同步', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/packageUser/pages/login/index.vue'), 'utf8');
  const match = source.match(/function syncBrowserAutofill\(\): void \{[\s\S]*?\n\}/);
  assert.ok(match, '应提供浏览器填充值同步');
  const js = ts.transpileModule(match[0], { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const account = { value: '' }, password = { value: '' };
  const document = { querySelectorAll: () => [{ value: 'remembered-user' }, { value: 'remembered-password' }] };
  new Function('document', 'account', 'password', `${js}; syncBrowserAutofill();`)(document, account, password);
  assert.equal(account.value, 'remembered-user');
  assert.equal(password.value, 'remembered-password');
  assert.match(source, /function handlePasswordLogin\(\)\s*\{[\s\S]*?syncBrowserAutofill\(\)[\s\S]*?requestAgreement/);
});
