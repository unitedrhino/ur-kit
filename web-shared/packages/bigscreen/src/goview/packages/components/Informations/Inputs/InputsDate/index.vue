<template>
  <n-date-picker
    v-model:value="option.dataset"
    clearable
    :panel="!!chartConfig.option.isPanel"
    :type="chartConfig.option.componentInteractEventKey"
    :style="`width:${w}px;`"
    @update:value="onChange"
  />
</template>

<script setup lang="ts">
import { computed, type PropType, ref, shallowReactive, toRefs, watch } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartInteract } from '@/hooks'
import { InteractEventOn } from '@/enums/eventEnum'
import {ComponentInteractEventEnum, ComponentInteractParamsEnum, DefaultTypeEnum} from './interact'
import dayjs, { type ManipulateType } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear';


const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { w, h } = toRefs(props.chartConfig.attr)
const rangeDate = ref<number | number[]>()

const option = shallowReactive({
  dataset: props.chartConfig.option.dataset
})

const isRange = computed(() => {
  return props.chartConfig.option.componentInteractEventKey.endsWith('range')
})

// 监听事件改变
const onChange = (v: number | number[] | null) => {
  if (isRange.value) {
    let dateStart: number | null = null
    let dateEnd: number | null = null
    let daterange: string | null = null
    if(v instanceof Array){
      // 数组元素缺失时兜底 null 表示无值
      dateStart = v[0] ?? null
      dateEnd = v[1] ?? null
      daterange = `${v[0]}-${v[1]}`
    }
    // 存储到联动数据
    useChartInteract(
        props.chartConfig,
        useChartEditStore,
        {
          [ComponentInteractParamsEnum.DATE_START]: dateStart,
          [ComponentInteractParamsEnum.DATE_END]: dateEnd,
          [ComponentInteractParamsEnum.DATE_RANGE]: daterange
        },
        InteractEventOn.CHANGE
    )
  } else {
    // 存储到联动数据
    useChartInteract(
        props.chartConfig,
        useChartEditStore,
        { [ComponentInteractParamsEnum.DATE]: v },
        InteractEventOn.CHANGE
    )
  }
}

const getDiffDate = (type: ComponentInteractEventEnum, date: dayjs.Dayjs) => {
  // 注册 quarterOfYear 插件
  dayjs.extend(quarterOfYear)
  switch (type) {
    case ComponentInteractEventEnum.DATE:
    case ComponentInteractEventEnum.DATE_RANGE:
      date = date.startOf('day')
      break
    case ComponentInteractEventEnum.MONTH:
    case ComponentInteractEventEnum.MONTH_RANGE:
      date = date.startOf('month')
      break
    case ComponentInteractEventEnum.YEAR:
    case ComponentInteractEventEnum.YEAR_RANGE:
      date = date.startOf('year')
        break
    case ComponentInteractEventEnum.QUARTER:
    case ComponentInteractEventEnum.QUARTER_RANGE:
      date = date.startOf('quarter')
      break
    default:
      break
  }
  return date
}

watch(
    () => {
      return {
        type: props.chartConfig.option.componentInteractEventKey as ComponentInteractEventEnum,
        defaultType: props.chartConfig.option.defaultType as string,
        differValue: props.chartConfig.option.differValue as number[],
        differUnit: props.chartConfig.option.differUnit as ManipulateType[],
        dataset: props.chartConfig.option.dataset as number | number[] | null,
      };
    },
    (newData, oldData) => {
      const hasTypeChanged = newData.type !== oldData?.type;
      const hasDefaultTypeChanged = newData.defaultType !== oldData?.defaultType;
      const hasDifferValueChanged = newData.differValue !== oldData?.differValue;
      const hasDifferUnitChanged = newData.differUnit !== oldData?.differUnit;

      if (hasTypeChanged || hasDefaultTypeChanged || hasDifferValueChanged || hasDifferUnitChanged) {
        if (newData.defaultType === DefaultTypeEnum.NONE) {
          props.chartConfig.option.dataset = null;
        } else if (newData.defaultType === DefaultTypeEnum.DYNAMIC) {
          let date = dayjs();
          if (isRange.value) {
            props.chartConfig.option.dataset = [
             // differValue/differUnit 元素缺失时兜底 0，偏移量按原值处理
             getDiffDate(newData.type,date.add(newData.differValue[0] ?? 0, newData.differUnit[0])).valueOf(),
             getDiffDate(newData.type,date.add(newData.differValue[1] ?? 0, newData.differUnit[1])).valueOf(),
            ];
          } else {
            props.chartConfig.option.dataset = getDiffDate(newData.type,date.add(newData.differValue[0] ?? 0, newData.differUnit[0])).valueOf()
          }
        }
      }
      option.dataset = props.chartConfig.option.dataset;
      onChange(option.dataset);
    },
    {
      immediate: true,
    }
);
</script>

<style lang="scss" scoped>
@include deep() {
  .n-input {
    height: v-bind('h + "px"');
    display: flex;
    align-items: center;
  }
}
</style>
