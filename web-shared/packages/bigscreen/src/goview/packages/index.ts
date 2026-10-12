/* eslint-disable new-cap, regexp/no-unused-capturing-group, regexp/optimal-quantifier-concatenation */
import type { ConfigType, PackagesType } from '@/packages/index.type';

import { ChartList } from '@/packages/components/Charts/index';
import DecoratedChartConfig from '@/packages/components/Charts/shared/DecoratedChartConfig.vue';
import DecoratedChartView from '@/packages/components/Charts/shared/DecoratedChartView.vue';
import { DecorateList } from '@/packages/components/Decorates/index';
import { IconList } from '@/packages/components/Icons/index';
import { InformationList } from '@/packages/components/Informations/index';
import { PhotoList } from '@/packages/components/Photos/index';
import { PresetList } from '@/packages/components/Presets/index';
import { TableList } from '@/packages/components/Tables/index';
import { InteractList } from '@/packages/components/Interact/index';
import { FetchComFlagType, PackagesCategoryEnum } from '@/packages/index.type';

const configModules: Record<string, { default: string }> = import.meta.glob('./components/**/config.vue', {
  eager: true,
});
const configTsModules: Record<string, () => Promise<any>> = import.meta.glob('./components/**/config.ts');
const indexModules: Record<string, { default: string }> = import.meta.glob('./components/**/index.vue', {
  eager: true,
});
const imagesModules: Record<string, { default: string }> = import.meta.glob('../assets/images/chart/**', {
  eager: true,
});

// * 所有图表
export const packagesList: PackagesType = {
  [PackagesCategoryEnum.CHARTS]: ChartList,
  [PackagesCategoryEnum.INFORMATIONS]: InformationList,
  [PackagesCategoryEnum.TABLES]: TableList,
  [PackagesCategoryEnum.DECORATES]: DecorateList,
  [PackagesCategoryEnum.PHOTOS]: PhotoList,
  [PackagesCategoryEnum.ICONS]: IconList,
  [PackagesCategoryEnum.PRESETS]: PresetList,
  [PackagesCategoryEnum.INTERACT]: InteractList,
  // Templates 分类由模板库动态加载（左侧栏会过滤此键后单独渲染），此处补空数组满足 PackagesType 契约
  [PackagesCategoryEnum.TEMPLATES]: [],
};

// 组件缓存, 可以大幅度提升组件加载速度
const componentCacheMap = new Map<string, any>();
const loadConfig = (packageName: string, categoryName: string, keyName: string) => {
  const key = packageName + categoryName + keyName;
  if (!componentCacheMap.has(key)) {
    const moduleKey = `./components/${packageName}/${categoryName}/${keyName}/config.ts`;
    const loader = configTsModules[moduleKey];
    if (!loader) {
      throw new Error(`Unknown chart config module: ${moduleKey}`);
    }
    componentCacheMap.set(key, loader());
  }
  return componentCacheMap.get(key);
};

/**
 * 获取目标组件配置信息
 * @param targetData
 */
export const createComponent = async (targetData: ConfigType) => {
  const { redirectComponent, category, key } = targetData;
  // redirectComponent 是给图片组件库和图标组件库使用的
  if (redirectComponent) {
    const [packageName, categoryName, keyName] = redirectComponent.split('/');
    // redirectComponent 格式异常（不足三段）时直接抛错，避免用 undefined 拼出无效模块路径
    if (!packageName || !categoryName || !keyName) {
      throw new Error(`Invalid redirectComponent: ${redirectComponent}`);
    }
    const redirectChart = await loadConfig(packageName, categoryName, keyName);
    return new redirectChart.default();
  }
  const chart = await loadConfig(targetData.package, category, key);
  return new chart.default();
};

/**
 * 获取组件
 * @param {string} chartName 名称
 * @param {FetchComFlagType} flag 标识 0为展示组件, 1为配置组件
 */
const fetchComponent = (chartName: string, flag: FetchComFlagType) => {
  const module = flag === FetchComFlagType.VIEW ? indexModules : configModules;
  for (const key in module) {
    const urlSplit = key.split('/');
    if (urlSplit[urlSplit.length - 2] === chartName) {
      return module[key];
    }
  }
};

/**
 * 获取展示组件
 * @param {ConfigType} dropData 配置项
 */
export const fetchChartComponent = (dropData: ConfigType): any => {
  if (dropData.package === PackagesCategoryEnum.CHARTS) {
    return DecoratedChartView;
  }
  const { key } = dropData;
  return fetchComponent(key, FetchComFlagType.VIEW)?.default as any;
};

/**
 * 获取配置组件
 * @param {ConfigType} dropData 配置项
 */
export const fetchConfigComponent = (dropData: ConfigType): any => {
  if (dropData.package === PackagesCategoryEnum.CHARTS) {
    return DecoratedChartConfig;
  }
  const { key } = dropData;
  return fetchComponent(key, FetchComFlagType.CONFIG)?.default as any;
};

/**
 * 获取图片内容
 * @param {ConfigType} targetData 配置项
 */
export const fetchImages = async (targetData?: ConfigType) => {
  if (!targetData || !targetData.image) return '';
  // 正则判断图片是否为 url，是则直接返回该 url
  if (/^(http|https):\/\/([\w.]+\/?)\S*/.test(targetData.image)) return targetData.image;
  // 绝对路径直接返回
  if (targetData.image.startsWith('/')) return targetData.image;
  // 新数据动态处理
  const { image } = targetData;
  // 兼容旧数据
  if (image.includes('@') || image.includes('base64')) return image;

  const imageName = image.slice(Math.max(0, image.lastIndexOf('/') + 1));
  for (const key in imagesModules) {
    const urlSplit = key.split('/');
    if (urlSplit[urlSplit.length - 1] === imageName) {
      return imagesModules[key]?.default;
    }
  }
  return '';
};
