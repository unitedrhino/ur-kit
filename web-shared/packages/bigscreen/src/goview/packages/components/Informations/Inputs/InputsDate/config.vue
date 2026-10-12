<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('bigscreenEditor.ui.displayMode')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.selectionMode')">
      <n-select v-model:value="optionData.isPanel" size="small" :options="panelOptions" />
    </setting-item-box>
  </collapse-item>

  <collapse-item :name="editorT('bigscreenEditor.ui.componentTimeConfiguration')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentBasic')">
      <setting-item :name="editorT('orgManage.role.type')">
        <n-select v-model:value="optionData.componentInteractEventKey" size="small" :options="datePickerTypeOptions"
                  @update:value="datePickerTypeUpdate"/>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenManagement.ui.defaultValue')">
      <setting-item :name="editorT('orgManage.role.type')">
        <n-select v-model:value="optionData.defaultType" size="small" :options="defaultTypeOptions"
                  @update:value="defaultTypeUpdate" />
      </setting-item>

    </setting-item-box>
    <setting-item-box v-if="optionData.defaultType === DefaultTypeEnum.STATIC" :alone="true">
      <setting-item :name="editorT('bigscreenEditor.ui.componentStaticDefaultValue')">
        <n-date-picker size="small" clearable v-model:value="optionData.dataset" :type="optionData.componentInteractEventKey" />
      </setting-item>
    </setting-item-box>
    <setting-item-box v-if="optionData.defaultType === DefaultTypeEnum.DYNAMIC" >
      <template #name>
        <n-text></n-text>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="21" :depth="3">
              <help-outline-icon></help-outline-icon>
            </n-icon>
          </template>
          <span>{{ editorT('bigscreenEditor.ui.componentBrowserSystemTimeWhenThePageOpensPlus') }}</span>
        </n-tooltip>
      </template>
      <setting-item :name="differValueName">
        <n-input-number v-model:value="optionData.differValue[0]" class="input-num-width" size="small">
          <template #suffix>
            {{ DifferUnitObject[optionData.differUnit[0] ?? DifferUnitEnum.DAY] }}
          </template>
        </n-input-number>
      </setting-item>
      <setting-item :name="differUnitName">
        <n-select v-model:value="optionData.differUnit[0]" size="small" :options="differUnitOptions" />
      </setting-item>
      <setting-item v-if="isRange" :name="editorT('bigscreenEditor.ui.componentDynamicEndValueOffset')">
        <n-input-number v-model:value="optionData.differValue[1]" class="input-num-width" size="small">
          <template #suffix>
            {{ DifferUnitObject[optionData.differUnit[1] ?? DifferUnitEnum.DAY] }}
          </template>
        </n-input-number>
      </setting-item>
      <setting-item v-if="isRange" :name="editorT('bigscreenEditor.ui.componentEndValueOffsetUnit')">
        <n-select v-model:value="optionData.differUnit[1]" size="small" :options="differUnitOptions" />
      </setting-item>
    </setting-item-box>

  </collapse-item>
</template>

<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { icon } from '@/plugins'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'
import { ComponentInteractEventEnum, DefaultTypeEnum, DifferUnitEnum, DifferUnitObject } from './interact'
import dayjs from "dayjs";

const { HelpOutlineIcon } = icon.ionicons5

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const panelOptions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDropdownDisplay'); },
    value: 0
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPanelDisplay'); },
    value: 1
  }
]

const datePickerTypeOptions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.fcDate'); },
    value: ComponentInteractEventEnum.DATE
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDateAndTime'); },
    value: ComponentInteractEventEnum.DATE_TIME
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.memory.dateRange'); },
    value: ComponentInteractEventEnum.DATE_RANGE
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.av.month'); },
    value: ComponentInteractEventEnum.MONTH
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentMonthRange'); },
    value: ComponentInteractEventEnum.MONTH_RANGE
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('platformManage.oem.year'); },
    value: ComponentInteractEventEnum.YEAR
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentYearRange'); },
    value: ComponentInteractEventEnum.YEAR_RANGE
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgEnergy.ui.quarter'); },
    value: ComponentInteractEventEnum.QUARTER
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentQuarterRange'); },
    value: ComponentInteractEventEnum.QUARTER_RANGE
  }
]

const defaultTypeOptions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.static'); },
    value: DefaultTypeEnum.STATIC
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDynamic'); },
    value: DefaultTypeEnum.DYNAMIC
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.card.overageNone'); },
    value: DefaultTypeEnum.NONE
  }
]


const differUnitOptions = [
  // ManipulateType
  {
    value: DifferUnitEnum.DAY,
    label: DifferUnitObject[DifferUnitEnum.DAY]
  },
  {
    value: DifferUnitEnum.WEEK,
    label: DifferUnitObject[DifferUnitEnum.WEEK]
  },
  {
    value: DifferUnitEnum.MONTH,
    label: DifferUnitObject[DifferUnitEnum.MONTH]
  },
  {
    value: DifferUnitEnum.QUARTER,
    label: DifferUnitObject[DifferUnitEnum.QUARTER]
  },
  {
    value: DifferUnitEnum.YEAR,
    label: DifferUnitObject[DifferUnitEnum.YEAR]
  },
  {
    value: DifferUnitEnum.HOUR,
    label: DifferUnitObject[DifferUnitEnum.HOUR]
  },
  {
    value: DifferUnitEnum.MINUTE,
    label: DifferUnitObject[DifferUnitEnum.MINUTE]
  },
  {
    value: DifferUnitEnum.SECOND,
    label: DifferUnitObject[DifferUnitEnum.SECOND]
  },
  {
    value: DifferUnitEnum.MILLISECOND,
    label: DifferUnitObject[DifferUnitEnum.MILLISECOND]
  }
]


const isRange = computed(() => {
  return props.optionData.componentInteractEventKey.endsWith('range')
})

const differValueName = computed(() => {
  return isRange.value ? editorT('bigscreenEditor.ui.componentDynamicStartValueOffset') : editorT('bigscreenEditor.ui.componentDynamicOffset')
})

const differUnitName = computed(() => {
  return isRange.value ? editorT('bigscreenEditor.ui.componentStartValueOffsetUnit') : editorT('bigscreenEditor.ui.componentOffsetUnit')
})

const datePickerTypeUpdate = () => {
  props.optionData.dataset = isRange.value ? [dayjs().valueOf(), dayjs().valueOf()] : dayjs().valueOf()
}

const defaultTypeUpdate = (v: string) => {
  if (v === DefaultTypeEnum.STATIC) {
    datePickerTypeUpdate()
  } else {
    // DefaultTypeEnum.
    props.optionData.dataset = null
  }
}

</script>
