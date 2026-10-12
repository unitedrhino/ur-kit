/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
export const formatOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.all'); }, value: '' },
  { label: 'jpg', value: 'jpg' },
  { label: 'jpeg', value: 'jpeg' },
  { label: 'png', value: 'png' },
  { label: 'gif', value: 'gif' },
  { label: 'bmp', value: 'bmp' },
  { label: 'svg', value: 'svg' },
  { label: 'webp', value: 'webp' },
  { label: 'ico', value: 'ico' },
  { label: 'xls', value: 'xls' },
  { label: 'xlsx', value: 'xlsx' },
  { label: 'csv', value: 'csv' },
  // CAD 图纸（作为图片类资源展示，由图片组件 CAD 分支渲染）
  { label: 'dwg', value: 'dwg' },
  { label: 'dxf', value: 'dxf' },
];

const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'svg',
  'webp',
  'ico',
]);

export function isImageFile(name?: string): boolean {
  if (!name) return false;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return imageExtensions.has(ext);
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
