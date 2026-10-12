<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('iotApp.deviceDetail.content')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFont')">
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number
          v-model:value="optionData.timeSize"
          size="small"
          :min="1"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.thickness')">
        <n-select
          v-model:value="optionData.fontWeight"
          size="small"
          :options="fontWeightOptions"
        />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSpacing')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing')">
        <n-input-number
          v-model:value="optionData.timeTextIndent"
          size="small"
          :min="1"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRowSpacing')">
        <n-input-number
          v-model:value="optionData.timeLineHeight"
          size="small"
          :min="1"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('orgManage.flow.fwColor')">
      <SettingItem :name="editorT('orgManage.pointLog.time')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.timeColor"
        ></n-color-picker>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShadow')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="optionData.showShadow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowShadow') }}</n-text>
        </n-space>
      </SettingItem>
      <SettingItem name="x">
        <n-input-number v-model:value="optionData.hShadow" size="small"></n-input-number
      ></SettingItem>
      <SettingItem name="y">
        <n-input-number v-model:value="optionData.vShadow" size="small"></n-input-number
      ></SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBlur')">
        <n-input-number
          v-model:value="optionData.blurShadow"
          size="small"
        ></n-input-number
      ></SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="optionData.colorShadow"
        ></n-color-picker
      ></SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from "vue";
import {
  CollapseItem,
  SettingItemBox,
  SettingItem,
} from "@/components/Pages/ChartItemSetting";
import { option, FontWeightEnum, FontWeightObject } from "./config";

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
});
const fontWeightOptions = [
  {
    label: FontWeightEnum.NORMAL,
    value: FontWeightObject[FontWeightEnum.NORMAL],
  },
  {
    label: FontWeightEnum.BOLD,
    value: FontWeightObject[FontWeightEnum.BOLD],
  },
];
</script>
