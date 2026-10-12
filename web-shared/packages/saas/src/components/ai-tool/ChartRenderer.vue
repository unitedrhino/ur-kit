<!-- 文件说明：受控图表渲染，组件内部生成 ECharts 配置并按需加载。 -->
<script lang="ts" setup>
import type { EChartsOption } from 'echarts';

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ name: 'ChartRenderer' });

interface SeriesItem {
  name: string;
  data: Array<number | null>;
}

interface ChartData {
  xAxis: string[];
  series: SeriesItem[];
}

interface Props {
  type: string;
  data: ChartData;
  title?: string;
  width?: string;
  height?: string;
  /** 趋势图启用缩放，旧调用保持关闭。 */
  zoom?: boolean;
  /** 仅标注为时间字段时格式化坐标轴，悬浮保留原始完整值。 */
  timeAxis?: boolean;
  /** 对话结果已有外层卡片，避免重复边框。 */
  flat?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '100%',
  height: '360px',
  zoom: false,
});

const chartRef = ref<HTMLDivElement>();
const loading = ref(true);
const error = ref('');
let chartInstance: any = null;
/** 异步图表加载和尺寸观察均绑定组件生命周期，防止卸载后创建画布。 */
let disposed = false;
let initGeneration = 0;
let resizeObserver: ResizeObserver | undefined;
/** 主题切换时重建图表皮肤，监听 class 而非持续轮询。 */
let themeObserver: MutationObserver | undefined;
let darkTheme = false;
/** selection 只返回当前真实数据中的点，供聊天继续提问引用。 */
const emit = defineEmits<{ selection: [value: { xValue: string; seriesName: string; value: number | null }] }>();

function buildOption(): EChartsOption {
  const { type, data, title } = props;
  const baseOption: EChartsOption = {
    backgroundColor: 'transparent',
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14,
            fontWeight: 'normal',
          },
        }
      : undefined,
    tooltip: {
      trigger: type === 'pie' ? 'item' : 'axis',
      renderMode: 'richText',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      // 长分类只缩短图例文案，完整名称保留在数据和悬浮提示中。
      formatter: (name: string) => name.length > 24 ? `${name.slice(0, 24)}…` : name,
    },
    grid: type !== 'pie'
      ? {
          left: '3%',
          right: '4%',
          bottom: props.zoom && type === 'line' ? '80px' : type !== 'scatter' ? '40px' : '15%',
          containLabel: true,
        }
      : undefined,
  };

  const xData = data?.xAxis ?? [];
  const series = (data?.series ?? []).map((s) => ({
    name: s.name,
    type: type === 'scatter' ? 'scatter' : type,
    data: type === 'pie'
      ? xData.map((name, i) => ({ name, value: s.data[i] ?? null }))
      : s.data,
    ...(type === 'pie'
      ? {
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          // 多分类外部标签会相互覆盖，使用悬浮提示与下方明细查看。
          label: { show: xData.length <= 12, overflow: 'truncate', width: 120 },
          labelLine: { show: xData.length <= 12 },
          labelLayout: { hideOverlap: true },
        }
      : {}),
  }));

  return {
    ...baseOption,
    dataZoom: props.zoom && type === 'line' ? [{ type: 'inside' }, { type: 'slider', bottom: 24 }] : undefined,
    xAxis: type !== 'pie'
      ? {
          type: 'category',
          data: xData,
          axisLabel: { hideOverlap: true, formatter: props.timeAxis ? (value: string) => {
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour12: false });
          } : undefined },
        }
      : undefined,
    yAxis: type !== 'pie'
      ? { type: 'value' }
      : undefined,
    series,
  } as EChartsOption;
}

/** initChart 懒加载图表并处理并发更新，旧加载结果不能覆盖当前组件。 */
async function initChart() {
  if (disposed || !chartRef.value) return;
  const current = ++initGeneration;

  loading.value = true;
  error.value = '';

  try {
    const echarts = await import('echarts');
    if (disposed || current !== initGeneration || !chartRef.value) return;

    if (chartInstance) {
      chartInstance.dispose();
    }

    const isDark = document.documentElement.classList.contains('dark');
    darkTheme = isDark;
    chartInstance = echarts.init(chartRef.value, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    });

    chartInstance.setOption(buildOption());
    chartInstance.on('click', (point: { dataIndex?: number; seriesIndex?: number }) => {
      const index = point.dataIndex; const series = props.data.series[point.seriesIndex ?? 0];
      if (index === undefined || !series || index < 0 || index >= props.data.xAxis.length) return;
      emit('selection', { xValue: props.data.xAxis[index]!, seriesName: series.name, value: series.data[index] ?? null });
    });
  } catch (err: any) {
    if (disposed || current !== initGeneration) return;
    error.value = err?.message ?? '图表加载失败';
    console.error('[ChartRenderer] Failed to initialize chart:', err);
  } finally {
    if (!disposed && current === initGeneration) loading.value = false;
  }
}

function handleResize() {
  chartInstance?.resize();
}

onMounted(() => {
  nextTick(() => initChart());
  window.addEventListener('resize', handleResize);
  themeObserver = new MutationObserver(() => {
    if (document.documentElement.classList.contains('dark') !== darkTheme) void initChart();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (typeof ResizeObserver !== 'undefined' && chartRef.value) { resizeObserver = new ResizeObserver(handleResize); resizeObserver.observe(chartRef.value); }
});

onBeforeUnmount(() => {
  disposed = true; initGeneration++; resizeObserver?.disconnect(); themeObserver?.disconnect();
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});

watch(
  () => [props.type, props.data, props.title],
  () => {
    if (chartInstance) {
      chartInstance.setOption(buildOption(), true);
    } else {
      nextTick(() => initChart());
    }
  },
  { deep: true },
);
</script>

<template>
  <div
    class="chart-renderer min-w-0 max-w-full" :class="flat ? '' : 'bg-card border-border rounded-lg border p-4'"
    :style="{ width: props.width }"
  >
    <div
      ref="chartRef"
      :style="{ width: '100%', height: props.height }"
    />
    <div
      v-if="loading"
      class="text-muted-foreground flex items-center justify-center text-sm"
      :style="{ height: props.height }"
    >
      正在加载图表…
    </div>
    <div
      v-if="error"
      class="text-destructive flex items-center justify-center text-sm"
      :style="{ height: props.height }"
    >
      {{ error }}
    </div>
  </div>
</template>
