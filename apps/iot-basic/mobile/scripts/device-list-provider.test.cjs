const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('device list trusts backend project context instead of filtering DTO projectID locally', () => {
  const provider = read('src/providers/device-list.provider.ts');

  assert.doesNotMatch(
    provider,
    /filterByFamily/,
    'device list should not remove backend-visible devices by comparing dto.projectID with current family ID',
  );
  assert.doesNotMatch(
    provider,
    /\.filter\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.projectID\s*===\s*\w+/,
    'device list should not locally filter devices by projectID after get-list returns',
  );
});
