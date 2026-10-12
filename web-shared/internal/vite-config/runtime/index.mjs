import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, {
  interopDefault: true,
});

const mod = await jiti.import('../src/index.ts');

export const loadAndConvertEnv = mod.loadAndConvertEnv;
export const defineConfig = mod.defineConfig;
export const defineApplicationConfig = mod.defineApplicationConfig;
export const defineLibraryConfig = mod.defineLibraryConfig;
export const defaultImportmapOptions = mod.defaultImportmapOptions;
export const getDefaultPwaOptions = mod.getDefaultPwaOptions;
export const loadApplicationPlugins = mod.loadApplicationPlugins;
export const loadLibraryPlugins = mod.loadLibraryPlugins;
export const viteArchiverPlugin = mod.viteArchiverPlugin;
export const viteCompressPlugin = mod.viteCompressPlugin;
export const viteDtsPlugin = mod.viteDtsPlugin;
export const viteHtmlPlugin = mod.viteHtmlPlugin;
export const viteVisualizerPlugin = mod.viteVisualizerPlugin;
export const viteVxeTableImportsPlugin = mod.viteVxeTableImportsPlugin;

export default mod;
