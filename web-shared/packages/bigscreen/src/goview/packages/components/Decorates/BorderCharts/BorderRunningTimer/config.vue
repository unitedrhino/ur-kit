<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 边框配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentBorder')" :expanded="false">
    <SettingItemBox :name="editorT('orgManage.approve.colTitle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleText2')">
        <n-input v-model:value="optionData.borderOption.borderTitle" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleFontSize')">
        <n-input-number v-model:value="optionData.borderOption.borderTitleSize" size="small" :min="12" :max="36" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleColor')">
        <n-color-picker v-model:value="optionData.borderOption.borderTitleColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBorderColor2')">
      <SettingItem v-for="(_, idx) in optionData.borderOption.colors" :key="idx" :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })">
        <n-color-picker v-model:value="optionData.borderOption.colors[idx]" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.background')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker v-model:value="optionData.borderOption.backgroundColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 天数翻牌器 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentDaysFlipCard')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFlipCard')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDigits')">
        <n-input-number v-model:value="optionData.dayOption.flipperLength" size="small" :min="1" :max="8" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="optionData.dayOption.flipperWidth" size="small" :min="10" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.height2')">
        <n-input-number v-model:value="optionData.dayOption.flipperHeight" size="small" :min="20" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSpacing')">
        <n-input-number v-model:value="optionData.dayOption.flipperGap" size="small" :min="0" :max="30" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="optionData.dayOption.flipperRadius" size="small" :min="0" :max="20" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker v-model:value="optionData.dayOption.flipperBgColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextColor')">
        <n-color-picker v-model:value="optionData.dayOption.flipperTextColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('iotApp.schemaForm.unitLabel')">
      <SettingItem :name="editorT('bigscreenManagement.ui.text')">
        <n-input v-model:value="optionData.dayUnitOption.text" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.dayUnitOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.dayUnitOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.dayUnitOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 小时翻牌器 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentHoursFlipCard')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFlipCard')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDigits')">
        <n-input-number v-model:value="optionData.hourOption.flipperLength" size="small" :min="1" :max="8" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="optionData.hourOption.flipperWidth" size="small" :min="10" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.height2')">
        <n-input-number v-model:value="optionData.hourOption.flipperHeight" size="small" :min="20" :max="100" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSpacing')">
        <n-input-number v-model:value="optionData.hourOption.flipperGap" size="small" :min="0" :max="30" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="optionData.hourOption.flipperRadius" size="small" :min="0" :max="20" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <n-color-picker v-model:value="optionData.hourOption.flipperBgColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextColor')">
        <n-color-picker v-model:value="optionData.hourOption.flipperTextColor" size="small" :modes="['hex']" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('iotApp.schemaForm.unitLabel')">
      <SettingItem :name="editorT('bigscreenManagement.ui.text')">
        <n-input v-model:value="optionData.hourUnitOption.text" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
        <n-input-number v-model:value="optionData.hourUnitOption.fontSize" size="small" :min="12" :max="48" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.hourUnitOption.fontColor" size="small" :modes="['hex']" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
        <n-select v-model:value="optionData.hourUnitOption.fontWeight" size="small" :options="fontWeightOptions" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <!-- 布局配置 -->
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentLayout')" :expanded="false">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPadding')">
      <SettingItem>
        <n-slider v-model:value="optionData.padding" :min="0" :max="60" :step="2" />
      </SettingItem>
      <SettingItem>
        <n-input-number v-model:value="optionData.padding" size="small" :min="0" :max="60" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
})

const fontWeightOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentRegular'); }, value: 'normal' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBold'); }, value: 'bold' },
]
</script>
