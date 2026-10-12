/**
 * 共享 ECharts hook 生命周期测试。
 *
 * 核心职责：验证零尺寸重试可在作用域销毁时收束，并锁定可见绘制、主题重建和尺寸调整行为。
 */

/* eslint-disable vue/one-component-per-file -- Hook 生命周期测试需要宿主组件和图表子组件。 */

import type { Ref } from 'vue';

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEcharts } from './use-echarts';

/** echartsMocks 只隔离 ECharts 实例边界，生命周期与计时器继续使用真实实现。 */
const echartsMocks = vi.hoisted(() => {
  const instance = {
    clear: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
    setOption: vi.fn(),
  };
  return {
    init: vi.fn(() => instance),
    instance,
  };
});

/** preferenceMocks 暴露真实 Vue ref，便于触发主题 watcher。 */
const preferenceMocks = vi.hoisted(() => ({
  isDark: null as null | Ref<boolean>,
}));

vi.mock('./echarts', () => ({
  default: { init: echartsMocks.init },
}));

vi.mock('@vben/preferences', async () => {
  const { ref: createRef } = await import('vue');
  const isDark = createRef(false);
  preferenceMocks.isDark = isDark;
  return {
    usePreferences: () => ({ isDark }),
  };
});

/** ChartStub 提供与 EchartsUI 一致的组件 ref 和真实根元素。 */
const ChartStub = defineComponent({
  name: 'ChartStub',
  setup() {
    return () => h('div', { 'data-testid': 'chart-element' });
  },
});

/** HarnessApi 是测试组件公开的共享 hook API。 */
type HarnessApi = ReturnType<typeof useEcharts>;

/** mountHarness 挂载真实 hook，并让测试精确控制图表元素尺寸。 */
function mountHarness(initialWidth: number, initialHeight: number) {
  const Harness = defineComponent({
    name: 'UseEchartsHarness',
    setup(_props, { expose }) {
      const chartRef = ref();
      const api = useEcharts(chartRef as never);
      expose(api);
      return () => h(ChartStub, { ref: chartRef });
    },
  });
  const wrapper = mount(Harness);
  const element = wrapper.get('[data-testid="chart-element"]').element as HTMLElement;
  let width = initialWidth;
  let height = initialHeight;
  Object.defineProperties(element, {
    offsetHeight: { configurable: true, get: () => height },
    offsetWidth: { configurable: true, get: () => width },
  });
  return {
    api: wrapper.vm as unknown as HarnessApi,
    element,
    setSize(nextWidth: number, nextHeight: number) {
      width = nextWidth;
      height = nextHeight;
    },
    wrapper,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  if (preferenceMocks.isDark) preferenceMocks.isDark.value = false;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('useEcharts', () => {
  it('零尺寸重试在作用域卸载后收束为 null 且不再初始化或调度', async () => {
    const harness = mountHarness(0, 0);
    const renderPromise = harness.api.renderEcharts({ series: [] });

    await nextTick();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    harness.wrapper.unmount();

    await expect(renderPromise).resolves.toBeNull();
    await vi.runAllTimersAsync();
    expect(vi.getTimerCount()).toBe(0);
    expect(echartsMocks.init).not.toHaveBeenCalled();
    expect(echartsMocks.instance.setOption).not.toHaveBeenCalled();
  });

  it('可见元素继续初始化、清理并写入最终 option', async () => {
    const harness = mountHarness(640, 320);
    const option = { series: [{ data: [1], type: 'line' }] };
    const renderPromise = harness.api.renderEcharts(option);

    await nextTick();
    await vi.advanceTimersByTimeAsync(30);

    await expect(renderPromise).resolves.toBe(echartsMocks.instance);
    expect(echartsMocks.init).toHaveBeenCalledWith(harness.element, null);
    expect(echartsMocks.instance.clear).toHaveBeenCalledTimes(1);
    expect(echartsMocks.instance.setOption).toHaveBeenCalledWith(option);
    harness.wrapper.unmount();
  });

  it('主题变化继续重建图表并保留公开 resize 行为', async () => {
    const harness = mountHarness(640, 320);
    const option = { series: [{ data: [2], type: 'line' }] };
    const renderPromise = harness.api.renderEcharts(option);
    await nextTick();
    await vi.advanceTimersByTimeAsync(30);
    await renderPromise;

    harness.api.resize();
    expect(echartsMocks.instance.resize).toHaveBeenCalled();

    if (!preferenceMocks.isDark) throw new Error('主题测试 ref 未初始化');
    preferenceMocks.isDark.value = true;
    await nextTick();
    await vi.advanceTimersByTimeAsync(30);

    expect(echartsMocks.instance.dispose).toHaveBeenCalledTimes(1);
    expect(echartsMocks.init).toHaveBeenCalledTimes(2);
    expect(echartsMocks.instance.setOption).toHaveBeenLastCalledWith({ ...option, backgroundColor: 'transparent' });
    harness.wrapper.unmount();
  });
});
