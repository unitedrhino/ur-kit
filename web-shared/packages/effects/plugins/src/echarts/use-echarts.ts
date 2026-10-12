import type { EChartsOption } from 'echarts';

import type { Ref } from 'vue';

import type { Nullable } from '@vben/types';

import type EchartsUI from './echarts-ui.vue';

import { computed, nextTick, watch } from 'vue';

import { usePreferences } from '@vben/preferences';

import { tryOnScopeDispose, useDebounceFn, useResizeObserver, useTimeoutFn, useWindowSize } from '@vueuse/core';

import echarts from './echarts';

type EchartsUIType = typeof EchartsUI | undefined;

type EchartsThemeType = 'dark' | 'light' | null;

/** EchartsRenderResult 描述一次绘制完成后返回实例或因作用域销毁返回空值。 */
type EchartsRenderResult = Nullable<echarts.ECharts>;

/** SettleRender 是每次绘制 Promise 唯一允许的收束入口。 */
type SettleRender = (result: EchartsRenderResult) => void;

function useEcharts(chartRef: Ref<EchartsUIType>) {
  /** chartInstance 保存当前仍由 hook 管理的 ECharts 实例。 */
  let chartInstance: echarts.ECharts | null = null;
  /** cacheOptions 保存主题切换时需要重新绘制的原始配置。 */
  let cacheOptions: EChartsOption = {};
  /** isScopeDisposed 阻止组件或调用作用域销毁后继续调度和初始化。 */
  let isScopeDisposed = false;
  /** pendingRenderSettlers 收集尚未完成的绘制，以便销毁时统一收束。 */
  const pendingRenderSettlers = new Set<SettleRender>();

  const { isDark } = usePreferences();
  const { height, width } = useWindowSize();
  const resizeHandler: () => void = useDebounceFn(resize, 200);

  const getChartEl = (): HTMLElement | null => {
    const refValue = chartRef?.value as unknown;
    if (!refValue) return null;
    if (refValue instanceof HTMLElement) {
      return refValue;
    }
    const maybeComponent = refValue as { $el?: HTMLElement };
    return maybeComponent.$el ?? null;
  };

  const isElHidden = (el: HTMLElement | null): boolean => {
    if (!el) return true;
    return el.offsetHeight === 0 || el.offsetWidth === 0;
  };

  const getOptions = computed((): EChartsOption => {
    if (!isDark.value) {
      return {};
    }

    return {
      backgroundColor: 'transparent',
    };
  });

  const initCharts = (t?: EchartsThemeType) => {
    const el = chartRef?.value?.$el;
    if (!el) {
      return;
    }
    chartInstance = echarts.init(el, t || isDark.value ? 'dark' : null);

    return chartInstance;
  };

  const renderEcharts = (options: EChartsOption, clear = true): Promise<EchartsRenderResult> => {
    if (isScopeDisposed) return Promise.resolve(null);
    cacheOptions = options;
    const currentOptions = {
      ...options,
      ...getOptions.value,
    };
    return new Promise((resolve) => {
      /** timerControls 始终只保存本次绘制当前一个待执行计时器。 */
      let timerControls: null | ReturnType<typeof useTimeoutFn> = null;
      /** isSettled 防止计时器和销毁流程重复完成同一 Promise。 */
      let isSettled = false;

      /** settle 停止当前计时器并让本次绘制只完成一次。 */
      const settle: SettleRender = (result) => {
        if (isSettled) return;
        isSettled = true;
        timerControls?.stop();
        timerControls = null;
        pendingRenderSettlers.delete(settle);
        resolve(result);
      };

      /** schedule 在销毁前安排唯一下一步，销毁后立即返回空结果。 */
      const schedule = (callback: () => void) => {
        if (isScopeDisposed) {
          settle(null);
          return;
        }
        timerControls?.stop();
        timerControls = useTimeoutFn(() => {
          timerControls = null;
          if (isScopeDisposed) {
            settle(null);
            return;
          }
          callback();
        }, 30);
      };

      /** commitOptions 初始化可见图表并保持原有 clear 与 setOption 顺序。 */
      const commitOptions = () => {
        if (isScopeDisposed) {
          settle(null);
          return;
        }
        const instance = chartInstance ?? initCharts();
        if (!instance) {
          settle(null);
          return;
        }
        if (clear) instance.clear();
        instance.setOption(currentOptions);
        settle(instance);
      };

      /** attemptRender 等待 DOM 更新；零尺寸时只重排本次调用，不递归创建 Promise。 */
      const attemptRender = () => {
        if (isScopeDisposed) {
          settle(null);
          return;
        }
        void nextTick(() => {
          if (isScopeDisposed) {
            settle(null);
            return;
          }
          const el = getChartEl();
          if (isElHidden(el)) {
            schedule(attemptRender);
            return;
          }
          schedule(commitOptions);
        });
      };

      pendingRenderSettlers.add(settle);
      attemptRender();
    });
  };

  function resize() {
    const el = getChartEl();
    if (isElHidden(el)) {
      return;
    }
    chartInstance?.resize({
      animation: {
        duration: 300,
        easing: 'quadraticIn',
      },
    });
  }

  watch([width, height], () => {
    resizeHandler?.();
  });

  useResizeObserver(chartRef as never, resizeHandler);

  watch(isDark, () => {
    if (chartInstance) {
      chartInstance.dispose();
      initCharts();
      void renderEcharts(cacheOptions);
      resize();
    }
  });

  tryOnScopeDispose(() => {
    isScopeDisposed = true;
    for (const settle of pendingRenderSettlers) settle(null);
    chartInstance?.dispose();
    chartInstance = null;
  });
  return {
    renderEcharts,
    resize,
    getChartInstance: () => chartInstance,
  };
}

export { useEcharts };

export type { EchartsUIType };
