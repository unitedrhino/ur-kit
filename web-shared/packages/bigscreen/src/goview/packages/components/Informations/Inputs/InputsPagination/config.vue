<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
    <collapse-item :name="editorT('bigscreenEditor.ui.componentPaginationConfiguration')" :expanded="true">
      <setting-item-box :alone="false" :name="editorT('bigscreenEditor.ui.componentPaginationSettings')">
        <setting-item  :name="editorT('bigscreenEditor.ui.componentDefaultPageNumber')" :alone="true">
          <n-input-number v-model:value="optionData.pageValue" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')"></n-input-number>
        </setting-item>
        <setting-item  :name="editorT('bigscreenEditor.ui.componentPagination')" :alone="true">
          <n-select v-model:value="optionData.pageSize" size="small"
                    :options="page" />
        </setting-item>
        <setting-item  :name="editorT('bigscreenEditor.ui.componentPageCount')" :alone="true">
          <n-input-number v-model:value="optionData.dataset" size="small" :placeholder="editorT('bigscreenEditor.ui.componentFontSize')"></n-input-number>
        </setting-item>
      </setting-item-box>
    </collapse-item>
</template>
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import {CollapseItem, SettingItem, SettingItemBox} from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const page = [
  {label:'2',value:2},
  {label:'4',value:4},
  {label:'8',value:8},
  {label:'10',value:10},
  {label:'20',value:20}
]
defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>