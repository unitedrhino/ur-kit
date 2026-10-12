<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem v-for="(item, index) in seriesList" :key="index" :name="editorT('bigscreenEditor.ui.componentLiquidFill')" :expanded="true">
    <SettingItemBox :name="editorT('iotApp.deviceDetail.content')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPercentageMode')">
        <n-switch v-model:value="optionData.percentMode" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.value')">
        <n-input-number
          v-model:value="optionData.dataset"
          :min="0"
          :max="optionData.percentMode ? 1 : undefined"
          :step="optionData.percentMode ? 0.01 : 1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentLiquidFillValue')"
        />
      </SettingItem>
      <SettingItem v-if="!optionData.percentMode" :name="editorT('orgManage.flow.propMax')">
        <n-input-number v-model:value="optionData.maxValue" :min="1" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterMaximumValue')" />
      </SettingItem>
      <SettingItem v-if="!optionData.percentMode" :name="editorT('iotApp.schemaForm.unitLabel')">
        <n-input v-model:value="optionData.unit" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEGKWhDevices2')" />
      </SettingItem>
      <n-text v-if="!optionData.percentMode && optionData.autoUnit" depth="3" style="font-size: 12px; display: block">
        {{ editorT('bigscreenEditor.ui.componentDetectedUnit') }}{{ optionData.autoUnit }}
      </n-text>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="optionData.displayDecimals" :min="0" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.shape')">
        <n-select v-model:value="item.shape" :options="shapes" :placeholder="editorT('bigscreenEditor.ui.componentSelectShape')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextSize2')">
        <n-input-number v-model:value="item.label.normal.textStyle.fontSize" :min="0" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentTextSize')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentColor1')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.color?.[0]?.colorStops?.[0]?.color"
          @update:value="(value) => updateWaveColor(item, 0, value)"
        />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentColor2')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          :value="item.color?.[0]?.colorStops?.[1]?.color"
          @update:value="(value) => updateWaveColor(item, 1, value)"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.background')" :alone="true">
      <SettingItem>
        <n-color-picker size="small" :modes="['hex']" v-model:value="item.backgroundStyle.color" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, type PropType, watch } from 'vue';

import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';

import { option, shapes } from './config';

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
});

watch(
  () => props.optionData.percentMode,
  (enabled) => {
    if (enabled && Number(props.optionData.dataset) > 1) {
      props.optionData.dataset = 1;
    }
    if (enabled && props.optionData.unitAutoApplied) {
      props.optionData.unit = '';
      props.optionData.autoUnit = '';
      props.optionData.unitAutoApplied = false;
    }
    if (!enabled && Number(props.optionData.maxValue) <= 0) {
      props.optionData.maxValue = 100;
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => props.optionData.unit,
  (nextUnit) => {
    if (props.optionData.percentMode) return;
    props.optionData.unitAutoApplied = !!props.optionData.autoUnit && nextUnit === props.optionData.autoUnit;
  },
);

const seriesList = computed(() => props.optionData.series);

const updateWaveColor = (item: any, stopIndex: 0 | 1, value: string) => {
  if (!item.color?.[0]?.colorStops?.[stopIndex]) return;
  item.color[0].colorStops[stopIndex].color = value;
};
</script>
