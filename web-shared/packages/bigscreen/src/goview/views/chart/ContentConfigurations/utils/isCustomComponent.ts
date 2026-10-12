import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

export const isCustomComponent = (target: CreateComponentGroupType | CreateComponentType): boolean => {
  return target.chartConfig.sourceType === 'custom';
};
