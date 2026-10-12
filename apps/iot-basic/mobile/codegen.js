/**
 * OpenAPI Codegen 脚本
 *
 * 从本仓 contracts/source/backend/.swagger/ 读取固定 SaaS 提交的 Swagger JSON，
 * 生成 TypeScript DTOs + API 客户端到 src/data/openapi/generated/
 *
 * 用法: cd apps/iot-basic/mobile && pnpm codegen
 *
 * 依赖: @openapitools/openapi-generator-cli（全局安装或 npx）
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SWAGGER_DIR = path.resolve(__dirname, '../../../contracts/source/backend/.swagger');
const OUTPUT_DIR = path.resolve(__dirname, 'src/data/openapi/generated');

const specs = [
  { name: 'core-api', file: 'core-api.json' },
  { name: 'things-api', file: 'things-api.json' },
];

function generate(spec) {
  const inputPath = path.join(SWAGGER_DIR, spec.file);
  const outputPath = path.join(OUTPUT_DIR, spec.name);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`missing contract: ${inputPath}`);
  }

  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true, force: true });
  }

  console.log(`[codegen] Generating ${spec.name} from ${spec.file}...`);

  execSync(
    [
      'npx @openapitools/openapi-generator-cli generate',
      `-i "${inputPath}"`,
      `-o "${outputPath}"`,
      '-g typescript-fetch',
      '--additional-properties=supportsES6=true,typescriptThreePlus=true',
      '--skip-validate-spec',
      '--global-property=models,apis,supportingFiles=index.ts',
    ].join(' '),
    { stdio: 'inherit' },
  );

  console.log(`[codegen] Done: ${spec.name}`);
  return true;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const generated = [];
let failed = false;

for (const spec of specs) {
  try {
    if (generate(spec)) {
      generated.push(spec);
    }
  } catch (err) {
    failed = true;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[codegen] FAILED: ${spec.name}`, message);
  }
}

const indexContent = generated
  .filter((spec) => fs.existsSync(path.join(OUTPUT_DIR, spec.name)))
  .map((spec) => `export * as ${spec.name.replace(/-/g, '_')} from './${spec.name}';`)
  .join('\n');

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), `${indexContent}\n`);

if (failed) {
  process.exitCode = 1;
} else {
  console.log('[codegen] All done.');
}
