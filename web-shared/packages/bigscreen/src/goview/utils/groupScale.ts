export interface GroupContentScaleInput {
  containerHeight: number;
  containerWidth: number;
  designHeight: number;
  designWidth: number;
  padding?: number;
  titleHeight?: number;
}

export interface GroupContentScaleResult {
  contentHeight: number;
  contentWidth: number;
  left: number;
  scaleX: number;
  scaleY: number;
  top: number;
}

export function computeGroupContentScale(input: GroupContentScaleInput): GroupContentScaleResult {
  const padding = input.padding ?? 0;
  const titleHeight = input.titleHeight ?? 0;
  const contentWidth = Math.max(input.containerWidth - padding * 2, 0);
  const contentHeight = Math.max(input.containerHeight - padding * 2 - titleHeight, 0);

  return {
    left: padding,
    top: padding + titleHeight,
    contentWidth,
    contentHeight,
    scaleX: input.designWidth > 0 ? Math.max(contentWidth / input.designWidth, 0) : 1,
    scaleY: input.designHeight > 0 ? Math.max(contentHeight / input.designHeight, 0) : 1,
  };
}
