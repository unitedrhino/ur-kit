import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { fetchChartComponent, fetchConfigComponent } from '@/packages';
import { inferSimplifiedData } from '@/packages/custom/inferSimplifiedData';
import { PublicGroupConfigClass } from '@/packages/public/publicConfig';
import { componentInstall, getUUID } from '@/utils';

export type EditorTemplateMeta = {
  id?: number | string;
  source?: 'local' | 'remote';
  thumbnail?: string;
};

export type EditorTemplatePayload = {
  attr?: { h?: number; w?: number };
  component?: CreateComponentType;
  // 与分组组件 option 的容器类型取值保持一致
  containerType?: 'border' | 'none';
  groupList?: CreateComponentType[];
  option?: Record<string, any>;
  styles?: Record<string, any>;
  thumbnail?: string;
  type?: string;
  version?: number;
};

const applyTemplateChartMeta = (chart: CreateComponentGroupType | CreateComponentType, meta: EditorTemplateMeta, thumbnail?: string) => {
  if (meta.source === 'remote' && meta.id !== undefined) {
    chart.chartConfig.sourceType = 'custom';
    chart.chartConfig.templateId = String(meta.id);
  }
  if (thumbnail) {
    chart.chartConfig.image = thumbnail;
  }
};

export const instantiateTemplate = (meta: EditorTemplateMeta, template: EditorTemplatePayload): CreateComponentGroupType | CreateComponentType => {
  const thumbnail = template.thumbnail || meta.thumbnail;

  if (template.type === 'single_template' && template.component) {
    const single = { ...template.component, id: getUUID() } as CreateComponentType;
    applyTemplateChartMeta(single, meta, thumbnail);
    if (!single.option._simplifiedData) {
      single.option._simplifiedData = inferSimplifiedData(single);
    }
    componentInstall(single.chartConfig.chartKey, fetchChartComponent(single.chartConfig));
    componentInstall(single.chartConfig.conKey, fetchConfigComponent(single.chartConfig));
    return single;
  }

  const groupConfig = new PublicGroupConfigClass();
  groupConfig.attr.w = template.attr?.w || 400;
  groupConfig.attr.h = template.attr?.h || 300;
  if (template.styles) groupConfig.styles = template.styles as typeof groupConfig.styles;

  const newChildIds: string[] = [];
  groupConfig.groupList = (template.groupList || []).map((child: CreateComponentType) => {
    const newId = getUUID();
    newChildIds.push(newId);
    return { ...child, id: newId };
  });

  applyTemplateChartMeta(groupConfig, meta, thumbnail);

  if (template.version === 3) {
    groupConfig.chartConfig.conKey = 'VEnhancedGroupConfig';
    groupConfig.option = {
      ...groupConfig.option,
      containerType: template.containerType,
      borderKey: template.option?.borderKey,
      borderOption: template.option?.borderOption,
      padding: template.option?.padding,
      designWidth: template.option?.designWidth,
      designHeight: template.option?.designHeight,
    };
  }

  if (template.option?._simplifiedData) {
    const simplifiedData = structuredClone(template.option._simplifiedData);
    if (simplifiedData.compositeAdapter?.childBindings) {
      simplifiedData.compositeAdapter.childBindings = simplifiedData.compositeAdapter.childBindings.map(
        (binding: { childId: string; childProp: string; sourceField: string }, index: number) => ({
          ...binding,
          childId: newChildIds[index] ?? binding.childId,
        }),
      );
    }
    groupConfig.option._simplifiedData = simplifiedData;
  }

  for (const child of groupConfig.groupList) {
    componentInstall(child.chartConfig.chartKey, fetchChartComponent(child.chartConfig));
    componentInstall(child.chartConfig.conKey, fetchConfigComponent(child.chartConfig));
  }

  return groupConfig;
};
