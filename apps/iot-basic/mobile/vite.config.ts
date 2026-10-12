/**
 * mobile-uniapp 构建配置，负责 uni-app 编译插件、路径别名和多小程序 manifest 覆盖。
 */
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import {
  createThemeScssAdditionalData,
  createThemeStyleReplacements,
  resolveThemeTokens,
  type ThemeEnv,
} from './src/config/theme';
import { tabIconSvgs } from './src/config/tab-icons';

interface MiniProgramManifestEnv {
  VITE_MP_WEIXIN_APPID?: string;
  VITE_MP_WEIXIN_NAME?: string;
}

/** colorizeSvg 将 SVG mask 中的 currentColor 替换为目标颜色。 */
function colorizeSvg(svg: string, color: string): string {
  return svg.replace(/currentColor/g, color);
}

/** 创建微信小程序 manifest 覆盖插件，用于同一套源码输出给不同小程序主体。 */
function createMpWeixinManifestPlugin(env: MiniProgramManifestEnv): PluginOption {
  const mpWeixinAppId = env.VITE_MP_WEIXIN_APPID?.trim();
  const mpWeixinName = env.VITE_MP_WEIXIN_NAME?.trim();
  const outputDir = path.resolve(__dirname, process.env.UNI_OUTPUT_DIR || 'dist/build/mp-weixin');

  return {
    name: 'mobile-uniapp-mp-weixin-manifest-env',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('/manifest.json')) return null;
      if (!mpWeixinAppId && !mpWeixinName) return null;

      const manifest = JSON.parse(code);
      if (mpWeixinAppId) {
        manifest['mp-weixin'] = manifest['mp-weixin'] || {};
        manifest['mp-weixin'].appid = mpWeixinAppId;
      }
      if (mpWeixinName) {
        manifest.name = mpWeixinName;
        manifest.h5 = manifest.h5 || {};
        manifest.h5.title = mpWeixinName;
      }

      return {
        code: JSON.stringify(manifest, null, 2),
        map: null,
      };
    },
    writeBundle() {
      if (!mpWeixinAppId && !mpWeixinName) return;
      const projectConfigPath = path.join(outputDir, 'project.config.json');
      if (!fs.existsSync(projectConfigPath)) return;

      const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      if (mpWeixinAppId) projectConfig.appid = mpWeixinAppId;
      if (mpWeixinName) projectConfig.projectname = mpWeixinName;
      fs.writeFileSync(projectConfigPath, `${JSON.stringify(projectConfig, null, 2)}\n`);
    },
  };
}

/** 创建 pages 主题覆盖插件，让 tabBar 选中色跟随主题配置。 */
function createPagesThemePlugin(env: ThemeEnv): PluginOption {
  const themeTokens = resolveThemeTokens(env);
  const outputDir = path.resolve(__dirname, process.env.UNI_OUTPUT_DIR || 'dist/build/mp-weixin');
  const tabBarIcons = [
    { name: 'tab-home', svg: tabIconSvgs.home },
    { name: 'tab-device', svg: tabIconSvgs.device },
    { name: 'tab-scene', svg: tabIconSvgs.scene },
    { name: 'tab-mine', svg: tabIconSvgs.mine },
  ];

  return {
    name: 'mobile-uniapp-pages-theme-env',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('/pages.json')) return null;

      const pages = JSON.parse(code);
      pages.globalStyle = pages.globalStyle || {};
      pages.globalStyle.backgroundColor = themeTokens.colorPageBackground;
      pages.tabBar = pages.tabBar || {};
      pages.tabBar.color = themeTokens.colorTextPlaceholder;
      pages.tabBar.selectedColor = themeTokens.colorPrimary;
      pages.tabBar.backgroundColor = themeTokens.colorSurface;

      return {
        code: JSON.stringify(pages, null, 2),
        map: null,
      };
    },
    async writeBundle() {
      const appJsonPath = path.join(outputDir, 'app.json');
      if (!fs.existsSync(appJsonPath)) return;

      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      appJson.tabBar = appJson.tabBar || {};
      appJson.tabBar.color = themeTokens.colorTextPlaceholder;
      appJson.tabBar.selectedColor = themeTokens.colorPrimary;
      appJson.tabBar.backgroundColor = themeTokens.colorSurface;
      if (appJson.window) {
        appJson.window.backgroundColor = themeTokens.colorPageBackground;
      }
      fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

      const outputIconDir = path.join(outputDir, 'static/icons');
      fs.mkdirSync(outputIconDir, { recursive: true });
      await Promise.all(tabBarIcons.flatMap((icon) => [
        sharp(Buffer.from(colorizeSvg(icon.svg, '#999999'))).resize(81, 81).png().toFile(path.join(outputIconDir, `${icon.name}.png`)),
        sharp(Buffer.from(colorizeSvg(icon.svg, themeTokens.colorPrimary))).resize(81, 81).png().toFile(path.join(outputIconDir, `${icon.name}-active.png`)),
      ]));
    },
  };
}

/** 创建全局样式主题插件，将 app.scss / uni.scss 中的 token 占位符替换为构建时主题值。 */
function createThemeStylePlugin(env: ThemeEnv): PluginOption {
  const themeTokens = resolveThemeTokens(env);
  const replacements = createThemeStyleReplacements(themeTokens);

  return {
    name: 'mobile-uniapp-theme-style-env',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('/app.scss') && !cleanId.endsWith('/uni.scss')) return null;

      let nextCode = code;
      for (const [placeholder, value] of Object.entries(replacements)) {
        nextCode = nextCode.split(placeholder).join(value);
      }

      return {
        code: nextCode,
        map: null,
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, __dirname, ''), ...process.env };
  const themeTokens = resolveThemeTokens(env);

  return {
    plugins: [createMpWeixinManifestPlugin(env), createPagesThemePlugin(env), createThemeStylePlugin(env), uni()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: createThemeScssAdditionalData(themeTokens),
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
    },
  };
});
