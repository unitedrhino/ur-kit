import { computed, type Ref } from 'vue'
import type { CreateComponentType, CreateComponentGroupType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

// 获取当前对象数据
export const useTargetData = () => {
  const chartEditStore = useChartEditStore()
  const targetData: Ref<CreateComponentType | CreateComponentGroupType> = computed(() => {
    // 隔离编辑模式：优先从当前 Group 的 groupList 中查找子元素
    const editCanvas = chartEditStore.getEditCanvas
    if (editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
      const selectId = chartEditStore.getTargetChart.selectId
      if (selectId.length === 1) {
        const id = selectId[0]
        const group = chartEditStore.componentList.find(e => e.id === editCanvas.activeGroupId) as CreateComponentGroupType | undefined
        const child = group?.groupList?.find(c => c.id === id)
        if (child) return child
      }
    }

    const list = chartEditStore.getComponentList
    const targetIndex = chartEditStore.fetchTargetIndex()
    // 配置面板组件仅在选中组件后才挂载渲染，正常路径下目标组件必在列表中；
    // 此处断言仅收窄索引访问产生的 undefined，未选中（targetIndex=-1）的异常路径行为不变
    return list[targetIndex] as CreateComponentType | CreateComponentGroupType
  })
  return { targetData, chartEditStore }
}
