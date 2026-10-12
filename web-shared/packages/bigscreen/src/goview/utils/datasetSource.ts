/** 文件说明：编辑器辅助能力的界面提示随宿主语言更新。 */
import { $t as editorT } from '@vben/saas/locales';
/** 数据集来源展示信息；来源标识与优先级不参与翻译。 */
type DatasetSourceMeta = {
  label: string;
  priority: number;
  value: 'custom' | 'shared' | 'system';
};

/** 根据稳定来源标识返回当前语言标签与排序优先级。 */
export const resolveDatasetSourceMeta = (item: any): DatasetSourceMeta => {
  if (item?.source === 'system' || item?.isSystem === true || item?.tenantCode === 'common') {
    return {
      label: editorT('orgPark.ui.built'),
      priority: 0,
      value: 'system',
    };
  }

  if (item?.source === 'shared' || item?.isShared === true) {
    return {
      label: editorT('bigscreenEditor.ui.projectShared'),
      priority: 1,
      value: 'shared',
    };
  }

  return {
    label: editorT('iotApp.productPage.custom'),
    priority: 2,
    value: 'custom',
  };
};

/** 将业务数据集名称与已翻译来源组合为选项，保留业务名称。 */
export const formatDatasetOptionLabel = (item: any) => {
  const sourceMeta = resolveDatasetSourceMeta(item);
  const typeLabel = item?.type ? `${item.type} · ` : '';
  return `${item?.name ?? editorT('bigscreenEditor.ui.unnamedDataset')}（${typeLabel}${sourceMeta.label}）`;
};

/** 按来源优先级与原始名称排序，语言切换不改变选择顺序。 */
export const sortDatasetsBySource = <T extends Record<string, any>>(list: T[]): T[] => {
  return [...list].sort((a, b) => {
    const sourceDiff = resolveDatasetSourceMeta(a).priority - resolveDatasetSourceMeta(b).priority;
    if (sourceDiff !== 0) return sourceDiff;

    return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'zh-CN');
  });
};
