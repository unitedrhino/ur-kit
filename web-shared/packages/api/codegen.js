// 使用本地 json/ 目录中的 OpenAPI JSON 批量生成 TypeScript API 代码
// 文件名（去掉 .json 后缀）作为 modelName，例如 things-saas.json → things-saas
// 生成结果统一放到 /CodeGenerator/{modelName}/，再整合到 /src/

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== JSON 来源加载模块 ====================

// 优先级 1：backend/.swagger/ 相对路径
const SWAGGER_DIR = join(__dirname, '../../../../backend/.swagger');
// 优先级 2：本地 json/ 备用目录
const LOCAL_JSON_DIR = join(__dirname, 'json');

// 跳过列表：modelName（文件名去掉 .json）加入此列表则跳过生成
const SKIP_MODELS = new Set([
  // sale-sale 与历史稳定 namespace mall-mall 内容相同，避免生成重复 SDK。
  'sale-sale',
  // parksvr-parksvr 是 update.sh apps 循环产生的过期重复副本（旧 CamelCase 路由世代，
  // 无前端消费方，正式拷贝为 parksvr-parking），.swagger 中已删除，此处防御其复活后重新生成 SDK。
  'parksvr-parksvr',
]);

/**
 * 从指定目录扫描所有 .json 文件，返回配置列表
 */
function scanJsonDir(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) return null;
  return files.map((file) => {
    const modelName = file.replace('.json', '');
    return {
      modelName,
      title: modelName,
      outputDir: `./CodeGenerator/${modelName}`,
      filePath: join(dir, file),
      enabled: !SKIP_MODELS.has(modelName),
    };
  });
}

/**
 * 按优先级加载 JSON 配置：
 *   1. backend/.swagger/
 *   2. ./json/
 *   3. 两者均无 → 报错退出
 * 返回 { configs, source }
 */
function loadLocalConfigs() {
  // 优先：backend/.swagger/
  const swaggerConfigs = scanJsonDir(SWAGGER_DIR);
  if (swaggerConfigs) {
    return { configs: swaggerConfigs, source: `backend/.swagger/ (${SWAGGER_DIR})` };
  }

  // 备用：./json/
  const localConfigs = scanJsonDir(LOCAL_JSON_DIR);
  if (localConfigs) {
    return { configs: localConfigs, source: `本地 json/ (${LOCAL_JSON_DIR})` };
  }

  // 均无
  console.error('❌ 未找到可用的 OpenAPI JSON 文件。');
  console.error(`   已尝试: ${SWAGGER_DIR}`);
  console.error(`   已尝试: ${LOCAL_JSON_DIR}`);
  console.error('   请将 OpenAPI JSON 文件放入上述任一目录后重试。');
  process.exit(1);
}

/**
 * parseRequestedModels 解析命令行中的定向生成模块。
 * 支持 `--model things-card` 与 `--model=things-card` 两种写法。
 */
function parseRequestedModels(args = process.argv.slice(2)) {
  const requestedModels = new Set();

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--model') {
      const modelName = args[index + 1];
      if (!modelName || modelName.startsWith('--')) {
        throw new Error('--model 必须提供模块名');
      }
      requestedModels.add(modelName);
      index++;
      continue;
    }
    if (argument.startsWith('--model=')) {
      const modelName = argument.slice('--model='.length);
      if (!modelName) {
        throw new Error('--model 必须提供模块名');
      }
      requestedModels.add(modelName);
      continue;
    }
    throw new Error(`不支持的参数: ${argument}`);
  }

  return requestedModels;
}

/**
 * selectConfigs 按显式模块名筛选生成配置，并校验目标真实存在。
 */
function selectConfigs(configs, requestedModels) {
  if (!requestedModels || requestedModels.size === 0) {
    return configs;
  }

  const knownModels = new Set(configs.map((config) => config.modelName));
  const missingModels = [...requestedModels].filter((modelName) => !knownModels.has(modelName));
  if (missingModels.length > 0) {
    throw new Error(`未找到指定模块: ${missingModels.join(', ')}`);
  }

  return configs.filter((config) => requestedModels.has(config.modelName));
}

/**
 * assertGenerationSucceeded 确保所有选中模块均生成成功。
 */
