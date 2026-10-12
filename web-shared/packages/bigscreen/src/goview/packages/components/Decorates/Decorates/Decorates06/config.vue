<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('iotApp.deviceDetail.content')" expanded>
    <SettingItemBox :name="editorT('orgManage.session.chText')" alone>
      <SettingItem>
        <n-input v-model:value="optionData.dataset" size="small"></n-input>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.textColor"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="optionData.textSize" size="small" :min="12"></n-input-number>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem :name="editorT('bigscreenEditor.ui.componentStyle')" expanded>
    <SettingItemBox :name="editorT('bigscreenEditor.dynamic.colorNumber', { index: String(index + 1) })" v-for="(item, index) in optionData.colors" :key="index">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.colors[index]"></n-color-picker>
      </SettingItem>
      <SettingItem>
        <!-- 兜底：默认色缺失时置为空串，避免把 undefined 写入颜色数组 -->
        <n-button size="small" @click="optionData.colors[index] = option.colors[index] ?? ''"> {{ editorT('iotApp.cardSetting.resetDefault') }} </n-button>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})
</script>
