const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function listFiles(dir, predicate, files = []) {
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((entry) => {
    const relPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(relPath, predicate, files);
      return;
    }
    if (predicate(relPath)) {
      files.push(relPath);
    }
  });
  return files;
}

test('packageDevice keeps clone memory routes and implementation files', () => {
  const pagesJson = readJson('src/pages.json');
  const packageDevice = pagesJson.subPackages.find((item) => item.root === 'packageDevice');
  assert.ok(packageDevice, 'packageDevice subpackage should exist');

  const paths = packageDevice.pages.map((item) => item.path);
  assert.ok(paths.includes('pages/clone-memory/index'), 'clone memory page should be registered');
  assert.ok(paths.includes('pages/clone-session-detail/index'), 'clone session detail page should be registered');

  [
    'src/services/clone-memory.service.ts',
    'src/providers/clone-memory.provider.ts',
    'src/data/repositories/clone-memory.repository.impl.ts',
    'src/data/repositories/clone-session.repository.impl.ts',
    'src/domain/entities/clone-memory.entity.ts',
    'src/domain/entities/clone-session.entity.ts',
    'src/domain/entities/clone-session-message.entity.ts',
    'src/domain/interfaces/clone-memory.repository.ts',
    'src/domain/interfaces/clone-session.repository.ts',
    'src/packageDevice/pages/clone-memory/index.vue',
    'src/packageDevice/pages/clone-session-detail/index.vue',
  ].forEach((relPath) => {
    assert.ok(exists(relPath), `${relPath} should exist`);
  });
});

test('device entity and mapper preserve cloneID variants from backend DTOs', () => {
  const entity = read('src/domain/entities/device.entity.ts');
  const mapper = read('src/data/mappers/device.mapper.ts');

  assert.match(entity, /cloneID\??:\s*number/, 'DeviceEntity should expose cloneID');
  assert.match(mapper, /dto\.cloneID/, 'mapper should read cloneID');
  assert.match(mapper, /dto\.clone_id/, 'mapper should read clone_id');
  assert.match(mapper, /dto\.cloneId/, 'mapper should read cloneId');
});

test('login logo path points to an emitted static asset', () => {
  const brand = read('src/config/brand.ts');
  const match = brand.match(/logoPath:\s*'([^']+)'/);
  assert.ok(match, 'BRAND.logoPath should be configured');

  const logoPath = match[1].replace(/^\//, '');
  assert.ok(logoPath.startsWith('static/'), 'uni-app static assets should be referenced under /static');
  assert.ok(exists(`src/${logoPath}`), `${logoPath} should exist under src/static so uni emits it`);
  assert.ok(!exists(logoPath), `${logoPath} should not live in project-root static, which is not emitted for this app`);
});

