<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div ref="chartRef"></div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { onMounted, type PropType, ref, toRefs, watch } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartDataFetch } from '@/hooks'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { option } from './config'
import World from './code/world/Word'
import throttle from 'lodash/throttle'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})

const chartEditStore = useChartEditStore()

const chartRef = ref<HTMLElement>()
const { w, h } = toRefs(props.chartConfig.attr)
let threeClassInstance: World

// 初始化
const init = () => {
  const dom: HTMLElement | undefined = chartRef.value
  if (dom) {
    threeClassInstance = new World({
      dom: dom,
      data: props.chartConfig.option.dataset,
      width: w.value,
      height: h.value
    })
  }
}

const updateData = (data: any) => {
  try {
    threeClassInstance.updateData(data)
  } catch (error) {
    console.log(error)
  }
}

// 改变大小
watch(
  () => [w.value, h.value],
  throttle(([newWidth], [newHeight]) => {
    threeClassInstance.updateSize(newWidth, newHeight)
  }, 100)
)

watch(
  () => props.chartConfig.option.dataset,
  (newData: any) => {
    updateData(newData)
  },
  {
    deep: false
  }
)

// DOM 渲染之后进行初始化
onMounted(() => {
  try {
    if (navigator.userAgent.indexOf('Chrome') < -1 || navigator.userAgent.indexOf('Edg') < -1) {
      window['$message'].error(editorT('bigscreenEditor.ui.componentThe3DMapComponentIsSupportedOnlyIn'))
      chartEditStore.removeComponentList(undefined, false)
      return
    }
    init()
  } catch (error) {
    console.log(error)
  }
})

useChartDataFetch(props.chartConfig, useChartEditStore, updateData)
</script>
