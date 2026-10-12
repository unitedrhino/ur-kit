<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div>
    <CollapseItem :name="editorT('bigscreenEditor.ui.componentSankeyChart')" :expanded="true">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
        <SettingItem :name="editorT('iotApp.deviceDetail.direction')">
          <n-select
            v-model:value="sankeyConfig.orient"
            size="small"
            :options="orientList"
            :placeholder="editorT('bigscreenEditor.ui.componentSelectDirection')"
          />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentHintLabel')">
          <n-select
            v-model:value="optionData.tooltip.show"
            size="small"
            :options="toolTipSwitch"
            :placeholder="editorT('bigscreenEditor.ui.componentEnabled')"
          />
        </SettingItem>
      </SettingItemBox>
    </CollapseItem>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option, orientList, toolTipSwitch } from './config'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option & GlobalThemeJsonType>,
    required: true
  }
})

const sankeyConfig = computed<typeof option.series>(() => {
  return props.optionData.series
})

</script>
