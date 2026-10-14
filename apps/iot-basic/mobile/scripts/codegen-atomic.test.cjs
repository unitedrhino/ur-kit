// 本文件验证移动端合同生成在失败时保留原客户端，并拒绝被改动的 Swagger。
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/** codegenDir 在仓库忽略的临时目录中构造独立应用，不接触现有生成产物。 */
function codegenDir() {
  const root = path.resolve(__dirname, '../../../..');
  const tempRoot = path.join(root, '.temp');
  fs.mkdirSync(tempRoot, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(tempRoot, 'mobile-codegen-test-'));
  const mobile = path.join(fixture, 'apps/iot-basic/mobile');
  const contracts = path.join(fixture, 'contracts/source/backend/.swagger');
  const bin = path.join(mobile, 'node_modules/.bin');
  fs.mkdirSync(contracts, { recursive: true });
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(mobile, 'src/data/openapi'), { recursive: true });
  fs.writeFileSync(path.join(mobile, 'package.json'), '{"type":"commonjs"}\n');
  fs.copyFileSync(path.resolve(__dirname, '../codegen.js'), path.join(mobile, 'codegen.js'));
  const files = {};
  for (const name of ['core-api', 'things-api']) {
    const relative = `backend/.swagger/${name}.json`;
    const body = JSON.stringify({
      swagger: '2.0',
      info: { title: name, version: '1' },
      components: name === 'things-api' ? { schemas: {
        DataAreaDetail: { properties: { '': { type: 'string' }, authType: { type: 'integer' } } },
        DeviceSchemaUpdateReq: { properties: { '': { type: 'string' } } },
        DeviceMsgPropertyBatchGetListResp: { properties: { lists: { items: { items: { type: 'invalid', format: 'UNKNOWN' } } } } },
      } } : { schemas: {
        ApiBatchAggResp: { properties: { lists: { items: { items: { type: 'invalid', format: 'UNKNOWN' } } } } },
      } },
    });
    fs.writeFileSync(path.join(contracts, `${name}.json`), body);
    files[relative] = createHash('sha256').update(body).digest('hex');
  }
  fs.writeFileSync(path.join(fixture, 'contracts/manifest.json'), JSON.stringify({ saas_commit: 'a'.repeat(40), files }));
  const verifierDir = path.join(fixture, 'scripts');
  fs.mkdirSync(verifierDir, { recursive: true });
  fs.copyFileSync(path.join(root, 'scripts/verify_iot_basic.mjs'), path.join(verifierDir, 'verify_iot_basic.mjs'));
  const shared = path.join(fixture, 'web-shared');
  fs.mkdirSync(shared);
  fs.writeFileSync(path.join(shared, 'source.json'), JSON.stringify({ saasCommit: 'b'.repeat(40), packages: {} }));
  const lock = spawnSync(process.execPath, [path.join(verifierDir, 'verify_iot_basic.mjs'), '--print'], {
    cwd: fixture,
    encoding: 'utf8',
  });
  assert.equal(lock.status, 0, lock.stderr);
  fs.writeFileSync(path.join(fixture, 'apps/iot-basic/ur-kit.lock.json'), lock.stdout);
  const fakeGenerator = path.join(bin, 'openapi-generator-cli');
  fs.writeFileSync(fakeGenerator, `#!/usr/bin/env node
const fs=require('node:fs'); const path=require('node:path');
const args=process.argv.slice(2); const input=args[args.indexOf('-i')+1]; const output=args[args.indexOf('-o')+1];
const spec=JSON.parse(fs.readFileSync(input,'utf8'));
if(path.basename(input)==='things-api.json' && ('' in spec.components.schemas.DataAreaDetail.properties || '' in spec.components.schemas.DeviceSchemaUpdateReq.properties)) process.exit(8);
const target=path.basename(input)==='things-api.json'?'DeviceMsgPropertyBatchGetListResp':'ApiBatchAggResp';
if(spec.components.schemas[target].properties.lists.items.items.type==='invalid') process.exit(9);
fs.mkdirSync(output,{recursive:true}); fs.writeFileSync(path.join(output,'client.ts'),path.basename(input));
if(process.env.MOCK_FAIL_SPEC && path.basename(input)===process.env.MOCK_FAIL_SPEC) process.exit(7);
`);
  fs.chmodSync(fakeGenerator, 0o755);
  return { fixture, mobile, contracts, output: path.join(mobile, 'src/data/openapi/generated') };
}

/** runCodegen 在隔离应用中执行与用户相同的脚本入口并返回状态。 */
function runCodegen(mobile, extraEnv = {}) {
  return spawnSync(process.execPath, [path.join(mobile, 'codegen.js')], {
    cwd: mobile,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

test('OpenAPI 两组客户端全部成功后替换，生成失败、版本锁和合同篡改保留旧产物', () => {
  const { fixture, mobile, contracts, output } = codegenDir();
  try {
    const first = runCodegen(mobile);
    assert.equal(first.status, 0, first.stderr);
    const index = fs.readFileSync(path.join(output, 'index.ts'), 'utf8');
    assert.match(index, /core_api/);
    assert.match(index, /things_api/);
    assert.equal(fs.readFileSync(path.join(output, 'things-api/client.ts'), 'utf8'), 'things-api.json');

    const lockPath = path.join(fixture, 'apps/iot-basic/ur-kit.lock.json');
    const locked = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    fs.writeFileSync(lockPath, JSON.stringify({ ...locked, webSharedSHA256: '0'.repeat(64) }));
    const mismatched = runCodegen(mobile);
    assert.equal(mismatched.status, 1);
    assert.match(mismatched.stderr, /版本锁不匹配/);
    assert.equal(fs.readFileSync(path.join(output, 'index.ts'), 'utf8'), index);
    fs.writeFileSync(lockPath, JSON.stringify(locked));

    const failed = runCodegen(mobile, { MOCK_FAIL_SPEC: 'things-api.json' });
    assert.equal(failed.status, 1);
    assert.equal(fs.readFileSync(path.join(output, 'index.ts'), 'utf8'), index);
    assert.equal(fs.readFileSync(path.join(output, 'things-api/client.ts'), 'utf8'), 'things-api.json');

    fs.writeFileSync(path.join(contracts, 'core-api.json'), '{"swagger":"changed"}');
    const tampered = runCodegen(mobile);
    assert.equal(tampered.status, 1);
    assert.match(tampered.stderr, /合同文件与清单不一致/);
    assert.equal(fs.readFileSync(path.join(output, 'index.ts'), 'utf8'), index);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
