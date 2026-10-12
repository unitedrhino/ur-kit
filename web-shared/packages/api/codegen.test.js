// 本文件验证 API 生成器的模块去重与 TypeScript 输出清理规则。
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { assertGenerationSucceeded, loadLocalConfigs, parseRequestedModels, postProcessGeneratedApiTs, renderModuleIndex, selectConfigs } from './codegen.js';

// sale-sale 与 mall-mall 来源相同，前端只保留既有 MallMall namespace。
test('重复的 sale-sale 模块默认跳过生成', () => {
  const { configs } = loadLocalConfigs();
  const saleConfig = configs.find((config) => config.modelName === 'sale-sale');

  assert.ok(saleConfig, '应能扫描到 sale-sale Swagger');
  assert.equal(saleConfig.enabled, false);
});

// 生成文件不得携带行尾空白，保证 git diff --check 可作为交付门禁。
test('API 后处理移除每一行的尾随空白', () => {
  const source = 'export const first = 1;  \nexport const second = 2;\t\n';

  assert.equal(postProcessGeneratedApiTs(source), 'export const first = 1;\nexport const second = 2;\n');
});

// 生成的 GET 方法必须调用 requestClient.get，查询参数只通过 config 传递。
test('API 后处理按 operationId 修正 GET 请求方法', () => {
  const source = `export async function getApiV1ImCallActive (bodyParam: { conversationId: number }, config?: RequestClientConfig) {
    const localVarPath = \`/api/v1/im/call/active\`;
    return requestClient.post<ExtractDataType<GetResp>>(localVarPath, bodyParam, mergeApiConfig(config, query, headers));
}\n`;

  const result = postProcessGeneratedApiTs(source);
  assert.match(result, /return requestClient\.get<ExtractDataType<GetResp>>\(localVarPath, mergeApiConfig\(config, query, headers\)\);/);
  assert.doesNotMatch(result, /requestClient\.post/);
});

// 定向生成新增模块时也必须刷新顶层 namespace 导出，且保持稳定排序。
test('模块索引包含新增 CoreIm namespace 并稳定排序', () => {
  assert.equal(
    renderModuleIndex(['core-im', 'core-api']),
    `// 自动生成，请勿修改
// 导出基础配置
export * from "./base";

// 导出所有模块
export * as CoreApi from "./core-api";
export * as CoreIm from "./core-im";
`,
  );
});

// 定向生成仅选择显式指定的模块，避免重建无关 SDK。
test('支持通过 --model 定向选择 things-card 模块', () => {
  assert.deepEqual(parseRequestedModels(['--model', 'things-card']), new Set(['things-card']));
  assert.deepEqual(parseRequestedModels(['--model=things-card']), new Set(['things-card']));

  const configs = [{ modelName: 'core-api' }, { modelName: 'things-card' }];
  assert.deepEqual(selectConfigs(configs, new Set(['things-card'])), [{ modelName: 'things-card' }]);
});

// 未知模块必须立即失败，防止生成命令静默通过却没有更新契约。
test('定向选择未知模块时返回明确错误', () => {
  assert.throws(() => selectConfigs([{ modelName: 'things-card' }], new Set(['missing'])), /未找到指定模块: missing/);
});

// 生成器失败必须让门禁命令返回失败，不能只打印日志后以 0 退出。
test('存在生成失败时抛出错误', () => {
  assert.throws(() => assertGenerationSucceeded(0, 1), /API 生成失败: 0\/1/);
  assert.doesNotThrow(() => assertGenerationSucceeded(1, 1));
});

// 连通测试必须允许不同协议选择 ICCID 或 MSISDN，生成类型不能强制其中任意一个字段。
test('things-card 连通测试双标识在生成 SDK 中保持可选', () => {
  const source = readFileSync(new URL('./src/things-card/models/card-route-test-connection-req.ts', import.meta.url), 'utf8');

  assert.match(source, /'iccid'\?: string;/);
  assert.match(source, /'msisdn'\?: string;/);
  assert.doesNotMatch(source, /'iccid': string;/);
  assert.doesNotMatch(source, /'msisdn': string;/);
});

// Things Card SDK 必须与后端 Things 服务前缀一致，禁止保留旧物联卡根路径。
// IPC命令传输保留原JSON对象与端点包装，不将SDK受理标记解释为媒体连通。
test('IPC命令SDK包含对象包装、受理与重放而不创造设备方法', () => {
  const api = readFileSync(new URL('./src/core-im/apis/im-interaction-api.ts', import.meta.url), 'utf8');
  const request = readFileSync(new URL('./src/core-im/models/im-interaction-commands-req.ts', import.meta.url), 'utf8');
  const response = readFileSync(new URL('./src/core-im/models/im-interaction-commands-resp.ts', import.meta.url), 'utf8');
  assert.match(api, /postApiV1ImInteractionCommands/);
  assert.match(api, /`\/api\/v1\/im\/interaction\/commands`/);
  assert.match(request, /'command': object;/);
  assert.match(request, /'endpointId': string;/);
  assert.match(response, /'accepted': boolean;/);
  assert.match(response, /'replay': boolean;/);
  assert.doesNotMatch(request, /'version'/);
});

test('things-card 生成 SDK 精确使用 112 条 Things 前缀', () => {
  const apiDirectory = new URL('./src/things-card/apis/', import.meta.url);
  const sources = readdirSync(apiDirectory)
    .filter((fileName) => fileName.endsWith('.ts'))
    .map((fileName) => readFileSync(new URL(fileName, apiDirectory), 'utf8'))
    .join('\n');

  assert.equal(sources.match(/\/api\/v1\/things\/card\//g)?.length ?? 0, 112);
  assert.doesNotMatch(sources, /\/api\/v1\/card\//);
  assert.equal(sources.match(/export async function\s+postApiV1ThingsCard/g)?.length ?? 0, 112);
  assert.doesNotMatch(sources, /postApiV1Card/);
});
