// 测试脚本：验证自动提取OpenAPI规范中info.description字段的功能

import { extractDescriptionFromOpenAPI, generateAPIConfigs, loadConfig } from './codegen.js';

// 测试单个URL的description提取
async function testSingleExtract() {
  console.log('=== 测试单个URL的description提取 ===');

  const testUrl = 'http://127.0.0.1:4523/export/openapi/90?version=openapi30';

  try {
    const description = await extractDescriptionFromOpenAPI(testUrl);
    if (description) {
      console.log(`✅ 成功提取description: ${description}`);
      console.log(`   输出目录将是: ./CodeGenerator/${description}`);
    } else {
      console.log('❌ 提取description失败');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试配置生成
async function testConfigGeneration() {
  console.log('\n=== 测试配置生成 ===');

  try {
    const config = loadConfig();
    console.log(`📋 原始配置: ${config.apiUrls.length} 个API`);

    const enhancedConfigs = await generateAPIConfigs(config);
    console.log(`✅ 增强配置: ${enhancedConfigs.length} 个API`);

    enhancedConfigs.forEach((apiConfig, index) => {
      console.log(`   ${index + 1}. ${apiConfig.description} -> ${apiConfig.outputDir}`);
    });
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 测试多种配置格式
async function testMultipleFormats() {
  console.log('\n=== 测试多种配置格式 ===');

  const testConfigs = {
    apiUrls: [
      'http://127.0.0.1:4523/export/openapi/90?version=openapi30',
      {
        url: 'https://api.example.com/openapi.json',
        enabled: false,
      },
      {
        url: 'https://another-api.com/openapi.json',
        description: '自定义描述',
        outputDir: './CodeGenerator/自定义目录',
      },
    ],
  };

  try {
    const enhancedConfigs = await generateAPIConfigs(testConfigs);
    console.log(`✅ 生成 ${enhancedConfigs.length} 个配置`);

    enhancedConfigs.forEach((apiConfig, index) => {
      console.log(`   ${index + 1}. ${apiConfig.description} -> ${apiConfig.outputDir} (enabled: ${apiConfig.enabled})`);
    });
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 开始测试自动提取功能...\n');

  try {
    await testSingleExtract();
    await testConfigGeneration();
    await testMultipleFormats();

    console.log('\n🎉 所有测试完成！');
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testSingleExtract, testConfigGeneration, testMultipleFormats };
