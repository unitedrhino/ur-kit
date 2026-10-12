import { defineConfig } from '@vben/vite-config';
import { resolve } from 'node:path';
import { NodePackageImporter } from 'sass';
import { loadEnv } from 'vite';

// ---- Bigscreen 源码根目录 (packages/bigscreen/src) ----
const bigscreenPkgSrc = resolve(process.cwd(), '../../packages/bigscreen/src');
const goviewSrc = resolve(bigscreenPkgSrc, 'goview');
const goviewStylePath = resolve(goviewSrc, 'styles/common/style.scss').replaceAll('\\', '/');
const stylesGlobal = resolve(process.cwd(), '../../packages/styles/src/global/index.scss').replaceAll('\\', '/');

export default defineConfig(async (config) => {
  // 正确获取环境变量
  const { mode = 'development' } = config || {};
  const env = loadEnv(mode, process.cwd(), '');
  const isJitiRequest = (id: string) => {
    const normalized = id.replaceAll('\\', '/');
    return (
      normalized === 'jiti' ||
      normalized.startsWith('jiti/') ||
      normalized.includes('/node_modules/.pnpm/jiti@') ||
      normalized.includes('/node_modules/jiti/') ||
      normalized.endsWith('/jiti/lib/jiti.mjs') ||
      normalized.endsWith('/jiti/lib/jiti.cjs') ||
      normalized.endsWith('/jiti/dist/jiti.cjs') ||
      normalized.endsWith('/jiti/dist/babel.cjs')
    );
  };

  // 支持命令行覆盖后端地址：BACKEND_URL=http://localhost:7851 pnpm vite --mode development
  const backendUrl = process.env.BACKEND_URL || env.VITE_GLOB_API_URL;

  // 打印调试信息，便于 AI 工具（agent-browser 等）识别地址
  console.log(`\n[saas-dev] ============================`);
  console.log(`[saas-dev] App Port  : http://localhost:${env.VITE_PORT}`);
  console.log(`[saas-dev] Backend   : ${backendUrl}`);
  console.log(`[saas-dev] ============================\n`);

  return {
    application: {
      pwa: false,
      license: false,
      archiver: false,
      devtools: false,
    },
    vite: {
      plugins: [
        {
          name: 'stub-node-only-deps',
          enforce: 'pre' as const,
          resolveId(id: string) {
            if (isJitiRequest(id)) {
              return '\0virtual:jiti-stub';
            }
          },
          load(id: string) {
            if (id === '\0virtual:jiti-stub') {
              return `export default function createJiti() { return {}; }\nexport { createJiti };`;
            }
          },
        },
      ],
      resolve: {
        alias: [
          {
            find: /^@vben-core\/shared\/(.+)$/,
            replacement: resolve(process.cwd(), '../../packages/@core/base/shared/src') + '/$1',
          },
          // ---- Bigscreen (goview) 别名：支持在大屏 dashboard 嵌入 GoView 自定义大屏预览 ----
          // @/ → goview 内部别名 (goview 源码内使用 @/xxx 导入)
          {
            find: /^@\//,
            replacement: goviewSrc + '/',
          },
          // /#/ → goview 类型别名
          {
            find: /\/#\//,
            replacement: resolve(goviewSrc, 'types'),
          },
          // @app/ → packages/bigscreen/src/ (goview 跨边界导入)
          {
            find: /^@app\//,
            replacement: bigscreenPkgSrc + '/',
          },
        ],
      },
      optimizeDeps: {
        include: ['@vben/request'],
      },
      build: {
        modulePreload: false,
        rollupOptions: {
          output: {
            hoistTransitiveImports: false,
            // rollup 口径下只把 manualChunks 显式命名的模块归入具名 chunk，
            // 防止传递依赖被拖入具名 chunk；vite8/rolldown 忽略此字段（语义天然满足）。
            onlyExplicitManualChunks: true,
            manualChunks(id) {
              const normalizedId = id.replaceAll('\\', '/');

              // bigscreen 必须保留动态 import 边界，避免 goview/monaco 被合回首屏。
              if (normalizedId.includes('/packages/bigscreen/src/')) {
                return undefined;
              }
              if (normalizedId.includes('commonjsHelpers.js')) return 'commonjs-helpers';
              if (normalizedId.includes('monaco-editor')) {
                return 'monaco';
              }
              // 只固定 Vue 基础运行时，避免 TDZ 循环依赖（Cannot access 'X' before initialization）。
              // 其余依赖保持真实的同步/异步依赖边界：univer/file-viewer/exceljs/three 等重库
              // 随懒加载页面按需加载，禁止再以宽规则统一聚回首屏 vendor（apps/AGENTS.md 首屏红线）。
              const packagePath = normalizedId.split('/node_modules/').pop() || '';
              if (/^(?:@vue\/|vue\/|vue-router\/|pinia\/|vue-demi\/)/.test(packagePath)) {
                return 'vue-runtime';
              }
              if (normalizedId.includes('node_modules')) {
                if (normalizedId.includes('naive-ui')) return 'naive-ui';
                if (
                  normalizedId.includes('vxe-table') ||
                  normalizedId.includes('vxe-pc-ui') ||
                  normalizedId.includes('@vxe-ui') ||
                  normalizedId.includes('xe-utils')
                ) {
                  return 'vxe-table';
                }
                if (normalizedId.includes('lodash')) return 'lodash';
                if (normalizedId.includes('echarts') || normalizedId.includes('zrender') || normalizedId.includes('vue-echarts')) return 'echarts';
                if (normalizedId.includes('ace-builds')) return 'ace';
              }
            },
          },
        },
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // mock代理目标地址
            target: backendUrl,
            // ws: true,
          },
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: (content: string, filepath: string) => {
              const globalScss = `@use "${stylesGlobal}" as *;\n`;
              const goviewStyle = `@import "${goviewStylePath}";\n`;
              const normalizedPath = filepath.replaceAll('\\', '/');
              if (normalizedPath.includes('/packages/bigscreen/src/goview/')) {
                return `${globalScss}${goviewStyle}${content}`;
              }
              return `${globalScss}${content}`;
            },
            api: 'modern',
            importers: [new NodePackageImporter()],
            loadPaths: [resolve(process.cwd(), 'node_modules')],
          },
        },
      },
    },
  };
});
