/**
 * 导入核心逻辑
 *
 * 校验和解析 .goview.json / .goview.zip 文件，提取导入摘要。
 */

import type { GoviewSchema } from './types';
import { migrateSchema } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './types';
import { getEditorFetchHeaders } from '@/utils';

/** 校验结果 */
export interface ValidationResult {
  valid: boolean;
  schema?: GoviewSchema;
  error?: string;
}

/** 导入摘要（用于确认弹窗展示） */
export interface ImportSummary {
  name: string;
  componentCount: number;
  version: string;
  hasCanvasConfig: boolean;
  hasRequestConfig: boolean;
}

/**
 * 校验 JSON 字符串是否为合法的 GoviewSchema
 *
 * 兼容两种格式：
 * 1. 新格式（带 version + meta 信封）
 * 2. 旧格式（直接是 ChartEditStorage，无信封）
 */
export function validateGoviewJson(raw: string): ValidationResult {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, error: '文件内容不是有效的 JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, error: '文件内容不是 JSON 对象' };
  }

  // 新格式：有 version + meta 信封
  if (parsed.version && parsed.meta) {
    if (!parsed.componentList && !parsed.editCanvasConfig) {
      return { valid: false, error: '缺少 componentList 和 editCanvasConfig 字段' };
    }
    return { valid: true, schema: migrateSchema(parsed as GoviewSchema) };
  }

  // 旧格式：直接是 ChartEditStorage
  // ChartEditStorage 至少包含 editCanvasConfig 和 componentList
  if (parsed.editCanvasConfig || parsed.componentList) {
    const schema: GoviewSchema = {
      version: '1.0.0',
      meta: {
        name: parsed.editCanvasConfig?.projectName || '未命名大屏',
        exportedAt: new Date().toISOString(),
        componentCount: Array.isArray(parsed.componentList) ? parsed.componentList.length : 0,
      },
      editCanvasConfig: parsed.editCanvasConfig || {},
      requestGlobalConfig: parsed.requestGlobalConfig || {},
      componentList: parsed.componentList || [],
    };
    return { valid: true, schema: migrateSchema(schema) };
  }

  return { valid: false, error: '文件格式不正确，缺少 editCanvasConfig 和 componentList' };
}

/**
 * 读取文件并校验
 */
export function parseImportFile(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        resolve({ valid: false, error: '文件读取结果为空' });
        return;
      }
      resolve(validateGoviewJson(text));
    };
    reader.onerror = () => {
      resolve({ valid: false, error: '文件读取失败' });
    };
    reader.readAsText(file);
  });
}

/**
 * 提取导入摘要信息（用于确认弹窗）
 */
export function getImportSummary(schema: GoviewSchema): ImportSummary {
  return {
    name: schema.meta?.name || '未命名大屏',
    componentCount: schema.meta?.componentCount ?? (schema.componentList?.length ?? 0),
    version: schema.version || '未知',
    hasCanvasConfig: !!schema.editCanvasConfig && Object.keys(schema.editCanvasConfig).length > 0,
    hasRequestConfig: !!schema.requestGlobalConfig && Object.keys(schema.requestGlobalConfig).length > 0,
  };
}

/**
 * 将 GoviewSchema 还原为 ChartEditStorage 格式（用于写入后端）
 */
export function schemaToStorageContent(schema: GoviewSchema): string {
  return JSON.stringify({
    editCanvasConfig: schema.editCanvasConfig,
    requestGlobalConfig: schema.requestGlobalConfig,
    componentList: schema.componentList,
  });
}

/** ZIP 导入文件大小上限（50MB），防止 ZIP 炸弹导致浏览器内存溢出 */
const MAX_ZIP_FILE_SIZE = 50 * 1024 * 1024;

/**
 * ZIP 导入：解析 .goview.zip，上传素材，替换路径。
 *
 * 返回已替换为 OSS URL 的 GoviewSchema。
 */
