<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentDial')" :expanded="true">
    <SettingItemBox :name="editorT('orgMall.devices.excelSheet')">
      <SettingItem :name="editorT('bigscreenEditor.ui.value')">
        <n-input-number v-model:value="config.dataset" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterValue')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentExpandRangeAutomatically')">
        <n-switch v-model:value="config.autoScale" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('iotApp.schemaForm.unitLabel')">
        <n-input v-model:value="config.unit" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEGKWhDevices')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="config.displayDecimals" :min="0" :step="1" size="small" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFont')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="dialConfig.axisLabel.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="dialConfig.axisLabel.fontSize" :min="0" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentOutsideTheDial')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="config.series[1].axisLine.lineStyle.color[1][1]" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPointer')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="dialConfig.data[0].itemStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="dialConfig.pointer.width" :min="0" :step="1" size="small" :placeholder="editorT('bigscreenEditor.ui.width2')" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.scale')">
      <SettingItem :name="editorT('orgManage.flow.propMin')">
        <n-input-number v-model:value="dialConfig.min" :step="1" size="small" :placeholder="editorT('orgManage.flow.propMin')" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.propMax')">
        <n-input-number v-model:value="dialConfig.max" :step="1" size="small" :placeholder="editorT('orgManage.flow.propMax')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTickCount')">
        <n-input-number v-model:value="dialConfig.splitNumber" :min="1" :step="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTickColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="config.series[1].axisTick.lineStyle.color" @update:value="updateClick" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentCenterValue')">
      <SettingItem :name="editorT('orgManage.menuManage.shown')">
        <n-switch v-model:value="dialConfig.detail.show" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="dialConfig.detail.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="dialConfig.detail.fontSize" :min="0" :step="1" size="small" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, type PropType } from 'vue';

import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';
import type { GlobalThemeJsonType } from '@/settings/chartThemes';

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true,
  },
});

const config = computed(() => props.optionData as any);
const dialConfig = computed(() => props.optionData.series[0] as any);

const updateClick = (val: any) => {
  props.optionData.series[1].splitLine.lineStyle.color = val;
};
</script>
