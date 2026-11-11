/** 账号登录协议交互：已同意直接提交，未同意必须明确确认。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

for (const app of ['mobile-uniapp']) {
  test(`${app} 登录操作根据勾选状态控制确认弹窗`, () => {
    const page = fs.readFileSync(path.join(__dirname, '../../', 'mobile', 'src/packageUser/pages/login/index.vue'), 'utf8');
    const functions = ['requestAgreement', 'cancelAgreement', 'confirmAgreement', 'handlePasswordLogin'].map(name => {
      const match = page.match(new RegExp(`function ${name}[^\\n]*\\{[\\s\\S]*?\\n\\}`));
      assert.ok(match, `${name} 缺失`);
      return match[0];
    }).join('\n');
    const code = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
    const loading = {value:false}, agreedProtocols = {value:false}, agreementDialogVisible = {value:false};
    let submits = 0, autofill = 0;
    const api = new Function('loading', 'agreedProtocols', 'agreementDialogVisible', 'syncBrowserAutofill', 'submitPasswordLogin', `let pendingAgreementAction = null; ${code}; return {handlePasswordLogin, confirmAgreement, cancelAgreement}`)(loading, agreedProtocols, agreementDialogVisible, () => autofill++, () => submits++);
    api.handlePasswordLogin();
    assert.equal(agreementDialogVisible.value, true); assert.equal(submits, 0);
    api.cancelAgreement(); assert.equal(agreementDialogVisible.value, false); assert.equal(agreedProtocols.value, false); assert.equal(submits, 0);
    api.handlePasswordLogin(); api.confirmAgreement(); assert.equal(agreedProtocols.value, true); assert.equal(submits, 1);
    api.handlePasswordLogin(); assert.equal(agreementDialogVisible.value, false); assert.equal(submits, 2); assert.equal(autofill, 3);
    loading.value = true; api.handlePasswordLogin(); assert.equal(submits, 2);
  });
}
