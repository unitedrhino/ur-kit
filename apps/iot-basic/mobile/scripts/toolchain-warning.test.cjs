const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('vite sass options silence the third-party legacy JS API deprecation warning', () => {
  const config = read('vite.config.ts');

  assert.match(config, /preprocessorOptions/, 'vite css.preprocessorOptions should be configured');
  assert.match(
    config,
    /scss:\s*\{[\s\S]*silenceDeprecations:\s*\[\s*['"]legacy-js-api['"]\s*\]/,
    'scss should silence Dart Sass legacy-js-api deprecations emitted by the uni/vite toolchain',
  );
});
