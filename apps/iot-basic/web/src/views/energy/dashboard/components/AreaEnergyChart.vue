<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { EchartsUIType } from '@vben/plugins/echarts';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useDashboardTheme } from '../composables/useTheme';

const props = defineProps<{
  names: string[];
  values: number[];
}>();

const theme = useDashboardTheme();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const expanded = ref(false);

const total = computed(() => props.values.reduce((a, b) => a + b, 0));

const allItems = computed(() => {
  const colors = theme.value.chartColors;
  return props.names
    .map((name, index) => {
      const value = props.values[index] ?? 0;
      const percent = total.value > 0 ? (value / total.value) * 100 : 0;
      return {
        key: index,
        name,
        value,
        percent,
        color: colors[index % colors.length] ?? theme.value.accent,
      };
    })
    .sort((a, b) => b.value - a.value);
});

const previewItems = computed(() => allItems.value);
const extraCount = computed(() => allItems.value.length);
const hasMore = computed(() => allItems.value.length > 0);

watch(
  () => ({ names: props.names, values: props.values, t: theme.value }),
  ({ names, values, t }) => {
    if (!names?.length) {
      renderEcharts({ series: [] });
      return;
    }

    const tot = values.reduce((a, b) => a + b, 0);
    const colors = t.chartColors;
    const pieData = names.map((name, index) => ({
      name,
      value: values[index] ?? 0,
      itemStyle: { color: colors[index % colors.length] ?? t.accent },
    }));

    renderEcharts({
      tooltip: {
        trigger: 'item',
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        textStyle: { color: t.tooltipText, fontSize: 11 },
        position: (point: number[]) => {
          // 始终弹到鼠标右侧（饼图本身在卡片右边，卡片 overflow:visible 允许溢出）
          const x = point[0] ?? 0;
          const y = point[1] ?? 0;
          return [x + 14, y - 24];
        },
        formatter: (params: any) =>
          `<div style="font-size:11px">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${params.color};margin-right:5px"></span>${params.name}
            <div style="margin-top:3px;padding-left:12px">
              <b style="color:${t.accentLight}">${Number(params.value).toFixed(2)} kWh</b>
              <span style="color:${t.axisLabel};margin-left:6px">${Number(params.percent).toFixed(1)}%</span>
            </div>
          </div>`,
      },
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: 'middle',
          children: [
            {
              type: 'text',
              style: { text: tot.toFixed(1), fill: t.centerText, fontSize: 14, fontWeight: 700 },
              left: 'center',
              top: -8,
            } as any,
            {
              type: 'text',
              style: { text: 'kWh', fill: t.centerSubText, fontSize: 9 },
              left: 'center',
              top: 10,
            } as any,
          ],
        },
      ],
      series: [
        {
          type: 'pie',
          radius: ['52%', '76%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { scaleSize: 4, label: { show: false } },
          itemStyle: { borderRadius: 3, borderColor: t.pieBorderColor, borderWidth: 2 },
          data: pieData,
        },
      ],
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="aec">
    <!-- 左侧：折叠列表 -->
    <div class="aec__left">
      <ul class="aec__list">
        <li v-for="item in previewItems" :key="item.key" class="aec__item">
          <span class="aec__rank" :style="{ color: theme.textDim }">{{ item.key + 1 }}</span>
          <span class="aec__dot" :style="{ background: item.color }" />
          <span class="aec__name" :style="{ color: theme.textMuted }" :title="item.name">
            {{ item.name }}
          </span>
          <span class="aec__bar-wrap">
            <span class="aec__bar" :style="{ width: `${item.percent}%`, background: item.color + 'aa' }" />
          </span>
          <span class="aec__pct" :style="{ color: theme.text }">{{ item.percent.toFixed(1) }}%</span>
        </li>
      </ul>

      <!-- 展开按钮 -->
      <button
        v-if="hasMore"
        class="aec__expand-btn"
        :style="{ color: theme.accent, borderTopColor: theme.panelHeadBorder }"
        @click="expanded = true"
      >
        {{ $t('orgIotClient.energyDashboard.expandAll', { count: extraCount }) }}
        <span class="icon-[mdi--chevron-down]" />
      </button>
    </div>

    <!-- 右侧：小饼图 -->
    <div class="aec__chart">
      <EchartsUI ref="chartRef" height="100%" />
    </div>

    <!-- 展开浮层：覆盖整个卡片 -->
    <Transition name="aec-overlay">
      <div
        v-if="expanded"
        class="aec__overlay"
        :style="{
          background: theme.bgCard,
          borderColor: theme.cardBorder,
        }"
      >
        <div class="aec__overlay-head" :style="{ borderBottomColor: theme.panelHeadBorder }">
          <span :style="{ color: theme.text, fontSize: '12px', fontWeight: 600 }">{{ $t('orgIotClient.energyDashboard.areaShareAll', { count: allItems.length }) }}</span>
          <button
            class="aec__close-btn"
            :style="{ color: theme.textMuted }"
            @click="expanded = false"
          >
            <span class="icon-[mdi--close]" />
          </button>
        </div>
        <div class="aec__overlay-body">
          <ul class="aec__list aec__list--full">
            <li v-for="item in allItems" :key="item.key" class="aec__item">
              <span class="aec__rank" :style="{ color: theme.textDim }">{{ item.key + 1 }}</span>
              <span class="aec__dot" :style="{ background: item.color }" />
              <span class="aec__name" :style="{ color: theme.textMuted }" :title="item.name">
                {{ item.name }}
              </span>
              <span class="aec__bar-wrap">
                <span class="aec__bar" :style="{ width: `${item.percent}%`, background: item.color + 'aa' }" />
              </span>
              <span class="aec__pct" :style="{ color: theme.text }">{{ item.percent.toFixed(1) }}%</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.aec {
  display: flex;
  flex-direction: row-reverse;
  gap: 8px;
  height: 100%;
  min-height: 0;
  position: relative;
}

/* 饼图：固定宽度、自适应 */
.aec__chart {
  flex: 0 0 clamp(120px, 34%, 200px);
  min-height: 0;
}

/* 左侧容器 */
.aec__left {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 列表 */
.aec__list {
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}

.aec__list--full {
  overflow-y: auto;
}

.aec__list--full::-webkit-scrollbar {
  width: 3px;
}

.aec__list--full::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: rgba(255 255 255 / 0.15);
}

.aec__item {
  display: grid;
  grid-template-columns: 14px 8px 1fr minmax(32px, 52px) 34px;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  line-height: 1.4;
  padding: 2px 0;
}

.aec__rank {
  font-size: 10px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.aec__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.aec__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.aec__bar-wrap {
  height: 4px;
  border-radius: 2px;
  background: rgba(255 255 255 / 0.06);
  overflow: hidden;
}

.aec__bar {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.aec__pct {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

/* 展开按钮 */
.aec__expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  padding: 4px 0;
  margin-top: 2px;
  border: none;
  border-top: 1px solid;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  transition: opacity 0.2s;
}

.aec__expand-btn:hover {
  opacity: 0.75;
}

/* ===== 展开覆盖浮层 ===== */
.aec__overlay {
  position: absolute;
  inset: -8px; /* 贴合 chart-panel__body 的 padding */
  z-index: 10;
  border-radius: 8px;
  border: 1px solid;
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.aec__overlay-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid;
  flex-shrink: 0;
}

.aec__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s;
}

.aec__close-btn:hover {
  background: rgba(255 255 255 / 0.1);
}

.aec__overlay-body {
  flex: 1;
  padding: 6px 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 过渡动画 */
.aec-overlay-enter-active,
.aec-overlay-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.aec-overlay-enter-from,
.aec-overlay-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
