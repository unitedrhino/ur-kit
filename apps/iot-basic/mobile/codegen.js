/**
 * 本文件按固定 SaaS 合同快照生成移动端 OpenAPI 客户端。
 * 先校验源文件摘要并在临时目录完成全部生成，成功后才替换现有产物。
 */
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// REPO_ROOT 是公开 ur-kit 仓库根目录，用于读取版本化合同和放置临时产物。
const REPO_ROOT = path.resolve(__dirname, '../../..');
// CONTRACTS_ROOT 保存固定 SaaS 提交的 OpenAPI 文档与来源清单。
const CONTRACTS_ROOT = path.join(REPO_ROOT, 'contracts');
// OUTPUT_DIR 是应用实际引用的生成客户端目录，仅在完整生成后替换。
const OUTPUT_DIR = path.join(__dirname, 'src/data/openapi/generated');
// GENERATOR 是当前 mobile 锁文件安装的 OpenAPI Generator CLI。
const GENERATOR = path.join(__dirname, 'node_modules/.bin/openapi-generator-cli');
// SPECS 限定首批移动端使用的 Core 与 Things HTTP 合同。
const SPECS = [
  { name: 'core-api', file: 'core-api.json' },
  { name: 'things-api', file: 'things-api.json' },
];
// EMPTY_PROPERTY_SCHEMAS 是上游 Swagger 中无法表示为 TypeScript 字段的匿名嵌入定义。
const EMPTY_PROPERTY_SCHEMAS = new Set(['DataAreaDetail', 'DeviceSchemaUpdateReq']);
// INVALID_ARRAY_SCHEMAS 是上游 Swagger 将任意 JSON 元素写成 invalid 的两个返回模型。
const INVALID_ARRAY_SCHEMAS = {
  'core-api': 'ApiBatchAggResp',
  'things-api': 'DeviceMsgPropertyBatchGetListResp',
};

/** verifyContracts 核对源 Swagger 与合同清单的逐文件哈希，返回可生成的文件路径。 */
function verifyContracts() {
  execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts/verify_iot_basic.mjs')], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  const manifest = JSON.parse(fs.readFileSync(path.join(CONTRACTS_ROOT, 'manifest.json'), 'utf8'));
  if (!/^[0-9a-f]{40}$/.test(manifest.saas_commit || '')) {
    throw new Error('合同清单缺少完整 SaaS 来源提交');
  }
  return SPECS.map((spec) => {
    const relative = `backend/.swagger/${spec.file}`;
    const input = path.join(CONTRACTS_ROOT, 'source', relative);
    const expected = manifest.files?.[relative];
    if (!/^[0-9a-f]{64}$/.test(expected || '') || !fs.existsSync(input)) {
      throw new Error(`合同清单缺少 ${relative}`);
    }
    const actual = createHash('sha256').update(fs.readFileSync(input)).digest('hex');
    if (actual !== expected) {
      throw new Error(`合同文件与清单不一致: ${relative}`);
    }
    return { ...spec, input };
  });
}

/** prepareSpec 仅修复已核对的匿名字段与任意 JSON 元素，再生成临时合同副本。 */
function prepareSpec(spec, temporary) {
  const document = JSON.parse(fs.readFileSync(spec.input, 'utf8'));
  if (spec.name === 'things-api') {
    for (const name of EMPTY_PROPERTY_SCHEMAS) {
      const properties = document.components?.schemas?.[name]?.properties;
      if (!properties || !Object.prototype.hasOwnProperty.call(properties, '')) {
        throw new Error(`上游 Swagger 匿名属性已变化，请复核生成适配: ${name}`);
      }
      delete properties[''];
    }
  }
  const schemaName = INVALID_ARRAY_SCHEMAS[spec.name];
  const element = document.components?.schemas?.[schemaName]?.properties?.lists?.items?.items;
  if (element?.type !== 'invalid' || element.format !== 'UNKNOWN') {
    throw new Error(`上游 Swagger 任意 JSON 元素已变化，请复核生成适配: ${schemaName}`);
  }
  delete element.type;
  delete element.format;
  const output = path.join(temporary, spec.file);
  fs.writeFileSync(output, JSON.stringify(document));
  return output;
}

/** generateAll 在独立目录生成两个客户端和入口，任何一步失败都保留现有产物。 */
function generateAll() {
  const specs = verifyContracts();
  if (!fs.existsSync(GENERATOR)) {
    throw new Error('缺少锁定的 OpenAPI Generator，请先运行 pnpm install --ignore-workspace --frozen-lockfile');
  }
  const tempBase = path.join(REPO_ROOT, '.temp');
  fs.mkdirSync(tempBase, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(tempBase, 'mobile-codegen-'));
  const staged = path.join(temporary, 'generated');
  const backup = path.join(temporary, 'previous');
  fs.mkdirSync(staged);
  try {
    for (const spec of specs) {
      console.log(`[codegen] 从固定合同生成 ${spec.name}`);
      const input = prepareSpec(spec, temporary);
      execFileSync(GENERATOR, [
        'generate', '-i', input, '-o', path.join(staged, spec.name),
        '-g', 'typescript-fetch',
        '--additional-properties=supportsES6=true,typescriptThreePlus=true',
        '--skip-validate-spec',
        '--global-property=models,apis,supportingFiles',
      ], { cwd: __dirname, stdio: 'inherit' });
    }
    const index = specs.map((spec) => `export * as ${spec.name.replace(/-/g, '_')} from './${spec.name}';`).join('\n');
    fs.writeFileSync(path.join(staged, 'index.ts'), `${index}\n`);
    if (fs.existsSync(OUTPUT_DIR)) {
      if (fs.lstatSync(OUTPUT_DIR).isSymbolicLink()) {
        throw new Error('生成目录不能是符号链接');
      }
      fs.renameSync(OUTPUT_DIR, backup);
    }
    try {
      fs.renameSync(staged, OUTPUT_DIR);
    } catch (error) {
      if (fs.existsSync(backup) && !fs.existsSync(OUTPUT_DIR)) {
        fs.renameSync(backup, OUTPUT_DIR);
      }
      throw error;
    }
    console.log('[codegen] Core 与 Things 客户端已完整更新');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

try {
  generateAll();
} catch (error) {
  console.error('[codegen] 生成失败，原有客户端保持不变:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
