/**
 * 导出核心逻辑
 *
 * 将 chartEditStore 的数据构建为 GoviewSchema 并导出为 JSON 或 PNG。
 */

import type { ExportOptions, GoviewSchema } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';
import { downloadByA, downloadTextFile } from '@/utils';
import { compressImage, urlToBase64 } from '../image-utils';

/**
 * 将 ChartEditStorage 包装为 GoviewSchema
 *
 * @param storageInfo 画布存储信息
 * @param options 导出选项，可通过 indexImage 传入封面 base64
 */
export function buildExportSchema(
  storageInfo: {
    editCanvasConfig: Record<string, any>;
    requestGlobalConfig: Record<string, any>;
    componentList: any[];
  },
  options?: ExportOptions & { indexImage?: string },
): GoviewSchema {
  const config = storageInfo.editCanvasConfig || {};
  const componentList = storageInfo.componentList || [];

  return {
    version: CURRENT_SCHEMA_VERSION,
    meta: {
      name: config.projectName || '未命名大屏',
      exportedAt: new Date().toISOString(),
      componentCount: componentList.length,
      indexImage: options?.indexImage,
    },
    editCanvasConfig: { ...config },
    requestGlobalConfig: { ...(storageInfo.requestGlobalConfig || {}) },
    componentList,
  };
}

/**
 * 带超时的 fetch（ms），超时抛出 AbortError。
 */
function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

/**
 * 递归收集组件树中所有匹配 /oss/ 特征的图片 URL（去重）。
 */
/**
 * 判断 URL 是否为外部图片资源（任何绝对 HTTP/HTTPS URL 或根路径）。
 * 不再依赖 /oss/ 特征串，覆盖所有 OSS 地址格式（含 /app/iot/png/ 等）。
 */
