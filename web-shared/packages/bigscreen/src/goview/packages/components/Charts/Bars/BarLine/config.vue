<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"></global-setting>
  <CollapseItem
    v-for="(item, index) in seriesList"
    :key="index"
    :name="editorT('bigscreenEditor.dynamic.seriesNumber', { index: String(index + 1) })"
    :expanded="true"
  >
    <template #header>
      <n-text class="go-fs-13" depth="3">
        {{ item.type == 'bar' ? editorT('bigscreenEditor.ui.componentBarChart') : editorT('bigscreenEditor.ui.componentLineChart') }}
      </n-text>
    </template>
    <SettingItemBox :name="editorT('orgManage.role.type')">
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-select
          :value="item.type"
          size="small"
          :options="[
            { label: editorT('aiChat.ui.barChart'), value: 'bar' },
            { label: editorT('aiChat.ui.lineChart'), value: 'line' }
          ]"
          @update:value="(value: any) => {
            updateHandle(item, value)
          }"
        />
      </SettingItem>
 
    </SettingItemBox>
    <template v-if="item.itemStyle">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShape')" v-if="item.type == 'bar'">
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number
          v-model:value="item.barWidth"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number v-model:value="item.itemStyle.borderRadius" :min="0" size="small"></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLine')" v-if="item.type == 'line'">
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number
          v-model:value="item.lineStyle.width"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="item.lineStyle.type" size="small" :options="lineConf.lineStyle.type"></n-select>
      </SettingItem>
      <setting-item>
        <n-space>
          <n-switch v-model:value="item.smooth" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentCurve') }}</n-text>
        </n-space>
      </setting-item>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentSolidPoint')" v-if="item.type == 'line'">
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number
          v-model:value="item.symbolSize"
          :min="1"
          :max="100"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentCalculateAutomatically')"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <setting-item-box :name="editorT('iotApp.productPage.tags')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="item.label.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentShowLabels') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="item.label.fontSize" size="small" :min="1"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTooltipColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="item.label.color"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('iotApp.devicePage.location')">
        <n-select
          v-model:value="item.label.position"
          :options="[
            { label: editorT('bigscreenEditor.ui.top'), value: 'top' },
            { label: editorT('bigscreenEditor.ui.left'), value: 'left' },
            { label: editorT('bigscreenEditor.ui.right'), value: 'right' },
            { label: editorT('bigscreenEditor.ui.bottom'), value: 'bottom' }
          ]"
        />
      </setting-item>
    </setting-item-box>
    </template>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed, toRaw } from 'vue'
import { merge, cloneDeep } from 'lodash';

import GlobalSetting from '@/components/Pages/ChartItemSetting/GlobalSetting.vue'
import CollapseItem from '@/components/Pages/ChartItemSetting/CollapseItem.vue'
import SettingItemBox from '@/components/Pages/ChartItemSetting/SettingItemBox.vue'
import SettingItem from '@/components/Pages/ChartItemSetting/SettingItem.vue'

import { lineConf } from '@/packages/chartConfiguration/echarts'
import type { GlobalThemeJsonType } from '@/settings/chartThemes'
import { barSeriesItem, lineSeriesItem } from './config'


const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true
  }
})

const seriesList = computed(() => {
  return props.optionData.series
})

const updateHandle = (item:any, value:string) => {
  const _label = cloneDeep(toRaw(item.label))
  lineSeriesItem.label = _label
  if (value === 'line') {
    merge(item, lineSeriesItem)
  } else {
    merge(item, barSeriesItem)
  }
}
</script>
