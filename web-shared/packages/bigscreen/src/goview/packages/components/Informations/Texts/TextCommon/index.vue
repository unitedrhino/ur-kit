<template>
  <div class="go-text-box">
    <div class="content">
      <span v-if="link" style="cursor: pointer; white-space: pre-wrap" :style="dynamicColorStyle" @click="click">{{ option.dataset }}</span>
      <span v-else style="white-space: pre-wrap" :style="dynamicColorStyle">{{ option.dataset }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, toRefs, shallowReactive, watch, ref, computed } from 'vue';

import { useChartDataFetch } from '@/hooks';
import type { CreateComponentType } from '@/packages/index.type';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';

import { option as configOption } from './config';
import { extractSingleValueFromDataset } from './valueResolver';

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof configOption>,
    required: true,
  },
});

const {
  linkHead,
  link,
  fontColor,
  fontSize,
  letterSpacing,
  paddingY,
  paddingX,
  textAlign,
  borderWidth,
  borderColor,
  borderRadius,
  writingMode,
  backgroundColor,
  fontWeight,
} = toRefs(props.chartConfig.option);

const option = shallowReactive({
  dataset: configOption.dataset,
});

function extractRawValue(newData: any): number | string {
  return extractSingleValueFromDataset(newData, {
    requestMapping: (props.chartConfig.request as any)?.requestIoTDeviceConfig?.mapping,
    simplifiedMappings: (props.chartConfig.option as any)?._simplifiedData?.mappings,
  });
}

function formatValue(raw: number | string, format: typeof configOption.format): string {
  if (!format?.enabled) return String(raw);

  // 对字符串值：只有整个字符串都是数字时才做数字格式化，否则保留原始文本
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return `${format.prefix}${raw}${format.suffix}`;
    }
  }

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (Number.isNaN(num)) return `${format.prefix}${raw}${format.suffix}`;

  let formatted = format.decimals >= 0 ? num.toFixed(format.decimals) : String(num);

  if (format.useThousands) {
    const parts = formatted.split('.');
    // 整数段必然存在，兜底空串仅为满足类型
    parts[0] = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');
  }

  return `${format.prefix}${formatted}${format.suffix}`;
}

function resolveConditionalColor(raw: number | string, condStyles: typeof configOption.conditionalStyles): null | string {
  if (!condStyles?.enabled || !condStyles.rules?.length) return null;

  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (Number.isNaN(num)) return null;

  for (const rule of condStyles.rules) {
    let match = false;
    switch (rule.operator) {
      case 'gt':
        match = num > rule.value;
        break;
      case 'lt':
        match = num < rule.value;
        break;
      case 'gte':
        match = num >= rule.value;
        break;
      case 'lte':
        match = num <= rule.value;
        break;
      case 'eq':
        match = num === rule.value;
        break;
    }
    if (match) return rule.color;
  }

  return null;
}

const dynamicColor = ref<null | string>(null);
const currentRawValue = ref<number | string>('');

const dynamicColorStyle = computed(() => {
  if (dynamicColor.value) {
    return { color: dynamicColor.value };
  }
  return {};
});

function applyDisplayValue(raw: number | string) {
  const formatCfg = props.chartConfig.option.format ?? { enabled: false };
  const condStylesCfg = props.chartConfig.option.conditionalStyles ?? { enabled: false, rules: [] };

  currentRawValue.value = raw;
  option.dataset = formatValue(raw, formatCfg);
  dynamicColor.value = resolveConditionalColor(raw, condStylesCfg);
}

watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    applyDisplayValue(extractRawValue(newData));
  },
  {
    immediate: true,
    deep: false,
  },
);

useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  applyDisplayValue(extractRawValue(newData));
});

watch(
  () => [
    props.chartConfig.option.format?.enabled,
    props.chartConfig.option.format?.prefix,
    props.chartConfig.option.format?.suffix,
    props.chartConfig.option.format?.decimals,
    props.chartConfig.option.format?.useThousands,
    JSON.stringify(props.chartConfig.option.conditionalStyles ?? {}),
  ],
  () => {
    applyDisplayValue(currentRawValue.value);
  },
);

const click = () => {
  // linkHead/link 经 toRefs 解构可能为 undefined，缺失时按空串拼接
  window.open((linkHead?.value ?? '') + (link?.value ?? ''));
};
</script>

<style lang="scss" scoped>
@include go('text-box') {
  display: flex;
  align-items: center;
  justify-content: v-bind('textAlign');
  overflow: hidden;

  .content {
    color: v-bind('fontColor');
    padding: v-bind('`${paddingY}px ${paddingX}px`');
    font-size: v-bind('fontSize + "px"');
    letter-spacing: v-bind('letterSpacing + "px"');
    writing-mode: v-bind('writingMode');
    font-weight: v-bind('fontWeight');
    border-style: solid;
    border-width: v-bind('borderWidth + "px"');
    border-radius: v-bind('borderRadius + "px"');
    border-color: v-bind('borderColor');
    background-color: v-bind('backgroundColor');
  }
}
</style>
