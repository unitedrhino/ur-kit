<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <DecoratedTableContainerConfig :option-data="optionData as any" />

  <CollapseItem :name="editorT('platformManage.devops.structList')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasic')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTableRowCount')">
        <n-input-number v-model:value="optionData.rowNum" :min="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheAutomaticCalculationSetting')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentCarouselDurationS')">
        <n-input-number v-model:value="optionData.waitTime" :min="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheCarouselDuration')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentHeaderHeight')">
        <n-input-number v-model:value="optionData.headerHeight" :min="1" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheHeaderHeight')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDecimalPlaces')">
        <n-input-number v-model:value="optionData.displayDecimals" :min="0" size="small" :placeholder="editorT('bigscreenEditor.ui.componentDecimalPlaces')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShowRowNumbers')">
        <n-switch size="small" v-model:value="optionData.index" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('orgManage.agent.tabConfig')" :alone="true">
      <n-table striped size="small">
        <thead>
          <tr>
            <th>{{ editorT('bigscreenEditor.ui.componentHeaderName') }}</th>
            <th>{{ editorT('bigscreenEditor.ui.componentColumnAlignment') }}</th>
            <th>{{ editorT('bigscreenEditor.ui.componentColumnWidth') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in columnSettings" :key="item.id">
            <td>
              <n-input
                :value="item.title"
                size="small"
                :placeholder="editorT('bigscreenEditor.ui.componentEnterTheHeaderName')"
                @update:value="(value) => updateColumnTitle(item.index, value)"
              />
            </td>
            <td>
              <n-select
                :value="item.align"
                size="small"
                :options="alignOptions"
                @update:value="(value) => updateColumnAlign(item.index, value)"
              />
            </td>
            <td>
              <n-input-number
                :value="item.width"
                size="small"
                :min="1"
                :placeholder="editorT('bigscreenEditor.ui.componentAssignAutomatically')"
                style="width: 100%"
                @update:value="(value) => updateColumnWidth(item.index, value)"
              />
            </td>
          </tr>
        </tbody>
      </n-table>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentCarouselMode')">
        <n-select
          v-model:value="optionData.carousel"
          :options="[
            { label: editorT('bigscreenEditor.ui.componentSingleItemCarousel'), value: 'single' },
            { label: editorT('bigscreenEditor.ui.componentFullPageCarousel'), value: 'page' },
          ]"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentHeaderBackgroundColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.headerBGC" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentOddRowBackgroundColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.oddRowBGC" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentEvenRowBackgroundColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.evenRowBGC" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'

import { computed } from 'vue'

import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting'

import DecoratedTableContainerConfig from '../../shared/DecoratedTableContainerConfig.vue'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true,
  },
})

type AlignValue = 'center' | 'left' | 'right'
type ColumnSetting = {
  id: string
  index: number
  title: string
  align: AlignValue
  width: null | number
}

const alignOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAlignLeft'); }, value: 'left' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentCenter'); }, value: 'center' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAlignRight'); }, value: 'right' },
]

const getOptionModel = () => props.optionData as typeof option & { indexHeader?: string }

const getDataColumnCount = () => {
  const dataset = getOptionModel().dataset
  if (Array.isArray(dataset) && Array.isArray(dataset[0])) {
    return dataset[0].length
  }
  return 0
}

const columnSettings = computed<ColumnSetting[]>(() => {
  const optionModel = getOptionModel()
  const hasIndex = Boolean(optionModel.index)
  const dataColumnCount = getDataColumnCount()
  const baseHeaderCount = Array.isArray(optionModel.header) ? optionModel.header.length : 0
  const alignCount = Array.isArray(optionModel.align) ? optionModel.align.length : 0
  const widthCount = Array.isArray(optionModel.columnWidth) ? optionModel.columnWidth.length : 0
  const totalColumns = Math.max(dataColumnCount + (hasIndex ? 1 : 0), baseHeaderCount + (hasIndex ? 1 : 0), alignCount, widthCount, hasIndex ? 1 : 0)

  const headers = Array.isArray(optionModel.header) ? [...optionModel.header] : []
  const aligns = Array.isArray(optionModel.align) ? [...optionModel.align] : []
  const widths = Array.isArray(optionModel.columnWidth) ? [...optionModel.columnWidth] : []

  return Array.from({ length: totalColumns }, (_, index) => {
    const isIndexColumn = hasIndex && index === 0
    const headerIndex = hasIndex ? index - 1 : index
    const defaultTitle = isIndexColumn ? (optionModel.indexHeader || '#') : editorT('bigscreenEditor.dynamic.columnNumber', { index: String(headerIndex + 1) })
    return {
      id: `column-${index}`,
      index,
      title: isIndexColumn ? (optionModel.indexHeader || '#') : (headers[headerIndex] || defaultTitle),
      align: (aligns[index] as AlignValue) || 'left',
      width: typeof widths[index] === 'number' ? widths[index] : null,
    }
  })
})

const updateColumnTitle = (index: number, value: string) => {
  const optionModel = getOptionModel()
  const hasIndex = Boolean(optionModel.index)
  if (hasIndex && index === 0) {
    optionModel.indexHeader = value || '#'
    return
  }
  const headerIndex = hasIndex ? index - 1 : index
  const nextHeader = Array.isArray(optionModel.header) ? [...optionModel.header] : []
  nextHeader[headerIndex] = value
  optionModel.header = nextHeader
}

const updateColumnAlign = (index: number, value: AlignValue) => {
  const optionModel = getOptionModel()
  const nextAlign = Array.isArray(optionModel.align) ? [...optionModel.align] : []
  nextAlign[index] = value
  optionModel.align = nextAlign
}

const updateColumnWidth = (index: number, value: null | number) => {
  const optionModel = getOptionModel()
  const nextWidths = Array.isArray(optionModel.columnWidth) ? [...optionModel.columnWidth] : []
  if (typeof value === 'number' && Number.isFinite(value)) {
    nextWidths[index] = value
  } else {
    delete nextWidths[index]
  }
  optionModel.columnWidth = nextWidths
}
</script>
