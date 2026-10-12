/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { ConfigType } from '@/packages/index.type';

import { computed, h, ref } from 'vue';
import { NIcon } from 'naive-ui';

// LayersOutline 未收录在 icon.ionicons5 聚合导出中，改为从图标包直接导入
import { LayersOutline as LayersOutlineIcon } from '@vicons/ionicons5';

import { PackagesCategoryEnum, PrimaryCategoryEnum } from '@/packages/index.type';
import { icon } from '@/plugins';
import { ChartLayoutStoreEnum } from '@/store/modules/chartLayoutStore/chartLayoutStore.type';
import { usePackagesStore } from '@/store/modules/packagesStore/packagesStore';
import { renderIcon, renderLang } from '@/utils';

// 交互分类自定义图片
import interactCategoryImg from '@/assets/images/chart/interact/交互.png';

import { getCharts, setItem, themeColor } from './useLayout.hook';

const { AirPlaneOutlineIcon, ImageIcon, BarChartIcon, AppsOutlineIcon } = icon.ionicons5;
const { TableSplitIcon, RoadmapIcon, SpellCheckIcon, GraphicalDataFlowIcon } = icon.carbon;

export type MenuOptionsType = {
  icon: ReturnType<typeof renderIcon>;
  key: string;
  // 运行时以纯文本字符串为主，同时兼容 renderLang 渲染函数
  label: string | ReturnType<typeof renderLang>;
  list: ConfigType[];
};

const packagesListObj = {
  [PackagesCategoryEnum.CHARTS]: {
    icon: renderIcon(RoadmapIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenManagement.ui.definitionCharts'); },
  },
  [PackagesCategoryEnum.INFORMATIONS]: {
    icon: renderIcon(SpellCheckIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.devicePage.logInfo'); },
  },
  [PackagesCategoryEnum.TABLES]: {
    icon: renderIcon(TableSplitIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('platformManage.devops.structList'); },
  },
  [PackagesCategoryEnum.DECORATES]: {
    icon: renderIcon(GraphicalDataFlowIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.widgets'); },
  },
  [PackagesCategoryEnum.PHOTOS]: {
    icon: renderIcon(ImageIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.im.image'); },
  },
  [PackagesCategoryEnum.ICONS]: {
    icon: renderIcon(AirPlaneOutlineIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.menu.icon'); },
  },
  [PackagesCategoryEnum.PRESETS]: {
    icon: renderIcon(AppsOutlineIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.presets'); },
  },
  [PackagesCategoryEnum.INTERACT]: {
    icon: () => h(NIcon, {}, { default: () => h('img', { src: interactCategoryImg, style: { width: '18px', height: '18px' } }) }),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.interactions'); },
  },
  [PackagesCategoryEnum.TEMPLATES]: {
    icon: renderIcon(LayersOutlineIcon),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.appCard.tagTemplate'); },
  },
};

export const useAsideHook = (allowedCategories?: string[]) => {
  const packagesStore = usePackagesStore();
  const menuOptions: MenuOptionsType[] = [];

  const handlePackagesList = () => {
    for (const val in packagesStore.getPackagesList) {
      menuOptions.push({
        key: val,
        // @ts-ignore
        icon: packagesListObj[val].icon,
        // @ts-ignore
        get label() { return packagesListObj[val].label; },
        // @ts-ignore
        list: packagesStore.getPackagesList[val],
      });
    }
  };
  handlePackagesList();

  const basicMenuOptions = menuOptions
    .filter((item) => item.key !== PackagesCategoryEnum.TEMPLATES)
    .sort((left, right) => {
      if (left.key === PackagesCategoryEnum.PRESETS) return -1;
      if (right.key === PackagesCategoryEnum.PRESETS) return 1;
      return 0;
    });

  const templateMenuOption: MenuOptionsType = {
    icon: renderIcon(LayersOutlineIcon),
    key: PackagesCategoryEnum.TEMPLATES,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.appCard.tagTemplate'); },
    list: [],
  };

  const activeMenuKey = ref<string>(basicMenuOptions[0]?.key ?? '');

  const selectOptions = computed(() => {
    const menu = basicMenuOptions.find((m) => m.key === activeMenuKey.value);
    if (!menu) return undefined;
    if (menu.key === PackagesCategoryEnum.PHOTOS) {
      const libPhotos = packagesStore.libraryPhotos || [];
      return { ...menu, list: [...menu.list, ...libPhotos] };
    }
    return menu;
  });

  const templateActiveMenu = ref<string>(templateMenuOption.key);
  const templateSelectOptions = ref(templateMenuOption);

  const activePanel = ref<string>(PrimaryCategoryEnum.BASIC);

  const currentSelectOptions = computed(() => {
    if (activePanel.value === PrimaryCategoryEnum.TEMPLATES) return templateSelectOptions.value;
    return selectOptions.value;
  });

  const currentActiveMenu = computed(() => {
    if (activePanel.value === PrimaryCategoryEnum.TEMPLATES) return templateActiveMenu.value;
    return activeMenuKey.value;
  });

  const onPanelChange = (expandedNames: string | string[]) => {
    const panelKey = Array.isArray(expandedNames) ? expandedNames[0] : expandedNames;
    if (!panelKey) return;

    activePanel.value = panelKey;

    switch (panelKey) {
      case PrimaryCategoryEnum.BASIC: {
        const firstMenu = basicMenuOptions[0];
        if (firstMenu) {
          activeMenuKey.value = firstMenu.key;
        }
        break;
      }
      case PrimaryCategoryEnum.TEMPLATES: {
        templateActiveMenu.value = templateMenuOption.key;
        templateSelectOptions.value = templateMenuOption;
        break;
      }
    }

    setItem(ChartLayoutStoreEnum.CHARTS, true, false);
  };

  const clickItemHandle = (key: string, _item: MenuOptionsType) => {
    activeMenuKey.value = key;
    setItem(ChartLayoutStoreEnum.CHARTS, true, false);
  };

  const clickTemplateItemHandle = (key: string, item: MenuOptionsType) => {
    templateActiveMenu.value = key;
    templateSelectOptions.value = item;
    setItem(ChartLayoutStoreEnum.CHARTS, true, false);
  };

  return {
    getCharts,
    BarChartIcon,
    themeColor,
    selectOptions,
    activeMenuKey,
    clickItemHandle,
    templateMenuOption,
    templateActiveMenu,
    clickTemplateItemHandle,
    activePanel,
    onPanelChange,
    menuOptions,
    basicMenuOptions,
    currentSelectOptions,
    currentActiveMenu,
  };
};
