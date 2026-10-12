const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

test('LLSync protocol helper keeps official WiFi BLE command contract', () => {
  assert.ok(exists('src/utils/llsync-protocol.ts'), 'LLSync protocol helper should exist');
  const protocol = read('src/utils/llsync-protocol.ts');

  assert.match(protocol, /LLSYNC_ADVERTISING_SERVICE_UUID\s*=\s*'0000FFF0-0000-1000-8000-00805F9B34FB'/);
  assert.match(protocol, /LLSYNC_SERVICE_UUID\s*=\s*'0000FFF0-65D0-4E20-B56A-E493541BA4E2'/);
  assert.match(protocol, /LLSYNC_DEVICE_INFO_WRITE_UUID\s*=\s*'0000FFE1-65D0-4E20-B56A-E493541BA4E2'/);
  assert.match(protocol, /LLSYNC_EVENT_NOTIFY_UUID\s*=\s*'0000FFE3-65D0-4E20-B56A-E493541BA4E2'/);
  assert.match(protocol, /export function parseLLSyncAdvertisingData/);
  assert.match(protocol, /const moduleVersion = bytes\[2\];/);
  assert.match(protocol, /const macBytes = bytes\.slice\(3,\s*9\)/);
  assert.match(protocol, /stripNullPadding\(bytes\.slice\(9\)\)/);
  assert.match(protocol, /productID,\s*\n\s*\}/);
  assert.match(protocol, /export function buildGetDeviceInfoCommand\(\)[\s\S]*0xe0/);
  assert.match(protocol, /export function buildSetWifiModeCommand\(\)[\s\S]*0xe1,\s*0x01/);
  assert.match(protocol, /const wifiInfoLength = ssidBytes\.length \+ passwordBytes\.length/);
  assert.match(protocol, /0xe2,\s*\.\.\.u16be\(wifiInfoLength\),\s*ssidBytes\.length/);
  assert.match(protocol, /export function buildConnectWifiCommand\(\)[\s\S]*0xe3/);
  assert.match(protocol, /export function buildSendTokenCommand[\s\S]*0xe4,\s*\.\.\.u16be\(tokenBytes\.length\)/);
  assert.match(protocol, /export function buildGetLogCommand\(\)[\s\S]*0xe5/);
});

test('LLSync advertisement ProductID strips fixed-field NUL padding before binding', () => {
  const protocol = read('src/utils/llsync-protocol.ts');

  assert.match(protocol, /function stripNullPadding\(bytes: number\[\]\): number\[\]/);
  assert.match(protocol, /byte\) => byte === 0/);
  assert.match(protocol, /const productID = utf8Decode\(stripNullPadding\(bytes\.slice\(9\)\)\)/);
  assert.doesNotMatch(protocol, /productID:\s*utf8Decode\(bytes\.slice\(9\)\)/);
});

