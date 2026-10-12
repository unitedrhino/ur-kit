/** 原生列宽手势回归：只隔离本次拖动产生的点击，后续排序与卸载保持正常。 */
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResizeClickGuard } from './use-resize-click-guard';

afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ''; });

describe('列宽拖动点击隔离', () => {
  it('移动后的表头点击不会排序，下一次普通点击仍可排序', () => {
    vi.useFakeTimers();
    const sort = vi.fn();
    const Host = defineComponent({ setup() {
      const guard = useResizeClickGuard('[data-resize]');
      return () => h('div', { onMousedownCapture: guard }, [h('button', { 'data-resize': '' }), h('button', { onClick: sort }, '排序')]);
    } });
    const wrapper = mount(Host, { attachTo: document.body });
    wrapper.get('[data-resize]').element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    wrapper.findAll('button')[1]!.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(sort).not.toHaveBeenCalled();
    vi.runAllTimers();
    wrapper.findAll('button')[1]!.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sort).toHaveBeenCalledTimes(1);
    wrapper.get('[data-resize]').element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    wrapper.unmount();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });
});