function isExternalAsset(url: string): boolean {
  if (typeof url !== 'string' || !url || url.startsWith('data:')) return false;
  if (url.startsWith('/')) return true;
  if (/^https?:\/\//.test(url)) return true;
  return false;
}

/**
 * 收集组件树中所有外部图片 URL（仅 chartConfig.image，跳过 option.dataset）。
 * option.dataset 可能为内联 JSON 数据，强制转换会损坏数据。
 */
function collectOssUrls(components: any[], seen = new Set<string>()): string[] {
  for (const comp of components) {
    const img = comp?.chartConfig?.image;
    if (typeof img === 'string' && isExternalAsset(img) && !seen.has(img)) seen.add(img);

    if (Array.isArray(comp?.groupList)) collectOssUrls(comp.groupList, seen);
  }
  return [...seen];
}

/**
 * 将组件树中的 OSS URL 替换为 base64。
 */
function applyOssBase64(components: any[], urlMap: Map<string, string>): any[] {
  return components.map((comp) => {
    let updated = comp;
    const img = comp?.chartConfig?.image;
    if (img && urlMap.has(img)) {
      updated = { ...updated, chartConfig: { ...updated.chartConfig, image: urlMap.get(img) } };
    }
    // 兜底替换
    for (const key of Object.keys(updated || {})) {
      if (key === 'chartConfig' || key === 'option') continue;
      const val = updated[key];
      if (typeof val === 'string' && urlMap.has(val)) {
        updated = { ...updated, [key]: urlMap.get(val) };
      }
    }
    if (Array.isArray(comp?.groupList)) {
      updated = { ...updated, groupList: applyOssBase64(comp.groupList, urlMap) };
    }
    return updated;
  });
}

/**
 * 处理画布背景图 + 组件图片：base64 模式下将 OSS URL 转为压缩 Base64。
 *
 * - 封面图（indexImage）：300px/0.4 WebP（ExportModal 中处理）
 * - 画布背景图：800px/0.85 WebP
 * - 组件封面（chartConfig.image）：300px/0.4 WebP（极致压缩，仅作缩略图展示）
 *
 * 转换失败降级保留原 URL，不阻塞导出。
 */
export async function processBgImage(
  schema: GoviewSchema,
  mode: 'url' | 'base64',
): Promise<GoviewSchema> {
  if (mode !== 'base64') return schema;

  let result = schema;

  // 1. 画布背景图
  const bgImage = schema.editCanvasConfig?.backgroundImage;
  if (bgImage && typeof bgImage === 'string' && !bgImage.startsWith('data:')) {
    try {
      const base64 = await urlToBase64(bgImage);
      const compressed = await compressImage(base64, 800, 0.85);
      result = { ...result, editCanvasConfig: { ...result.editCanvasConfig, backgroundImage: compressed } };
    } catch {
      console.warn('[exportCore] 背景图 Base64 转换失败，保留原始 URL');
    }
  }

  // 2. 组件图片
  if (Array.isArray(result.componentList)) {
    const ossUrls = collectOssUrls(result.componentList);
    if (ossUrls.length > 0) {
      const urlMap = new Map<string, string>();
      const results = await Promise.allSettled(
        ossUrls.map(async (url) => {
          const fetchUrl = normalizeAssetUrl(url); // 绝对URL→相对路径，避免跨域
          const resp = await fetchWithTimeout(fetchUrl, 3000);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const compressed = await compressImage(dataUrl, 300, 0.4);
          urlMap.set(url, compressed);
        }),
      );
      for (const r of results) {
        if (r.status === 'rejected') console.warn('[exportCore] 组件图片转换失败:', r.reason);
      }
      if (urlMap.size > 0) {
        result = { ...result, componentList: applyOssBase64(result.componentList, urlMap) };
      }
    }
  }

  return result;
}

/**
 * 导出为 JSON 文件
 */
export function exportAsJson(schema: GoviewSchema, filename?: string): void {
  const name = filename || schema.meta?.name || '未命名大屏';
  const json = JSON.stringify(schema, null, 2);
  // downloadTextFile 的 filename 参数默认类型为 number，但实际支持 string
  downloadTextFile(json, name as any, 'goview.json');
}

/**
 * 导出画布为 PNG 截图
 *
 * 复用 headerLeftBtn 的 captureThumb 模式：
 * 1. 添加 is-capturing class 隐藏编辑 UI
 * 2. html2canvas 截图
 * 3. 移除 class 并下载
 */
export async function exportAsPng(
  filename?: string,
): Promise<{ success: boolean; error?: string }> {
  const el = document.querySelector('.go-edit-range') as HTMLElement;
  if (!el) {
    return { success: false, error: '找不到画布元素' };
  }

  // 动态导入 html2canvas（减少首屏体积）
  const html2canvas = (await import('html2canvas')).default;

  try {
    // 隐藏编辑 UI（拖拽点、选中框等）
    el.classList.add('is-capturing');
    await new Promise((r) => requestAnimationFrame(r));

    // 将画布内绝对 OSS URL 的 <img> 转为相对路径，避免跨域
    const imgs = el.querySelectorAll('img');
    const srcRestore = new Map<HTMLImageElement, string>();
    imgs.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && /^https?:\/\//.test(src) && src.includes('/oss/')) {
        const normalized = normalizeAssetUrl(src);
        if (normalized !== src) {
          srcRestore.set(img, src);
          img.setAttribute('src', normalized);
        }
      }
    });

    const canvas = await html2canvas(el, {
      backgroundColor: null,
      allowTaint: false,
      useCORS: true,
      scale: Math.max(window.devicePixelRatio || 1, 2),
      logging: false,
    });

    const name = filename || '大屏截图';
    const dataUrl = canvas.toDataURL('image/png');
    downloadByA(dataUrl, name as any, 'png');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || '截图失败' };
  } finally {
    el.classList.remove('is-capturing');
  }
}

/**
 * 将 OSS 绝对 URL 归一化为相对路径，避免跨域。
 * /oss/ 前缀的 URL 提取路径部分，其他原样返回。
 */
export function normalizeAssetUrl(url: string): string {
  if (typeof url !== 'string') return '';
  if (!url || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);
    if (u.pathname.startsWith('/oss/')) return u.pathname + u.search + u.hash;
  } catch {
    /* 非绝对 URL，原样返回 */
  }
  return url;
}

const MAX_ZIP_ASSETS_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 收集 schema 中所有外部图片 URL → 文件名映射。
 * 覆盖 editCanvasConfig.backgroundImage 和 componentList[*].chartConfig.image / option.dataset。
 */
export function collectAssets(schema: GoviewSchema): Map<string, string> {
  const urlToName = new Map<string, string>();
  const nameCount = new Map<string, number>();

  function register(url: string) {
    if (!isExternalAsset(url)) return;
    const normalized = normalizeAssetUrl(url);
    if (urlToName.has(normalized)) return;

    // 从 URL 提取文件名
    let name = 'image.png';
    try {
      const path = normalized.split('?')[0] || normalized;
      const p = path.split('/').pop() || 'image.png';
      name = decodeURIComponent(p);
    } catch {
      /* 保持默认 */
    }

    // 去重加后缀
    const count = nameCount.get(name) || 0;
    nameCount.set(name, count + 1);
    const finalName = count > 0 ? `${name.replace(/\.([^.]+)$/, '_' + count + '.$1')}` : name;
    urlToName.set(normalized, finalName);
  }

  // 画布背景
  const bg = schema.editCanvasConfig?.backgroundImage;
  if (bg) register(bg);

  // 组件图片
  function walk(list: any[]) {
    for (const comp of list) {
      const img = comp?.chartConfig?.image;
      if (img) register(img);
      if (Array.isArray(comp?.groupList)) walk(comp.groupList);
    }
  }
  if (Array.isArray(schema.componentList)) walk(schema.componentList);

  return urlToName;
}

