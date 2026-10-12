<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div>
    <n-input :style="`width:${w}px;`" type="text"
             v-model:value="option.value.dataset"
             :placeholder="editorT('orgManage.common.phInput')"
             @change="onChange">

    </n-input>
  </div>
</template>

<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, toRefs, shallowReactive, watch } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartInteract } from '@/hooks'
import { InteractEventOn } from '@/enums/eventEnum'
import { ComponentInteractParamsEnum } from './interact'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { w, h } = toRefs(props.chartConfig.attr)
const option = shallowReactive({
  value: {
    inputValue: props.chartConfig.option.inputValue,
    dataset: props.chartConfig.option.dataset
  }
})

const onChange = (v: string) => {
  if(v == undefined) return;
  // 存储到联动数据
  useChartInteract(
      props.chartConfig,
      useChartEditStore,
      { [ComponentInteractParamsEnum.DATA]: v },
      InteractEventOn.CHANGE
  )
}

// 手动更新
watch(
    () => props.chartConfig.option,
    (newData: any) => {
      option.value = newData
      onChange(newData.inputValue)
    },
    {
      immediate: true,
      deep: true
    }
)

</script>





