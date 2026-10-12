/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
/* eslint-disable jsdoc/check-param-names, jsdoc/require-returns-description, unicorn/prefer-ternary, @typescript-eslint/no-unsafe-function-type */
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import type { MenuOptionsItemType } from './useContextMenu.hook.type';

import { h, nextTick, ref, toRaw } from 'vue';

import { MenuEnum } from '@/enums/editPageEnum';
import { captureComponentSnapshot } from '@/packages/custom/captureSnapshot';
import {
  desensitizeComponent,
  desensitizeGroupComponent,
  generateCustomComponentTemplate,
  generateGroupComponentTemplate,
  injectCustomMeta,
  injectGroupCustomMeta,
} from '@/packages/custom/encapsulate';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getEditorFetchHeaders, loadingError, renderIcon } from '@/utils';
import { useProjectStore } from '@vben/stores';
import cloneDeep from 'lodash/cloneDeep';

import EncapsulationModal from './EncapsulationModal.vue';

const {
  CopyIcon,
  CutIcon,
  ClipboardOutlineIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockOpenOutlineIcon,
  LockClosedOutlineIcon,
  EyeOutlineIcon,
  EyeOffOutlineIcon,
  SaveOutlineIcon,
} = icon.ionicons5;
const { UpToTopIcon, DownToBottomIcon, PaintBrushIcon, Carbon3DSoftwareIcon, Carbon3DCursorIcon } = icon.carbon;
const getProjectStore = () => useProjectStore();

const getActiveIsolationGroup = () => {
  const chartEditStore = useChartEditStore();
  const { isGroupIsolation, activeGroupId } = chartEditStore.getEditCanvas;
  if (!isGroupIsolation || !activeGroupId) return undefined;

  return chartEditStore.getComponentList.find((item): item is CreateComponentGroupType => {
    return item.isGroup && item.id === activeGroupId;
  });
};

const isClearCanvasDisabled = () => {
  const chartEditStore = useChartEditStore();
  const activeGroup = getActiveIsolationGroup();

  if (chartEditStore.getEditCanvas.isGroupIsolation) {
    return !activeGroup || activeGroup.groupList.length === 0;
  }

  return chartEditStore.getComponentList.length === 0;
};

const applyDynamicMenuState = (options: MenuOptionsItemType[]) => {
  const clearDisabled = isClearCanvasDisabled();
  return options.map((option) => {
    if (option.key !== MenuEnum.CLEAR) return option;
    return {
      ...option,
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.clearCanvas'); },
      disabled: clearDisabled,
    };
  });
};

const showClearCanvasConfirm = () => {
  const chartEditStore = useChartEditStore();
  const activeGroup = getActiveIsolationGroup();

  if (chartEditStore.getEditCanvas.isGroupIsolation) {
    if (!activeGroup?.groupList.length) return;

    (window as any).$dialog?.warning({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.clearCanvas'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return editorT('bigscreenEditor.ui.deleteAllComponentsThisContainerWhileKeepingContainer'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('orgManage.common.clearAll'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
      onPositiveClick: () => {
        chartEditStore.clearGroupComponents(activeGroup.id);
      },
    });
    return;
  }

  if (chartEditStore.getComponentList.length === 0) return;

  (window as any).$dialog?.warning({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.clearCanvas'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return editorT('bigscreenEditor.ui.deleteAllCanvasComponentsWhileKeepingCanvasSize'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('orgManage.common.clearAll'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
    onPositiveClick: () => {
      chartEditStore.clearCanvasComponents();
    },
  });
};

// ---------- 封装 / 更新自定义组件 ----------

/** 获取当前选中的画布组件（含前置校验） */
const getTargetChartForSave = () => {
  const chartEditStore = useChartEditStore();
  const targetIndex = chartEditStore.getTargetChart.selectId[0];
  const targetChart = chartEditStore.getComponentList[
    chartEditStore.getComponentList.findIndex((e: CreateComponentGroupType | CreateComponentType) => e.id === targetIndex)
  ] as (CreateComponentGroupType | CreateComponentType) | undefined;

  if (!targetChart) {
    window.$message?.warning(editorT('bigscreenEditor.ui.selectComponentFirst'));
    return undefined;
  }
  return targetChart;
};

