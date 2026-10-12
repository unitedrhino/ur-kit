/** 文件说明：组件动态提示读取宿主语言，保留业务名称与参数。 */
import { $t as editorT } from '@vben/saas/locales';
/**
 * 节点绑定规则引擎（纯函数，无 three 依赖）
 *
 * 职责：
 * - 绑定 → three 节点的目标解析：nodeID 精确匹配 → nodePath 匹配 → nodeName 唯一匹配，
 *   歧义（命中多个）即放弃并提示（借鉴 Tier0 的保守策略，防止错误节点被误驱动）
 * - 实时值 → 动作评估：color 规则表 / visible 判定 / label 文本格式化
 */

import type { BindingColorRule, BindingValue, GltfNodeInfo, NodeBinding } from './types'

/** 目标解析结果 */
export interface ResolveTargetResult {
  /** 命中的节点信息（歧义或未命中时为 null） */
  node: GltfNodeInfo | null
  /** 命中方式：uuid=同会话精确匹配；path=层级路径匹配；name=唯一名称匹配 */
  matchedBy: 'uuid' | 'path' | 'name' | null
  /** 歧义/失败原因（用于提示） */
  reason?: string
}

/**
 * 解析绑定对应的模型节点
 * @param binding 节点绑定
 * @param nodes 当前模型解析出的节点快照
 */
export function resolveBindingTarget(binding: NodeBinding, nodes: GltfNodeInfo[]): ResolveTargetResult {
  // 同会话：uuid 精确匹配（最可靠）
  const byUuid = nodes.filter((n) => n.uuid && n.uuid === binding.nodeID)
  if (byUuid.length === 1) return { node: byUuid[0] ?? null, matchedBy: 'uuid' }

  // 模型重载后：按层级路径匹配
  if (binding.nodePath) {
    const byPath = nodes.filter((n) => n.path === binding.nodePath)
    if (byPath.length === 1) return { node: byPath[0] ?? null, matchedBy: 'path' }
    if (byPath.length > 1) return { node: null, matchedBy: null, reason: editorT('bigscreenEditor.dynamic.ambiguousNodePath', { path: String(binding.nodePath) }) }
  }

  // 兜底：按名称唯一匹配（重名节点直接放弃）
  if (binding.nodeName) {
    const byName = nodes.filter((n) => n.name === binding.nodeName)
    if (byName.length === 1) return { node: byName[0] ?? null, matchedBy: 'name' }
    if (byName.length > 1) return { node: null, matchedBy: null, reason: editorT('bigscreenEditor.dynamic.ambiguousNodeName', { name: String(binding.nodeName) }) }
  }

  return { node: null, matchedBy: null, reason: '未找到绑定节点（模型可能已变更）' }
}

/**
 * 评估 color 动作：按规则表顺序匹配，返回目标颜色；未命中返回 defaultColor（可为空表示保持原色）
 * @param action 绑定动作
 * @param value 属性最新值
 */
export function evaluateColor(action: NodeBinding['action'], value: unknown): string | null | undefined {
  const rules = action.colorRules ?? []
  for (const rule of rules) {
    if (matchRule(rule, value)) return rule.color
  }
  return action.defaultColor ?? null
}

/**
 * 评估 visible 动作：返回是否显示；未配置规则返回 null（保持现状）
 * @param action 绑定动作
 * @param value 属性最新值
 */
export function evaluateVisible(action: NodeBinding['action'], value: unknown): boolean | null {
  if (action.visibleMode === 'bool') {
    const trueSet = action.visibleTrueValues ?? []
    if (trueSet.length === 0) return null
    return trueSet.includes(String(value))
  }
  if (action.visibleMode === 'threshold') {
    if (action.visibleMin === undefined) return null
    const num = Number(value)
    if (Number.isNaN(num)) return false
    return num >= action.visibleMin
  }
  return null
}

/** 格式化 label 动作文本：`前缀: 值 单位` */
export function formatLabelText(action: NodeBinding['action'], binding: NodeBinding, value: unknown): string {
  const prefix = action.labelText || binding.dataName || binding.dataID
  const unit = binding.dataUnit ? ` ${binding.dataUnit}` : ''
  return `${prefix}: ${String(value)}${unit}`
}

/** 单条颜色规则匹配判断 */
function matchRule(rule: BindingColorRule, value: unknown): boolean {
  if (rule.mode === 'enum') {
    return rule.enumValue !== undefined && rule.enumValue !== '' && String(value) === rule.enumValue
  }
  const num = Number(value)
  if (Number.isNaN(num)) return false
  if (rule.min !== undefined && num < rule.min) return false
  if (rule.max !== undefined && num > rule.max) return false
  // 区间模式：min/max 均未配置视为不合法规则
  return rule.min !== undefined || rule.max !== undefined
}

/** 生成绑定唯一键：productID|deviceName|dataID（实时消息匹配与初值请求共用） */
export function bindingKey(binding: Pick<NodeBinding, 'productID' | 'deviceName' | 'dataID'>): string {
  return `${binding.productID}|${binding.deviceName}|${binding.dataID}`
}

/**
 * 把 WS 实时属性消息匹配到绑定列表
 * 兼容中枢两种负载：批量 {device, params:{id:value}} 与单属性 {device, identifier, param}
 * @param bindings 当前绑定表
 * @param msgs 微批合并后的属性消息
 */
export function matchBindings(
  bindings: NodeBinding[],
  msgs: Array<{ device?: { productID?: string; deviceName?: string }; identifier?: string; param?: unknown; params?: Record<string, unknown> }>
): BindingValue[] {
  if (bindings.length === 0) return []
  const index = new Map<string, NodeBinding[]>()
  for (const b of bindings) {
    const key = bindingKey(b)
    const list = index.get(key)
    if (list) list.push(b)
    else index.set(key, [b])
  }

  const hits: BindingValue[] = []
  for (const msg of msgs) {
    const productID = msg.device?.productID
    const deviceName = msg.device?.deviceName
    if (!productID || !deviceName) continue
    const entries: Array<[string, unknown]> =
      msg.params && typeof msg.params === 'object'
        ? Object.entries(msg.params)
        : msg.identifier
          ? [[msg.identifier, msg.param]]
          : []
    for (const [identifier, value] of entries) {
      const matched = index.get(`${productID}|${deviceName}|${identifier}`)
      if (matched) {
        for (const binding of matched) hits.push({ binding, value })
      }
    }
  }
  return hits
}
