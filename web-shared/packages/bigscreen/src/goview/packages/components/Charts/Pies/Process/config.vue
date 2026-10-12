<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentProgressBar')" :expanded="true">
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
          :placeholder="editorT('bigscreenEditor.ui.componentProgressValue')"
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
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTrack')">
      <SettingItem :name="editorT('bigscreenEditor.ui.shape')">
        <n-select v-model:value="optionData.type" :options="types" :placeholder="editorT('bigscreenEditor.ui.componentSelectShape')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentProgressBarColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTrackColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.railColor" />
      </SettingItem>
      <SettingItem v-if="optionData.type !== lineTypeValue" :name="editorT('bigscreenEditor.ui.componentOffsetAngle')">
        <n-input-number v-model:value="optionData.offsetDegree" size="small" />
      </SettingItem>
      <SettingItem v-if="optionData.type === lineTypeValue">
        <n-space>
          <n-switch v-model:value="optionData.processing" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentAnimationInProgress') }}</n-text>
        </n-space>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentMetric')">
      <SettingItem v-if="optionData.type === lineTypeValue" :name="editorT('iotApp.devicePage.location')">
        <n-select v-model:value="optionData.indicatorPlacement" :options="indicatorPlacements" :placeholder="editorT('bigscreenEditor.ui.componentSelectPosition')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextColor2')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.indicatorTextColor" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextSize2')">
        <n-input-number v-model:value="optionData.indicatorTextSize" size="small" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue';

import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';

import { indicatorPlacements, option, types } from './config';

const lineTypeValue = types[0]?.value ?? 'line';

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
});
</script>
