/** 表格拖动排序隔离：列宽达到边界后，手势结束的点击可能落到表头。 */
import { onBeforeUnmount } from 'vue';

/** useResizeClickGuard 接收手柄选择器和手势类型，返回按下监听器，隔离本次拖动生成的点击。 */
export function useResizeClickGuard(selector: string, gesture: 'mouse' | 'pointer' = 'mouse'): (event: MouseEvent) => void {
  /** 释放事件与原生鼠标拖动或 Pointer 拖动保持一致。 */
  const releaseEvent = gesture === 'pointer' ? 'pointerup' : 'mouseup';
  /** 当前手势监听器的清理方法。 */
  let cleanup: (() => void) | undefined;
  onBeforeUnmount(() => cleanup?.());
  return (event) => {
    if (event.button !== 0) return;
    if (!(event.target instanceof Element) || !event.target.closest(selector)) return;
    cleanup?.();
    /** 鼠标松开后延迟到下一任务清理，允许拦截随后的原生 click。 */
    let timer: ReturnType<typeof setTimeout> | undefined;
    const suppressClick = (click: Event) => { click.preventDefault(); click.stopImmediatePropagation(); };
    const release = () => { timer = setTimeout(() => cleanup?.(), 0); };
    cleanup = () => {
      document.removeEventListener('click', suppressClick, true);
      document.removeEventListener(releaseEvent, release, true);
      document.removeEventListener('pointercancel', release, true);
      window.removeEventListener('blur', cleanup!);
      if (timer) clearTimeout(timer);
      cleanup = undefined;
    };
    document.addEventListener('click', suppressClick, true);
    document.addEventListener(releaseEvent, release, true);
    if (gesture === 'pointer') document.addEventListener('pointercancel', release, true);
    window.addEventListener('blur', cleanup);
  };
}
