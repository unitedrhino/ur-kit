import html2canvas from 'html2canvas';

type CaptureComponentSnapshotOptions = {
  componentData?: any;
  preferredScale?: number;
  currentPath?: string;
  maxWidth?: number;
  quality?: number;
  storageInfo?: any;
};

const SNAPSHOT_BACKGROUND = '#0d0d0d';
const SNAPSHOT_MIN_SCALE = 2;
const SNAPSHOT_MAX_SCALE = 3;

function hideEditorArtifacts(root: HTMLElement) {
  root.querySelectorAll('.shape-point, .shape-modal, .shape-modal-select, .shape-modal-change').forEach((node) => {
    (node as HTMLElement).remove();
  });
}

async function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll('img')] as HTMLImageElement[];
  const pending = images.filter((img) => !img.complete);
  if (pending.length === 0) return;

  await Promise.allSettled(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
          window.setTimeout(resolve, 1500);
        }),
    ),
  );
}

/**
 * 对画布中指定组件的 DOM 节点进行截图，返回 base64 JPEG 字符串。
 * 截图失败时返回空字符串（静默降级）。
 *
 * @param componentId 组件 ID（对应 DOM 上的 data-id 属性）
 * @param options 可选配置
 */
export const captureComponentSnapshot = async (componentId: string, options?: CaptureComponentSnapshotOptions): Promise<string> => {
  const { maxWidth = 360, preferredScale, quality = 0.82 } = options ?? {};

  try {
    const wrapper = document.querySelector(`[data-id="${componentId}"]`) as HTMLElement | null;
    if (!wrapper) return '';

    await waitForImages(wrapper);

    const rect = wrapper.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return '';

    const previewScale = Math.max(maxWidth / rect.width, 1);
    const captureScale =
      preferredScale && preferredScale > 0
        ? preferredScale
        : Math.min(SNAPSHOT_MAX_SCALE, Math.max(SNAPSHOT_MIN_SCALE, previewScale * (window.devicePixelRatio || 1)));

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-99999px';
    host.style.top = '0';
    host.style.width = `${Math.ceil(rect.width)}px`;
    host.style.height = `${Math.ceil(rect.height)}px`;
    host.style.pointerEvents = 'none';
    host.style.opacity = '0';
    host.style.overflow = 'hidden';
    host.style.zIndex = '-1';

    const clone = wrapper.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.width = `${Math.ceil(rect.width)}px`;
    clone.style.height = `${Math.ceil(rect.height)}px`;
    clone.style.overflow = 'hidden';
    hideEditorArtifacts(clone);

    host.append(clone);
    document.body.append(host);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(clone, {
        backgroundColor: SNAPSHOT_BACKGROUND,
        useCORS: true,
        scale: captureScale,
        logging: false,
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      });
    } finally {
      host.remove();
    }

    // 校验 canvas 有效性
    if (canvas.width < 1 || canvas.height < 1) return '';

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    // 校验 data URL 有效性（排除空 canvas 输出的 "data:," 等极短字符串）
    if (!dataUrl || dataUrl.length < 100) return '';

    return dataUrl;
  } catch {
    console.warn('[captureComponentSnapshot] 截图失败，组件ID:', componentId);
    return '';
  }
};