/** 构建模板 JSON：根据组件类型分发到单组件或分组组件流程 */
const buildTemplate = (
  targetChart: CreateComponentGroupType | CreateComponentType,
  formData: { adapterType?: string; category: string; exposedProps: string[]; name: string; thumbnail?: string },
) => {
  const isGroup = (targetChart as CreateComponentGroupType).isGroup;
  const meta = { name: formData.name, category: formData.category, thumbnail: formData.thumbnail };

  if (isGroup) {
    const raw = toRaw(targetChart) as CreateComponentGroupType;
    // 必须在 desensitizeGroupComponent 之前记录原始 child ID，脱敏会将 id 清空
    const originalChildIds = (raw.groupList || []).map((c) => c.id);
    const desensitized = desensitizeGroupComponent(raw);
    const injected = injectGroupCustomMeta(desensitized, formData.exposedProps, originalChildIds);
    return generateGroupComponentTemplate(injected, meta);
  }

  const raw = toRaw(targetChart) as CreateComponentType;
  const desensitized = desensitizeComponent(raw);
  const injected = injectCustomMeta(desensitized, formData.exposedProps, formData.adapterType);
  return generateCustomComponentTemplate(injected, meta);
};

/** 打开封装模态框并提交（create / update 共用） */
const openEncapsulationDialog = async (targetChart: CreateComponentGroupType | CreateComponentType, mode: 'create' | 'update') => {
  const projectStore = useProjectStore();
  // 弹窗前静默截图（失败不阻塞流程）
  const coverImage = await captureComponentSnapshot(targetChart.id);

  // 用普通对象持有最新表单值（避免 h() 中 ref 无法回写的问题）
  let latestFormData: null | ReturnType<InstanceType<typeof EncapsulationModal>['getFormData']> = null;
  const chartTitle = targetChart.chartConfig.title || '';
  const templateId = targetChart.chartConfig.templateId;
  const isGroup = (targetChart as CreateComponentGroupType).isGroup;

  // 编辑态预填数据：从组件的 _simplifiedData.exposedProps 读取
  const initialData =
    mode === 'update'
      ? {
          name: chartTitle,
          exposedProps: targetChart.option?._simplifiedData?.exposedProps as string[] | undefined,
          adapterType: targetChart.option?._simplifiedData?.adapterType as string | undefined,
        }
      : undefined;

  window.$dialog?.create({
    title: mode === 'update' ? editorT('bigscreenEditor.ui.overwriteAndUpdateCustomComponent') : editorT('bigscreenEditor.ui.createCustomComponent'),
    style: { width: '420px' },
    content: () =>
      h(EncapsulationModal, {
        componentName: chartTitle,
        mode,
        initialData,
        isGroup,
        coverImage,
        onUpdate: (data: ReturnType<InstanceType<typeof EncapsulationModal>['getFormData']>) => {
          latestFormData = data;
        },
      }),
    positiveText: mode === 'update' ? editorT('bigscreenEditor.ui.overwriteAndUpdate') : editorT('orgManage.dept.confirm'),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      const formData = latestFormData;
      if (!formData || !formData.name) {
        window.$message?.warning(editorT('bigscreenEditor.ui.enterComponentName'));
        return false;
      }

      const template = buildTemplate(targetChart, formData);

      try {
        let coverPath = '';
        const snapshot = formData.thumbnail || coverImage;
        if (snapshot) {
          try {
            const blob = await fetch(snapshot).then((response) => response.blob());
            const form = new FormData();
            form.append('file', blob, `comp_${targetChart.id}_${Date.now()}.jpg`);

            const uploadRes = await fetch('/api/v1/system/common/upload-file', {
              method: 'POST',
              headers: getEditorFetchHeaders(),
              body: form,
            });
            const uploadData = await uploadRes.json();
            coverPath = (uploadData?.data?.fileUri || uploadData?.fileUri || uploadData?.data?.filePath || uploadData?.filePath || '').trim();
          } catch (error) {
            console.warn('[openEncapsulationDialog] 组件封面上传失败', error);
          }
        }
        const isUpdate = mode === 'update' && templateId;
        const url = isUpdate ? '/api/v1/view/component/update' : '/api/v1/view/component/create';
        const body = isUpdate
          ? {
              id: String(templateId),
              name: formData.name,
              content: JSON.stringify(template),
              ...(coverPath ? { cover: coverPath } : {}),
              projectID: getProjectStore().currentProjectID || undefined,
              ...(coverPath ? { cover: coverPath } : {}),
            }
          : {
              name: formData.name,
              content: JSON.stringify(template),
              ...(coverPath ? { cover: coverPath } : {}),
              projectID: getProjectStore().currentProjectID || undefined,
              ...(coverPath ? { cover: coverPath } : {}),
            };

        const res = await fetch(url, {
          method: 'POST',
          headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.code === 200) {
          window.$message?.success(isUpdate ? editorT('bigscreenEditor.ui.customComponentOverwrittenAndUpdated') : editorT('bigscreenEditor.ui.createdAsCustomComponent'));
          // 通知左侧「自定义」面板刷新组件列表
          window.dispatchEvent(new CustomEvent('custom-component-changed'));
        } else {
          window.$message?.error(json.msg || editorT('orgManage.common.opFailed'));
        }
      } catch {
        window.$message?.error(editorT('orgManage.common.opFailed'));
      }
    },
  });
};

