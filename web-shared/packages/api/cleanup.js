// 清理脚本：删除之前生成的不完整文件

import { execSync } from 'child_process';
import { readdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// 清理CodeGenerator目录
function cleanupCodeGenerator() {
  console.log('🧹 清理CodeGenerator目录...');

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

    console.log(`✅ 清理完成，删除了 ${dirs.length} 个目录`);
  } else {
    console.log('📁 CodeGenerator目录不存在，无需清理');
  }
}

// 清理src目录
function cleanupSrc() {
  console.log('🧹 清理src目录...');

  const srcDir = './src';

  if (existsSync(srcDir)) {
    console.log('   删除src目录');
    rmSync(srcDir, { recursive: true, force: true });
    console.log('✅ src目录清理完成');
  } else {
    console.log('📁 src目录不存在，无需清理');
  }
}

// 主清理函数
function main() {
  console.log('🚀 开始清理生成的文件...\n');

  try {
    cleanupCodeGenerator();
    console.log('');
    cleanupSrc();

    console.log('\n🎉 清理完成！现在可以重新运行代码生成脚本了');
    console.log('   运行命令: npm run codegen');
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupCodeGenerator, cleanupSrc };
