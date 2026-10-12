<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <collapse-item :name="editorT('console.im.callTypeVideo')" expanded>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentSource')" alone>
      <setting-item :name="editorT('bigscreenEditor.ui.componentCustomSource')">
        <n-input v-model:value="optionData.dataset" size="small"></n-input>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('orgIotClient.console.control')">
      <setting-item>
        <n-checkbox v-model:checked="optionData.loop" size="small">{{ editorT('bigscreenEditor.ui.componentLoopPlayback') }}</n-checkbox>
      </setting-item>
      <setting-item>
        <n-checkbox v-model:checked="optionData.muted" size="small">{{ editorT('console.im.muteAction') }}</n-checkbox>
      </setting-item>
    </setting-item-box>

    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('orgManage.role.type')">
        <n-select v-model:value="optionData.fit" size="small" :options="fitList"></n-select>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

// 适应类型
const fitList = [
  {
    value: 'fill',
    label: 'fill'
  },
  {
    value: 'contain',
    label: 'contain'
  },
  {
    value: 'cover',
    label: 'cover'
  },
  {
    value: 'scale-down',
    label: 'scale-down'
  },
  {
    value: 'none',
    label: 'none'
  }
]

defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>