function assertGenerationSucceeded(successCount, totalCount) {
  if (successCount !== totalCount) {
    throw new Error(`API 生成失败: ${successCount}/${totalCount}`);
  }
}

// ==================== 文件操作模块 ====================

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录: ${dir}`);
  }
}

/**
 * 清理之前生成的文件
 */
function cleanupBeforeGeneration(requestedModels = new Set()) {
  console.log('🧹 生成前清理之前的文件...');

  // 清理 CodeGenerator 目录
  const codeGenDir = './CodeGenerator';
  if (existsSync(codeGenDir)) {
    const dirs = readdirSync(codeGenDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const dir of dirs) {
      const dirPath = join(codeGenDir, dir);
      console.log(`   删除目录: ${dir}`);
      rmSync(dirPath, { recursive: true, force: true });
    }
    console.log(`✅ 清理完成，删除了 ${dirs.length} 个 CodeGenerator 目录`);
  }

  // 全量生成清理 src；定向生成只清理目标模块，避免改写无关 SDK。
  const srcDir = './src';
  if (existsSync(srcDir)) {
    if (requestedModels.size === 0) {
      console.log('   删除 src 目录');
      rmSync(srcDir, { recursive: true, force: true });
      console.log('✅ src 目录清理完成');
    } else {
      for (const modelName of requestedModels) {
        const moduleDir = join(srcDir, modelName);
        if (existsSync(moduleDir)) {
          console.log(`   删除目标模块: src/${modelName}`);
          rmSync(moduleDir, { recursive: true, force: true });
        }
      }
      console.log('✅ 目标模块清理完成');
    }
  }

  // 清理临时 OpenAPI 文件
  const tempDir = './temp';
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ temp 目录清理完成');
  }

  console.log('');
}

/**
 * 检查 OpenAPI Generator CLI 是否安装
 */
function checkOpenAPIGenerator() {
  try {
    execSync('openapi-generator-cli version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('❌ OpenAPI Generator CLI 未安装，正在安装...');
    try {
      execSync('npm install -g @openapitools/openapi-generator-cli', { stdio: 'inherit' });
      console.log('✅ OpenAPI Generator CLI 安装成功');
      return true;
    } catch (installError) {
      console.error('❌ 安装失败:', installError.message);
      return false;
    }
  }
}

/**
 * 清理生成的不需要文件
 */
function cleanupGeneratedFiles(outputDir) {
  console.log(`   🧹 清理不需要的生成文件...`);

  const filesToRemove = ['common.ts', 'configuration.ts', 'git_push.sh', '.npmignore', '.gitignore', 'README.md'];

  const dirsToRemove = ['docs'];

  filesToRemove.forEach((file) => {
    const filePath = join(outputDir, file);
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
      console.log(`     删除文件: ${file}`);
    }
  });

  dirsToRemove.forEach((dir) => {
    const dirPath = join(outputDir, dir);
    if (existsSync(dirPath)) {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`     删除目录: ${dir}`);
    }
  });

  console.log(`   ✅ 清理完成`);
}

// ==================== API 生成模块 ====================

/**
 * applyPropertyQualitySchema 补全 goctl 尚不能表达的属性质量枚举和可空值合同。
 * 仅处理已具备新字段的物联网 schema；同步持久化 Swagger，避免文档与 SDK 不一致。
 */
function applyPropertyQualitySchema(spec) {
  const schemas = spec.components?.schemas;
  if (!schemas?.DeviceMsgPropertyLogInfo?.properties?.quality) return false;
  // 文档格式版本沿用历史 SDK，避免 goctl 默认版本号造成全模块注释漂移；不是功能发布版本。
  spec.info.version = '1.0.1';
  const receiptTypes = [
    'DeviceMsgPropertyLogInfo', 'DeviceInfoWithProperty', 'DeviceMsgEventLogInfo',
    'DeviceMsgHubLogInfo', 'DeviceInteractSendActionResp',
    'DeviceInteractPropertyGetReportSendResp', 'DeviceInteractPropertyGetReportSendMsg',
  ];
  for (const name of receiptTypes) {
    const receivedTime = schemas[name]?.properties?.receivedTime;
    // 接收时间以数字 0 表示未知，不能把已确定的 API 字段改回可空。
    if (receivedTime) delete receivedTime.nullable;
  }
  for (const name of ['DeviceMsgPropertyLogInfo', 'DeviceInfoWithProperty', 'DeviceMsgPropertyLogAggRespDataDetail']) {
    const value = schemas[name]?.properties?.value;
    if (value) value.nullable = true;
  }
  const latestAggregate = schemas.DeviceMsgPropertyLatestAggRespDetail?.properties?.values?.additionalProperties;
  if (latestAggregate) latestAggregate.nullable = true;
  const qualityValues = ['GOOD', 'UNCERTAIN', 'BAD'];
  for (const name of ['DeviceMsgPropertyLogInfo', 'DeviceInfoWithProperty']) {
    const quality = schemas[name]?.properties?.quality;
    if (quality) quality.enum = qualityValues;
  }
  for (const name of ['DeviceInteractPropertyGetReportSendResp', 'DeviceInteractPropertyGetReportSendMsg']) {
    const quality = schemas[name]?.properties?.quality?.additionalProperties;
    if (quality) quality.enum = qualityValues;
  }
  return true;
}

/**
 * 从本地 JSON 文件生成单个模块的 API
 * @param {object} apiConfig - { modelName, title, outputDir, filePath, enabled }
 */
async function generateAPI(apiConfig) {
  const { title, modelName, outputDir, filePath, enabled } = apiConfig;

  if (!enabled) {
    console.log(`⏭️  跳过 ${title} (已禁用)`);
    return true;
  }

  console.log(`🚀 正在生成 ${title} 的 API...`);
  console.log(`   模块名: ${modelName}`);
  console.log(`   源文件: ${filePath}`);
  console.log(`   输出目录: ${outputDir}`);

  try {
    // 1. 读取本地 JSON 文件
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    const openAPISpec = JSON.parse(readFileSync(filePath, 'utf-8'));
    console.log(`   ✅ 读取本地文件成功`);
    if (modelName === 'things-api' && applyPropertyQualitySchema(openAPISpec)) {
      writeFileSync(filePath, `${JSON.stringify(openAPISpec, null, 2)}\n`, 'utf-8');
    }

    // 1.5 清洗 operationId：将冒号替换为驼峰（:clientID → ClientID）
    //     冒号在 go-zero 生成的 swagger 中用于分隔路径段，但对 openapi-generator 是非法字符
    let sanitized = 0;
    for (const methods of Object.values(openAPISpec.paths || {})) {
      for (const op of Object.values(methods)) {
        if (op.operationId && op.operationId.includes(':')) {
          op.operationId = op.operationId.replace(/:([a-zA-Z])/g, (_, c) => c.toUpperCase()).replace(/:/g, '');
          sanitized++;
        }
      }
    }
    if (sanitized > 0) {
      console.log(`   🔧 已清洗 ${sanitized} 个含冒号的 operationId`);
    }

    // 1.6 补全 path 模板中的 {param}：部分 go-zero swagger 未写 parameters，导致生成代码缺少 .replace
    let pathParamsInjected = 0;
    for (const [pathKey, methods] of Object.entries(openAPISpec.paths || {})) {
      const pathParamNames = [...pathKey.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      if (pathParamNames.length === 0) continue;
      for (const op of Object.values(methods)) {
        if (!op || typeof op !== 'object') continue;
        if (!Array.isArray(op.parameters)) {
          op.parameters = [];
        }
        const existingPath = new Set(op.parameters.filter((p) => p && p.in === 'path').map((p) => p.name));
        for (const name of pathParamNames) {
          if (existingPath.has(name)) continue;
          op.parameters.push({
            in: 'path',
            name,
            required: true,
            schema: { type: 'string' },
          });
          existingPath.add(name);
          pathParamsInjected++;
        }
      }
    }
    if (pathParamsInjected > 0) {
      console.log(`   🔧 已补全 ${pathParamsInjected} 个路径参数声明（来自 URL 模板）`);
    }

    // 1.7 去重 tags：go-zero swagger 可能为同一个 operation 生成多个 tag（如 ['system/access/info', 'systemAccessInfo']），
    //     openapi-generator 会为每个 tag 生成一份函数拷贝（带 _N 后缀），造成代码膨胀。仅保留第一个 tag。
    let tagsDeduped = 0;
    for (const methods of Object.values(openAPISpec.paths || {})) {
      for (const op of Object.values(methods)) {
        if (op && Array.isArray(op.tags) && op.tags.length > 1) {
          op.tags = [op.tags[0]];
          tagsDeduped++;
        }
      }
    }
    if (tagsDeduped > 0) {
      console.log(`   🔧 已去重 ${tagsDeduped} 个多标签 operation（仅保留首个 tag）`);
    }

    // 1.8 修正 body 参数名：go-zero 生成的 swagger 中 body 参数统一命名为 "body"，
    //     openapi-generator >= 7.x 会直接使用该 name 作为函数参数名，导致所有接口参数名都是 body。
    //     此处将 body 参数的 name 替换为其 schema 引用类型的小驼峰形式（如 AlarmInfo → alarmInfo）。
    let bodyParamRenamed = 0;
    for (const methods of Object.values(openAPISpec.paths || {})) {
      for (const op of Object.values(methods)) {
        if (!op || typeof op !== 'object' || !Array.isArray(op.parameters)) continue;
        for (const param of op.parameters) {
          if (param.in === 'body' && param.name === 'body' && param.schema) {
            // 从 $ref 或直接 type 中提取类型名
            const ref = param.schema.$ref;
            if (ref) {
              const typeName = ref.split('/').pop();
              if (typeName) {
                // PascalCase → camelCase
                param.name = typeName.charAt(0).toLowerCase() + typeName.slice(1);
                bodyParamRenamed++;
              }
            }
          }
        }
      }
    }
    if (bodyParamRenamed > 0) {
      console.log(`   🔧 已修正 ${bodyParamRenamed} 个 body 参数名（body → 类型名小驼峰）`);
    }

    // 2. 保存到临时文件（openapi-generator-cli 需要文件路径输入）
    const tempDir = './temp';
    ensureDir(tempDir);
    const tempFilePath = join(tempDir, `${modelName}-openapi.json`);
    writeFileSync(tempFilePath, JSON.stringify(openAPISpec, null, 2), 'utf-8');
    console.log(`   💾 已保存到临时文件: ${tempFilePath}`);

    // 3. 确保输出目录存在
    ensureDir(outputDir);

    // 4. 构建 OpenAPI Generator 命令（配置硬编码）
    const additionalProps = [
      'withSeparateModelsAndApi=true',
      'modelPropertyNaming=camelCase',
      'apiPackage=apis',
      'modelPackage=models',
      'supportsES6=true',
      'typescriptThreePlus=true',
      'stringEnums=true',
      'enumPropertyNaming=UPPERCASE',
      'generateSourceCodeOnly=true',
      'removeOperationIdPrefix=true',
      'useSingleRequestParameter=false',
      'legacyDiscriminatorBehavior=false',
      'disallowAdditionalPropertiesIfNotPresent=false',
    ].join(',');

    const command = `openapi-generator-cli generate \
      -i "${tempFilePath}" \
      -g typescript-axios \
      -o "${outputDir}" \
      -t "./typescript-axios" \
      --skip-validate-spec \
      --additional-properties="${additionalProps}"`;

    console.log(`   🔨 执行 OpenAPI Generator...`);
    execSync(command, { stdio: 'ignore' });
    console.log(`✅ ${title} API 生成完成`);

    // 5. 清理不需要的生成文件
    cleanupGeneratedFiles(outputDir);

    return true;
  } catch (error) {
    console.error(`❌ ${title} API 生成失败:`, error.message);
    return false;
  }
}

// ==================== 文件整合模块 ====================

/**
 * Mustache 统一 import COLLECTION_FORMATS；无数组 query 的文件会触发消费方 noUnusedLocals。
 * 仅 bodyParam 且未使用 _bp['…'] 访问时删除多余 _bp 声明。
 */
function postProcessGeneratedApiTs(content) {
  let s = content;

  // 自定义模板历史上把所有无 body 接口都生成成 POST；按 operationId 修正 GET，
  // 并仅通过 config 传 query，避免迁移后的只读接口被错误方法调用。
  s = s.replace(
    /(export async function\s+get[\s\S]*?return )requestClient\.post<([^;\n]+)>\(localVarPath, bodyParam, mergeApiConfig\(([^)]*)\)\);/g,
    '$1requestClient.get<$2>(localVarPath, mergeApiConfig($3));',
  );

  if (!s.includes('COLLECTION_FORMATS[')) {
    s = s.replace(/import \{ requestClient, mergeApiConfig, COLLECTION_FORMATS \} from/g, 'import { requestClient, mergeApiConfig } from');
  }
  if (!s.includes("_bp['") && !s.includes('_bp["')) {
    s = s.replace(/^\s*const _bp = bodyParam as Record<string, unknown>;\n/gm, '');
  }
  // 去重：inline object type 中同名属性（allParams 可能包含 query + form 重复字段）
  s = s.replace(/bodyParam: \{([^}]+)\[key: string\]: unknown \}/g, (match, propsStr) => {
    const seen = new Map();
    const props = propsStr
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean);
    const unique = [];
    for (const prop of props) {
      const nameMatch = prop.match(/^(\w+)/);
      if (nameMatch) {
        const name = nameMatch[1];
        if (!seen.has(name)) {
          seen.set(name, true);
          unique.push(prop);
        }
      }
    }
    if (unique.length === props.length) return match; // 无重复，原样返回
    return `bodyParam: { ${unique.join('; ')}; [key: string]: unknown }`;
  });
  // 去重：JSDoc 中同名 bodyParam.xxx 参数
  s = s.replace(/(\/\*\*[\s\S]*?\*\/)/g, (docBlock) => {
    const lines = docBlock.split('\n');
    const seen = new Set();
    const filtered = lines.filter((line) => {
      const m = line.match(/\* @param .+\[bodyParam\.(\w+)\]/);
      if (m) {
        if (seen.has(m[1])) return false;
        seen.add(m[1]);
      }
      return true;
    });
    return filtered.join('\n');
  });

  // openapi-generator 会把 aisvr skill 的多个 SkillInfo 响应错误折叠到 approve response。
  // 对 get-one 保持专属 wrapper，保证 ExtractDataType<{data?: SkillInfo}> 正常解包。
  if (s.includes('export async function  postApiV1AiSkillGetOne')) {
    if (!s.includes("import type { PostApiV1AiSkillGetOne200Response } from '../models';")) {
      s = s.replace(
        "import type { PostApiV1AiSkillGetList200Response } from '../models';",
        "import type { PostApiV1AiSkillGetList200Response } from '../models';\nimport type { PostApiV1AiSkillGetOne200Response } from '../models';",
      );
    }
    s = s.replace(
      /return requestClient\.post<ExtractDataType<PostApiV1AiSkillApprove200Response>>\(localVarPath, withID, mergeApiConfig\(config, localVarQueryParameter, localVarHeaderParameter\)\);/g,
      'return requestClient.post<ExtractDataType<PostApiV1AiSkillGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));',
    );
    s = s.replace(
      /return requestClient\.post<ExtractDataType<SkillInfo>>\(localVarPath, withID, mergeApiConfig\(config, localVarQueryParameter, localVarHeaderParameter\)\);/g,
      'return requestClient.post<ExtractDataType<PostApiV1AiSkillGetOne200Response>>(localVarPath, withID, mergeApiConfig(config, localVarQueryParameter, localVarHeaderParameter));',
    );
  }
  return normalizeGeneratedTypeScript(s);
}

/**
 * renderModuleIndex 根据模块目录名生成统一 namespace 导出文件。
 */
function renderModuleIndex(moduleNames) {
  let indexContent = '// 自动生成，请勿修改\n';
  indexContent += '// 导出基础配置\n';
  indexContent += 'export * from "./base";\n\n';
  indexContent += '// 导出所有模块\n';

  [...moduleNames].sort().forEach((moduleName) => {
    const namespace = moduleName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    indexContent += `export * as ${namespace} from "./${moduleName}";\n`;
  });
  return indexContent;
}

/**
 * refreshModuleIndexFromSource 扫描已有 SDK 模块并刷新 namespace 导出。
 */
function refreshModuleIndexFromSource(srcDir = './src') {
  const moduleNames = readdirSync(srcDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((moduleName) => existsSync(join(srcDir, moduleName, 'index.ts')));
  writeFileSync(join(srcDir, 'index.ts'), renderModuleIndex(moduleNames));
}

/**
 * 清理生成 TypeScript 的行尾空白并保留单个文件末尾换行。
 */
function normalizeGeneratedTypeScript(content) {
  return `${content.replace(/[ \t]+$/gm, '').replace(/\n*$/, '')}\n`;
}

function ensureCoreAiSkillGetOneResponse(srcDir = './src') {
  const modelsDir = join(srcDir, 'core-ai', 'models');
  if (!existsSync(modelsDir)) return;

  const wrapperFile = join(modelsDir, 'post-api-v1-ai-skill-get-one200-response.ts');
  const wrapperContent = `/* tslint:disable */
