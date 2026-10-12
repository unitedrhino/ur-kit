<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData" :in-chart="true"></global-setting>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { GlobalSetting } from '@/components/Pages/ChartItemSetting'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true
  }
})
</script>
