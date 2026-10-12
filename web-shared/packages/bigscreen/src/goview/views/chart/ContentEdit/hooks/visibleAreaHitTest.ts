import type { CreateComponentType } from '@/packages/index.type';

type Rect = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

function getImageContentRect(
  containerRect: DOMRect,
  naturalWidth: number,
  naturalHeight: number,
) {
  if (naturalWidth <= 0 || naturalHeight <= 0 || containerRect.width <= 0 || containerRect.height <= 0) {
    return null;
  }

  const imageRatio = naturalWidth / naturalHeight;
  const containerRatio = containerRect.width / containerRect.height;

  let renderWidth = containerRect.width;
  let renderHeight = containerRect.height;

  if (imageRatio > containerRatio) {
    renderHeight = containerRect.width / imageRatio;
  } else {
    renderWidth = containerRect.height * imageRatio;
  }

  const offsetX = (containerRect.width - renderWidth) / 2;
  const offsetY = (containerRect.height - renderHeight) / 2;

  return {
    bottom: containerRect.top + offsetY + renderHeight,
    left: containerRect.left + offsetX,
    right: containerRect.left + offsetX + renderWidth,
    top: containerRect.top + offsetY,
  } satisfies Rect;
}

function isPointInsideRect(clientX: number, clientY: number, rect: Rect) {
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function getMediaNaturalSize(mediaElement: Element) {
  if (mediaElement instanceof HTMLImageElement) {
    return {
      height: mediaElement.naturalHeight,
      width: mediaElement.naturalWidth,
    };
  }

  if (mediaElement instanceof HTMLVideoElement) {
    return {
      height: mediaElement.videoHeight,
      width: mediaElement.videoWidth,
    };
  }

  return null;
}

function shouldUseVisibleAreaHitTest(item: CreateComponentType) {
  return ['Image', 'ImageCarousel', 'Video'].includes(item.chartConfig?.key) && item.option?.fit === 'contain';
}

/**
 * 编辑器命中规则：图片组件在 contain 模式下，只在真实可见区域内响应选中。
 */
export function shouldSelectByVisibleArea(
  event: MouseEvent,
  item: CreateComponentType,
  currentTarget: EventTarget | null,
) {
  if (!shouldUseVisibleAreaHitTest(item)) return true;
  if (!(currentTarget instanceof HTMLElement)) return true;

  const mediaElement = currentTarget.querySelector('img, video') as Element | null;
  if (!mediaElement) return true;

  const naturalSize = getMediaNaturalSize(mediaElement);
  if (!naturalSize) return true;

  const rect = currentTarget.getBoundingClientRect();
  const visibleRect = getImageContentRect(rect, naturalSize.width, naturalSize.height);
  if (!visibleRect) return true;

  return isPointInsideRect(event.clientX, event.clientY, visibleRect);
}
