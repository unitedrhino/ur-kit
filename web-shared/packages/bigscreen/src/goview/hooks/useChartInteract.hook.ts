import { toRefs } from 'vue'
import { isPreview } from '@/utils'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

// 获取类型
type ChartEditStoreType = typeof useChartEditStore

// Params 参数修改触发 api 更新图表请求
export const useChartInteract = (
  chartConfig: CreateComponentType,
  useChartEditStore: ChartEditStoreType,
  param: { [T: string]: any },
  interactEventOn: string
) => {
  if (!isPreview()) return
  const chartEditStore = useChartEditStore()
  const { interactEvents } = chartConfig.events
  const fnOnEvent = interactEvents.filter(item => {
    return item.interactOn === interactEventOn
  })

  if (fnOnEvent.length === 0) return
  fnOnEvent.forEach(item => {

    const globalConfigPindAprndex = chartEditStore.requestGlobalConfig.requestDataPond.findIndex(cItem =>
      cItem.dataPondId === item.interactComponentId
    )
    if (globalConfigPindAprndex !== -1) {
      const pondItem = chartEditStore.requestGlobalConfig.requestDataPond[globalConfigPindAprndex]
      // 数据池条目缺失时跳过本次联动，避免索引访问 undefined 导致渲染中断
      if (!pondItem) return
      const { Params, Header } = toRefs(pondItem.dataPondRequestConfig.requestParams)

      Object.keys(item.interactFn).forEach(key => {
        const interactKey = item.interactFn[key]
        // 联动字段映射为空时跳过，避免以 undefined 作为参数索引
        if (!interactKey) return
        if (key in Params.value) {
          Params.value[key] = param[interactKey]
        }
        if (key in Header.value) {
          Header.value[key] = param[interactKey]
        }
      })
    } else {
      const index = chartEditStore.fetchTargetIndex(item.interactComponentId)
      if (index === -1) return
      const targetComponent = chartEditStore.componentList[index]
      // 联动目标组件可能已被删除，缺失时跳过本次联动
      if (!targetComponent) return
      const { Params, Header } = toRefs(targetComponent.request.requestParams)

      Object.keys(item.interactFn).forEach(key => {
        const interactKey = item.interactFn[key]
        // 联动字段映射为空时跳过，避免以 undefined 作为参数索引
        if (!interactKey) return
        if (key in Params.value) {
          Params.value[key] = param[interactKey]
        }
        if (key in Header.value) {
          Header.value[key] = param[interactKey]
        }
      })
    }
  })
}
// 联动事件触发的 type 变更时，清除当前绑定内容
export const clearInteractEvent = (chartConfig: CreateComponentType) => {

}
