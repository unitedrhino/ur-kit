/** 文件说明：在知识库内稳定图片预览的滚动视口，保留上游缩放、格式解码及灯箱能力。 */
import imageRenderer from '@file-viewer/renderer-image';

/** 只包装图片渲染入口；直接操作渲染目标可覆盖 Shadow DOM，避免全局 CSS 和依赖目录补丁。 */
const stableImageRenderer: typeof imageRenderer = {
  ...imageRenderer,
  handlers: imageRenderer.handlers?.map((registration) => ({
    ...registration,
    /** 图片首次加载后固定两轴滚动条占位，打断滚动条显隐与 ResizeObserver 自动缩放的反馈环。 */
    handler: async (...args) => {
      const result = await registration.handler(...args);
      const viewport = args[1].querySelector<HTMLElement>('.image-viewer');
      if (viewport) {
        // 两轴都保持可滚动：手动放大仍可查看整张图片，不用 overflow:hidden 掩盖溢出。
        viewport.style.overflow = 'scroll';
        viewport.style.scrollbarGutter = 'stable';
        viewport.style.scrollbarWidth = 'thin';
      }
      return result;
    },
  })),
};

export default stableImageRenderer;
