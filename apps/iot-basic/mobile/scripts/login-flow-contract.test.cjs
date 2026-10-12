const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '../..');

function readFromMobile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}


test('wechat login probes after agreement and only requests phone when needed', () => {
  const page = readFromMobile('src/packageUser/pages/login/index.vue');

  assert.match(
    page,
    /watch\(\s*\[\s*agreedProtocols\s*,\s*mode\s*\][\s\S]{0,260}attemptWxLogin\(false\)/,
    'checking the agreement should start wx.login probing without entering the app',
  );
  assert.match(
    page,
    /function handleToggleAgreement\(\)[\s\S]{0,220}agreedProtocols\.value = !agreedProtocols\.value/,
    'agreement tap should only toggle consent state',
  );
  assert.match(
    page,
    /v-if="!requiresWxPhoneAuth"[\s\S]{0,220}一键快捷登录[\s\S]{0,520}v-else-if="agreedProtocols"[\s\S]{0,240}open-type="getPhoneNumber"[\s\S]{0,220}一键快捷登录/,
    'getPhoneNumber should replace the one-click button only after wx.login reports phone authorization is needed',
  );
  assert.match(
    page,
    /const wxLoginProbeReady = ref\(false\)/,
    'wx.login probe success should be stored separately from app entry',
  );
  assert.match(
    page,
    /async function attemptWxLogin\(resumeAfterSuccess = false\)[\s\S]{0,900}wxLoginProbeReady\.value = true[\s\S]{0,260}if \(resumeAfterSuccess\)[\s\S]{0,180}handleAuthSuccess\('登录成功'\)/,
    'wx.login probing should only enter when resumed by an explicit button click',
  );
  assert.match(
    page,
    /function handleWxAutoLoginTap\(\)[\s\S]{0,360}wxLoginProbeReady\.value && authProvider\.isLoggedIn\(\)[\s\S]{0,220}handleAuthSuccess\('登录成功'\)[\s\S]{0,360}attemptWxLogin\(true\)/,
    'the normal one-click button should be the only path that resumes a successful wx.login probe',
  );
  assert.doesNotMatch(
    page,
    /v-if="!agreedProtocols"[\s\S]{0,260}v-else[\s\S]{0,180}open-type="getPhoneNumber"/,
    'agreeing to protocols alone must not make every login require getPhoneNumber',
  );
});

test('wechat mini program phone completion uses getPhoneNumber instead of the sms bind page', () => {
  const page = readFromMobile('src/packageUser/pages/login/index.vue');
  const provider = readFromMobile('src/providers/auth.provider.ts');
  const service = readFromMobile('src/services/auth.service.ts');
  const repository = readFromMobile('src/data/repositories/auth.repository.impl.ts');

  assert.match(
    page,
    /type WxPhoneAuthPurpose = 'quickLogin' \| 'bindAfterLogin'[\s\S]{0,1600}const wxPhoneAuthPurpose = ref<WxPhoneAuthPurpose>\('quickLogin'\)/,
    'login page should distinguish quick login from post-login phone binding',
  );
  assert.match(
    page,
    /#ifdef MP-WEIXIN[\s\S]{0,240}wxPhoneAuthPurpose\.value = 'bindAfterLogin'[\s\S]{0,240}requiresWxPhoneAuth\.value = true[\s\S]{0,240}return[\s\S]{0,80}#endif/,
    'wechat mini program should switch to getPhoneNumber when logged-in user still needs a phone',
  );
  assert.match(
    page,
    /#ifdef MP-WEIXIN[\s\S]{0,240}requiresWxPhoneAuth\.value = true[\s\S]{0,120}return[\s\S]{0,80}#endif[\s\S]{0,120}navigateTo\(\{ url: '\/packageUser\/pages\/bind-phone\/index' \}\)/,
    'wechat mini program should return before the sms bind-phone fallback',
  );
  assert.doesNotMatch(
    page,
    /return\s*\n\s*\/\/ #endif\s*\n\s*uni\.navigateTo\(\{ url: '\/packageUser\/pages\/bind-phone\/index' \}\)/,
    'wechat mini program return should not rely on ASI before the sms bind-phone fallback',
  );
  assert.match(
    page,
    /wxPhoneAuthPurpose\.value === 'bindAfterLogin'[\s\S]{0,180}authProvider\.bindPhoneByWxPhone\(phoneCode\)/,
    'wechat phone authorization should bind the current account after a successful login without phone',
  );
  assert.match(
    page,
    /open-type="getPhoneNumber"[\s\S]{0,220}<text class="login-btn__text">一键快捷登录<\/text>/,
    'wechat phone authorization should stay merged into the one-click login button copy',
  );
  assert.doesNotMatch(
    page,
    /授权手机号登录|授权手机号继续|wxPhoneAuthButtonText/,
    'merged wechat login should not expose a second-step phone-authorization copy',
  );
  assert.match(provider, /bindPhoneByWxPhone\(phoneCode: string\): Promise<void>/, 'auth provider should expose wechat phone binding');
  assert.match(service, /bindPhoneByWxPhone\(phoneCode: string\): Promise<UserEntity>/, 'auth service should refresh user after binding phone');
  assert.match(repository, /WX_MINI_PHONE_CODE_ID\s*=\s*'wxMiniPPhoneCode'/, 'repository should tag wechat phone-code binding explicitly');
});

test('wechat privacy authorization resolves through a real agreePrivacyAuthorization button', () => {
  const app = readFromMobile('src/App.vue');
  const service = readFromMobile('src/services/privacy-consent.service.ts');
  const readiness = readFromMobile('src/utils/ble-readiness.ts');
  const modal = readFromMobile('src/components/privacy-authorization-modal/privacy-authorization-modal.vue');
  const login = readFromMobile('src/packageUser/pages/login/index.vue');
  const bindPhone = readFromMobile('src/packageUser/pages/bind-phone/index.vue');
  const wifi = readFromMobile('src/packageBluetooth/pages/wifi/index.vue');
  const deviceBind = readFromMobile('src/packageDevice/pages/bind/index.vue');

  assert.match(
    service,
    /export const PRIVACY_AGREE_BUTTON_ID = 'agree-privacy-btn'/,
    'privacy resolver should share a stable agree button id',
  );
  assert.match(
    service,
    /resolve\(\{ event: 'agree', buttonId: buttonId \|\| PRIVACY_AGREE_BUTTON_ID \}\)/,
    'privacy resolver should pass the same id as the clicked agreement button',
  );
  assert.match(
    service,
    /event: 'exposureAuthorization'/,
    'privacy resolver should report exposure before resolving agree or disagree',
  );
  assert.match(
    service,
    /typeof wx === 'undefined'/,
    'privacy service should safely no-op outside the WeChat Mini Program runtime',
  );
  assert.doesNotMatch(
    app,
    /showPrivacyModal|uni\.showModal|requestAuthorization\(\)/,
    'App.vue should not resolve WeChat privacy authorization through a system modal',
  );
  assert.match(
    modal,
    /id="agree-privacy-btn"[\s\S]{0,220}open-type="agreePrivacyAuthorization"[\s\S]{0,220}@agreeprivacyauthorization="handleAgree"/,
    'privacy popup should expose a real WeChat privacy agreement button',
  );
  assert.match(
    modal,
    /privacyConsentService\.handleAgree\(PRIVACY_AGREE_BUTTON_ID\)/,
    'privacy popup should resolve authorization only after the real agree button event',
  );
  assert.match(login, /<privacy-authorization-modal\s*\/>/, 'login page should render the privacy authorization popup');
  assert.match(bindPhone, /<privacy-authorization-modal\s*\/>/, 'bind phone page should render the privacy authorization popup');
  assert.match(wifi, /<privacy-authorization-modal\s*\/>/, 'WiFi provisioning page should render the privacy authorization popup for Bluetooth privacy updates');
  assert.match(deviceBind, /<privacy-authorization-modal\s*\/>/, 'device bind page should render the privacy authorization popup for Bluetooth privacy updates');
  assert.match(
    readiness,
    /privacyConsentService\.requestAuthorization\(\)/,
    'BLE readiness should proactively check whether the updated privacy agreement requires confirmation',
  );
  assert.match(
    readiness,
    /const privacyAgreementResult = await ensurePrivacyAgreementReady\(\)[\s\S]*ensureMiniProgramBluetoothAuthorized\(appAuth,\s*interactive\)/,
    'BLE readiness should request Mini Program Bluetooth authorization only after privacy agreement confirmation',
  );
  assert.doesNotMatch(
    login,
    /open-type="getPhoneNumber\|agreePrivacyAuthorization"/,
    'login getPhoneNumber should stay plain and let the dedicated privacy popup resolve privacy authorization',
  );
  assert.doesNotMatch(
    bindPhone,
    /open-type="getPhoneNumber\|agreePrivacyAuthorization"/,
    'bind-phone getPhoneNumber should stay plain and let the dedicated privacy popup resolve privacy authorization',
  );
  assert.match(
    login,
    /logWxPhoneNumberCallback\('get-phone-number:callback'/,
    'login page should log the sanitized getPhoneNumber callback shape',
  );
  assert.match(
    bindPhone,
    /logger\.(info|warn)\('auth', 'bind-phone:get-phone-number:callback'/,
    'bind-phone page should log the sanitized getPhoneNumber callback shape',
  );
});

test('wechat login keeps the agreement-probe then two-button-state flow', () => {
  const page = readFromMobile('src/packageUser/pages/login/index.vue');

  assert.match(
    page,
    /watch\(\[agreedProtocols,\s*mode\][\s\S]{0,220}attemptWxLogin\(false\)/,
    'checking agreement should probe wx login before deciding the main button state',
  );
  assert.match(
    page,
    /v-if="!requiresWxPhoneAuth"[\s\S]{0,260}一键快捷登录/,
    'normal probed state should show WeChat quick login',
  );
  assert.match(
    page,
    /v-else-if="agreedProtocols"[\s\S]{0,240}open-type="getPhoneNumber"[\s\S]{0,220}一键快捷登录/,
    'unbound probed state should replace the main button with WeChat phone-number retrieval while keeping the button copy',
  );
  assert.doesNotMatch(page, /mode\.value = 'phone'[\s\S]{0,220}getPhoneNumber/, 'getPhoneNumber failure should not rewrite the WeChat probe flow into SMS login');
});

test('wechat login probe treats unregistered responses as expected branch data', () => {
  const request = readFromMobile('src/utils/request.ts');
  const repository = readFromMobile('src/data/repositories/auth.repository.impl.ts');
  const provider = readFromMobile('src/providers/auth.provider.ts');

  assert.match(request, /expectedApiCodes\?: number\[\]/, 'request options should allow expected business codes');
  assert.match(request, /isExpectedApiCode\(resp\.code, options\.expectedApiCodes\)/, 'request should recognize expected business codes');
  assert.match(request, /recordExpectedApiResponse\(error/, 'expected business codes should be logged without exception capture');
  assert.match(
    repository,
    /loginType: 'wxMiniP'[\s\S]{0,120}expectedApiCodes:\s*\[1000003,\s*1000033\]/,
    'wx login probe should mark unregistered or unbound codes as expected',
  );
  assert.match(provider, /import \{ ApiError, isApiError \}/, 'auth provider should preserve ApiError codes for login page branching');
  assert.match(provider, /isExpectedWxLoginProbeError\(e\)[\s\S]{0,120}throw e/, 'expected wx probe errors should pass through without console.error wrapping');
});

test('wechat phone-number failure explains WeChat-account unbound phone errors', () => {
  const login = readFromMobile('src/packageUser/pages/login/index.vue');
  const bindPhone = readFromMobile('src/packageUser/pages/bind-phone/index.vue');

  assert.match(
    login,
    /function normalizeWxPhoneNumberFailure\(errMsg: string\)[\s\S]{0,260}未绑定手机[\s\S]{0,220}微信客户端绑定手机号/,
    'login page should explain that getPhoneNumber can fail because the current WeChat account has no bound phone',
  );
  assert.match(
    bindPhone,
    /function normalizeWxPhoneNumberFailure\(errMsg: string\)[\s\S]{0,260}未绑定手机[\s\S]{0,220}手机号绑定/,
    'bind-phone page should guide users to SMS binding when WeChat has no bound phone',
  );
});
