// 独立生产构建回归入口，复用应用的 Vue 分包边界和文件引擎资产插件。
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileViewerRenderers } from '../../../../apps/platform-manage/node_modules/@file-viewer/vite-plugin';

/** 从声明 VXE 依赖的工作区包解析已锁定版本，不引入额外依赖。 */
const require = createRequire(new URL('../../../effects/plugins/package.json', import.meta.url));
export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue(), fileViewerRenderers({ formats: ['pdf', 'word', 'spreadsheet', 'image', 'text', 'cad'], inject: false, copyAssets: true })],
  resolve: {
    dedupe: ['vue'],
    alias: {
      'vxe-table': dirname(require.resolve('vxe-table/package.json')),
      'vxe-pc-ui': dirname(require.resolve('vxe-pc-ui/package.json')),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, '../../../../.temp/heavy-lazy-dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const packagePath = id.replaceAll('\\', '/').split('/node_modules/').pop() || '';
          if (/^(?:@vue\/|vue\/|vue-router\/|pinia\/|vue-demi\/)/.test(packagePath)) return 'vue-runtime';
        },
      },
    },
  },
});
