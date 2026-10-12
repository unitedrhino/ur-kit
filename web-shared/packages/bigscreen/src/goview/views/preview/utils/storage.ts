import { getSessionStorage } from '@/utils'
import { StorageEnum } from '@/enums/storageEnum'
import type { ChartEditStorage } from '@/store/modules/chartEditStore/chartEditStore.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import router from '@/router'

export interface ChartEditStorageType extends ChartEditStorage {
  id: string
}

// 根据路由 id 获取存储数据的信息
export const getSessionStorageInfo = () => {
  const chartEditStore = useChartEditStore()
  const routeID = router.currentRoute.value.params?.id
  const id = typeof routeID === 'string'
    ? routeID
    : Array.isArray(routeID) && routeID[0]
      ? routeID[0]
      : document.location.hash.split('/').pop() || ''

  // 优先从 window.parent 全局 Map 读取封面截图传递的预览数据（无容量限制）
  try {
    const parentMap = (window.parent as any)?.__COVER_PREVIEW_DATA__ as
      | Map<string, Record<string, any>>
      | undefined
    if (parentMap) {
      const coverData = parentMap.get(decodeURIComponent(id))
      if (coverData) {
        const { editCanvasConfig, requestGlobalConfig, componentList } = coverData
        if (editCanvasConfig && componentList) {
          chartEditStore.editCanvasConfig = editCanvasConfig
          if (requestGlobalConfig) chartEditStore.requestGlobalConfig = requestGlobalConfig
          chartEditStore.componentList = componentList
          return coverData as ChartEditStorageType
        }
      }
    }
  } catch { /* 跨域或安全限制时忽略 */ }

  // 回退：从 localStorage 读取预览按钮写入的最新编辑数据
  // 预览按钮每次点击都会写入最新状态，必须优先读它，否则 sessionStorage 中的旧保存数据会覆盖未保存的修改
  try {
    const raw = localStorage.getItem(`GO_PREVIEW_DATA_${decodeURIComponent(id)}`)
    if (raw) {
      const info: ChartEditStorageType = JSON.parse(raw)
      const { editCanvasConfig, requestGlobalConfig, componentList } = info
      if (editCanvasConfig && componentList) {
        chartEditStore.editCanvasConfig = editCanvasConfig
        if (requestGlobalConfig) chartEditStore.requestGlobalConfig = requestGlobalConfig
        chartEditStore.componentList = componentList
        return info
      }
    }
  } catch { /* ignore */ }

  // 回退：从 sessionStorage 读取（刷新预览页时无 localStorage 数据的场景）
  const storageList: ChartEditStorageType[] = getSessionStorage(
    StorageEnum.GO_CHART_STORAGE_LIST
  )

  if (storageList) {
    for (const storageItem of storageList) {
      if (id.toString() === storageItem['id']) {
        const { editCanvasConfig, requestGlobalConfig, componentList } = storageItem
        chartEditStore.editCanvasConfig = editCanvasConfig
        if (requestGlobalConfig) chartEditStore.requestGlobalConfig = requestGlobalConfig
        chartEditStore.componentList = componentList
        return storageItem
      }
    }
  }
}