/**
 * 下载所有资产图片为 Blob。
 */
export async function downloadAssets(
  urlToName: Map<string, string>,
): Promise<Map<string, Blob>> {
  const result = new Map<string, Blob>();
  let totalSize = 0;

  const entries = [...urlToName.entries()];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    // 按下标遍历理论上不会越界，此守卫仅为满足严格索引类型收窄
    if (!entry) continue;
    const [url, name] = entry;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      totalSize += blob.size;
      if (totalSize > MAX_ZIP_ASSETS_SIZE) {
        throw new Error(
          `素材总大小 ${(totalSize / 1024 / 1024).toFixed(1)}MB 超过 ${MAX_ZIP_ASSETS_SIZE / 1024 / 1024}MB 限制`,
        );
      }
      result.set(name, blob);
    } catch (err: any) {
      console.warn(`[exportCore] 下载素材失败: ${url}`, err);
    }
  }
  return result;
}

/**
 * 将 schema 中的图片 URL 替换为 _assets/ 相对路径。
 */
export function replaceAssetUrls(schema: GoviewSchema, urlToName: Map<string, string>): GoviewSchema {
  const urlToPath = new Map<string, string>();
  for (const [url, name] of urlToName) {
    urlToPath.set(url, `_assets/${name}`);
  }

  function replace(url: string) {
    const normalized = normalizeAssetUrl(url);
    return urlToPath.get(normalized) || urlToPath.get(url) || url;
  }

  let result = schema;

  const bg = schema.editCanvasConfig?.backgroundImage;
  if (bg) {
    result = {
      ...result,
      editCanvasConfig: { ...result.editCanvasConfig, backgroundImage: replace(bg) },
    };
  }

  function walk(list: any[]): any[] {
    return list.map((comp) => {
      let updated = comp;
      const img = comp?.chartConfig?.image;
      if (img) {
        updated = { ...updated, chartConfig: { ...updated.chartConfig, image: replace(img) } };
      }
      if (Array.isArray(comp?.groupList)) {
        updated = { ...updated, groupList: walk(comp.groupList) };
      }
      return updated;
    });
  }
  if (Array.isArray(result.componentList)) {
    result = { ...result, componentList: walk(result.componentList) };
  }

  return result;
}

/**
 * 构建 ZIP Blob。
 */
export async function buildZip(
  json: GoviewSchema,
  assets: Map<string, Blob>,
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  zip.file('project.goview.json', JSON.stringify(json, null, 2));
  const assetsFolder = zip.folder('_assets')!;
  for (const [name, blob] of assets) {
    assetsFolder.file(name, blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * 导出为 ZIP 包（JSON + 原始图片素材）。
 *
 * 所有图片资产（封面、背景、组件封面）均以原始二进制存入 _assets/ 目录，
 * JSON 中仅保留 _assets/ 相对路径，零 base64 嵌入，实现最高保真度离线资产包。
 */
export async function exportAsZip(
  schema: GoviewSchema,
  filename?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const urlToName = collectAssets(schema);
    const assets = await downloadAssets(urlToName);
    let replaced = replaceAssetUrls(schema, urlToName);

    // 封面图从 base64 提取为 _assets/ 文件（保持 ZIP 内 JSON 纯净无 base64）
    if (replaced.meta?.indexImage?.startsWith('data:')) {
      const coverBlob = dataUrlToBlob(replaced.meta.indexImage);
      if (coverBlob) {
        const ext = (replaced.meta.indexImage.match(/^data:image\/(\w+);/) || [])[1] || 'webp';
        const coverName = `cover.${ext}`;
        assets.set(coverName, coverBlob);
        replaced = { ...replaced, meta: { ...replaced.meta, indexImage: `_assets/${coverName}` } };
      }
    }

    const zipBlob = await buildZip(replaced, assets);

    const name = filename || schema.meta?.name || '未命名大屏';
    const url = URL.createObjectURL(zipBlob);
    downloadByA(url, name as any, 'goview.zip');
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'ZIP 导出失败' };
  }
}

/**
 * 将 base64 data URL 解码为 Blob，失败返回 null。
 */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m || !m[1] || !m[2]) return null;
  try {
    const mime = m[1];
    const base64 = m[2];
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    return new Blob([byteArr], { type: mime });
  } catch {
    return null;
  }
}
