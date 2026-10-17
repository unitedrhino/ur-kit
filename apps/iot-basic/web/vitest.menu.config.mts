/** 本文件独立验证注册清单的多语言菜单，隔离大屏构建配置和无关页面依赖。 */
import { resolve } from 'node:path';

/** root 定位公开套件，测试仅读取仓内模板与实际共享翻译实现。 */
const root = resolve(import.meta.dirname, '../../..');

export default {
  // 独立测试不加载共享包的构建 tsconfig；使用真实 Vue/i18n 运行时。
  esbuild: {
    tsconfigRaw: JSON.stringify({ compilerOptions: { target: 'ESNext', useDefineForClassFields: true } }),
  },
  resolve: {
    alias: {
      '@vben/api': resolve(root, 'web-shared/packages/api/src/index.ts'),
      '@vben/saas/locales': resolve(root, 'web-shared/packages/saas/src/locales/index.ts'),
      '@vben-core/composables': resolve(root, 'web-shared/packages/@core/composables/src/index.ts'),
    },
  },
  test: {
    root,
    environment: 'node',
    include: ['apps/iot-basic/web/src/router/menu-language.test.ts'],
    maxWorkers: 1,
  },
};