test('Bluetooth datasource and service scan LLSync advertisements instead of old name prefix devices', () => {
  const model = read('src/domain/models/ble-scan-result.model.ts');
  const datasource = read('src/data/datasources/bluetooth.datasource.ts');
  const service = read('src/services/bluetooth-config.service.ts');

  assert.match(model, /advertisData\?:\s*ArrayBuffer/, 'scan result should carry manufacturer data');
  assert.match(datasource, /advertisData:\s*normalizeAdvertisData\(d\.advertisData\)/, 'datasource should preserve manufacturer data as ArrayBuffer');
  assert.match(service, /parseLLSyncAdvertisingData/, 'service should parse LLSync manufacturer data');
  assert.match(service, /advertisingInfoByDeviceId = new Map/, 'service should cache parsed advertisement identity by deviceId');
  assert.match(service, /advertisingInfoByDeviceId\.set\(device\.deviceId/, 'scan should cache ProductID/MAC before page navigation');
  assert.match(service, /const identity = this\.advertisingInfoByDeviceId\.get\(deviceId\)/, 'connect should restore cached advertisement identity');
  assert.match(service, /LLSYNC_ADVERTISING_SERVICE_UUID/, 'scan should request the LLSync advertising service');
  assert.match(service, /bleDataSource\.startScan\(\[LLSYNC_ADVERTISING_SERVICE_UUID\]\)/);
  assert.doesNotMatch(service, /PROVISION_BLE_NAME_PREFIX|xdtp-/, 'LLSync scan should not depend on the temporary old name prefix');
  assert.doesNotMatch(service, /SHORT_SERVICE\s*=\s*'ffff'|FF01|FF02/, 'LLSync config service should not keep old FFFF/FF01/FF02 constants');
});

test('Bluetooth config service follows official LLSync sequence and parses length-prefixed events', () => {
  const service = read('src/services/bluetooth-config.service.ts');

  assert.match(service, /buildGetDeviceInfoCommand/);
  assert.match(service, /writeAndWaitForEvent\(\s*buildGetDeviceInfoCommand\(\),\s*LLSYNC_EVENT_DEVICE_INFO/);
  assert.match(service, /private async setWiFiMode\([^)]*trace[^)]*\)[\s\S]*buildSetWifiModeCommand\(\)[\s\S]*LLSYNC_EVENT_SET_WIFI_MODE_RESULT/);
  assert.match(service, /private async setWiFiInfo[\s\S]*buildSetWifiInfoCommand\(ssid,\s*password/);
  assert.match(service, /private async connectWifi\([^)]*trace[^)]*\)[\s\S]*buildConnectWifiCommand\(\)[\s\S]*LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT/);
  assert.match(service, /TYPE_BIND_TOKEN_WRITTEN/, 'service should emit a local token-written event after E4 write succeeds');
  assert.match(service, /private async sendToken[\s\S]*const ackWaiting = this\.waitForEvent[\s\S]*LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT[\s\S]*await this\.writeCommand\(buildSendTokenCommand\(token\), trace\)[\s\S]*this\.dispatchTokenWritten\(\)[\s\S]*const event = await ackWaiting/, 'E4 write success should wait for device E3 ACK before protocol completion');
  assert.match(service, /await this\.setWiFiMode\(trace\)[\s\S]*await delay\(LLSYNC_WRITE_GAP_MS\)[\s\S]*await this\.setWiFiInfo\(params\.ssid, params\.pwd \?\? '', trace\)/);
  assert.match(service, /await this\.connectWifi\(trace\)[\s\S]*await this\.sendToken\(params\.uid, trace\)/);
  assert.doesNotMatch(
    service,
    /const wifiState = await this\.connectWifi\(trace\);[\s\S]{0,300}dispatchMessage\(\{ type: TYPE_WIFI_CONNECT_RESULT/,
    'E2 notify should be the only WiFi result dispatch source',
  );
  assert.match(service, /this\.eventDecoder\.push\(bytes\)/, 'notify path must reassemble LLSync event bytes');
  assert.match(service, /recordTx\(command\)/, 'every command should be traced at the datasource write boundary');
  assert.match(service, /recordRx\(bytes\)/, 'every notify packet should be traced before parsing');
  assert.match(service, /const callback = this\.notifyCallback[\s\S]*offBLECharacteristicValueChange[\s\S]*off\?\.call\(runtimeApi, callback\)/, 'disconnect should remove the exact notify callback');
  assert.doesNotMatch(service, /buildJsonFrames|parseFrame|Reassembler|sendJson/, 'old JSON frame protocol should not be used for LLSync WiFi binding');
});

test('Provision session binds with LLSync ProductID and DeviceName returned by BLE flow', () => {
  const session = read('src/services/provision-session.service.ts');
  const provider = read('src/providers/provision.provider.ts');

  assert.match(session, /TYPE_WIFI_CONNECT_RESULT/, 'session should observe WiFi connected events separately from token binding');
  assert.match(session, /message\.type === TYPE_WIFI_CONNECT_RESULT[\s\S]*binding_device/, 'WiFi connected should advance UI into binding stage before token wait');
  assert.match(session, /TYPE_BIND_TOKEN_WRITTEN/, 'session should observe local E4 write success as a UI stage transition');
  assert.match(session, /message\.type === TYPE_BIND_TOKEN_WRITTEN[\s\S]*binding_device[\s\S]*return/, 'token-written event should only advance UI while waiting for device E3');
  assert.match(session, /确认设备添加超时[\s\S]*BIND_FAILED/, 'device add confirmation timeout should be reported as bind failure instead of UNKNOWN');
  assert.doesNotMatch(session, /waitForBindTokenReported|getBindTokenStatus\(token\)/, 'mini program should not poll bind token status in the LLSync protocol flow');
  assert.match(session, /this\.bindWithLevelHandling\(productID, deviceName, token\)/, 'platform bind should happen after device E3 success');
  assert.match(session, /llsyncProvisionTrace\.start/, 'each provisioning run should create one explicit trace session');
  assert.match(session, /transport\.connect\(currentDevice\.deviceId, trace\)/, 'BLE connect should receive the session trace');
  assert.match(session, /getModuleLog\(trace\)/, 'E5 diagnostics should use the same session trace');
  assert.match(session, /const trace = this\.currentTrace[\s\S]*this\.state\.stage === 'failed' \|\| !trace/, 'late success must not reopen a failed trace');
  assert.match(session, /\.replace\(\s*\/\\0\/g,\s*''\s*\)/, 'BLE identity strings should strip NUL padding before bind API calls');
  assert.match(session, /message\.type === TYPE_PROVISION_FAIL[\s\S]*binding_device[\s\S]*return/, 'E3 failure should be reported as bind failure instead of PROVISION_REJECTED');
  assert.match(session, /resolveBindProductID/);
  assert.match(session, /const productID = resolveBindProductID\(message\)[\s\S]*this\.selectedCandidate\?\.productID/);
  assert.match(session, /boundDevice:\s*\{\s*productID,\s*deviceName/);
  assert.doesNotMatch(session, /DEFAULT_PROVISION_PRODUCT_ID\s*=\s*'AC'|PROVISION_DEVICE_NAME_PREFIX|withDeviceNamePrefix/, 'LLSync binding should not force old AC or AI_ defaults');
  assert.match(provider, /title:\s*'发现设备'/);
  assert.match(provider, /title:\s*'连接设备'/);
  assert.match(provider, /title:\s*'发送网络信息'/);
  assert.match(provider, /title:\s*'等待设备联网'/);
  assert.match(provider, /title:\s*'等待上线并完成添加'/);
  assert.doesNotMatch(provider, /desc:\s*'[^']*LLSync[^']*'/, 'user-facing provisioning progress text should not expose protocol names');
  assert.match(provider, /cancel\(reason = 'USER_CANCELLED'\)/, 'provider should preserve explicit cancellation reasons');
  const progressPage = read('src/packageBluetooth/pages/progress/index.vue');
  assert.match(progressPage, /provisionProvider\.cancel\('PAGE_UNLOADED'\)/, 'passive page exit should close the trace');
  assert.match(progressPage, /!resultNavigated\.value/, 'redirecting to the result page should not be recorded as cancellation');
});

test('scan-to-wifi navigation preserves LLSync product identity from advertisement', () => {
  const bindPage = read('src/packageDevice/pages/bind/index.vue');
  const wifiPage = read('src/packageBluetooth/pages/wifi/index.vue');

  assert.match(bindPage, /@tap="handleDeviceTap\(item\)"/, 'scan card should pass the full parsed scan result');
  assert.match(bindPage, /const productID = encodeURIComponent\(device\.productID \|\| ''\)/, 'scan navigation should carry ProductID');
  assert.match(bindPage, /productID=\$\{productID\}/, 'WiFi page URL should include ProductID');
  assert.match(bindPage, /mac=\$\{mac\}/, 'WiFi page URL should include MAC for debugging/fallback');
  assert.match(wifiPage, /const productID = decodeQueryValue\(query\.productID\)/, 'WiFi page should parse ProductID from query');
  assert.match(wifiPage, /productID,[\s\S]*deviceName,[\s\S]*mac,[\s\S]*moduleVersion/, 'selected scan result should preserve LLSync identity fields');
});
