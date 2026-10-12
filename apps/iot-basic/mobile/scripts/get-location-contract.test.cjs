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

test('wechat manifest declares location private interface and provisioning permission scopes', () => {
  const manifest = readJson('src/manifest.json');
  const mpWeixin = manifest['mp-weixin'];

  assert.deepEqual(mpWeixin.requiredPrivateInfos, ['getLocation']);
  assert.deepEqual(Object.keys(mpWeixin.permission), ['scope.userLocation', 'scope.bluetooth']);
  assert.equal(
    mpWeixin.permission['scope.userLocation'].desc,
    '用于蓝牙配网获取 Wi-Fi 名称、记录家庭或设备安装位置',
  );
  assert.equal(
    mpWeixin.permission['scope.bluetooth'].desc,
    '用于蓝牙配网时发现、连接附近设备并下发网络配置',
  );
});

test('location service centralizes getLocation with App-compatible coordinate fallback', () => {
  assert.ok(exists('src/services/location.service.ts'), 'location service should exist');
  const service = read('src/services/location.service.ts');
  const warmup = read('src/services/permission-warmup.service.ts');
  const brand = read('src/config/brand.ts');

  assert.match(service, /getCurrentLocation/, 'service should expose a current-location method');
  assert.match(service, /locationApi\.getLocation/, 'service should call getLocation through an adapter');
  assert.match(service, /requestLocation\('gcj02'\)/, 'service should request gcj02 coordinates first');
  assert.match(service, /requestLocation\('wgs84'\)/, 'service should fall back when App does not support gcj02');
  assert.match(service, /typeof uni !== 'undefined'/, 'service should prefer the cross-platform uni location API');
  assert.match(service, /LOCATION_PERMISSION_DENIED/, 'service should expose permission-denied failures');
  assert.doesNotMatch(warmup, /wx\s+as unknown[\s\S]*getLocation/, 'permission warmup should not bypass the location service');
  assert.match(brand, /afterLogin:\s*{\s*location:\s*false/, 'login should not silently trigger location permission');
});

test('device model and update payload preserve address and position', () => {
  const entity = read('src/domain/entities/device.entity.ts');
  const iface = read('src/domain/interfaces/device.repository.ts');
  const mapper = read('src/data/mappers/device.mapper.ts');
  const repo = read('src/data/repositories/device.repository.impl.ts');

  assert.match(entity, /position\??:\s*GeoPoint/, 'DeviceEntity should expose position');
  assert.match(entity, /address\??:\s*string/, 'DeviceEntity should expose address');
  assert.match(iface, /position\??:\s*GeoPoint/, 'DeviceUpdateData should accept position');
  assert.match(iface, /address\??:\s*string/, 'DeviceUpdateData should accept address');
  assert.match(mapper, /dto\.position/, 'mapper should read position from backend DTOs');
  assert.match(repo, /payload\.position\s*=\s*data\.position/, 'device update should submit position');
});

test('provisioning saves device installation location only after bind succeeds', () => {
  const wifiModel = read('src/domain/models/wifi-credential.model.ts');
  const sessionModel = read('src/domain/models/provision-session-state.model.ts');
  const session = read('src/services/provision-session.service.ts');
  const wifiPage = read('src/packageBluetooth/pages/wifi/index.vue');
  const resultPage = read('src/packageBluetooth/pages/result/index.vue');

  assert.doesNotMatch(wifiModel, /installLocation/, 'WifiCredential should not carry installLocation before binding');
  assert.doesNotMatch(wifiPage, /设备安装位置/, 'WiFi page should not ask for device installation location');
  assert.doesNotMatch(wifiPage, /handleFetchInstallLocation/, 'WiFi page should not fetch installation location');
  assert.match(sessionModel, /locationWarning\??:\s*string/, 'ProvisionSessionState should carry non-blocking location warning');
  assert.match(sessionModel, /boundDevice\??:/, 'ProvisionSessionState should expose the bound device identity');
  assert.match(resultPage, /保存设备安装位置/, 'result page should show the post-bind device location prompt');
  assert.match(resultPage, /deviceLocationChecked/, 'device location prompt should be checked by default');
  assert.match(resultPage, /handleSaveDeviceLocation/, 'result page should save location after binding');
  assert.match(resultPage, /locationWarning/, 'result page should show non-blocking location save warnings');
});

test('family creation can save current location as project position', () => {
  const entity = read('src/domain/entities/project.entity.ts');
  const iface = read('src/domain/interfaces/project.repository.ts');
  const mapper = read('src/data/mappers/project.mapper.ts');
  const repo = read('src/data/repositories/project.repository.impl.ts');
  const service = read('src/services/project.service.ts');
  const provider = read('src/providers/project.provider.ts');
  const page = read('src/packageUser/pages/family-edit/index.vue');

  assert.match(entity, /position\??:\s*GeoPoint/, 'ProjectEntity should expose position');
  assert.match(iface, /position\??:\s*GeoPoint/, 'project create/update payload should accept position');
  assert.match(mapper, /dto\.position/, 'project mapper should read position');
  assert.match(repo, /payload\.position\s*=\s*data\.position/, 'project repository should submit position');
  assert.match(service, /ProjectCreateData/, 'project service should accept the position-capable create payload');
  assert.match(provider, /ProjectCreateData/, 'project provider should accept the position-capable create payload');
  assert.match(page, /TERM\.project}位置/, 'family edit page should show a location prompt');
  assert.match(page, /familyLocationChecked/, 'family location prompt should be checked by default');
  assert.match(page, /handleFetchFamilyLocation/, 'family edit page should fetch current location');
  assert.match(page, /定位失败，已不带位置创建/, 'family creation should not be blocked when optional location fails');
  assert.match(page, /@tap="handleSubmitTap"/, 'family save should use a plain App-compatible tap handler');
  assert.doesNotMatch(page, /@tap="\(\) => !submitting && handleSubmit\(\)"/, 'family save should not rely on inline arrow handlers');
});

test('device settings exposes a location editor route backed by wx.getLocation', () => {
  const pages = readJson('src/pages.json');
  const packageDevice = pages.subPackages.find((item) => item.root === 'packageDevice');
  const paths = packageDevice.pages.map((item) => item.path);
  const settings = read('src/packageDevice/pages/settings/index.vue');

  assert.ok(paths.includes('pages/edit-location/index'), 'device location edit page should be registered');
  assert.ok(exists('src/packageDevice/pages/edit-location/index.vue'), 'device location edit page should exist');
  assert.match(settings, /设备位置/, 'device settings should show a device location row');
  assert.match(settings, /handleEditLocation/, 'device settings should navigate to the location editor');
  assert.match(read('src/packageDevice/pages/edit-location/index.vue'), /getCurrentLocation/, 'location editor should use location service');
});
