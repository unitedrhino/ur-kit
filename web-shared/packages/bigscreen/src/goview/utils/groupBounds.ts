import type { CreateComponentGroupType } from '@/packages/index.type';

export interface GroupContentBounds {
  height: number;
  width: number;
}

export interface GroupContentMetrics extends GroupContentBounds {
  contentHeight: number;
  contentWidth: number;
  padding: number;
  scaleX: number;
  scaleY: number;
  shellHeight: number;
  shellWidth: number;
  titleHeight: number;
}

export function getGroupContentBounds(group: CreateComponentGroupType): GroupContentBounds {
  return {
    width: group.option?.designWidth ?? group.attr.w,
    height: group.option?.designHeight ?? group.attr.h,
  };
}

export function getGroupContentMetrics(group: CreateComponentGroupType): GroupContentMetrics {
  const design = getGroupContentBounds(group);
  const padding = group.option?.padding ?? 0;
  const hasBorderContainer = group.option?.containerType === 'border';
  const borderOption = group.option?.borderOption ?? {};
  const titleHeight = !hasBorderContainer
    ? 0
    : group.option?.borderKey === 'Border04'
      ? (borderOption.borderTitleHeight ?? 52)
      : (borderOption.borderTitle?.show && borderOption.borderTitle?.text ? (borderOption.borderTitle.fontSize ?? 18) + 10 : 0);
  const contentWidth = Math.max(group.attr.w - padding * 2, 0);
  const contentHeight = Math.max(group.attr.h - padding * 2 - titleHeight, 0);

  return {
    ...design,
    padding,
    titleHeight,
    contentWidth,
    contentHeight,
    shellWidth: Math.max(group.attr.w - contentWidth, 0),
    shellHeight: Math.max(group.attr.h - contentHeight, 0),
    scaleX: design.width > 0 ? contentWidth / design.width : 1,
    scaleY: design.height > 0 ? contentHeight / design.height : 1,
  };
}
