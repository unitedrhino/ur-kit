/** 过期请求不能清除新登录会话，401 只跳转一次。 */
const fs = require('node:fs'); const path = require('node:path'); const ts = require('typescript');
const test = require('node:test'); const assert = require('node:assert/strict');
test('迟到的旧 token 401 不影响新会话', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/request.ts'), 'utf8');
  const body = source.match(/function handleTokenExpired\(requestToken: string\): void \{[\s\S]*?\n\}/)[0];
  const js = ts.transpileModule(body, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  let token = 'new'; const actions=[];
  const uni={removeStorageSync:k=>{actions.push('remove:'+k);if(k==='token')token='';},showToast:()=>{},reLaunch:o=>actions.push(o.url)};
  const bus={emit:x=>actions.push(x)};
  const invoke=new Function('uni','eventBus','localStorage','getToken','isOnLoginPage','LOGIN_URL',`let redirectingToLogin=false; ${js};return handleTokenExpired;`)(uni,bus,{remove:()=>{}},()=>token,()=>false,'/login');
  invoke('old'); assert.equal(token,'new'); assert.deepEqual(actions,[]);
  invoke('new'); assert.equal(token,''); assert.ok(actions.includes('/login')); assert.ok(actions.includes('auth:token-expired'));
  invoke('new'); assert.equal(actions.filter(x=>x==='/login').length,1);
});
