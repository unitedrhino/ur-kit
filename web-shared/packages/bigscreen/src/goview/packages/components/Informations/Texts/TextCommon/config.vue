<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('iotApp.devicePage.logInfo')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.session.chText')" :alone="true">
      <setting-item>
        <n-input v-model:value="optionData.dataset" type="textarea" size="small"></n-input>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentLink')" :alone="true">
      <setting-item>
        <n-input-group>
          <n-select
            v-model:value="optionData.linkHead"
            size="small"
            :style="{ width: '80%' }"
            :options="linkHeadOptions"
          />
          <n-input v-model:value="optionData.link" size="small"></n-input>
          <n-button :disabled="!optionData.link" secondary size="small" @click="handleLinkClick">{{ editorT('bigscreenEditor.ui.componentNavigate') }}</n-button>
        </n-input-group>
      </setting-item>
    </setting-item-box>
  </collapse-item>

  <!-- ── 数值格式 ── -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentValueFormat')" :expanded="false">
    <setting-item-box :name="editorT('orgManage.common.enabled')">
      <n-switch v-model:value="optionData.format.enabled" size="small" />
    </setting-item-box>

    <template v-if="optionData.format.enabled">
      <setting-item-box :name="editorT('bigscreenEditor.ui.componentPrefix')">
        <setting-item>
          <n-input
            v-model:value="optionData.format.prefix"
            :placeholder="editorT('bigscreenEditor.ui.componentEGTemperature')"
            size="small"
          />
        </setting-item>
      </setting-item-box>
      <setting-item-box :name="editorT('bigscreenEditor.ui.componentSuffix')">
        <setting-item>
          <n-input
            v-model:value="optionData.format.suffix"
            :placeholder="editorT('bigscreenEditor.ui.componentEG')"
            size="small"
          />
        </setting-item>
        <n-text
          v-if="optionData.format.autoUnit"
          depth="3"
          style="font-size: 12px"
        >
          {{ editorT('bigscreenEditor.ui.componentDetectedUnit') }}{{ optionData.format.autoUnit }}
        </n-text>
      </setting-item-box>
      <setting-item-box :name="editorT('bigscreenEditor.ui.componentDecimalPlaces2')">
        <setting-item>
          <n-input-number
            v-model:value="optionData.format.decimals"
            :min="-1"
            :max="10"
            size="small"
          />
        </setting-item>
        <n-text depth="3" style="font-size: 12px">{{ editorT('bigscreenEditor.ui.component1DisablesProcessing') }}</n-text>
      </setting-item-box>
    </template>
  </collapse-item>

  <!-- ── 条件样式 ── -->
  <collapse-item :name="editorT('bigscreenEditor.ui.componentConditionalStyles')" :expanded="false">
    <setting-item-box :name="editorT('orgManage.common.enabled')">
      <n-switch v-model:value="optionData.conditionalStyles.enabled" size="small" />
    </setting-item-box>

    <template v-if="optionData.conditionalStyles.enabled">
      <!-- 规则列表 -->
      <div
        v-for="(rule, index) in optionData.conditionalStyles.rules"
        :key="rule.id"
        style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; padding: 0 12px;"
      >
        <n-select
          v-model:value="rule.operator"
          :options="operatorOptions"
          size="small"
          style="width: 70px"
        />
        <n-input-number
          v-model:value="rule.value"
          size="small"
          style="width: 80px"
        />
        <n-color-picker
          v-model:value="rule.color"
          size="small"
          :show-alpha="false"
          :swatches="['#00ff00', '#ffff00', '#ff0000', '#999999']"
          style="width: 60px"
        />
        <n-button
          size="tiny"
          quaternary
          @click="optionData.conditionalStyles.rules.splice(index, 1)"
        >
          ×
        </n-button>
      </div>

      <!-- 添加规则 -->
      <div style="padding: 0 12px;">
        <n-button
          size="small"
          dashed
          block
          @click="addRule"
        >
          {{ editorT('orgManage.cloneGroup.addRule') }}
        </n-button>
      </div>

      <!-- 默认颜色说明 -->
      <n-text depth="3" style="font-size: 12px; padding: 4px 12px; display: block">
        {{ editorT('bigscreenEditor.ui.componentWhenNoRuleMatchesUseTheTextColor') }}
      </n-text>
    </template>
  </collapse-item>

  <collapse-item :name="editorT('bigscreenEditor.ui.componentStyle')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.session.chText')">
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.fontColor"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="optionData.fontSize" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentFontWeight')">
        <n-select v-model:value="optionData.fontWeight" size="small" :options="fontWeightOptions" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentXAxisPadding')">
        <n-input-number v-model:value="optionData.paddingX" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterPadding')"></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentYAxisPadding')">
        <n-input-number v-model:value="optionData.paddingY" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterPadding')"></n-input-number>
      </setting-item>

      <setting-item :name="editorT('bigscreenEditor.ui.componentHorizontalAlignment')">
        <n-select v-model:value="optionData.textAlign" size="small" :options="textAlignOptions" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTextDirection')">
        <n-select v-model:value="optionData.writingMode" size="small" :options="verticalOptions" />
      </setting-item>

      <setting-item :name="editorT('bigscreenEditor.ui.componentLetterSpacing2')">
        <n-input-number v-model:value="optionData.letterSpacing" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterLetterSpacing')"></n-input-number>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentBorder')">
      <setting-item :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number
          v-model:value="optionData.borderWidth"
          size="small"
          :min="0"
          :placeholder="editorT('bigscreenEditor.ui.width2')"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.borderColor"></n-color-picker>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentRoundedCorners')">
        <n-input-number
          v-model:value="optionData.borderRadius"
          size="small"
          :min="0"
          :placeholder="editorT('bigscreenEditor.ui.componentRoundedCorners')"
        ></n-input-number>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.background')" :alone="true">
      <setting-item :name="editorT('bigscreenEditor.ui.backgroundColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.backgroundColor"></n-color-picker>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option, WritingModeEnum, WritingModeObject, FontWeightEnum, FontWeightObject } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { getUUID } from '@/utils'
const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const textAlignOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAlignLeft'); }, value: 'start' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentCenter'); }, value: 'center' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAlignRight'); }, value: 'end' }
]

const verticalOptions = [
  {
    label: WritingModeEnum.HORIZONTAL,
    value: WritingModeObject[WritingModeEnum.HORIZONTAL]
  },
  {
    label: WritingModeEnum.VERTICAL,
    value: WritingModeObject[WritingModeEnum.VERTICAL]
  }
]
const fontWeightOptions = [
  {
    label: FontWeightEnum.NORMAL,
    value: FontWeightObject[FontWeightEnum.NORMAL]
  },
  {
    label: FontWeightEnum.BOLD,
    value: FontWeightObject[FontWeightEnum.BOLD]
  }
]
const handleLinkClick = () => {
  window.open(props.optionData.linkHead + props.optionData.link)
}
const linkHeadOptions = [
  { label: 'http://', value: 'http://' },
  { label: 'https://', value: 'https://' }
]

const operatorOptions = [
  { label: '>', value: 'gt' },
  { label: '<', value: 'lt' },
  { label: '≥', value: 'gte' },
  { label: '≤', value: 'lte' },
  { label: '=', value: 'eq' },
]

const addRule = () => {
  props.optionData.conditionalStyles.rules.push({
    id: getUUID(),
    operator: 'gt',
    value: 0,
    color: '#ff0000',
  })
}
</script>
