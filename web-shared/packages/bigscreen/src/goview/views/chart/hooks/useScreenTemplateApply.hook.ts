/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ChartEditStorage } from '@/store/modules/chartEditStore/chartEditStore.type';

import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getEditorFetchHeaders } from '@/utils';

import { useSync } from './useSync.hook';

export interface ScreenTemplateSummary {
  id: string;
  name?: string;
}

type ApplyTrigger = 'click' | 'drag';

function hasCanvasContent(storage: ChartEditStorage) {
  return Array.isArray(storage.componentList) && storage.componentList.length > 0;
}

async function fetchTemplateStorage(template: ScreenTemplateSummary) {
  const res = await fetch('/api/v1/view/project/detail/get-one', {
    method: 'POST',
    headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: template.id }),
  });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(json.msg || editorT('bigscreenEditor.ui.failedLoadTemplate'));
  }

  const rawContent = json.data?.content;
  if (!rawContent || !String(rawContent).trim()) {
    return null;
  }

  try {
    return JSON.parse(rawContent) as ChartEditStorage;
  } catch {
    throw new Error(editorT('bigscreenEditor.ui.invalidTemplateContentFormat'));
  }
}

function buildAppliedStorage(currentStorage: ChartEditStorage, templateStorage: ChartEditStorage, template: ScreenTemplateSummary): ChartEditStorage {
  const currentProjectName = currentStorage.editCanvasConfig?.projectName;

  return {
    ...templateStorage,
    editCanvasConfig: {
      ...templateStorage.editCanvasConfig,
      projectName: currentProjectName || templateStorage.editCanvasConfig?.projectName,
      templateSource: {
        id: template.id,
        name: template.name || templateStorage.editCanvasConfig?.projectName || editorT('console.appCard.tagTemplate'),
      },
    },
    requestGlobalConfig: templateStorage.requestGlobalConfig || currentStorage.requestGlobalConfig,
    componentList: Array.isArray(templateStorage.componentList) ? templateStorage.componentList : [],
  };
}

async function applyTemplateStorage(template: ScreenTemplateSummary, templateStorage: ChartEditStorage) {
  const chartEditStore = useChartEditStore();
  const { updateComponent } = useSync();

  const currentStorage = chartEditStore.getStorageInfo();
  const nextStorage = buildAppliedStorage(currentStorage, templateStorage, template);
  await updateComponent(nextStorage, true, false);
  chartEditStore.setTargetSelectChart(undefined);
}

function buildResolutionText(storage: ChartEditStorage) {
  const width = Number(storage.editCanvasConfig?.width || 0);
  const height = Number(storage.editCanvasConfig?.height || 0);
  return width > 0 && height > 0 ? `${width} x ${height}` : editorT('iotApp.categoryPage.unset');
}

export async function applyScreenTemplate(template: ScreenTemplateSummary, trigger: ApplyTrigger = 'click') {
  const chartEditStore = useChartEditStore();
  const currentStorage = chartEditStore.getStorageInfo();
  const currentResolutionText = buildResolutionText(currentStorage);

  let templateStorage: ChartEditStorage | null = null;
  try {
    templateStorage = await fetchTemplateStorage(template);
  } catch (error: any) {
    window.$message?.error(error?.message || editorT('bigscreenEditor.ui.failedLoadTemplate'));
    return false;
  }

  if (!templateStorage) {
    window.$message?.warning(editorT('bigscreenEditor.ui.thisTemplateHasNoContentCompleteDesignTemplate'));
    return false;
  }

  const templateResolutionText = buildResolutionText(templateStorage);
  const isResolutionMismatch =
    Number(templateStorage.editCanvasConfig?.width || 0) !== Number(currentStorage.editCanvasConfig?.width || 0) ||
    Number(templateStorage.editCanvasConfig?.height || 0) !== Number(currentStorage.editCanvasConfig?.height || 0);
  const hasExistingContent = hasCanvasContent(currentStorage);
  const templateName = template.name || editorT('console.appCard.tagTemplate');

  const executeApply = async () => {
    try {
      await applyTemplateStorage(template, templateStorage);
      window.$message?.success(editorT('bigscreenEditor.dynamic.message81', { name: String(templateName) }));
      return true;
    } catch (error: any) {
      window.$message?.error(error?.message || editorT('bigscreenEditor.ui.failedApplyTemplate'));
      return false;
    }
  };

  if (isResolutionMismatch) {
    window.$dialog?.warning({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.templateResolutionDoesNotMatch'); },
      content: editorT('bigscreenEditor.dynamic.message82', { template: String(templateResolutionText), canvas: String(currentResolutionText), warning: String(hasExistingContent ? editorT('bigscreenEditor.ui.canvasWillBeOverwritten') : '') }),
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('bigscreenEditor.ui.forceApply'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
      onPositiveClick: async () => await executeApply(),
    });
    return true;
  }

  if (hasExistingContent) {
    window.$dialog?.warning({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.overwriteCurrentCanvas'); },
      content: editorT('bigscreenEditor.dynamic.message83', { action: String(trigger === 'drag' ? editorT('bigscreenEditor.ui.dragTemplate') : editorT('bigscreenEditor.ui.applyTemplate')) }),
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('bigscreenEditor.ui.confirmOverwrite'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
      onPositiveClick: async () => await executeApply(),
    });
    return true;
  }

  await executeApply();
  return true;
}