/* eslint-disable */
/**
 * core-ai
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



// May contain unused imports in some cases
// @ts-ignore
import type { SkillInfo } from './skill-info';

export interface PostApiV1AiSkillGetOne200Response {
    'code'?: number;
    'data'?: SkillInfo;
    'msg'?: string;
}
`;
  writeFileSync(wrapperFile, wrapperContent);

  const indexFile = join(modelsDir, 'index.ts');
  if (existsSync(indexFile)) {
    const exportLine = "export * from './post-api-v1-ai-skill-get-one200-response';\n";
    const indexContent = readFileSync(indexFile, 'utf-8');
    if (!indexContent.includes(exportLine.trim())) {
      const anchor = "export * from './post-api-v1-ai-skill-get-list200-response';\n";
      if (indexContent.includes(anchor)) {
        writeFileSync(indexFile, indexContent.replace(anchor, anchor + exportLine));
      } else {
        writeFileSync(indexFile, indexContent + exportLine);
      }
    }
  }
}

/**
 * 整合所有生成的模块文件到 src/ 目录
 * @param {string} srcDir - 目标目录，默认 './src'
 */
function integrateFiles(srcDir = './src', options = {}) {
  const { updateSharedFiles = true } = options;
  console.log('\n🔧 开始整合文件到 src 目录...');

  ensureDir(srcDir);

  let processedModels = new Set();
  let moduleNames = [];
  let baseContent = '';

  // 遍历所有生成的目录
  const generatorDirs = readdirSync('./CodeGenerator', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`📂 发现 ${generatorDirs.length} 个生成目录`);

  for (const dir of generatorDirs) {
    const generatorPath = join('./CodeGenerator', dir);

    if (!existsSync(generatorPath)) continue;

    console.log(`\n📁 处理 ${dir} 目录...`);
    moduleNames.push(dir);

    // 在 src 下创建模块目录
    const moduleDir = join(srcDir, dir);
    ensureDir(moduleDir);

    // 复制 models 文件到模块目录
    const modelsPath = join(generatorPath, 'models');
    if (existsSync(modelsPath)) {
      const moduleModelsDir = join(moduleDir, 'models');
      ensureDir(moduleModelsDir);

      const modelFiles = readdirSync(modelsPath);
      console.log(`   发现 ${modelFiles.length} 个模型文件`);

      for (const file of modelFiles) {
        if (file.endsWith('.ts')) {
          const sourcePath = join(modelsPath, file);
          const targetPath = join(moduleModelsDir, file);

          if (processedModels.has(file)) {
            console.log(`   ⚠️  覆盖重复模型文件: ${file}`);
          } else {
            console.log(`   📋 复制模型文件: ${file} -> ${dir}/models/`);
            processedModels.add(file);
          }

          const modelSource = readFileSync(sourcePath, 'utf-8');
          writeFileSync(targetPath, normalizeGeneratedTypeScript(modelSource), 'utf-8');
        }
      }
    }

    // 复制 apis 文件到模块目录
    const apisPath = join(generatorPath, 'apis');
    if (existsSync(apisPath)) {
      const moduleApisDir = join(moduleDir, 'apis');
      ensureDir(moduleApisDir);

      const apiFiles = readdirSync(apisPath);
      console.log(`   发现 ${apiFiles.length} 个 API 文件`);

      for (const file of apiFiles) {
        if (file.endsWith('.ts')) {
          const sourcePath = join(apisPath, file);
          const targetPath = join(moduleApisDir, file);

          if (existsSync(targetPath)) {
            console.log(`   ⚠️  覆盖重复 API 文件: ${file}`);
          } else {
            console.log(`   📋 复制 API 文件: ${file} -> ${dir}/apis/`);
          }

          const apiSrc = readFileSync(sourcePath, 'utf-8');
          writeFileSync(targetPath, postProcessGeneratedApiTs(apiSrc), 'utf-8');
        }
      }
    }

    // 复制 api.ts 到模块目录
    const apiPath = join(generatorPath, 'api.ts');
    if (existsSync(apiPath)) {
      const targetApiPath = join(moduleDir, 'api.ts');
      const apiSource = readFileSync(apiPath, 'utf-8');
      writeFileSync(targetApiPath, normalizeGeneratedTypeScript(apiSource), 'utf-8');
      console.log(`   📋 复制 api.ts -> ${dir}/`);
    }

    // 复制 index.ts 到模块目录
    const indexPath = join(generatorPath, 'index.ts');
    if (existsSync(indexPath)) {
      const targetIndexPath = join(moduleDir, 'index.ts');
      const indexSource = readFileSync(indexPath, 'utf-8');
      writeFileSync(targetIndexPath, normalizeGeneratedTypeScript(indexSource), 'utf-8');
      console.log(`   📋 复制 index.ts -> ${dir}/`);
    }

    // 获取 base.ts 内容（取第一份）
    if (!baseContent) {
      const basePath = join(generatorPath, 'base.ts');
      if (existsSync(basePath)) {
        baseContent = readFileSync(basePath, 'utf-8');
        console.log(`   📋 获取 base.ts 内容来自: ${dir}`);
      }
    }
  }

  // 定向生成复用现有共享文件，避免无关 base.ts 产生漂移。
  if (baseContent && updateSharedFiles) {
    writeFileSync(join(srcDir, 'base.ts'), normalizeGeneratedTypeScript(baseContent));
    console.log(`✅ 写入 base.ts 完成 (${srcDir}/base.ts)`);
  }

  if (updateSharedFiles) {
    ensureCoreAiSkillGetOneResponse(srcDir);
  }

  // 生成 src/index.ts，导出所有模块
  if (moduleNames.length > 0 && updateSharedFiles) {
    writeFileSync(join(srcDir, 'index.ts'), renderModuleIndex(moduleNames));
    console.log(`✅ 生成 src/index.ts 完成 (${srcDir}/index.ts)`);
  }

  console.log('\n🎉 所有文件整合完成！');
}

