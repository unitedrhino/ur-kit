<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <DecoratedTableContainerConfig :option-data="optionData as any" />

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentTableSettings')" :expanded="true">
    <n-tag type="primary">{{ editorT('bigscreenEditor.ui.componentIfChangesAreNotVisibleCheckThePreview') }}</n-tag>

    <SettingItemBox :alone="true" :name="editorT('bigscreenEditor.ui.componentAlignment')">
      <SettingItem :alone="true">
        <n-select
          v-model:value="optionData.align"
          size="small"
          :options="[
            { label: editorT('bigscreenEditor.ui.componentToTheLeft'), value: 'left' },
            { label: editorT('bigscreenEditor.ui.componentCenter'), value: 'center' },
            { label: editorT('bigscreenEditor.ui.componentToTheRight'), value: 'right' }
          ]"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :alone="false" :name="editorT('bigscreenEditor.ui.componentPaginationSettings')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDefaultPageNumber')" :alone="true">
        <n-input-number v-model:value="optionData.pagination.page" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentPagination')" :alone="true">
        <n-select v-model:value="optionData.pagination.pageSize" size="small" :options="page" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :alone="true" :name="editorT('bigscreenEditor.ui.componentTableData')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentHeaderName')" class="form_name" :alone="true">
        <div style="width: 260px">
          <n-input v-model:value="header" size="small" :placeholder="editorT('bigscreenEditor.ui.componentHeaderDataCommaSeparated')" />
        </div>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')" class="form_name" :alone="true">
        <div style="width: 120px">
          <n-input-number v-model:value="optionData.displayDecimals" :min="0" size="small" :placeholder="editorT('bigscreenEditor.ui.componentDecimalPlaces')" />
        </div>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :alone="false" :name="editorT('bigscreenEditor.ui.componentTableStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShowBorder')" :alone="true">
        <n-select v-model:value="(optionData as any).style.border" size="small" :options="borderFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBottomBorder')" :alone="true">
        <n-select v-model:value="(optionData as any).style.bottomBordered" size="small" :options="bottomBorderedFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentColumnDivider')" :alone="true">
        <n-select v-model:value="(optionData as any).style.singleLine" size="small" :options="columnFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRowDivider')" :alone="true">
        <n-select v-model:value="(optionData as any).style.singleColumn" size="small" :options="lineFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentZebraStripes')" :alone="true">
        <n-select v-model:value="(optionData as any).style.striped" size="small" :options="stripedFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')" :alone="true">
        <n-input-number v-model:value="optionData.style.fontSize" :min="12" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderWidth')" :alone="true">
        <n-input-number v-model:value="optionData.style.borderWidth" :min="0" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderColor2')" :alone="true">
        <n-color-picker size="small" :modes="['rgb']" v-model:value="optionData.style.borderColor" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderStyle')" :alone="true">
        <n-select v-model:value="optionData.style.borderStyle" size="small" :options="borderStyleFlag" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTableSearchStaticFrontendSearch')" :alone="true">
        <n-select v-model:value="optionData.inputShow" size="small" :options="inputSelect" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'

import { computed, watch } from 'vue'

import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'

import DecoratedTableContainerConfig from '../../shared/DecoratedTableContainerConfig.vue'
import { option } from './config'

const page = [
  { label: '2', value: 2 },
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '30', value: 30 },
]
const borderFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); }, value: 'on' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHide'); }, value: 'off' },
]
const columnFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); }, value: 'off' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHide'); }, value: 'on' },
]
const lineFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); }, value: 'off' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHide'); }, value: 'on' },
]
const bottomBorderedFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); }, value: 'on' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHide'); }, value: 'off' },
]
const stripedFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.menuManage.shown'); }, value: 'on' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHide'); }, value: 'off' },
]
const borderStyleFlag = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSolidLineBorder'); }, value: 'solid' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDashedBorder'); }, value: 'dashed' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDottedBorder'); }, value: 'dotted' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDoubleLineBorder'); }, value: 'double' },
]
const inputSelect = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.defStopped'); }, value: 'none' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.common.enabled'); }, value: 'flex' },
]

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
})

const header = computed({
  get: () => (props.optionData.dataset?.dimensions ?? []).map((item) => item.title).toString(),
  set: (value: string) => {
    const dataset = props.optionData.dataset
    // dataset 缺失（异常数据）时跳过写入
    if (!dataset) return
    const titles = value.split(',')
    titles.forEach((item: string, index: number) => {
      const dimension = dataset.dimensions[index]
      // 索引有效时才写入标题
      if (dimension) {
        dimension.title = item
      }
    })
  },
})

watch(
  () => props.optionData.dataset?.dimensions?.map((item) => `${item.key}:${item.title}`).join('|'),
  () => {
  },
  {
    immediate: true,
  },
)
</script>
