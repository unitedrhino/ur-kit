// 使用示例脚本
// 展示如何单独调用代码生成器的各个功能

import { generateAPI, integrateFiles, loadConfig } from './codegen.js';

// 示例1: 只生成特定API
async function generateSingleAPI() {
  console.log('=== 示例1: 生成单个API ===');

  const config = loadConfig();
  const apiConfig = config.apiUrls[0]; // 取第一个配置

  if (apiConfig) {
    await generateAPI(apiConfig, config);
  }
}

// 示例2: 只整合文件
async function integrateOnly() {
  console.log('=== 示例2: 只整合文件 ===');

  const config = loadConfig();
  integrateFiles(config);
}

// 示例3: 自定义配置生成
async function generateWithCustomConfig() {
  console.log('=== 示例3: 自定义配置生成 ===');

  const customConfig = {
    url: 'https://custom-api.com/openapi.json',
    title: '自定义API',
    outputDir: './CodeGenerator/自定义API',
    enabled: true,
  };

  const config = loadConfig();
  await generateAPI(customConfig, config);
}

// 运行示例
async function runExamples() {
  try {
    // 取消注释下面的行来运行特定示例

    // await generateSingleAPI();
    // await integrateOnly();
    // await generateWithCustomConfig();

    console.log('请取消注释示例函数来运行');
  } catch (error) {
    console.error('示例运行失败:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export { generateSingleAPI, integrateOnly, generateWithCustomConfig };