test('login page keeps logo centered above the bottom login actions', () => {
  const login = read('src/packageUser/pages/login/index.vue');
  const brandBlock = login.match(/<view class="login-brand">([\s\S]*?)<\/view>/)?.[1] || '';
  const bottomStart = login.indexOf('<view class="login-bottom">');
  const sloganIndex = login.indexOf('<text class="login-slogan">{{appSlogan}}</text>');
  const legalIndex = login.indexOf('<view class="legal-row"', bottomStart);
  const autoLoginIndex = login.indexOf('一键快捷登录', bottomStart);
  const passwordLoginIndex = login.indexOf('使用账号密码登录', bottomStart);

  assert.match(brandBlock, /class="login-logo"/, 'brand area should render the logo');
  assert.doesNotMatch(brandBlock, /appName|appSlogan|login-slogan/, 'brand area should not contain app name or slogan copy');
  assert.ok(bottomStart >= 0, 'bottom action area should exist');
  assert.ok(sloganIndex > bottomStart, 'slogan should be inside the bottom action area');
  assert.ok(legalIndex > sloganIndex, 'agreement row should appear below the slogan');
  assert.ok(autoLoginIndex > legalIndex, 'WeChat one-click login action should appear below the agreement row');
  assert.ok(passwordLoginIndex > autoLoginIndex, 'account-password entry should appear below WeChat one-click login action');
  assert.match(login, /<view class="login-screen">/, 'login page should have a root screen container');
  assert.match(login, /\.login-screen\s*\{[\s\S]*height:\s*100vh/, 'login screen should fill the full viewport height');
  assert.match(login, /\.login-brand\s*\{[\s\S]*flex:\s*1 1 auto/, 'brand area should occupy remaining height');
  assert.match(login, /\.login-page\s*\{[\s\S]*flex:\s*1/, 'login content should fill the area below the custom nav bar');
  assert.match(login, /\.login-bottom\s*\{[\s\S]*flex-shrink:\s*0/, 'bottom action area should not collapse into the logo area');
});

test('login legal documents point to static hosted agreement pages', () => {
  const brand = read('src/config/brand.ts');

  assert.doesNotMatch(brand, /about:blank/, 'legal documents should not keep placeholder about:blank URLs');
  assert.match(brand, /title:\s*'用户隐私保护指引'[\s\S]*url:\s*'https:\/\/yunsunai\.net\/app\/static\/tmp\/privacy-policy-yunsun\.html\?v=20260519'/);
  assert.match(brand, /title:\s*'用户服务协议'[\s\S]*url:\s*'https:\/\/yunsunai\.net\/app\/static\/tmp\/user-service-agreement-yunsun\.html'/);
  assert.match(brand, /title:\s*'第三方信息共享清单'[\s\S]*url:\s*'https:\/\/yunsunai\.net\/app\/static\/tmp\/third-party-info-sharing-list-yunsun\.html'/);
  assert.match(brand, /LegalDocKey\s*=\s*'privacy-policy'\s*\|\s*'user-service-agreement'\s*\|\s*'third-party-share'/);
  assert.doesNotMatch(brand, /software-license/, 'old software-license key should be replaced by user-service-agreement');
});

test('login page does not preload debug account credentials', () => {
  const login = read('src/packageUser/pages/login/index.vue');

  assert.doesNotMatch(login, /administrator|iThings666|DEBUG_LOGIN_ACCOUNT|DEBUG_LOGIN_PASSWORD/, 'login page should not ship debug account credentials');
  assert.match(login, /const account = ref\(''\)/, 'account field should start empty');
  assert.match(login, /const password = ref\(''\)/, 'password field should start empty');
});

test('login page separates WeChat button login, WeChat phone authorization, and App SMS phone login', () => {
  const login = read('src/packageUser/pages/login/index.vue');

  assert.match(login, /#ifdef MP-WEIXIN[\s\S]*v-if="!requiresWxPhoneAuth"[\s\S]*一键快捷登录[\s\S]*v-else-if="agreedProtocols"[\s\S]*open-type="getPhoneNumber"[\s\S]*一键快捷登录[\s\S]*#endif/, 'WeChat phone authorization should replace the one-click button only when wx.login reports it is needed');
  assert.match(login, /quickLoginByWxPhone\(phoneCode\)/, 'WeChat getPhoneNumber click should combine wx login code and phone code in one flow');
  assert.doesNotMatch(login, /授权手机号登录|授权手机号继续|wxPhoneAuthButtonText/, 'merged WeChat login should not show a second-step phone authorization label');
  assert.match(login, /const wxLoginProbeReady = ref\(false\)/, 'WeChat login should remember a successful wx.login probe without entering automatically');
  assert.match(login, /async function attemptWxLogin\(resumeAfterSuccess = false\)/, 'WeChat login should probe with wx.login before requesting phone');
  assert.match(login, /isWxAccountUnboundError\(error/, 'WeChat login should centralize unbound-account detection');
  assert.match(login, /watch\(\[agreedProtocols,\s*mode\][\s\S]*attemptWxLogin\(false\)/, 'WeChat login should react to agreement with wx.login probing but not enter automatically');
  assert.match(login, /function handleWxAutoLoginTap\(\)[\s\S]*wxLoginProbeReady\.value && authProvider\.isLoggedIn\(\)[\s\S]*handleAuthSuccess\('登录成功'\)[\s\S]*attemptWxLogin\(true\)/, 'WeChat login should enter only after the one-click button is tapped');
  assert.doesNotMatch(login, /v-if="!agreedProtocols"[\s\S]*v-else[\s\S]*open-type="getPhoneNumber"/, 'checking agreement should not make every login use getPhoneNumber');
  assert.doesNotMatch(login, /wxAutoLoginStatusText[\s\S]*wxAutoLoginError\.value/, 'WeChat login errors should not be rendered as the primary action text');
  assert.match(login, /#ifdef APP-PLUS[\s\S]*phone-login-form[\s\S]*请输入手机号[\s\S]*请输入验证码[\s\S]*获取验证码[\s\S]*手机号登录[\s\S]*#endif/, 'App login should render SMS phone login form');
  assert.doesNotMatch(login, /#ifdef APP-PLUS[\s\S]*open-type="getPhoneNumber"[\s\S]*#endif/, 'App login should not use WeChat getPhoneNumber');
  assert.match(login, /const mode = ref<LoginMode>\(resolveInitialLoginMode\(\)\)/, 'initial login mode should be platform-aware');
  assert.match(login, /async function handlePhoneLogin\(\)/, 'App phone login should have a dedicated submit handler');
  assert.match(login, /async function handleSendPhoneLoginCode\(\)/, 'App phone login should request SMS captcha from the login page');
});

test('auth layer supports phone captcha login while keeping bind-phone captcha separate', () => {
  const authInterface = read('src/domain/interfaces/auth.repository.ts');
  const authRepo = read('src/data/repositories/auth.repository.impl.ts');
  const authService = read('src/services/auth.service.ts');
  const authProvider = read('src/providers/auth.provider.ts');
  const bindPhonePage = read('src/packageUser/pages/bind-phone/index.vue');

  assert.match(authInterface, /PhoneLoginParams/, 'auth repository interface should define phone login params');
  assert.match(authInterface, /loginByPhone\(params: PhoneLoginParams\): Promise<UserEntity>/, 'auth repository should expose loginByPhone');
  assert.match(authRepo, /loginType:\s*'phone'/, 'phone login should call login endpoint with loginType phone');
  assert.match(authRepo, /account:\s*params\.phone/, 'phone login should send phone as account');
  assert.match(authRepo, /code:\s*params\.code/, 'phone login should send sms code');
  assert.match(authRepo, /codeID:\s*params\.codeID/, 'phone login should send captcha codeID');
  assert.match(authService, /sendPhoneLoginCaptcha\(phone: string\)/, 'auth service should expose login captcha helper');
  assert.match(authService, /sendPhoneCaptcha\(\{\s*phone,\s*use:\s*'login'\s*\}\)/, 'login captcha helper should request use=login');
  assert.match(authProvider, /sendPhoneLoginCaptcha\(phone: string\)/, 'auth provider should expose login captcha helper');
  assert.match(authProvider, /loginByPhone\(phone: string,\s*code: string,\s*codeID: string\)/, 'auth provider should expose phone login');
  assert.match(bindPhonePage, /authProvider\.sendPhoneCaptcha\(phone\.value\)/, 'bind phone page should keep using bind-account captcha helper');
});

test('android app identity uses lianxi launcher icon and app name', () => {
  const manifest = readJson('src/manifest.json');
  const pages = readJson('src/pages.json');
  const pkg = readJson('package.json');
  const brand = read('src/config/brand.ts');

  assert.equal(manifest.name, '联犀Iot', 'Android launcher app name should match the requested app name');
  assert.equal(manifest.description, '联犀Iot 多端应用', 'manifest description should follow the app name');
  assert.equal(manifest.h5.title, '联犀Iot', 'H5 title should not keep the old SaaS IoT name');
  assert.equal(pages.globalStyle.navigationBarTitleText, '联犀Iot', 'default navigation title should not keep the old SaaS IoT name');
  assert.equal(pkg.description, '联犀Iot 多端应用（uni-app + Vue 3 + TS）', 'package metadata should not keep the old SaaS IoT name');
  assert.match(brand, /appName:\s*'联犀Iot'/, 'UI app name should match the requested app name');

  const icons = manifest['app-plus']?.distribute?.icons?.android || {};
  [
    ['hdpi', 'appRes/icons/72x72.png'],
    ['xhdpi', 'appRes/icons/96x96.png'],
    ['xxhdpi', 'appRes/icons/144x144.png'],
    ['xxxhdpi', 'appRes/icons/192x192.png'],
  ].forEach(([density, relPath]) => {
    assert.equal(icons[density], relPath, `${density} launcher icon should use generated lianxi asset`);
    assert.ok(exists(relPath), `${relPath} should be available from the project root for HBuilderX cloud pack`);
  });
});

test('android scan entry declares barcode module and requests camera permission before scanning', () => {
  const manifest = readJson('src/manifest.json');
  const page = read('src/pages/home/index.vue');
  const servicePath = 'src/services/scan-permission.service.ts';
  const androidPermissions = manifest['app-plus']?.distribute?.android?.permissions || [];

  assert.ok(manifest['app-plus']?.modules?.Barcode, 'App Android should include the Barcode module for uni.scanCode');
  assert.ok(
    androidPermissions.some((item) => item.includes('android.permission.CAMERA')),
    'App Android should declare CAMERA before requesting scan permission',
  );
  assert.ok(exists(servicePath), 'scan permission service should centralize App Android permission request');
  assert.match(page, /ensureScanCameraReady/, 'home scan should check camera readiness before uni.scanCode');
  assert.ok(
    page.indexOf('ensureScanCameraReady') < page.indexOf('uni.scanCode'),
    'camera readiness check should happen before uni.scanCode',
  );

  const service = read(servicePath);
  assert.match(service, /android\.permission\.CAMERA/, 'scan permission service should request CAMERA');
  assert.match(service, /requestPermissions/, 'scan permission service should actively request Android runtime permission');
});

test('tab pages use configurable brand identity instead of a back arrow', () => {
  const brand = read('src/config/brand.ts');
  const navBar = read('src/components/app-navigation-bar/app-navigation-bar.vue');

  assert.match(brand, /brandName:\s*'联犀'/, 'BRAND should expose a configurable default brandName');
  assert.match(navBar, /getNavigationBrandName/, 'navigation bar should resolve brandName through the tenant brand helper');
  assert.match(navBar, /getSingleTenantBrandLogoPath/, 'navigation bar should read the configured brand logo through the tenant brand helper');

  [
    'src/pages/home/index.vue',
    'src/pages/device/index.vue',
    'src/pages/scene/index.vue',
    'src/pages/mine/index.vue',
  ].forEach((relPath) => {
    const page = read(relPath);
    assert.match(page, /<app-navigation-bar\b[^>]*:brand="true"/, `${relPath} should enable brand navigation`);
    assert.doesNotMatch(page, /<app-navigation-bar\b[^>]*\bback="?true"?/, `${relPath} should not render a back arrow`);
  });
});

test('codegen entrypoint exists and targets the uni-app openapi directory', () => {
  assert.ok(exists('codegen.js'), 'package codegen script should have a local codegen.js');

  const codegen = read('codegen.js');
  assert.match(codegen, /src\/data\/openapi\/generated/, 'codegen should write under src/data/openapi/generated');
  assert.doesNotMatch(codegen, /miniprogram\/data\/openapi/, 'uni-app codegen should not target old miniprogram path');
});

test('vue-tsc configuration does not load the invalid uni-app language plugin', () => {
  const tsconfig = readJson('tsconfig.json');
  assert.ok(
    !tsconfig.vueCompilerOptions || !Array.isArray(tsconfig.vueCompilerOptions.plugins),
    'vueCompilerOptions.plugins should not point at @dcloudio/uni-app',
  );
});

test('request context is read through a leaf module to avoid provider import cycles', () => {
  const request = read('src/utils/request.ts');

  assert.ok(exists('src/utils/request-context.ts'), 'request-context leaf module should exist');
  assert.doesNotMatch(request, /providers\/tenant\.provider/, 'request.ts should not import tenantProvider');
  assert.doesNotMatch(request, /providers\/current-family\.provider/, 'request.ts should not import currentFamilyProvider');
  assert.match(request, /getRequestContext/, 'request.ts should read headers from request context helpers');
});

test('mine tenant switch uses an in-page selector instead of system action sheet', () => {
  const mine = read('src/pages/mine/index.vue');
  const tenantSwitchBlock = mine.slice(mine.indexOf('async function handleSwitchTenant'), mine.indexOf('async function handleSwitchFamily'));
  const familySwitchBlock = mine.slice(mine.indexOf('async function handleSwitchFamily'), mine.indexOf('function handleNavTo'));

  assert.match(mine, /mine-picker-sheet/, 'mine page should render an in-page tenant selector');
  assert.match(mine, /tenantPickerVisible/, 'mine page should control the tenant selector visibility in-page');
  assert.match(mine, /handleSelectTenant/, 'mine page should switch tenant from the selector item tap');
  assert.doesNotMatch(tenantSwitchBlock, /uni\.showActionSheet/, 'mine tenant switch should not rely on system action sheet');
  assert.match(familySwitchBlock, /uni\.showActionSheet/, 'mine family switch can keep its existing action sheet behavior');
});

test('personal account basics are routed and avoid album pre-authorization', () => {
  const pages = read('src/pages.json');
  const login = read('src/packageUser/pages/login/index.vue');
  const profile = read('src/packageUser/pages/profile/index.vue');
  const bindPhone = read('src/packageUser/pages/bind-phone/index.vue');

  [
    'pages/profile/index',
    'pages/account-security/index',
    'pages/bind-email/index',
    'pages/change-password/index',
    'pages/forgot-password/index',
  ].forEach((route) => {
    assert.match(pages, new RegExp(route.replace(/\//g, '\\/')), `${route} should be registered`);
  });
  assert.match(login, /forgot-password\/index/, 'login password mode should expose forgot password entry');
  assert.match(profile, /uni\.chooseImage/, 'profile avatar should use uni.chooseImage');
  assert.doesNotMatch(profile, /uni\.authorize|getSetting/, 'profile avatar should not pre-request album permission');
  assert.match(bindPhone, /open-type="getPhoneNumber"/, 'bind phone should prefer WeChat phone quick verification on mp-weixin');
});

test('mine digital life entry is gated until Beijing 2026-07-17 17:00', () => {
  const mine = read('src/pages/mine/index.vue');

  assert.match(mine, /v-if="showDigitalLifeMenuItem"[\s\S]{0,220}数字生命管理/, 'digital life entry should be conditionally rendered');
  assert.match(mine, /DIGITAL_LIFE_MENU_VISIBLE_AFTER_BEIJING_TIME\s*=\s*Date\.UTC\(2026,\s*6,\s*17,\s*9,\s*0,\s*0\)/, 'digital life entry should use Beijing 2026-07-17 17:00 as the fixed threshold');
  assert.match(mine, /isAfterBeijingDigitalLifeVisibleTime/, 'digital life entry should evaluate the absolute Beijing release time');
});

test('bind product selection card is gated until Beijing 2026-07-17 17:00', () => {
  const bind = read('src/packageDevice/pages/bind/index.vue');

  assert.match(bind, /v-if="showProductSelectionCard"[^>]*class="bind-section bind-section--products"[\s\S]{0,220}选择产品/, 'product selection card should be conditionally rendered');
  assert.match(bind, /PRODUCT_SELECTION_CARD_VISIBLE_AFTER_BEIJING_TIME\s*=\s*Date\.UTC\(2026,\s*6,\s*17,\s*9,\s*0,\s*0\)/, 'product selection card should use Beijing 2026-07-17 17:00 as the fixed threshold');
  assert.match(bind, /isAfterBeijingProductSelectionVisibleTime/, 'product selection card should evaluate the absolute Beijing release time');
});

test('unused packageAI routes and pages stay removed', () => {
  const pagesJson = readJson('src/pages.json');
  const minePreload = pagesJson.preloadRule['pages/mine/index'];

  assert.ok(!pagesJson.subPackages.some((item) => item.root === 'packageAI'), 'packageAI should not be registered as a subpackage');
  assert.ok(!minePreload.packages.includes('packageAI'), 'mine page should not preload packageAI');
  assert.ok(!exists('src/packageAI/pages/chat/index.vue'), 'AI chat page source should be removed');
  assert.ok(!exists('src/packageAI/pages/voice/index.vue'), 'AI voice page source should be removed');
});

test('runtime config splits app id and endpoints by output platform', () => {
  const config = read('src/config.ts');

  assert.doesNotMatch(config, /https:\/\/qing\.unitedrhino\.com/, 'apiBaseUrl should not point at qing');
  assert.doesNotMatch(config, /wss:\/\/qing\.unitedrhino\.com/, 'wsBaseUrl should not point at qing');
  assert.match(config, /type RuntimePlatform = 'mp-weixin' \| 'app-android' \| 'app-ios'/);
  assert.match(config, /function getRuntimePlatform\(\): RuntimePlatform/);
  assert.match(config, /getSystemInfoSync\(\)/, 'App should resolve Android/iOS from uni system info');
  assert.match(config, /VITE_API_BASE_URL/, 'apiBaseUrl should support env override');
  assert.match(config, /VITE_WS_BASE_URL/, 'wsBaseUrl should support env override');
  assert.match(config, /function normalizeWsBaseUrl\(/, 'wsBaseUrl should be normalized from env or apiBaseUrl');
  assert.equal((config.match(/apiBaseUrl:\s*normalizeApiBaseUrl\(apiBaseUrl,\s*''\)/g) || []).length, 9);
  assert.doesNotMatch(config, /saas\.unitedrhino\.com|120\.25\.49\.238/, 'public source must not embed environment addresses');
  assert.equal((config.match(/appId:\s*'700'/g) || []).length, 3, 'mp-weixin should use app-id 700');
  assert.equal((config.match(/appId:\s*'800'/g) || []).length, 3, 'Android App should use app-id 800');
  assert.equal((config.match(/appId:\s*'900'/g) || []).length, 3, 'iOS App should use app-id 900');
});

test('shared platform utility reads device platform for WiFi capability checks', () => {
  const platform = read('src/utils/platform.ts');

  assert.match(platform, /uni\.getDeviceInfo\(\)/, 'platform helper should read platform from device info');
  assert.match(platform, /uni\.getSystemInfoSync\(\)/, 'platform helper should fall back to system info when device info is unavailable');
  assert.match(platform, /return deviceInfo\.platform/, 'device platform should win over app-base fields');
  assert.doesNotMatch(platform, /const appBase = uni\.getAppBaseInfo\(\) as \{ platform\?: string \};[\s\S]*return appBase\.platform/, 'app-base info should not be the primary platform source');
});

test('custom navigation bar is renamed to avoid uni-components easycom conflict', () => {
  assert.ok(exists('src/components/app-navigation-bar/app-navigation-bar.vue'));
  assert.ok(!exists('src/components/navigation-bar/navigation-bar.vue'));

  const main = read('src/main.ts');
  assert.match(main, /app-navigation-bar\/app-navigation-bar\.vue/);
  assert.match(main, /app\.component\('app-navigation-bar'/);
  assert.doesNotMatch(main, /app\.component\('navigation-bar'/);

  listFiles('src', (relPath) => relPath.endsWith('.vue')).forEach((relPath) => {
    assert.doesNotMatch(read(relPath), /<\/?navigation-bar\b/, `${relPath} should use app-navigation-bar to avoid name conflicts`);
  });
});

test('scene create entry and form follow the non-ai design workflow', () => {
  const sceneList = read('src/pages/scene/index.vue');
  const page = read('src/packageScene/pages/create/index.vue');
  const provider = read('src/providers/scene-edit.provider.ts');

  assert.match(sceneList, /create-type-sheet/, 'scene list should expose a manual or automation create menu');
  assert.match(sceneList, /createScene\('manual'\)/, 'manual scene creation should use an explicit type entry');
  assert.match(sceneList, /createScene\('auto'\)/, 'automation scene creation should use an explicit type entry');
  assert.doesNotMatch(page, /<scene-ai-assistant\b/, 'scene create page should not expose the AI assistant entry');
  assert.doesNotMatch(page, /AI\s*辅助|AI 创建|AI 修改/, 'scene create page should not show AI helper copy');
  assert.doesNotMatch(provider, /applyAiPatch|scene-ai-patch/, 'scene edit provider should not depend on scene AI patch flow');
  assert.doesNotMatch(page, /uni\.showActionSheet/, 'scene create page should use in-page bottom sheets instead of system action sheets');
  assert.match(page, /onBackPress/, 'scene create page should guard physical back/navigation back');
  assert.match(page, /退出后修改将丢失/, 'dirty scene edits should warn before leaving');
  assert.match(page, /创建手动控制/, 'manual create page should use the design title');
  assert.match(page, /创建自动化/, 'automation create page should use the design title');
  assert.match(page, /添加触发条件/, 'automation create page should expose the trigger add card');
  assert.match(page, /添加执行动作/, 'scene create page should expose the action add card');
  assert.match(provider, /isDirty/, 'scene edit provider should expose dirty state');
  assert.match(provider, /originalSnapshot/, 'scene edit provider should track the original snapshot');
  assert.match(provider, /getValidation/, 'scene edit provider should expose validation state for save gating');
});

test('icon registry centralizes tabler, custom, tab bar, and area icon contracts', () => {
  assert.ok(exists('src/config/icons.ts'), 'icon registry should exist');
  assert.ok(exists('src/components/app-icon/app-icon.vue'), 'app-icon component should exist');
  assert.ok(exists('scripts/generate-icons.cjs'), 'icon generation script should exist');
  assert.ok(exists('src/static/icons/custom/ur/toilet.svg'), 'custom ur:toilet icon should exist');

  const main = read('src/main.ts');
  const icons = read('src/config/icons.ts');

  assert.match(main, /app-icon\/app-icon\.vue/, 'app-icon should be globally registered');
  assert.match(main, /app\.component\('app-icon'/, 'app-icon should be available to pages');
  assert.match(icons, /ICON_SET_PREFIX\s*=\s*'tabler'/, 'Tabler should be the primary Iconify set');
  assert.match(icons, /CUSTOM_ICON_PREFIX\s*=\s*'ur'/, 'custom icons should use the ur prefix');
  assert.match(icons, /tabler:home/, 'tabBar home icon should come from the registry');
  assert.match(icons, /ur:toilet/, 'area icons should include the custom toilet icon');
  assert.match(icons, /LEGACY_AREA_ICON_MAP/, 'legacy area icon values should be normalized');
});

test('area icons save standard icon keys while preserving legacy emoji reads', () => {
  const areaIcons = read('src/config/area-icons.ts');
  const roomEdit = read('src/packageUser/pages/room-edit/index.vue');
  const roomManage = read('src/packageUser/pages/room-manage/index.vue');
  const editArea = read('src/packageDevice/pages/edit-area/index.vue');

  assert.doesNotMatch(areaIcons, /value:\s*'[^\n']*[🛋🛏🚪🍳🚿🚽📚🍽👶🧺🚗🌳🎮💼📦]/, 'AREA_ICONS values should not store emoji');
  assert.match(areaIcons, /normalizeAreaIcon/, 'area icon config should expose a legacy normalizer');
  assert.match(roomEdit, /normalizeAreaIcon/, 'room edit should normalize existing backend values');
  assert.match(roomEdit, /handleSelectIcon\(item\.value\)/, 'room edit should save the standard icon key');
  assert.match(roomManage, /normalizeAreaIcon/, 'room manage should render legacy area icon values through the normalizer');
  assert.match(editArea, /normalizeAreaIcon/, 'device area picker should render legacy area icon values through the normalizer');
});

test('migrated UI icon usage goes through app-icon instead of scattered glyphs', () => {
  const files = [
    'src/pages/home/index.vue',
    'src/pages/scene/index.vue',
    'src/packageScene/pages/create/index.vue',
    'src/packageBluetooth/pages/wifi/index.vue',
    'src/packageBluetooth/pages/progress/index.vue',
    'src/packageBluetooth/pages/result/index.vue',
    'src/components/app-search-bar/app-search-bar.vue',
    'src/components/set-password/set-password.vue',
  ];

  files.forEach((relPath) => {
    const source = read(relPath);
    assert.doesNotMatch(source, /iconfont\s+icon-/, `${relPath} should not use iconfont classes`);
    assert.doesNotMatch(source, />[🏠📷🔔⚠️📱⚡▶☁]\s*</, `${relPath} should not render migrated emoji icons directly`);
    assert.doesNotMatch(source, />[＋+✓⚙↻⌕◷◴]\s*</, `${relPath} should not render migrated symbol icons directly`);
  });
});

test('bluetooth provisioning progress centers status icons and uses loading for the active step', () => {
  const page = read('src/packageBluetooth/pages/progress/index.vue');

  assert.match(page, /<view v-if="item\.status === 'active'" class="progress-item__spinner"/, 'active provisioning step should render an inline loading spinner');
  assert.match(page, /<app-icon v-else-if="item\.status === 'done'"/, 'completed provisioning step should still render the check icon');
  assert.match(page, /\.progress-item\s*\{[\s\S]*align-items:\s*center/, 'progress status icon should be vertically centered with the two-line status text');
  assert.doesNotMatch(page, /progress-item--active \.progress-item__dot\s*\{[\s\S]*background:\s*var\(--color-primary\)/, 'active provisioning step should not be a solid status dot');
  assert.match(page, /\.progress-item__spinner\s*\{[\s\S]*width:\s*18px[\s\S]*height:\s*18px[\s\S]*animation:\s*progress-item-spin/, 'inline spinner should fit inside the same centered status slot');
});

test('android tab pages avoid pull-refresh and scroll gesture competition', () => {
  const pages = read('src/pages.json');
  const home = read('src/pages/home/index.vue');
  const device = read('src/pages/device/index.vue');
  const scene = read('src/pages/scene/index.vue');
  const appIcon = read('src/components/app-icon/app-icon.vue');

  assert.doesNotMatch(pages, /"enablePullDownRefresh"\s*:\s*true/, 'tab pages should not enable native page pull refresh while using scroll-view lists');
  assert.doesNotMatch(home, /refresher-enabled/, 'home list should not enable scroll-view pull refresh');
  assert.doesNotMatch(device, /refresher-enabled/, 'device list should not enable scroll-view pull refresh');
  assert.doesNotMatch(scene, /refresher-enabled/, 'scene list should not enable scroll-view pull refresh');
  assert.match(home, /height:\s*\$\{scrollHeight\}/, 'home list should have an explicit scroll height');
  assert.match(device, /height:\s*\$\{pageHeight\}/, 'device list should have an explicit scroll height');
  assert.match(scene, /height:\s*\$\{pageHeight\}/, 'scene list should have an explicit scroll height');
  assert.match(appIcon, /#ifdef APP-PLUS/, 'app-icon should provide an Android App fallback');
  assert.match(appIcon, /pointer-events:\s*none/, 'icons should not steal parent tap events');
  assert.match(appIcon, /'tabler:chevron-down':\s*'▼'/, 'home family dropdown should render a solid down triangle on Android App');
  assert.match(appIcon, /'tabler:chevron-left':\s*'‹'/, 'Android App fallback should render a real back chevron');
  assert.match(appIcon, /'tabler:inbox':\s*'空'/, 'empty-state inbox icon should not degrade to a missing square on Android App');
  assert.match(appIcon, /'tabler:devices-off':\s*'空'/, 'no-device empty icon should not degrade to a missing square on Android App');
  assert.match(appIcon, /display:\s*inline-flex/, 'text fallback icons should center glyphs inside circular buttons');
  assert.match(appIcon, /align-items:\s*center/, 'text fallback icons should be vertically centered');
  assert.match(appIcon, /justify-content:\s*center/, 'text fallback icons should be horizontally centered');
});

test('scene create page handles Android back and uses left-facing back icons', () => {
  const icons = read('src/config/icons.ts');
  const appIcon = read('src/components/app-icon/app-icon.vue');
  const page = read('src/packageScene/pages/create/index.vue');

  assert.match(icons, /back:\s*'tabler:chevron-left'/, 'common back icon should point left');
  assert.match(appIcon, /'tabler:chevron-left':\s*'‹'/, 'App fallback should cover chevron-left');
  assert.ok(exists('src/static/icons/generated/tabler-chevron-left.svg'), 'chevron-left SVG should be generated');
  assert.match(page, /<app-navigation-bar[^>]*\bcustom-back\b/, 'main create nav should use the shared back button event path');
  assert.doesNotMatch(page, /<app-icon name="tabler:chevron-right" :size="2[24]"/, 'sub-page back actions should not use right-facing chevrons');
  assert.match(page, /function handleAndroidBack\(\): boolean/, 'Android hardware back should route through one handler');
  assert.match(page, /return false;/, 'clean Android hardware back should fall through to uni-app default navigation');
  assert.doesNotMatch(page, /plus\.key\.addEventListener\('backbutton'/, 'Android App should not stack a second native plus back listener');
  assert.match(page, /function closeTransientLayer\(\): boolean/, 'hardware back should first close sheets and pickers');
  assert.match(page, /if \(activeSheet\.value\)/, 'hardware back should close bottom sheets before leaving the page');
  assert.match(page, /if \(productPickerVisible\.value\)/, 'hardware back should close product picker before leaving the page');
  assert.match(page, /if \(viewMode\.value !== 'main'\)/, 'hardware back should return sub-edit pages to the main form');
});

test('device cards use a non-native select event for App navigation payloads', () => {
  const card = read('src/components/device-card/device-card.vue');
  const home = read('src/pages/home/index.vue');
  const device = read('src/pages/device/index.vue');

  assert.match(card, /\(e:\s*'select'/, 'device-card should emit a custom select event');
  assert.match(card, /emit\('select',\s*payload\)/, 'device-card should emit device identity through select');
  assert.match(home, /@select="handleDeviceTap"/, 'home device cards should listen to select instead of native tap');
  assert.match(device, /@select="handleDeviceTap"/, 'device tab cards should listen to select instead of native tap');
});

test('management action rows use block tap targets on App', () => {
  const family = read('src/packageUser/pages/family-manage/index.vue');
  const room = read('src/packageUser/pages/room-manage/index.vue');
  const tenant = read('src/packageUser/pages/tenant-manage/index.vue');

  [
    ['family manage', family],
    ['room manage', room],
  ].forEach(([name, source]) => {
    assert.doesNotMatch(source, /<text class="[^"]*card__action[^"]*"[^>]*@tap=/, `${name} should not use inline text as the only tap target`);
    assert.match(source, /<view class="[^"]*card__action[^"]*"[^>]*@tap\.stop=/, `${name} should use block action tap targets`);
  });
  assert.doesNotMatch(tenant, /card__action[^"]*"[^>]*@tap=/, 'tenant manage should not expose management action rows');
});

test('provisioning after BLE scan prefers uni runtime APIs on Android App', () => {
  const wifi = read('src/services/wifi-credential.service.ts');
  const readiness = read('src/utils/ble-readiness.ts');
  const bluetooth = read('src/services/bluetooth-config.service.ts');
  const datasource = read('src/data/datasources/bluetooth.datasource.ts');

  assert.match(wifi, /typeof uni !== 'undefined'[\s\S]*return uni as unknown as WxWifiApi/, 'WiFi credential service should prefer uni on App');
  assert.match(wifi, /WIFI_LIST_TIMEOUT_MS/, 'WiFi list lookup should not hang forever when App does not emit the list callback');
  assert.match(readiness, /function getRuntimeApi\(\)[\s\S]*typeof uni !== 'undefined'[\s\S]*typeof wx !== 'undefined'/, 'BLE readiness should choose uni first and wx only as fallback');
  assert.match(bluetooth, /GATT_OPERATION_SETTLE_MS/, 'Android App BLE writes should wait for pending MTU and notify GATT operations to settle');
  assert.match(bluetooth, /function getRuntimeApi\(\)[\s\S]*getBLEMTU[\s\S]*api\.call\(runtimeApi/, 'BLE MTU calls should use the selected runtime API');
  assert.match(bluetooth, /setBLEMTU[\s\S]*api\.call\(runtimeApi/, 'BLE MTU negotiation should use the selected runtime API');
  // 扫描重试只注销本轮回调；零参数注销会误删其他业务监听。
  assert.match(datasource, /offBluetoothDeviceFound[\s\S]*offFn\.call\(runtimeApi, handler\)/, 'BLE scan cleanup should target its own handler on the selected runtime API');
  assert.doesNotMatch(datasource, /offFn\.call\(runtimeApi\)/, 'BLE scan cleanup must not remove all listeners');
});

test('BLE readiness blocks reduced-accuracy WeChat location before scanning', () => {
  const readiness = read('src/utils/ble-readiness.ts');
  const wifiPage = read('src/packageBluetooth/pages/wifi/index.vue');
  const bluetooth = read('src/services/bluetooth-config.service.ts');

  assert.match(readiness, /locationReducedAccuracy\?: boolean/, 'BLE readiness should read WeChat precise-location status');
  assert.match(readiness, /'location_reduced_accuracy'/, 'BLE readiness should expose a precise-location failure reason');
  assert.match(readiness, /'privacy_not_declared'/, 'BLE readiness should expose WeChat privacy declaration failures separately');
  assert.match(readiness, /fail\.errno === 112/, 'BLE readiness should recognize WeChat privacy declaration errno 112');
  assert.match(readiness, /privacy agreement/, 'BLE readiness should recognize privacy-agreement failure messages');
  assert.match(readiness, /function formatOpenAdapterFail/, 'BLE readiness should log Bluetooth adapter failures as plain fields');
  assert.match(readiness, /appAuth\.locationReducedAccuracy === true/, 'BLE readiness should block when WeChat location is not precise');
  assert.match(readiness, /checkLocationPrerequisite\(sys,\s*appAuth\)/, 'BLE readiness should check location before opening the Bluetooth adapter');
  assert.match(readiness, /请开启精确位置/, 'guide should explain that precise location is required for scanning');
  assert.match(readiness, /蓝牙隐私声明未配置/, 'guide should explain when the Mini Program backend privacy declaration is missing');
  assert.match(wifiPage, /case 'privacy_not_declared': return '蓝牙隐私声明未配置'/, 'WiFi page should not collapse privacy declaration failures into adapter busy');
  assert.match(bluetooth, /result\.reason === 'privacy_not_declared'[\s\S]*\? '蓝牙隐私声明未配置'/, 'Bluetooth service should surface privacy declaration failures in thrown errors');
});

test('BLE readiness actively requests Mini Program Bluetooth permission before opening adapter', () => {
  const readiness = read('src/utils/ble-readiness.ts');
  const manifest = readJson('src/manifest.json');
  const brand = read('src/config/brand.ts');

  assert.equal(
    manifest['mp-weixin'].permission['scope.bluetooth']?.desc,
    '用于蓝牙配网时发现、连接附近设备并下发网络配置',
    'WeChat Mini Program manifest should declare the Bluetooth scope used by provisioning',
  );
  assert.match(
    brand,
    /afterLogin:\s*\{[\s\S]{0,120}bluetooth:\s*false/,
    'login should not silently warm up Bluetooth before the user enters provisioning',
  );
  assert.match(readiness, /const BLUETOOTH_AUTHORIZE_SCOPE = 'scope\.bluetooth'/, 'BLE readiness should keep the Mini Program Bluetooth scope explicit');
  assert.match(readiness, /const LOCATION_AUTHORIZE_SCOPE = 'scope\.userLocation'/, 'BLE readiness should keep the Mini Program location scope explicit for Android scans');
  assert.match(readiness, /privacyConsentService\.requestAuthorization\(\)/, 'BLE readiness should ask WeChat whether the updated privacy agreement needs confirmation');
  assert.match(readiness, /await ensureMiniProgramBluetoothAuthorized\(appAuth,\s*interactive\)/, 'readiness should request Mini Program authorization before opening the adapter');
  assert.match(readiness, /interactive\?: boolean/, 'readiness should distinguish silent checks from user-triggered permission requests');
  assert.match(readiness, /authorizeMiniProgramScope\(BLUETOOTH_AUTHORIZE_SCOPE\)/, 'user-triggered readiness should request the Mini Program Bluetooth scope');
  assert.match(readiness, /ensureAndroidLocationAuthorizedForBleScan/, 'user-triggered readiness should request Android location permission before BLE scanning');
  assert.match(readiness, /if \(scopeStatus === undefined && !interactive\)[\s\S]*reason: 'scope_not_determined'/, 'silent readiness should not open the adapter before Bluetooth permission has been requested');
  assert.match(readiness, /if \(scopeStatus === false\)[\s\S]*return \{ ok: false,\s*reason: 'scope_denied' \}/, 'only explicit Mini Program authorization denial should surface scope_denied');
  assert.match(readiness, /const privacyAgreementResult = await ensurePrivacyAgreementReady\(\)[\s\S]*ensureMiniProgramBluetoothAuthorized\(appAuth,\s*interactive\)/, 'Bluetooth scope authorization should happen only after privacy agreement confirmation');
});

test('BLE readiness serializes adapter opening to avoid first-entry busy errors', () => {
  const readiness = read('src/utils/ble-readiness.ts');

  assert.match(readiness, /let pendingBluetoothReady: Promise<BleReadinessResult> \| null = null/, 'BLE readiness should share an in-flight adapter initialization');
  assert.match(readiness, /if \(pendingBluetoothReady\) return pendingBluetoothReady/, 'concurrent readiness checks should reuse the in-flight promise');
  assert.match(readiness, /pendingBluetoothReady = null/, 'in-flight readiness state should be cleared after completion');
  assert.match(readiness, /openBluetoothAdapterWithRetry/, 'adapter opening should have a small retry for transient busy failures');
});

test('wifi provisioning page does not prefill test WiFi credentials', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.doesNotMatch(page, /18059688688/, 'WiFi password should not ship with a test default');
  assert.match(page, /const ssid = ref\(''\)/, 'WiFi SSID input should start empty');
  assert.match(page, /const password = ref\(''\)/, 'WiFi password input should start empty');
  assert.match(page, /ssid\.value = selectedSsid/, 'selecting a WiFi option should still fill the chosen SSID');
});

test('wifi provisioning page fills current system WiFi before manual edits', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.match(page, /const ssidDirty = ref\(false\)/, 'WiFi page should track whether the user has edited SSID manually');
  assert.match(page, /function syncSsidFromCurrent\(\)/, 'WiFi page should centralize current SSID sync');
  assert.match(page, /if \(ssidDirty\.value\) return/, 'current SSID sync should not overwrite manual input');
  assert.match(page, /ssid\.value = currentSsid\.value/, 'current SSID should populate the WiFi name input');
  assert.match(page, /syncSsidFromCurrent\(\)[\s\S]*guideVisible\.value = state\.needsGuide && !ssid\.value/, 'state sync should fill SSID before guide visibility is calculated');
});

test('wifi provisioning page uses an editable WiFi select input without band restrictions', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');
  const prepare = read('src/packageBluetooth/pages/prepare/index.vue');
  const result = read('src/packageBluetooth/pages/result/index.vue');

  assert.doesNotMatch(page, /建议使用 2\.4G|5G 频段|当前为 5G WiFi|PRODUCT_SUPPORTS_WIFI_5G|wifi-item__band|wifi-item--5g|isWifi5G/, 'WiFi page should not show or enforce old 2.4G/5G restrictions');
  assert.doesNotMatch(prepare, /2\.4G|5G/, 'prepare page should not warn about WiFi bands');
  assert.doesNotMatch(result, /2\.4G|5G/, 'result page should not warn about WiFi bands');
  assert.match(page, /const wifiListLoading = ref\(false\)/, 'WiFi page should expose input-side loading state while fetching WiFi list');
  assert.match(page, /const wifiPickerVisible = ref\(false\)/, 'WiFi page should keep the scanned WiFi list as an input dropdown');
  assert.match(page, /<input class="field__input"[\s\S]*@focus="handleSsidFocus"/, 'WiFi name input should stay editable and open choices on focus');
  assert.match(page, /class="wifi-input-action"[\s\S]*<loading v-if="wifiListLoading"/, 'WiFi list loading should render on the right side of the input');
  assert.match(page, /filteredWifiList/, 'WiFi dropdown should render selectable scan results from the input field');
  assert.match(page, /function handleSelectWifi\(selectedSsid: string\)[\s\S]*wifiPickerVisible\.value = false/, 'selecting a WiFi option should fill the input and close the dropdown');
});

test('wifi provisioning dropdown reopens the full list after selecting an SSID', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.match(page, /const wifiInputFilterActive = ref\(false\)/, 'WiFi page should distinguish typed filtering from selected SSID display');
  assert.match(page, /if \(!keyword \|\| !wifiInputFilterActive\.value\) return wifiList\.value/, 'dropdown should show the full list unless the user is actively typing');
  assert.match(page, /function handleSelectWifi\(selectedSsid: string\)[\s\S]*wifiInputFilterActive\.value = false[\s\S]*wifiPickerVisible\.value = false/, 'selecting an SSID should stop filtering so reopening shows all options');
  assert.match(page, /function handleSsidInput\(e: any\)[\s\S]*wifiInputFilterActive\.value = true/, 'manual input should enable list filtering');
  assert.match(page, /function handleSsidFocus\(\)[\s\S]*wifiInputFilterActive\.value = false/, 'focusing the selected input should reopen the full WiFi list');
});

test('wifi provisioning dropdown deduplicates SSIDs and scrolls with readable signal labels', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.match(page, /function normalizeWifiListBySsid\(list: WifiOption\[\]\): WifiOption\[\]/, 'WiFi page should deduplicate scan results by SSID');
  assert.match(page, /existingSignal[\s\S]*nextSignal[\s\S]*deduped\.set\(key,\s*item\)/, 'deduplication should keep the stronger duplicate network');
  assert.match(page, /function formatWifiSignalText\(rssi: number \| undefined\): string/, 'WiFi page should convert signal values into text labels');
  assert.match(page, /信号强[\s\S]*信号一般[\s\S]*信号弱/, 'signal labels should be readable text instead of percentages');
  assert.match(page, /<scroll-view[\s\S]*class="wifi-select-list"[\s\S]*scroll-y[\s\S]*:style="\{ height: wifiSelectListHeight \}"/, 'WiFi dropdown should use a bounded scroll-view');
  assert.doesNotMatch(page, /\{\{item\.rssi \|\| 0\}\}%/, 'WiFi dropdown should not show raw signal percentages');
});

test('wifi provisioning page stores credentials locally before readiness checks and exposes password eye toggle', () => {
  const page = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.match(page, /import \{ localStorage \} from '\.\.\/\.\.\/\.\.\/data\/datasources\/local-storage\.datasource'/, 'WiFi page should use the shared local storage datasource');
  assert.match(page, /const WIFI_CREDENTIAL_CACHE_KEY = 'provision_wifi_credential'/, 'WiFi page should keep a stable local cache key for credentials');
  assert.match(page, /function saveLocalWifiCredential\(ssidValue: string,\s*passwordValue: string\)[\s\S]*localStorage\.set<LocalWifiCredentialCache>/, 'WiFi page should save the entered SSID and password locally');
  assert.match(page, /ssid: ssidValue,[\s\S]*password: passwordValue,[\s\S]*updatedAt: Date\.now\(\)/, 'local WiFi cache should be updated with the latest submitted values');
  assert.match(page, /saveLocalWifiCredential\(ssidTrimmed,\s*password\.value\)[\s\S]*if \(!bluetoothReady\.value\)/, 'WiFi credentials should be stored before Bluetooth readiness checks and provisioning result');
  assert.match(page, /function applyLocalWifiCredential\(\)[\s\S]*ssid\.value = cache\.ssid[\s\S]*password\.value = cache\.password/, 'WiFi page should restore saved credentials into empty form fields');
  assert.match(page, /const passwordVisible = ref\(false\)/, 'WiFi password input should track eye-toggle visibility');
  assert.match(page, /:password="!passwordVisible"/, 'WiFi password input should use the visibility state');
  assert.match(page, /function togglePasswordVisible\(\)[\s\S]*passwordVisible\.value = !passwordVisible\.value/, 'WiFi password eye should toggle visibility');
  assert.match(page, /:name="passwordVisible \? 'tabler:eye' : 'tabler:eye-off'"/, 'WiFi password eye should use the standard eye icons');
  assert.match(page, /\.password-eye\s*\{[\s\S]*width:\s*34px[\s\S]*height:\s*34px[\s\S]*color:\s*var\(--text-secondary\)/, 'WiFi password eye should have a stable tap target');
});

test('failed provisioning retry returns to editable WiFi credentials instead of resending old values', () => {
  const page = read('src/packageBluetooth/pages/result/index.vue');
  const retryBlock = page.slice(page.indexOf('function handleRetry'), page.indexOf('function handleBackWifi'));

  // TASK-143 由统一返回函数分流：首次绑定回 Wi-Fi，换网回设备设置重新开启窗口。
  assert.match(retryBlock, /handleBackWifi\(\)/, 'retry should delegate to the mode-aware return path');
  assert.match(page, /function handleBackWifi[\s\S]*uni\.redirectTo\(\{\s*url:\s*'\/packageBluetooth\/pages\/wifi\/index'\s*\}\)/, 'initial binding should still return to the editable WiFi form');
  assert.doesNotMatch(retryBlock, /provisionProvider\.retry|provisionProvider\.submitWifi|provisionProvider\.start/, 'retry should not resend cached WiFi credentials directly');
});

test('provision result page initializes from current provider state before subscribing', () => {
  const page = read('src/packageBluetooth/pages/result/index.vue');

  assert.match(page, /const initialState = provisionProvider\.getState\(\)/, 'result page should read the current result before first render');
  assert.match(page, /const success = ref\(initialState\.result\.success\)/, 'success state should not default to failed before provider sync');
  assert.match(page, /function syncResultState\(state: ProvisionProviderState\)/, 'result page should centralize result state syncing');
  assert.match(page, /syncResultState\(provisionProvider\.getState\(\)\)/, 'onLoad should refresh from provider state before subscribing');
  assert.match(page, /v-if="failure" class="tips-card"/, 'failure tips should only appear after a real failure result exists');
  assert.match(page, /v-else-if="failure"/, 'retry actions should only appear after a real failure result exists');
});

test('wifi credential service attempts current WiFi lookup in WeChat devtools', () => {
  const service = read('src/services/wifi-credential.service.ts');

  assert.match(service, /value\.includes\('devtools'\)/, 'WeChat DevTools should use the current-WiFi lookup path instead of manual mode');
});

test('provisioning BLE scan accepts LLSync FFF0 advertisements with manufacturer data', () => {
  const bluetooth = read('src/services/bluetooth-config.service.ts');
  const datasource = read('src/data/datasources/bluetooth.datasource.ts');
  const model = read('src/domain/models/ble-scan-result.model.ts');

  assert.match(model, /advertisData\?:\s*ArrayBuffer/, 'BLE scan result should preserve manufacturer data');
  assert.match(datasource, /advertisData:\s*normalizeAdvertisData\(d\.advertisData\)/, 'BLE datasource should map advertisData from WeChat scan result as ArrayBuffer');
  assert.match(bluetooth, /parseLLSyncAdvertisingData/, 'BLE provisioning scan should parse LLSync manufacturer data');
  assert.match(bluetooth, /hasLLSyncAdvertisingService/, 'BLE provisioning scan should require FFF0 advertising service');
  assert.match(bluetooth, /bleDataSource\.startScan\(\[LLSYNC_ADVERTISING_SERVICE_UUID\]\)/, 'BLE scan should request LLSync FFF0 devices');
  assert.doesNotMatch(bluetooth, /PROVISION_BLE_NAME_PREFIX|xdtp-/, 'BLE provisioning scan should not depend on the old temporary name prefix');
});

test('device bind scan header uses a lightweight status indicator instead of a second spinner', () => {
  const page = read('src/packageDevice/pages/bind/index.vue');

  assert.doesNotMatch(page, /<loading v-if="scanning"[\s\S]*scan-status-strip__title/, 'scan header should not duplicate the main scanning spinner');
  assert.match(page, /scan-status-strip__signal--active/, 'scan header should use a lightweight active status indicator');
  assert.match(page, /scan-status-pulse/, 'active scan status indicator should have a subtle pulse animation');
});

test('device bind page refreshes nearby-device scan whenever the page becomes visible', () => {
  const page = read('src/packageDevice/pages/bind/index.vue');

  assert.match(page, /import \{ onLoad,\s*onShow,\s*onUnload \} from '@dcloudio\/uni-app'/, 'bind page should listen to onShow');
  assert.match(page, /onShow\(async \(\) => \{[\s\S]*bluetoothConfigService\.stopScan\(\)[\s\S]*void startScan\(\)/, 'returning to bind page should stop stale scan and search again');
  assert.doesNotMatch(page, /Promise\.allSettled\(\[loadCategoriesAndProducts\(\), startScan\(\)\]\)/, 'initial load should not be the only scan trigger');
});

test('home add popover closes before navigating from menu actions', () => {
  const home = read('src/pages/home/index.vue');

  assert.match(home, /function handleAddDevice\(\) \{[\s\S]*handleCloseMenus\(\)[\s\S]*uni\.navigateTo\(\{ url: '\/packageDevice\/pages\/bind\/index' \}\)/, 'add-device menu item should close the popover before navigation');
  assert.match(home, /async function handleScan\(\) \{[\s\S]*handleCloseMenus\(\)[\s\S]*uni\.scanCode/, 'scan menu item should close the popover before opening scanner');
  assert.match(home, /function handleRefresh\(\) \{[\s\S]*handleCloseMenus\(\)[\s\S]*deviceListProvider\.loadFirst\(\)/, 'refresh menu item should close the popover before refreshing');
});
