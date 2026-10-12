/**
 * 3D 模型组件数据链路
 *
 * 职责：按绑定表批量拉取设备物模型属性最新值（初值）。
 * 实时增量由 realtime 中枢（registerRealtimeInterest）推送后经 bindings.matchBindings 分发。
 */

import { getPropertyLogBatchLatest } from '@/api/thingsDevice'
import { bindingKey } from './bindings'
import type { NodeBinding } from './types'

/** 初值查询时间窗口（最新一条记录，取最近 1 小时足够覆盖） */
const LATEST_WINDOW_MS = 3600_000

/**
 * 批量拉取绑定列表对应的属性最新值
 * 接口约束：batch-get-list 每次「单 productID + 单 dataID + 多设备」，
 * 故按 (productID, dataID) 分组并行请求。
 * @param bindings 节点绑定表
 * @returns Map<bindingKey, 最新值>（未取到值的绑定不在 Map 中）
 */
export async function fetchBindingLatestValues(bindings: NodeBinding[]): Promise<Map<string, unknown>> {
  const result = new Map<string, unknown>()
  if (bindings.length === 0) return result

  // 按 (productID, dataID) 分组，组内合并设备名
  const groups = new Map<string, { productID: string; dataID: string; deviceNames: string[]; members: NodeBinding[] }>()
  for (const binding of bindings) {
    if (!binding.productID || !binding.deviceName || !binding.dataID) continue
    const groupKey = `${binding.productID}|${binding.dataID}`
    const group = groups.get(groupKey)
    if (group) {
      if (!group.deviceNames.includes(binding.deviceName)) group.deviceNames.push(binding.deviceName)
      group.members.push(binding)
    } else {
      groups.set(groupKey, {
        productID: binding.productID,
        dataID: binding.dataID,
        deviceNames: [binding.deviceName],
        members: [binding]
      })
    }
  }
  if (groups.size === 0) return result

  const endTime = Date.now()
  const startTime = endTime - LATEST_WINDOW_MS

  await Promise.all(
    Array.from(groups.values()).map(async (group) => {
      try {
        const res = await getPropertyLogBatchLatest({
          dataID: group.dataID,
          deviceNames: group.deviceNames,
          endTime,
          productID: group.productID,
          startTime
        })
        // batch 接口响应结构：{ lists: [每设备一组的记录列表] }，做宽容解析
        const rawList: any[] = (res?.data as any)?.lists?.flat?.() ?? (res?.data as any)?.list ?? []
        for (const item of rawList) {
          if (!item || typeof item !== 'object') continue
          const deviceName = item.deviceName
          const value = item.value ?? item.param
          if (deviceName === undefined || value === undefined) continue
          // 定位组内对应设备的绑定（同组绑定同 productID+dataID）
          for (const binding of group.members) {
            if (binding.deviceName === deviceName) {
              result.set(bindingKey(binding), value)
            }
          }
        }
      } catch (error) {
        // 单组失败不影响其他组；无值时节点保持默认状态
        console.error('[GlTFModel] 拉取属性最新值失败:', error)
      }
    })
  )
  return result
}
