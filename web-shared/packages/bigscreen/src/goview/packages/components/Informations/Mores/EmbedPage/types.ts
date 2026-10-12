/**
 * 内嵌页面组件（EmbedPage）类型定义
 *
 * 定义页面锚点（可绑定点位）、桥接 RPC 与 WS 订阅的数据结构。
 * 节点绑定表（NodeBinding）与点位快照直接复用 GlTFModel 的结构，
 * 保证右侧「节点数据绑定」面板（NodeBindingPanel）可零改动复用。
 */

import type { GltfNodeInfo, NodeBinding } from '@/packages/components/Decorates/Three/GlTFModel/types'

/** 场景页上报的可绑定锚点（一个锚点对应场景内一个可数据驱动的对象） */
export interface SceneAnchorInfo {
  /** 锚点唯一路径（如 factory/line1/motor1），作为绑定匹配主键 */
  path: string
  /** 锚点显示名（绑定面板树节点展示） */
  name: string
  /** 锚点业务描述（可选，首次上报时回写到 option.nodeDescs） */
  desc?: string
}

/** 大屏下发给场景页的绑定表条目（ur-scene:init 消息负载） */
export interface SceneInitBinding {
  /** 锚点路径（对应场景页上报的 anchor.path） */
  path: string
  /** 产品 ID */
  productID: string
  /** 设备名 */
  deviceName: string
  /** 物模型属性标识符 */
  identifier: string
}

/** 场景页可订阅的实时频道（最小实现仅项目级频道，经实时中枢转发） */
export type SceneSubscribeChannel = 'prop' | 'conn'

/** 场景页 → 大屏的 API 转发请求（ur-scene:api 消息负载） */
export interface SceneApiRequest {
  /** 请求关联 ID（大屏回包时原样带回，场景页据此匹配 Promise） */
  id: string | number
  /** 平台 API 路径（仅允许 /api/v1/ 前缀） */
  path: string
  /** 请求体（透传给平台 API 的 JSON body） */
  body?: unknown
}

/** 场景页锚点快照与节点绑定（复用 GlTFModel 的 GltfNodeInfo/NodeBinding 结构） */
export type { GltfNodeInfo, NodeBinding }

/** ur-scene:data 单条实时值消息负载 */
export interface SceneDataPayload {
  /** 产品 ID */
  productID: string
  /** 设备名 */
  deviceName: string
  /** 物模型属性标识符 */
  identifier: string
  /** 属性最新值（原始类型） */
  value: unknown
  /** 值时间戳（毫秒） */
  ts: number
}
