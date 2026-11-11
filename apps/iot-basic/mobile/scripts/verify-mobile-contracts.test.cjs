/** 文件说明：校验移动端合同快照损坏时构建入口拒绝继续。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
test('移动端合同来源和文件摘要受校验', () => {
  const tempRoot = path.resolve(__dirname, '../../../..', '.temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const root = fs.mkdtempSync(path.join(tempRoot, 'ur-mobile-contract-'));
  try {
    fs.mkdirSync(path.join(root, 'scripts')); fs.mkdirSync(path.join(root, 'contracts'));
    fs.copyFileSync(path.join(__dirname, 'verify-mobile-contracts.cjs'), path.join(root, 'scripts/verify-mobile-contracts.cjs'));
    const files = {};
    for (const name of ['core-api.json', 'things-api.json']) {
      fs.writeFileSync(path.join(root, 'contracts', name), '{}');
      files[name] = createHash('sha256').update('{}').digest('hex');
    }
    fs.writeFileSync(path.join(root, 'contracts/manifest.json'), JSON.stringify({ saasCommit: 'a'.repeat(40), files }));
    const run = () => spawnSync(process.execPath, [path.join(root, 'scripts/verify-mobile-contracts.cjs')], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    fs.writeFileSync(path.join(root, 'contracts/core-api.json'), '{"changed":true}');
    assert.notEqual(run().status, 0);
    assert.match(run().stderr, /摘要不匹配/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
