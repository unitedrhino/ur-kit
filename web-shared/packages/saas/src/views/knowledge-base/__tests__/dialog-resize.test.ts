/**
 * 文件说明：验证弹层宽度记忆的持久化、拖拽跟随与边界约束。
 */
import { describe, expect, it } from 'vitest';

import { DIALOG_MIN_WIDTH, useDialogWidth } from '../components/dialog-resize';

/** setViewport 固定 jsdom 视口宽度，拖拽距离按该值计算。 */
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

/** dragTo 模拟拖拽中的一次指针移动并松开结束会话。 */
async function dragTo(clientX: number) {
  window.dispatchEvent(new PointerEvent('pointermove', { clientX }));
  window.dispatchEvent(new PointerEvent('pointerup', { clientX }));
}

describe('弹层宽度记忆 useDialogWidth', () => {
  it('无记忆时使用默认宽度', () => {
    localStorage.clear();
    setViewport(1400);
    const { width } = useDialogWidth('spec-default', { defaultWidth: 960 });
    expect(width.value).toBe(960);
  });

  it('有记忆时恢复上次拖拽宽度', () => {
    localStorage.clear();
    localStorage.setItem('kb-dialog-width:spec-restore', '1200');
    setViewport(1400);
    const { width } = useDialogWidth('spec-restore', { defaultWidth: 960 });
    expect(width.value).toBe(1200);
  });

  it('拖拽中宽度跟随指针，松开后写入 localStorage', async () => {
    localStorage.clear();
    setViewport(1400);
    const { startResize, width } = useDialogWidth('spec-drag', { defaultWidth: 672 });
    startResize(new PointerEvent('pointerdown', { clientX: 400 }));
    await dragTo(500);
    expect(width.value).toBe(900);
    expect(localStorage.getItem('kb-dialog-width:spec-drag')).toBe('900');
  });

  it('宽度限制在可读下限与视口可用宽度之间', async () => {
    localStorage.clear();
    setViewport(1400);
    const { startResize, width } = useDialogWidth('spec-clamp', { defaultWidth: 672 });
    startResize(new PointerEvent('pointerdown', { clientX: 1000 }));
    await dragTo(1390);
    expect(width.value).toBe(DIALOG_MIN_WIDTH);

    setViewport(1000);
    startResize(new PointerEvent('pointerdown', { clientX: 100 }));
    await dragTo(0);
    expect(width.value).toBe(1000 - 48);
  });

  it('拖拽中断（pointercancel）同样结束会话并清理光标锁', async () => {
    localStorage.clear();
    setViewport(1400);
    const { startResize, width } = useDialogWidth('spec-cancel', { defaultWidth: 672 });
    startResize(new PointerEvent('pointerdown', { clientX: 400 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300 }));
    window.dispatchEvent(new PointerEvent('pointercancel', { clientX: 300 }));
    expect(width.value).toBe(1100);
    expect(document.body.classList.contains('kb-dialog-resizing')).toBe(false);
    expect(localStorage.getItem('kb-dialog-width:spec-cancel')).toBe('1100');
  });

  it('resetWidth 清除记忆并恢复默认宽度', () => {
    localStorage.clear();
    localStorage.setItem('kb-dialog-width:spec-reset', '1100');
    setViewport(1400);
    const { resetWidth, width } = useDialogWidth('spec-reset', { defaultWidth: 672 });
    expect(width.value).toBe(1100);
    resetWidth();
    expect(width.value).toBe(672);
    expect(localStorage.getItem('kb-dialog-width:spec-reset')).toBeNull();
  });
});
