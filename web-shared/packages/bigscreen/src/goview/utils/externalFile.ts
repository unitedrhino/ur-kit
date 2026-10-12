/**
 * 大屏外部文件（拖入画布/资源上传）类型白名单与判断工具
 *
 * 覆盖图片（位图/矢量图）、CAD 图纸（.dwg/.dxf/.dwf/.dwfx/.xps）与 3D 模型（.glb/.gltf）。
 * CAD 文件浏览器 MIME 常为空字符串，必须按扩展名兜底判断；
 * 该白名单供 useDrag.hook.ts（拖入画布）与 Image 组件（CAD 渲染分支）共用，避免逻辑分叉。
 */
import { FileTypeEnum } from '@/enums/fileTypeEnum';

/** 按 MIME 识别的图片类型 */
export const SUPPORTED_IMAGE_TYPES = new Set<string>([
  FileTypeEnum.BMP,
  FileTypeEnum.GIF,
  FileTypeEnum.JPEG,
  FileTypeEnum.PNG,
  FileTypeEnum.SVG,
  'image/webp',
  // CAD 图纸常见 MIME（多数环境为空字符串，主要靠扩展名兜底判断）
  'application/acad',
  'application/dxf',
  'application/x-dwg',
  'image/vnd.dwg',
]);

/** 图片扩展名白名单（MIME 为空时的兜底，如部分系统图片） */
export const SUPPORTED_IMAGE_EXTS = new Set<string>([
  '.bmp',
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.webp',
]);

/** CAD 图纸扩展名白名单（.dwg/.dxf/.dwf/.dwfx/.xps） */
export const CAD_EXTS = new Set<string>([
  '.dwg',
  '.dxf',
  '.dwf',
  '.dwfx',
  '.xps',
]);

/** CAD 文件上传大小上限（图纸普遍比图片大，单独放宽） */
export const CAD_MAX_SIZE_MB = 50;

/** 3D 模型扩展名白名单（.glb 为主，.gltf 需自包含资源） */
export const MODEL_EXTS = new Set<string>(['.glb', '.gltf']);

/** 3D 模型上传大小上限（对齐 Tier0 模型库限制） */
export const MODEL_MAX_SIZE_MB = 50;

/** 取文件名小写后缀（含点），无后缀返回空字符串 */
export const getFileExt = (name: string): string => {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
};

/** 判断是否为 CAD 图纸文件（按扩展名） */
export const isCadFile = (file: File): boolean => CAD_EXTS.has(getFileExt(file.name));

/** 判断是否为 3D 模型文件（按扩展名） */
export const isModelFile = (file: File): boolean => MODEL_EXTS.has(getFileExt(file.name));

/** 判断 URL 是否为 CAD 图纸地址（按末段后缀，忽略 query/hash），供图片组件渲染分支使用 */
export const isCadUrl = (url: string): boolean => {
  const raw = url || '';
  // split 结果首元素必然存在，?? 兜底仅为类型收窄
  const clean = (raw.split('?')[0] ?? '').split('#')[0] ?? '';
  return CAD_EXTS.has(getFileExt(clean));
};

/** 判断是否为可拖入画布的外部文件（图片 / CAD 图纸 / 3D 模型）：MIME 或扩展名命中即可 */
export const isSupportedExternalFile = (file: File): boolean => {
  if (SUPPORTED_IMAGE_TYPES.has(file.type)) return true;
  const ext = getFileExt(file.name);
  return SUPPORTED_IMAGE_EXTS.has(ext) || CAD_EXTS.has(ext) || MODEL_EXTS.has(ext);
};
