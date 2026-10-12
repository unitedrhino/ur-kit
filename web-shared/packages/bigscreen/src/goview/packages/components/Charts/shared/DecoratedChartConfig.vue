<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { borderTypeOptions, fontWeightOptions, titlePositionOptions } from '../../Decorates/BorderCharts/borderConstants'
import { useTargetData } from '@/views/chart/ContentConfigurations/components/hooks/useTargetData.hook'
import { resolveRawChartConfigComponent } from './chartComponentRegistry'
import {
  DEFAULT_BORDER_KEY,
  createBorderContainerOption,
  createDefaultBorderTitleOption,
  ensureDecoratedChartOptionDefaults,
  resolveDecoratedChartTitleHeight,
} from './decoratedChartOptions'

const props = defineProps({
  optionData: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

const { targetData } = useTargetData()

ensureDecoratedChartOptionDefaults(props.optionData)

const configComponent = computed(() => {
  return resolveRawChartConfigComponent(targetData.value?.chartConfig?.key)
})

const currentComponent = computed(() => {
  return targetData.value?.attr || { w: 0, h: 0 }
})

const containerTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.card.overageNone'); }, value: 'none' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBorderContainer'); }, value: 'border' },
]

const isBorder04 = computed(() => props.optionData.borderKey === 'Border04')
const currentBorderOption = computed(() => props.optionData.borderOption || {})

const ensureTitleOptionRef = () => {
  props.optionData.borderOption = props.optionData.borderOption || {}
  const borderOption = props.optionData.borderOption

  if (!borderOption.borderTitle || typeof borderOption.borderTitle !== 'object') {
    borderOption.borderTitle = createDefaultBorderTitleOption()
    return borderOption.borderTitle
  }

  const titleRef = borderOption.borderTitle as Record<string, any>
  const defaultTitleOption = createDefaultBorderTitleOption()

  for (const key in defaultTitleOption) {
    if (titleRef[key] === undefined) {
      titleRef[key] = defaultTitleOption[key as keyof typeof defaultTitleOption]
    }
  }

  return titleRef
}

const titleOption = computed({
  get: () => {
    return ensureTitleOptionRef()
  },
  set: (value) => {
    props.optionData.borderOption = props.optionData.borderOption || {}
    props.optionData.borderOption.borderTitle = value
  },
})

const contentScale = computed(() => {
  const { w, h } = currentComponent.value
  const pad = props.optionData.padding || 0
  const titleHeight = resolveDecoratedChartTitleHeight(
    props.optionData,
    isBorder04.value ? null : titleOption.value,
  )
  const scaleW = w > 0 ? (w - pad * 2) / w : 1
  const scaleH = h > 0 ? (h - pad * 2 - titleHeight) / h : 1
  return Math.min(scaleW, scaleH, 1)
})

const isOverScaled = computed(() => contentScale.value < 0.8)

const onContainerTypeChange = (value: string) => {
  props.optionData.containerType = value

  if (value === 'border') {
    const existingTitle = props.optionData.borderOption?.borderTitle
    props.optionData.borderKey = props.optionData.borderKey || DEFAULT_BORDER_KEY
    props.optionData.borderOption = createBorderContainerOption(props.optionData.borderKey, existingTitle)
    return
  }

  props.optionData.borderKey = undefined
  props.optionData.borderOption = {}
}

const onBorderTypeChange = (newKey: string) => {
  const existingTitle = props.optionData.borderOption?.borderTitle
  props.optionData.borderKey = newKey
  props.optionData.borderOption = createBorderContainerOption(newKey, existingTitle)
}
</script>

