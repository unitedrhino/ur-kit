const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('device list cards show only the device alias in the former device ID row', () => {
  const card = read('src/components/device-card/device-card.vue');
  const home = read('src/pages/home/index.vue');
  const device = read('src/pages/device/index.vue');

  assert.match(card, /deviceAlias\?:\s*string/, 'device-card should accept deviceAlias');
  assert.match(card, /const displayName = computed\(\(\) => props\.deviceAlias \|\| props\.deviceName\)/, 'card title should prefer deviceAlias and fall back to deviceName');
  assert.match(card, /<text class="device-card__name">\{\{displayName\}\}<\/text>/, 'card main row should render the alias-backed display name');
  assert.doesNotMatch(card, /class="device-card__product"/, 'device-card should not render the old second alias/product row');
  assert.match(card, /\.device-card__info\s*\{[^}]*justify-content:\s*flex-start/, 'single-line card content should start next to the left icon');
  assert.doesNotMatch(card, /\.device-card__info\s*\{[^}]*justify-content:\s*center/, 'device alias should not be centered away from the icon');
  assert.match(home, /:deviceAlias="item\.deviceAlias"/, 'home list should pass deviceAlias into device-card');
  assert.match(device, /:deviceAlias="item\.deviceAlias"/, 'device tab list should pass deviceAlias into device-card');
});

test('device settings exposes copyable device ID', () => {
  const settings = read('src/packageDevice/pages/settings/index.vue');
  const icons = read('src/config/icons.ts');
  const appIcon = read('src/components/app-icon/app-icon.vue');

  assert.match(settings, /<text class="ds-row__label">设备ID<\/text>/, 'settings page should show a device ID row');
  assert.match(settings, /<text class="ds-row__value ds-row__value--id">\{\{device\.deviceName\}\}<\/text>/, 'device ID row should display deviceName');
  assert.match(settings, /@tap\.stop="handleCopyDeviceID"/, 'device ID row should expose a copy tap target');
  assert.match(settings, /uni\.setClipboardData\(\{\s*data:\s*d\.deviceName/, 'copy action should copy the real device ID');
  assert.match(settings, /name="tabler:copy"/, 'copy action should use the shared copy icon');
  assert.match(icons, /copy:\s*'tabler:copy'/, 'copy icon should be registered for generated icon assets');
  assert.match(appIcon, /'tabler:copy':\s*'复制'/, 'Android App fallback should render a copy glyph instead of a missing square');
});
