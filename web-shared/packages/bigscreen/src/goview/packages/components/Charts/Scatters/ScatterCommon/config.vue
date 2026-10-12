<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData" :in-chart="true"></global-setting>

  <CollapseItem :name="editorT('bigscreenEditor.dynamic.scatterNumber', { index: String(index + 1) })" expanded v-for="(item, index) in optionData.series" :key="index">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="item.type" size="small" :options="ScatterEffectTypeEnumList" :placeholder="editorT('orgManage.user.select')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="item.symbolSize" size="small" :min="1"></n-input-number>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentMarkArea')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentThickness0HidesIt')">
        <n-input-number v-model:value="item.markArea.itemStyle.borderWidth" size="small" :min="0"></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSymbol')">
        <n-select
          v-model:value="item.markArea.itemStyle.borderType"
          size="small"
          :options="axisConfig.splitLint.lineStyle.type"
          :placeholder="editorT('orgManage.user.select')"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentMarkPoint')">
      <SettingItem :name="editorT('bigscreenEditor.ui.shape')">
        <n-select v-model:value="item.markPoint.symbol" size="small" :options="SymbolEnumList" :placeholder="editorT('orgManage.user.select')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="item.markPoint.symbolSize" size="small" :min="0"></n-input-number>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { GlobalSetting, CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'
import { ScatterEffectTypeEnumList, SymbolEnumList } from '../shard'
import { axisConfig } from '@/packages/chartConfiguration/echarts/index'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType & typeof option>,
    required: true
  }
})
</script>