// * 保存为我的组件（零代码封装）
const saveAsTemplate = () => {
  const targetChart = getTargetChartForSave();
  if (!targetChart) return;

  const templateId = targetChart.chartConfig.templateId;

  if (templateId) {
    // 已有溯源 ID → 让用户选择覆盖更新 or 另存为
    window.$dialog?.create({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.saveCustomComponent'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return editorT('bigscreenEditor.ui.thisComponentComesFromExistingCustomTemplateChoose'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('bigscreenEditor.ui.overwriteAndUpdate'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('bigscreenEditor.ui.saveAsNewComponent'); },
      onPositiveClick: () => {
        openEncapsulationDialog(targetChart, 'update');
      },
      onNegativeClick: () => {
        openEncapsulationDialog(targetChart, 'create');
      },
    });
  } else {
    // 无溯源 ID → 直接新建
    openEncapsulationDialog(targetChart, 'create');
  }
};

/**
 * 分割线
 * @param {number} n > 2
 * @returns
 */
export const divider = (n: number = 3) => {
  return {
    type: 'divider',
    key: `d${n}`,
  };
};

// * 默认单组件选项
export const defaultOptions: MenuOptionsItemType[] = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgPark.ui.locked'); },
    key: MenuEnum.LOCK,
    icon: renderIcon(LockClosedOutlineIcon),
    fnHandle: () => useChartEditStore().setLock(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgPark.ui.unlock'); },
    key: MenuEnum.UNLOCK,
    icon: renderIcon(LockOpenOutlineIcon),
    fnHandle: () => useChartEditStore().setUnLock(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.permHidden'); },
    key: MenuEnum.HIDE,
    icon: renderIcon(EyeOffOutlineIcon),
    fnHandle: () => useChartEditStore().setHide(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); },
    key: MenuEnum.SHOW,
    icon: renderIcon(EyeOutlineIcon),
    fnHandle: () => useChartEditStore().setShow(),
  },
  {
    type: 'divider',
    key: 'd0',
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.copy'); },
    key: MenuEnum.COPY,
    icon: renderIcon(CopyIcon),
    fnHandle: () => useChartEditStore().setCopy(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.cut'); },
    key: MenuEnum.CUT,
    icon: renderIcon(CutIcon),
    fnHandle: () => useChartEditStore().setCut(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.paste'); },
    key: MenuEnum.PARSE,
    icon: renderIcon(ClipboardOutlineIcon),
    fnHandle: () => useChartEditStore().setParse(),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.im.pin'); },
    key: MenuEnum.TOP,
    icon: renderIcon(UpToTopIcon),
    fnHandle: () => useChartEditStore().setTop(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sendBack'); },
    key: MenuEnum.BOTTOM,
    icon: renderIcon(DownToBottomIcon),
    fnHandle: () => useChartEditStore().setBottom(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.moveUp'); },
    key: MenuEnum.UP,
    icon: renderIcon(ChevronUpIcon),
    fnHandle: () => useChartEditStore().setUp(),
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.moveDown'); },
    key: MenuEnum.DOWN,
    icon: renderIcon(ChevronDownIcon),
    fnHandle: () => useChartEditStore().setDown(),
  },
  {
    type: 'divider',
    key: 'd2',
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.clearClipboard'); },
    key: MenuEnum.CLEAR,
    icon: renderIcon(PaintBrushIcon),
    fnHandle: showClearCanvasConfirm,
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.common.delete'); },
    key: MenuEnum.DELETE,
    icon: renderIcon(TrashIcon),
    fnHandle: () => useChartEditStore().removeComponentList(),
  },
  {
    type: 'divider',
    key: 'd3',
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.saveMyComponents'); },
    key: MenuEnum.SAVE_AS_TEMPLATE,
    icon: renderIcon(SaveOutlineIcon),
    fnHandle: saveAsTemplate,
  },
];

// * 默认多选组件选项
export const defaultMultiSelectOptions: MenuOptionsItemType[] = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iot.group.create'); },
    key: MenuEnum.GROUP,
    icon: renderIcon(Carbon3DSoftwareIcon),
    fnHandle: () => useChartEditStore().setGroup(),
  },
  {
    type: 'divider',
    key: 'd_multi_0',
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.ungroup2'); },
    key: MenuEnum.UN_GROUP,
    icon: renderIcon(Carbon3DCursorIcon),
    fnHandle: () => {
      useChartEditStore().setUnGroup();
    },
  },
];

// * 无数据传递拥有的选项
const defaultNoItemKeys = [MenuEnum.PARSE, MenuEnum.CLEAR];

/**
 * 挑选选项
 * @param options
 * @param pickList
 * @returns
 */
const pickOption = (options: MenuOptionsItemType[], pickList?: MenuEnum[]) => {
  if (!pickList) return options;
  const list: MenuOptionsItemType[] = [];
  pickList.forEach((e) => {
    list.push(...options.filter((op) => op.key === e));
  });
  return list;
};

/**
 * 去除选项
 * @param options
 * @param hideList
 * @returns
 */
const hideOption = (options: MenuOptionsItemType[], hideList?: MenuEnum[]) => {
  if (!hideList) return options;
  return options.filter((op: MenuOptionsItemType) => {
    return hideList.some((e: MenuEnum) => e !== op.key);
  });
};

// * 右键内容
const menuOptions = ref<MenuOptionsItemType[]>([]);

// * 右键处理
const handleContextMenu = (
  e: MouseEvent,
  // 右键对象
  targetInstance?: CreateComponentGroupType | CreateComponentType,
  // 判断函数
  optionsHandle?: Function,
  // 隐藏选项列表
  hideOptionsList?: MenuEnum[],
  // 挑选选项列表
  pickOptionsList?: MenuEnum[],
) => {
  e.stopPropagation();
  e.preventDefault();

  let target = e.target;
  while (target instanceof SVGElement) {
    target = target.parentNode;
  }

  const chartEditStore = useChartEditStore();
  chartEditStore.setTargetSelectChart(targetInstance && targetInstance.id);

  // 隐藏旧列表
  chartEditStore.setRightMenuShow(false);

  // * 多选默认选项
  if (chartEditStore.getTargetChart.selectId.length > 1) {
    menuOptions.value = defaultMultiSelectOptions;
  } else {
    // * 单选默认选项
    menuOptions.value = defaultOptions;
  }

  if (!targetInstance) {
    menuOptions.value = pickOption(toRaw(menuOptions.value), defaultNoItemKeys);
  }
  if (hideOptionsList) {
    menuOptions.value = hideOption([...defaultMultiSelectOptions, divider(), ...defaultOptions], hideOptionsList);
  }
  if (pickOptionsList) {
    menuOptions.value = pickOption([...defaultMultiSelectOptions, divider(), ...defaultOptions], pickOptionsList);
  }
  if (optionsHandle) {
    // 自定义函数能够拿到当前选项和所有选项
    menuOptions.value = optionsHandle(cloneDeep(toRaw(menuOptions.value)), [...defaultMultiSelectOptions, ...defaultOptions], targetInstance);
  }
  menuOptions.value = applyDynamicMenuState(menuOptions.value);
  nextTick().then(() => {
    chartEditStore.setMousePosition(e.clientX, e.clientY);
    chartEditStore.setRightMenuShow(true);
  });
};

/**
 * 右键hook
 * @param menuConfig
 * @returns
 */
export const useContextMenu = () => {
  const chartEditStore = useChartEditStore();
  // 设置默认项
  menuOptions.value = applyDynamicMenuState(defaultOptions);

  // * 失焦
  const onClickOutSide = () => {
    chartEditStore.setRightMenuShow(false);
  };

  // * 事件处理
  const handleMenuSelect = (key: string) => {
    chartEditStore.setRightMenuShow(false);
    const targetItem: MenuOptionsItemType[] = menuOptions.value.filter((e: MenuOptionsItemType) => e.key === key);

    menuOptions.value.forEach((e: MenuOptionsItemType) => {
      if (e.key === key) {
        if (e.fnHandle) {
          e.fnHandle();
          return;
        }
        if (!targetItem) loadingError();
      }
    });
  };

  return {
    menuOptions,
    defaultOptions,
    defaultMultiSelectOptions,
    handleContextMenu,
    onClickOutSide,
    handleMenuSelect,
    mousePosition: chartEditStore.getMousePosition,
  };
};
