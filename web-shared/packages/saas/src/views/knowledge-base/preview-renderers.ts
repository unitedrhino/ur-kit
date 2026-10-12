// 原文预览按扩展名选择引擎，各格式独立加载，失败不污染后续重试。
// 各类渲染器独立加载；不使用包含专有 PPT 引擎的 preset-office 或额外媒体引擎的 preset-lite。
/* eslint-disable unicorn/number-literal-case -- 内容魔数十六进制字面量按 prettier 规范保持小写，与该规则要求的大小写冲突 */

import { $t } from '../../locales';
import { createLazyResource } from '../../utils/lazy-resource';

/** 各渲染器按格式缓存；显式 import 使构建工具保留异步边界。 */
const renderers = {
  pdf: createLazyResource(async () => (await import('@file-viewer/renderer-pdf')).default),
  word: createLazyResource(async () => (await import('@file-viewer/renderer-word')).default),
  spreadsheet: createLazyResource(async () => (await import('@file-viewer/renderer-spreadsheet')).default),
  image: createLazyResource(async () => {
    const { default: renderer } = await import('./image-preview-renderer');
    return renderer;
  }),
  text: createLazyResource(async () => (await import('@file-viewer/renderer-text')).default),
  cad: createLazyResource(async () => (await import('@file-viewer/renderer-cad')).default),
  model: createLazyResource(async () => (await import('@file-viewer/renderer-3d')).default),
};

/** 按原始文件名选择渲染器；不支持的类型返回 undefined，不下载无关引擎。 */
export function previewFormat(filename: string): keyof typeof renderers | undefined {
  const extension = filename.split(/[?#]/)[0]?.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'glb') return 'model';
  if (/^(docx|docm|dotx|dotm|doc|dot|rtf|odt|odp)$/.test(extension || '')) return 'word';
  if (/^(xlsx|xltx|xlsm|xlsb|xls|xlt|xltm|csv|tsv|ods|fods|numbers)$/.test(extension || '')) return 'spreadsheet';
  if (/^(png|jpg|jpeg|gif|webp|bmp|svg|tiff|tif|avif|ico|heic|heif|jxl)$/.test(extension || '')) return 'image';
  if (/^(dwg|dxf|dwf|dwfx|xps)$/.test(extension || '')) return 'cad';
  if (
    /^(md|markdown|txt|json|js|mjs|cjs|css|java|py|html|htm|jsx|ts|tsx|xml|log|vue|yaml|yml|ini|sh|bash|sql|go|rs|php|c|cpp|cc|h|hpp|cs|diff|patch|bundle|bdl|jsonc|json5|ipynb|toml|proto|hcl|tex|gv|http|react|rb|swift|kt)$/.test(
      extension || '',
    )
  )
    return 'text';
}

/** 返回当前格式渲染器，不支持的文件以可展示错误结束。 */
export async function loadPreviewRenderer(filename: string) {
  const format = previewFormat(filename);
  if (!format) throw new Error($t('knowledgeBase.text_2dd87b68e0f4'));
  return renderers[format]();
}

/** 按已判定格式加载渲染器；供扩展名未命中后的内容嗅探分发复用。 */
export async function loadRendererByFormat(format: keyof typeof renderers) {
  return renderers[format]();
}

export type SniffedPreviewFormat = 'image' | 'pdf' | 'text';

/** asciiTag 读取指定偏移的 ASCII 标签，越界返回空串。 */
function asciiTag(bytes: Uint8Array, offset: number, length: number): string {
  if (offset + length > bytes.length) return '';
  let out = '';
  for (let i = 0; i < length; i++) {
    const byte = bytes[offset + i];
    if (byte === undefined) break;
    out += String.fromCodePoint(byte);
  }
  return out;
}

/**
 * sniffPreviewFormat 按内容魔数推断可预览格式，用于扩展名缺失或改错的文件。
 * 产品决策 b：无扩展名文件在后端导入环节直接拒绝、不放行，此处嗅探仅作为预览层的防御性兜底，
 * 不代表后端放开无扩展名支持。识别 PDF、常见图片（PNG/JPEG/GIF/WEBP）魔数；可解码为 UTF-8 的内容
 * （HTML、JSON、代码等）一律按文本分发；二进制未知格式返回 undefined，
 * 交由调用方进入不可预览降级。只检查头部样本，截断的多字节序列可容忍。
 */
export function sniffPreviewFormat(bytes: Uint8Array): SniffedPreviewFormat | undefined {
  if (bytes.length >= 4 && asciiTag(bytes, 0, 4) === '%PDF') return 'pdf';
  if (bytes.length >= 8 && bytes[0] === 0x89 && asciiTag(bytes, 1, 3) === 'PNG') return 'image';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image';
  if (bytes.length >= 6 && asciiTag(bytes, 0, 3) === 'GIF') return 'image';
  if (bytes.length >= 12 && asciiTag(bytes, 0, 4) === 'RIFF' && asciiTag(bytes, 8, 4) === 'WEBP') return 'image';
  // EBML 容器（webm/matroska 等）头部可被误判为 UTF-8，显式排除
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return undefined;
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  for (const byte of sample) {
    if (byte === 0) return undefined;
  }
  // 截断的多字节尾部序列不算非法，最多回退 3 字节重试解码
  let end = sample.length;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      new TextDecoder('utf8', { fatal: true }).decode(sample.subarray(0, end));
      return 'text';
    } catch {
      end -= 1;
    }
  }
  return undefined;
}

/** 按预览操作加载组件及样式，失败可通过同一重试入口恢复。 */
export const loadPreviewViewer = createLazyResource(async () => {
  const [module] = await Promise.all([import('@file-viewer/vue3'), import('@file-viewer/vue3/dist/file-viewer3.css')]);
  return module.FileViewer;
});
