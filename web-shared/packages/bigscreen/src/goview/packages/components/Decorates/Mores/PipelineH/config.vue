<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentPipe')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentDefaultColor')">
      <SettingItem>
        <n-select v-model:value="optionData.color_type" :options="colorOptions" @update:value="handleColorChange" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentPipeColor')">
      <SettingItem>
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.o_color"></n-color-picker>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentWaterFlowColor')">
      <SettingItem>
        <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.i_color"></n-color-picker>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFlowDirection')">
      <SettingItem>
        <n-select v-model:value="optionData.line_class" :options="options" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, ref } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { option } from './config'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const options = ref([
  {
    value: 'svg_ani_flow',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentForwardDirection'); }
  },
  {
    value: 'svg_ani_flow_back',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.reverseDirection'); }
  },
  {
    value: 'svg_ani_flow_stop',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.cloneGroup.stopAction'); }
  }
])

const colorOptions = ref([
  {
    value: 1,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBlue'); }
  },
  {
    value: 2,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentYellow'); }
  }
])

// 默认颜色
const handleColorChange = (e: number) => {
  switch (e) {
    case 1:
      props.optionData.o_color = '#0a7ae2'
      props.optionData.i_color = '#119bfa'
      break
    case 2:
      props.optionData.o_color = '#ff9d00'
      props.optionData.i_color = '#f7ea37'
      break
  }
}
</script>