<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.container')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentContainerType')">
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select
          v-model:value="optionData.containerType"
          size="small"
          :options="containerTypeOptions"
          @update:value="onContainerTypeChange"
        />
      </SettingItem>
    </SettingItemBox>

    <template v-if="optionData.containerType === 'border'">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBorderStyle')">
        <SettingItem :name="editorT('orgManage.role.type')">
          <n-select
            v-model:value="optionData.borderKey"
            size="small"
            :options="borderTypeOptions"
            @update:value="onBorderTypeChange"
          />
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPaddingPx')">
        <SettingItem>
          <n-slider
            v-model:value="optionData.padding"
            :min="0"
            :max="40"
            :step="2"
          />
        </SettingItem>
        <SettingItem>
          <n-input-number
            v-model:value="optionData.padding"
            size="small"
            :min="0"
            :max="40"
          />
        </SettingItem>
        <n-alert v-if="isOverScaled" type="warning" style="margin-top: 8px">
          {{ editorT('bigscreenEditor.ui.componentTheContentIsScaledTooMuchReduceThe') }}
        </n-alert>
      </SettingItemBox>

      <SettingItemBox
        v-for="(color, idx) in currentBorderOption.colors"
        :key="idx"
        :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(idx + 1) })"
      >
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker
            v-model:value="optionData.borderOption.colors[idx]"
            size="small"
            :modes="['hex']"
          />
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox v-if="currentBorderOption.dur !== undefined" :name="editorT('bigscreenEditor.ui.componentAnimationSpeedS')">
        <SettingItem>
          <n-input-number
            v-model:value="optionData.borderOption.dur"
            size="small"
            :step="0.5"
            :min="0.5"
          />
        </SettingItem>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBackgroundColor')">
        <SettingItem>
          <n-color-picker
            v-model:value="optionData.borderOption.backgroundColor"
            size="small"
            :modes="['hex']"
          />
        </SettingItem>
      </SettingItemBox>

      <CollapseItem v-if="!isBorder04" :name="editorT('orgManage.approve.colTitle')" :expanded="false">
        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentBasic')">
          <SettingItem>
            <n-space>
              <n-switch v-model:value="titleOption.show" size="small" />
              <n-text>{{ editorT('bigscreenEditor.ui.componentShowTitle') }}</n-text>
            </n-space>
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleText')">
            <n-input v-model:value="titleOption.text" size="small" :placeholder="editorT('orgPark.ui.enterTitle')" />
          </SettingItem>
          <SettingItem :name="editorT('iotApp.devicePage.location')">
            <n-select
              v-model:value="titleOption.position"
              size="small"
              :options="titlePositionOptions"
            />
          </SettingItem>
        </SettingItemBox>

        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTextStyle')">
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
            <n-input-number
              v-model:value="titleOption.fontSize"
              size="small"
              :min="12"
              :max="36"
              :step="1"
            />
          </SettingItem>
          <SettingItem :name="editorT('orgManage.flow.fwColor')">
            <n-color-picker
              v-model:value="titleOption.fontColor"
              size="small"
              :modes="['hex']"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontWeight2')">
            <n-select
              v-model:value="titleOption.fontWeight"
              size="small"
              :options="fontWeightOptions"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
            <n-input-number
              v-model:value="titleOption.letterSpacing"
              size="small"
              :min="0"
              :max="10"
              :step="0.5"
            />
          </SettingItem>
        </SettingItemBox>

        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPositionAdjustment')">
          <SettingItem :name="editorT('bigscreenEditor.ui.componentDistanceFromTopPx')">
            <n-input-number
              v-model:value="titleOption.top"
              size="small"
              :min="0"
              :max="100"
              :step="1"
            />
          </SettingItem>
          <SettingItem v-if="titleOption.position !== 'center'" :name="editorT('bigscreenEditor.ui.componentMarginPx')">
            <n-input-number
              v-model:value="titleOption.sideOffset"
              size="small"
              :min="0"
              :max="100"
              :step="1"
            />
          </SettingItem>
        </SettingItemBox>
      </CollapseItem>

      <template v-if="isBorder04">
        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTitleText')">
          <SettingItem>
            <n-input
              v-model:value="optionData.borderOption.borderTitle"
              size="small"
              :placeholder="editorT('orgPark.ui.enterTitle')"
            />
          </SettingItem>
        </SettingItemBox>

        <SettingItemBox :name="editorT('bigscreenEditor.ui.componentTitleStyle')">
          <SettingItem :name="editorT('orgManage.flow.fwColor')">
            <n-color-picker
              v-model:value="optionData.borderOption.borderTitleColor"
              size="small"
              :modes="['hex']"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize2')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleSize"
              size="small"
              :min="12"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleHeight')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleHeight"
              size="small"
              :min="24"
            />
          </SettingItem>
          <SettingItem :name="editorT('bigscreenEditor.ui.componentTitleWidth')">
            <n-input-number
              v-model:value="optionData.borderOption.borderTitleWidth"
              size="small"
              :min="50"
              :step="10"
            />
          </SettingItem>
        </SettingItemBox>
      </template>
    </template>
  </CollapseItem>

  <component v-if="configComponent" :is="configComponent" :option-data="optionData" />
</template>
