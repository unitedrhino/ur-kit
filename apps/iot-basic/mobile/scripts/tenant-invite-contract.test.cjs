const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function listSourceFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      listSourceFiles(fullPath, files);
      continue;
    }
    if (/\.(vue|ts|scss|json)$/.test(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanHardcodedThemeColors() {
  const ignored = [
    `${path.sep}src${path.sep}config${path.sep}theme.ts`,
    `${path.sep}src${path.sep}config${path.sep}tab-icons.ts`,
    `${path.sep}src${path.sep}static${path.sep}`,
    `${path.sep}src${path.sep}libs${path.sep}`,
    `${path.sep}src${path.sep}uni_modules${path.sep}`,
  ];
  const colorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\([^\n;]+?\)/g;
  return listSourceFiles(path.join(root, 'src'))
    .filter((file) => !ignored.some((item) => file.includes(item)))
    .flatMap((file) => {
      const rel = path.relative(root, file);
      return fs.readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) => (line.match(colorPattern) || []).map((color) => `${rel}:${index + 1} ${color}`));
    });
}

function loadTenantSourceModule() {
  const sourcePath = path.join(root, 'src/utils/tenant-source.ts');
  const output = ts.transpileModule(read('src/utils/tenant-source.ts'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;
  const storage = new Map();
  global.uni = {
    setStorageSync: (key, value) => storage.set(key, value),
    getStorageSync: (key) => storage.get(key) || '',
    removeStorageSync: (key) => storage.delete(key),
  };
  const module = { exports: {} };
  const fn = new Function('exports', 'module', output);
  fn(module.exports, module);
  return module.exports;
}

test('tenant invite parsing uses backend invite code instead of tenantCode', () => {
  const source = read('src/utils/tenant-source.ts');

  assert.match(source, /INVITE_CODE_PARAM_KEY\s*=\s*'code'/, 'launch and QR invite parameter should be code');
  assert.doesNotMatch(source, /TENANT_PARAM_KEY\s*=\s*'tenantCode'/, 'tenantCode should not be the mobile auto-join credential');
  assert.match(source, /PENDING_INVITE_CODE_KEY/, 'invite code should be persisted across login and registration');
  assert.match(source, /function parseInviteTenantCode/, 'mobile should parse tenant code from backend invite code');
  assert.match(source, /slice\(0,\s*-INVITE_CODE_SUFFIX_LENGTH\)/, 'tenant code should come from the invite-code prefix');
  assert.match(source, /function savePendingInviteCode/, 'invite code should be saved before auth redirects');
  assert.match(source, /function getPendingInviteCode/, 'pending invite code should be readable after auth');
  assert.match(source, /function clearPendingInviteCode/, 'pending invite code should be cleared after accepted join');
});

test('tenant invite helpers parse query, QR scene, encoded code, and pending storage', () => {
  const {
    clearPendingInviteCode,
    getPendingInviteCode,
    parseInviteFromLaunchOptions,
    parseInviteTenantCode,
    savePendingInviteCode,
  } = loadTenantSourceModule();
  const inviteCode = 'tenant-ac1234567890';
  const encodedInviteCode = encodeURIComponent(inviteCode);

  assert.equal(parseInviteTenantCode(inviteCode), 'tenant-a');
  assert.deepEqual(parseInviteFromLaunchOptions({ code: inviteCode }), {
    inviteCode,
    tenantCode: 'tenant-a',
    source: 'share_card',
  });
  assert.deepEqual(parseInviteFromLaunchOptions({ scene: `code=${encodedInviteCode}` }), {
    inviteCode,
    tenantCode: 'tenant-a',
    source: 'scene_qrcode',
  });

  savePendingInviteCode(encodedInviteCode);
  assert.equal(getPendingInviteCode(), inviteCode);
  clearPendingInviteCode();
  assert.equal(getPendingInviteCode(), '');
});

test('launch tenant helpers parse query and scene without breaking invite priority', () => {
  const {
    parseInviteFromLaunchOptions,
    parseLaunchTenantCode,
  } = loadTenantSourceModule();
  const inviteCode = 'tenant-ac1234567890';

  assert.equal(typeof parseLaunchTenantCode, 'function', 'tenant launch parser should be exported');
  assert.equal(parseLaunchTenantCode({ 'org-id': 'org-003' }), 'org-003');
  assert.equal(parseLaunchTenantCode({ tenantCode: 'org-001', orgId: 'org-002' }), '');
  assert.equal(parseLaunchTenantCode({ scene: 'org-id=org-004' }), 'org-004');
  assert.equal(parseLaunchTenantCode({ scene: 'tenantCode=org-004&orgId=org-005' }), '');
  assert.deepEqual(parseInviteFromLaunchOptions({ code: inviteCode, 'org-id': 'org-001' }), {
    inviteCode,
    tenantCode: 'tenant-a',
    source: 'share_card',
  });
});

test('app context requires a real joined tenant after login', () => {
  const service = read('src/providers/app-context.provider.ts');

  assert.match(service, /handlePendingInvite/, 'login continuation should handle pending invites before tenant selection');
  assert.match(service, /joinTenantByInviteCode/, 'pending invite should join through the backend invite-code API');
  assert.match(service, /parseInviteTenantCode/, 'joined tenant should be selected from the invite-code prefix');
  assert.match(service, /getAvailableTenants\(\)/, 'tenant readiness should use only joined tenants');
  assert.doesNotMatch(service, /COMMON_TENANT_CODE/, 'login continuation should not depend on a fixed common tenant');
  assert.match(service, /if\s*\(!currentTenant\?\.code\)/, 'family readiness should reject missing tenant context');
});

test('natural mini program login without tenant locks the user on tenant selection', () => {
  const service = read('src/providers/app-context.provider.ts');
  const page = read('src/packageUser/pages/tenant-manage/index.vue');

  assert.match(service, /openTenantSelectGate/, 'tenant readiness should use a dedicated forced-selection gateway');
  assert.match(
    service,
    /openTenantSelectGate\(\)[\s\S]{0,160}uni\.reLaunch\(\{\s*url:\s*TENANT_SELECT_URL\s*\}\)/,
    'forced tenant selection should clear the page stack so natural-login users cannot go back before selecting',
  );
  assert.match(
    page,
    /<app-navigation-bar\s+:title="title"\s+:back="mode !== 'select'"/,
    'tenant selection mode should hide the custom back button until an organization is selected',
  );
});

test('app context captures launch tenant code before auth and prefers it after login', () => {
  const service = read('src/providers/app-context.provider.ts');

  assert.match(service, /console\.info\('\[launch-options\] query'/, 'devtools should print launch query for debugging');
  assert.match(service, /normalizedOptions/, 'launch query log should use the normalized query object');
  assert.match(service, /parseLaunchTenantCode/, 'launch options should parse direct tenant code');
  assert.match(service, /savePendingLaunchTenantCode/, 'direct tenant code should persist across login and register redirects');
  assert.match(service, /prepareTenantContextBeforeAuth/, 'auth flows should prepare tenant context through one shared guard');
  assert.doesNotMatch(
    service,
    /savePendingLaunchTenantCode\(tenantCode\)[\s\S]{0,240}setRequestTenantCode\(tenantCode\)/,
    'captured tenant should not update request context before public validation',
  );
  assert.match(service, /handlePendingLaunchTenant/, 'login continuation should prefer direct tenant before generic tenant selection');
  assert.match(service, /tenantProvider\.switchTenant\(pendingTenantCode\)/, 'joined launch tenant should become the active tenant');
  assert.match(service, /clearPendingLaunchTenantCode\(\)/, 'launch tenant should be cleared after it is handled or rejected');
});

test('guard-created family resumes the pending route after creation', () => {
  const service = read('src/providers/app-context.provider.ts');
  const page = read('src/packageUser/pages/family-edit/index.vue');

  assert.match(service, /source=guard/, 'empty-family guard should mark the creation page as guard-owned');
  assert.match(
    page,
    /source\.value\s*===\s*'guard'[\s\S]{0,240}appContextProvider\.resumePendingRoute\('\/pages\/home\/index'\)/,
    'creating the first family from the guard page should continue to the pending route instead of navigating back',
  );
});

test('launch org-id is validated against public tenant core before login headers are set', () => {
  const appContext = read('src/providers/app-context.provider.ts');
  const tenantService = read('src/services/tenant.service.ts');
  const tenantRepo = read('src/data/repositories/tenant.repository.impl.ts');
  const tenantInterface = read('src/domain/interfaces/tenant.repository.ts');
  const login = read('src/packageUser/pages/login/index.vue');
  const pages = JSON.stringify(JSON.parse(read('src/pages.json')));

  assert.match(appContext, /ORG_ID_NOT_FOUND_URL\s*=\s*'\/packageUser\/pages\/org-id-not-found\/index'/, 'invalid org-id should have a dedicated public fallback page');
  assert.match(appContext, /ensurePendingLaunchTenantAvailable/, 'app context should expose a pre-login tenant validation guard');
  assert.match(appContext, /tenantService\.hasTenantForApp\(pendingTenantCode,\s*config\.appId\)/, 'pre-login guard should validate the org-id against the current app');
  assert.match(appContext, /clearPendingLaunchTenantCode\(\)/, 'invalid org-id should be cleared after validation failure');
  assert.match(appContext, /redirectToOrgIdNotFound/, 'invalid org-id should navigate to the not-found page');
  assert.match(tenantInterface, /hasTenantForApp\(code: string,\s*appID: string\): Promise<boolean>/, 'tenant repository interface should expose public tenant-app validation');
  assert.match(tenantService, /hasTenantForApp\(code: string,\s*appID: string\): Promise<boolean>/, 'tenant service should expose public tenant-app validation');
  assert.match(tenantRepo, /\/api\/v1\/system\/tenant\/core\/get-list/, 'validation should use the public tenant core list endpoint');
  assert.match(tenantRepo, /data:\s*\{[\s\S]*code[\s\S]*appID[\s\S]*page:\s*\{\s*page:\s*1,\s*size:\s*1\s*\}/, 'validation should filter by org-id and current app id');
  assert.match(login, /prepareTenantContextBeforeAuth\(\)/, 'login page should prepare tenant context before auth requests');
  assert.match(pages, /org-id-not-found/, 'org-id-not-found page should be registered');
  assert.ok(fs.existsSync(path.join(root, 'src/packageUser/pages/org-id-not-found/index.vue')), 'org-id-not-found page file should exist');
});

test('tenant mode config supports single tenant fixed organization', () => {
  const config = read('src/config.ts');
  const theme = read('src/config/theme.ts');

  assert.match(config, /TenantMode\s*=\s*'single'\s*\|\s*'multi'/, 'config should expose tenant mode type');
  assert.match(config, /tenantMode:\s*TenantMode/, 'runtime config should include tenantMode');
  assert.match(config, /singleTenantCode:\s*string/, 'runtime config should include singleTenantCode');
  assert.match(config, /themePrimaryColor:\s*string/, 'runtime config should include themePrimaryColor');
  assert.match(config, /themePrimaryLightColor:\s*string/, 'runtime config should include themePrimaryLightColor');
  assert.match(config, /themeOnPrimaryColor:\s*string/, 'runtime config should include themeOnPrimaryColor');
  assert.match(config, /themeTextPrimaryColor:\s*string/, 'runtime config should include themeTextPrimaryColor');
  assert.match(config, /themeTextSecondaryColor:\s*string/, 'runtime config should include themeTextSecondaryColor');
  assert.match(config, /themeTextPlaceholderColor:\s*string/, 'runtime config should include themeTextPlaceholderColor');
  assert.match(config, /themeBorderColor:\s*string/, 'runtime config should include themeBorderColor');
  assert.match(config, /themeErrorColor:\s*string/, 'runtime config should include themeErrorColor');
  assert.match(config, /themeChartGridColor:\s*string/, 'runtime config should include themeChartGridColor');
  assert.match(config, /brandName:\s*string/, 'runtime config should include brandName');
  assert.match(config, /VITE_API_BASE_URL/, 'api base url should be overridable by env');
  assert.match(config, /VITE_BRAND_NAME/, 'brand name should be overridable by env fallback');
  assert.match(config, /VITE_TENANT_MODE/, 'tenant mode should be overridable by env');
  assert.match(config, /VITE_SINGLE_TENANT_CODE/, 'single tenant code should be overridable by env');
  assert.match(config, /VITE_TERMINOLOGY_PRESET/, 'project and area terminology should be overridable by env');
  assert.match(config, /normalizeTerminologyPreset/, 'invalid terminology preset should fall back through a normalizer');
  assert.match(config, /resolveThemeTokens\(buildEnv\)/, 'runtime config should resolve theme from the shared token module');
  assert.match(theme, /VITE_THEME_PRIMARY_COLOR/, 'theme primary color should be overridable by env');
  assert.match(theme, /VITE_THEME_PRIMARY_LIGHT_COLOR/, 'theme primary light color should be overridable by env');
  assert.match(theme, /VITE_THEME_TEXT_PRIMARY_COLOR/, 'theme primary text color should be overridable by env');
  assert.match(theme, /VITE_THEME_TEXT_SECONDARY_COLOR/, 'theme secondary text color should be overridable by env');
  assert.match(theme, /VITE_THEME_TEXT_PLACEHOLDER_COLOR/, 'theme placeholder text color should be overridable by env');
  assert.match(config, /normalizeTenantMode/, 'invalid tenant mode should fall back through a normalizer');
});

test('theme color config drives global css variables and tabbar selected color', () => {
  const appScss = read('src/app.scss');
  const uniScss = read('src/uni.scss');
  const viteConfig = read('vite.config.ts');
  const theme = read('src/config/theme.ts');
  const tabIcons = read('src/config/tab-icons.ts');
  const pages = read('src/pages.json');

  assert.match(theme, /createThemeScssAdditionalData/, 'shared theme module should generate scss token injection');
  assert.match(theme, /createThemeStyleReplacements/, 'shared theme module should generate global style token replacements');
  assert.match(appScss, /--md-sys-color-primary:\s*__MOBILE_UNIAPP_THEME_COLOR_PRIMARY__/, 'global md primary css variable should use build-time theme placeholder');
  assert.match(appScss, /--color-primary:\s*var\(--md-sys-color-primary\)/, 'legacy primary css variable should alias md token');
  assert.match(appScss, /--text-primary:\s*var\(--md-sys-color-on-surface\)/, 'legacy text css variable should alias md token');
  assert.match(uniScss, /\$uni-color-primary:\s*__MOBILE_UNIAPP_THEME_COLOR_PRIMARY__/, 'uni.scss primary color should use theme token placeholder');
  assert.match(viteConfig, /createPagesThemePlugin/, 'vite should transform pages theme config');
  assert.match(viteConfig, /createThemeStylePlugin/, 'vite should transform global theme placeholders');
  assert.match(viteConfig, /appJson\.tabBar\.selectedColor\s*=\s*themeTokens\.colorPrimary/, 'tabBar selected color should follow theme primary color');
  assert.match(viteConfig, /createThemeScssAdditionalData\(themeTokens\)/, 'scss should receive theme variables from shared theme module');
  assert.match(viteConfig, /tabIconSvgs/, 'vite should read tab svg masks from typescript source');
  assert.match(viteConfig, /colorizeSvg\(icon\.svg,\s*themeTokens\.colorPrimary\)/, 'tabBar active icons should be generated from svg theme token at build time');
  assert.match(tabIcons, /export const tabIconSvgs/, 'tab svg masks should live in a typescript module');
  assert.match(pages, /static\/icons\/tab-home\.png/, 'tabBar should keep mini program stable png paths');
  assert.deepEqual(scanHardcodedThemeColors(), [], 'business source files should use theme tokens instead of hardcoded colors');
  assert.ok(fs.existsSync(path.join(root, 'src/config/tab-icons.ts')), 'tab icon svg source module should exist');
  assert.ok(!fs.existsSync(path.join(root, 'src/static/icons/tab-home.svg')), 'tab svg should not be a static mini program asset');
  assert.ok(!fs.existsSync(path.join(root, 'src/static/icons/tab-home-active.png')), 'tabBar active png should be generated output, not source');
});

test('single tenant mode ignores invite and organization selection flows', () => {
  const service = read('src/providers/app-context.provider.ts');
  const login = read('src/packageUser/pages/login/index.vue');
  const mine = read('src/pages/mine/index.vue');
  const tenantPage = read('src/packageUser/pages/tenant-manage/index.vue');
  const familyEdit = read('src/packageUser/pages/family-edit/index.vue');

  assert.match(service, /config\.tenantMode\s*===\s*'single'/, 'app context should branch on single tenant mode');
  assert.match(service, /clearIgnoredTenantContext/, 'single tenant mode should clear pending invite and launch tenant context');
  assert.match(service, /ensureSingleTenantAvailable/, 'single tenant mode should validate the configured organization');
  assert.match(service, /tenantService\.getTenantByCode\(this\.getSingleTenantCode\(\)\)/, 'single tenant validation should use public tenant info by configured code');
  assert.match(service, /setRequestTenantCode\(tenant\.code\)/, 'single tenant mode should write the resolved organization code');
  assert.match(service, /openTenantSelectGate\(\)[\s\S]{0,120}isSingleTenantMode\(\)[\s\S]{0,120}openHomeFallback/, 'single tenant mode should not open organization selection');
  assert.match(login, /prepareTenantContextBeforeAuth\(\)/, 'all auth paths should use the shared tenant context preparation');
  assert.match(mine, /canSwitchTenant && !singleTenantMode/, 'mine page should hide organization switch in single tenant mode');
  assert.match(tenantPage, /singleTenantMode[\s\S]{0,160}switchTab\(\{\s*url:\s*'\/pages\/home\/index'/, 'organization page should return home in single tenant mode');
  assert.match(tenantPage, /v-if="!singleTenantMode" class="tm-toolbar"/, 'invite join toolbar should be hidden in single tenant mode');
  assert.match(familyEdit, /source === 'guard' && !editingID && !singleTenantMode/, 'first family guard should hide organization switch in single tenant mode');
});

test('single tenant mode uses tenant avatar as brand icon', () => {
  const tenantInterface = read('src/domain/interfaces/tenant.repository.ts');
  const tenantRepo = read('src/data/repositories/tenant.repository.impl.ts');
  const tenantService = read('src/services/tenant.service.ts');
  const tenantBrand = read('src/utils/tenant-brand.ts');
  const nav = read('src/components/app-navigation-bar/app-navigation-bar.vue');
  const login = read('src/packageUser/pages/login/index.vue');

  assert.match(tenantInterface, /getTenantByCode\(code: string\): Promise<TenantEntity \| null>/, 'tenant repository should expose public tenant lookup by code');
  assert.match(tenantRepo, /getTenantForApp\(code: string,\s*appID: string\): Promise<TenantEntity \| null>/, 'tenant repository implementation should fetch public tenant info');
  assert.match(tenantRepo, /getTenantByCode\(code: string\): Promise<TenantEntity \| null>/, 'tenant repository implementation should fetch public tenant info by code');
  assert.match(tenantRepo, /item\.id[\s\S]*item\.code/, 'single tenant lookup should support config value as tenant id or code');
  assert.match(tenantRepo, /TenantMapper\.toEntity/, 'public tenant info should map through TenantMapper');
  assert.match(tenantService, /getTenantByCode\(code: string\): Promise<TenantEntity \| null>/, 'tenant service should expose public tenant info by code');
  assert.match(tenantBrand, /config\.tenantMode === 'single'/, 'tenant brand helper should only override icon in single tenant mode');
  assert.match(tenantBrand, /tenant\.code === config\.singleTenantCode \|\| tenant\.id === config\.singleTenantCode/, 'tenant brand helper should match configured tenant by id or code');
  assert.match(tenantBrand, /tenantService\s*\.\s*getTenantByCode\(config\.singleTenantCode\)/, 'tenant brand helper should load public tenant avatar by configured code');
  assert.match(tenantBrand, /getNavigationBrandName/, 'tenant brand helper should expose navigation brand name');
  assert.match(tenantBrand, /current\.name/, 'single tenant navigation brand should prefer current tenant name');
  assert.match(tenantBrand, /cachedSingleTenant\?\.name/, 'single tenant navigation brand should fall back to public tenant name');
  assert.match(nav, /getSingleTenantBrandLogoPath/, 'navigation bar should resolve logo from tenant brand helper');
  assert.match(nav, /getNavigationBrandName/, 'navigation bar should resolve brand name from tenant brand helper');
  assert.match(nav, /loadSingleTenantBrand/, 'navigation bar should load single tenant avatar');
  assert.match(login, /getSingleTenantBrandLogoPath/, 'login page should resolve logo from tenant brand helper');
  assert.match(login, /loadSingleTenantBrand/, 'login page should load single tenant avatar before login');
});

test('tenant provider starts without a fixed common tenant placeholder', () => {
  const provider = read('src/providers/tenant.provider.ts');
  const requestContext = read('src/utils/request-context.ts');

  assert.doesNotMatch(provider, /const COMMON_TENANT/, 'provider should not create a fixed common tenant placeholder');
  assert.match(provider, /list:\s*\[\]/, 'provider should initialize with an empty joined-tenant list');
  assert.match(provider, /current:\s*null/, 'provider should initialize without a selected tenant');
  assert.match(provider, /LEGACY_COMMON_TENANT_CODE/, 'provider should ignore legacy cached common values');
  assert.match(requestContext, /LEGACY_COMMON_TENANT_CODE/, 'request context should drop legacy common before headers are built');
  assert.match(provider, /joinTenantByInviteCode/, 'provider should name invite-code joining explicitly');
  assert.doesNotMatch(provider, /switchTenant\(code: string\): boolean[\s\S]*\?\?\s*\{/, 'switching an unknown tenant should not silently fall back');
});

test('mobile tenant management page supports join and selection only', () => {
  const page = read('src/packageUser/pages/tenant-manage/index.vue');
  const pages = JSON.stringify(JSON.parse(read('src/pages.json')));

  assert.match(page, /joinTenantByInviteCode/, 'tenant page should join by invite code');
  assert.doesNotMatch(
    page,
    /<empty-state[^>]*buttonText=/,
    'tenant empty state should not render a duplicate invite-code button below the empty illustration',
  );
  assert.doesNotMatch(page, /item\.code\s*!==\s*'common'/, 'tenant page should not carry a frontend common filter');
  assert.doesNotMatch(page, /handleCreate|handleEdit|handleDelete/, 'tenant page should not expose create, edit, or delete handlers');
  assert.doesNotMatch(page, /新建组织|编辑|删除/, 'tenant page should not show create, edit, or delete copy');
  assert.doesNotMatch(page, /tenant-edit/, 'tenant page should not navigate to tenant-edit');
  assert.doesNotMatch(pages, /tenant-edit/, 'mobile routes should not expose the tenant creation/edit page');
});