/**
 * 清理临时文件
 */
function cleanupTempFiles() {
  const tempDir = './temp';
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    console.log('🧹 临时文件清理完成');
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('🚀 开始批量生成 API...\n');

  // 按优先级加载 JSON 配置
  const requestedModels = parseRequestedModels();
  const { configs: allConfigs, source } = loadLocalConfigs();
  const configs = selectConfigs(allConfigs, requestedModels);
  console.log(`📂 JSON 来源: ${source}`);
  console.log(`📋 发现 ${configs.length} 个 JSON 文件:`);
  configs.forEach((c) => console.log(`   - ${c.filePath} → ${c.modelName}`));
  console.log('');

  // 生成前清理
  cleanupBeforeGeneration(requestedModels);

  // 检查 OpenAPI Generator CLI
  if (!checkOpenAPIGenerator()) {
    console.error('❌ OpenAPI Generator CLI 检查失败，退出');
    process.exit(1);
  }

  // 批量生成 API
  let successCount = 0;
  for (const apiConfig of configs) {
    const success = await generateAPI(apiConfig);
    if (success) successCount++;
    console.log('');
  }

  console.log(`📊 API 生成统计: ${successCount}/${configs.length} 成功`);
  console.log(`📂 JSON 来源: ${source}`);

  assertGenerationSucceeded(successCount, configs.length);

  if (successCount > 0) {
    integrateFiles('./src', {
      updateSharedFiles: requestedModels.size === 0,
    });
    if (requestedModels.size > 0) {
      refreshModuleIndexFromSource('./src');
    }
  } else {
    console.log('⚠️  没有成功生成的 API，跳过文件整合');
  }

  // 清理临时文件
  cleanupTempFiles();

  console.log('\n✨ 代码生成任务完成！');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  });
}

export {
  assertGenerationSucceeded,
  generateAPI,
  integrateFiles,
  loadLocalConfigs,
  main,
  normalizeGeneratedTypeScript,
  parseRequestedModels,
  postProcessGeneratedApiTs,
  refreshModuleIndexFromSource,
  renderModuleIndex,
  selectConfigs,
};