export async function parseZipImport(file: File): Promise<{
  schema?: GoviewSchema;
  assetErrors?: string[];
  error?: string;
}> {
  try {
    // 文件大小校验，防止 ZIP 炸弹
    if (file.size > MAX_ZIP_FILE_SIZE) {
      return { error: `导入文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请保持在 50MB 以内` };
    }

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);

    // 读取 JSON
    const jsonFile = zip.file('project.goview.json');
    if (!jsonFile) return { error: 'ZIP 中缺少 project.goview.json' };

    const jsonText = await jsonFile.async('string');
    let schema: GoviewSchema;
    try {
      schema = JSON.parse(jsonText);
    } catch {
      return { error: 'project.goview.json 格式无效' };
    }

    // 验证 schema
    if (!schema.editCanvasConfig || !Array.isArray(schema.componentList)) {
      return { error: 'project.goview.json 缺少必要字段' };
    }

    // 读取素材
    const assets = new Map<string, Blob>();
    const assetsFolder = zip.folder('_assets');
    if (assetsFolder) {
      const files = Object.keys(zip.files).filter((k) => k.startsWith('_assets/') && zip.files[k]?.dir === false);
      for (const path of files) {
        const zipEntry = zip.files[path];
        // path 来自 Object.keys(zip.files)，理论上必存在，此守卫仅为满足严格索引类型收窄
        if (!zipEntry) continue;
        const name = path.replace(/^_assets\//, '');
        const blob = await zipEntry.async('blob');
        assets.set(name, blob);
      }
    }

    // 上传封面图：支持 base64（旧格式兼容）和 _assets/ 路径（新 ZIP 格式）
    if (schema.meta?.indexImage?.startsWith('data:')) {
      // 旧格式：base64 → OSS
      try {
        const coverUrl = await uploadCoverFromBase64(schema.meta.indexImage);
        if (coverUrl) {
          schema = { ...schema, meta: { ...schema.meta, indexImage: coverUrl } };
        }
      } catch (e) {
        console.warn('[importCore] 封面上传失败:', e);
      }
    }

    // 上传素材（并发队列 4，单图失败不影响其他）
    const uploadedUrls = assets.size > 0 ? await uploadAssetsWithLimit(assets) : new Map<string, string>();
    const assetErrors: string[] = [];

    // 替换 JSON 中的 _assets/ 路径为新 OSS URL（含封面图路径）
    function replacePath(url: string): string {
      if (typeof url !== 'string') return url;
      if (url.startsWith('_assets/')) {
        const name = url.slice('_assets/'.length);
        const ossUrl = uploadedUrls.get(name);
        if (ossUrl) return ossUrl;
        assetErrors.push(`素材 ${name} 上传失败，保留原路径`);
      }
      return url;
    }

    // 替换封面图 _assets/ 路径（新 ZIP 格式）
    if (schema.meta?.indexImage?.startsWith('_assets/')) {
      const newCover = replacePath(schema.meta.indexImage);
      if (newCover.startsWith('_assets/')) {
        // 上传失败，清空封面避免渲染时 404
        console.warn('[importCore] 封面图上传 OSS 失败，已降级为默认封面');
        schema = { ...schema, meta: { ...schema.meta, indexImage: '' } };
      } else {
        schema = { ...schema, meta: { ...schema.meta, indexImage: newCover } };
      }
    }

    // 替换画布背景
    if (schema.editCanvasConfig?.backgroundImage) {
      schema = {
        ...schema,
        editCanvasConfig: {
          ...schema.editCanvasConfig,
          backgroundImage: replacePath(schema.editCanvasConfig.backgroundImage),
        },
      };
    }

    // 替换组件图片
    function walk(list: any[]): any[] {
      return list.map((comp) => {
        let updated = comp;
        const img = comp?.chartConfig?.image;
        if (img) {
          updated = { ...updated, chartConfig: { ...updated.chartConfig, image: replacePath(img) } };
        }
        const ds = comp?.option?.dataset;
        if (ds) {
          updated = { ...updated, option: { ...updated.option, dataset: replacePath(ds) } };
        }
        if (Array.isArray(comp?.groupList)) {
          updated = { ...updated, groupList: walk(comp.groupList) };
        }
        return updated;
      });
    }
    if (Array.isArray(schema.componentList)) {
      schema = { ...schema, componentList: walk(schema.componentList) };
    }

    return { schema, assetErrors: assetErrors.length > 0 ? assetErrors : undefined };
  } catch (err: any) {
    return { error: err?.message || 'ZIP 解析失败' };
  }
}

/**
 * 将 base64 封面图上传到 OSS，返回文件路径。
 * 失败时返回空字符串，不阻塞导入流程。
 */
async function uploadCoverFromBase64(base64DataUrl: string): Promise<string> {
  const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  // 正则整体匹配成功时捕获组理论上必存在，此守卫仅为满足严格索引类型收窄
  if (!match || !match[1] || !match[2]) return '';

  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split('/')[1] || 'webp';

  try {
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: mime });

    const form = new FormData();
    form.append('file', blob, `cover.${ext}`);
    form.append('isPublic', 'true');
    form.append('business', 'view');
    form.append('scene', 'goView/projectIndexImage');
    form.append('useBy', 'user');

    const res = await fetch('/api/v1/system/common/upload-file', {
      method: 'POST',
      headers: getEditorFetchHeaders(),
      body: form,
    });
    const data = await res.json();
    return (data?.data?.fileUri || data?.data?.filePath || data?.fileUri || data?.filePath || '').trim();
  } catch {
    return '';
  }
}

/**
 * 并发上传素材（最多 4 个并发），单图失败不阻塞其他。
 */
async function uploadAssetsWithLimit(
  assets: Map<string, Blob>,
  concurrency = 4,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const entries = [...assets.entries()];

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async ([name, blob]) => {
        const form = new FormData();
        form.append('file', blob, name);
        form.append('isPublic', 'true');
        form.append('business', 'view');
        form.append('scene', 'goView/zipImport');
        form.append('useBy', 'user');
        const res = await fetch('/api/v1/system/common/upload-file', {
          method: 'POST',
          headers: getEditorFetchHeaders(),
          body: form,
        });
        const data = await res.json();
        const url = (data?.data?.fileUri || data?.fileUri || data?.data?.filePath || data?.filePath || '').trim();
        if (!url) throw new Error('上传返回空地址');
        result.set(name, url);
      }),
    );
    for (const r of batchResults) {
      if (r.status === 'rejected') console.warn('[importCore] 素材上传失败:', r.reason);
    }
  }

  return result;
}
