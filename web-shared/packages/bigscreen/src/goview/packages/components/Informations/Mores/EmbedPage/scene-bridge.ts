/**
 * ur-scene 协议 v1：内嵌页面 postMessage 数据桥（协议常量与纯函数校验）
 *
 * 职责：
 * - 定义协议消息类型常量与 type 白名单（iframe→大屏 / 大屏→iframe 两个方向）
 * - 消息 schema 校验：畸形消息一律返回 null 由调用方丢弃，避免场景页脚本异常打穿大屏
 * - API 转发路径白名单：仅允许 /api/v1/ 前缀，凭证不出父页面（由大屏带登录态转发）
 * - origin 校验：sandbox="allow-scripts"（无 allow-same-origin）下场景页为不透明源，
 *   event.origin 恒为字符串 'null'，此时只校验消息 schema；非 null origin 必须与场景页地址同源
 *
 * 本文件不依赖 Vue/DOM 具体实现（仅使用 URL 做 origin 解析），可独立单测。
 */

import type { SceneApiRequest, SceneDataPayload, SceneInitBinding, SceneSubscribeChannel } from './types'

/** 协议消息类型常量（ur-scene 协议 v1） */
export const SCENE_MSG = {
  /** iframe→大屏：场景页加载完成，可接收绑定表 */
  READY: 'ur-scene:ready',
  /** iframe→大屏：上报可绑定锚点列表 */
  ANCHORS: 'ur-scene:anchors',
  /** 大屏→iframe：下发绑定表（锚点路径 → 设备物模型属性） */
  INIT: 'ur-scene:init',
  /** 大屏→iframe：单条实时属性值 */
  DATA: 'ur-scene:data',
  /** iframe→大屏：请求代调平台 API */
  API: 'ur-scene:api',
  /** 大屏→iframe：API 转发响应 */
  API_RES: 'ur-scene:api:res',
  /** iframe→大屏：注册实时订阅 */
  SUBSCRIBE: 'ur-scene:subscribe',
  /** 大屏→iframe：订阅频道实时消息透传 */
  WS: 'ur-scene:ws',
  /** 大屏→iframe：编辑态点位选中联动（场景页自行决定高亮表现） */
  SELECT: 'ur-scene:select'
} as const

/** iframe → 大屏方向的消息类型白名单 */
export const IFRAME_MESSAGE_TYPES: ReadonlySet<string> = new Set([
  SCENE_MSG.READY,
  SCENE_MSG.ANCHORS,
  SCENE_MSG.API,
  SCENE_MSG.SUBSCRIBE
])

/** 大屏 → iframe 方向的消息类型白名单 */
export const PARENT_MESSAGE_TYPES: ReadonlySet<string> = new Set([
  SCENE_MSG.INIT,
  SCENE_MSG.DATA,
  SCENE_MSG.API_RES,
  SCENE_MSG.WS,
  SCENE_MSG.SELECT
])

/** 场景页可订阅的实时频道白名单（最小实现：项目级属性 / 设备上下线） */
export const SUBSCRIBE_CHANNELS: ReadonlySet<string> = new Set(['prop', 'conn'])

/** 解析校验通过的 iframe→大屏消息（discriminated union） */
export type ParsedIframeMessage =
  | { type: typeof SCENE_MSG.READY }
  | { type: typeof SCENE_MSG.ANCHORS; anchors: Array<{ path: string; name: string; desc?: string }> }
  | { type: typeof SCENE_MSG.API; request: SceneApiRequest }
  | { type: typeof SCENE_MSG.SUBSCRIBE; id: string | number; channel: SceneSubscribeChannel }

/** API 转发显式黑名单：WS 建连等长连接接口不允许经 HTTP 转发 */
const API_PATH_BLOCKLIST: ReadonlySet<string> = new Set(['/api/v1/system/common/websocket/connect'])

/**
 * 判断平台 API 路径是否允许被场景页代调
 * 规则：必须 /api/v1/ 前缀、无路径穿越、不在黑名单内
 * @param path 场景页请求的路径
 */
export function isAllowedApiPath(path: unknown): path is string {
  if (typeof path !== 'string') return false
  const trimmed = path.trim()
  if (!trimmed.startsWith('/api/v1/')) return false
  if (trimmed.length > 512) return false
  // 拒绝 .. 段，防止路径穿越绕过前缀校验
  if (trimmed.split('/').some((seg) => seg === '..')) return false
  if (API_PATH_BLOCKLIST.has(trimmed)) return false
  return true
}

/**
 * 校验消息来源 origin 是否可信
 * @param origin postMessage 事件的 origin（sandbox 不透明源时为字符串 'null'）
 * @param sceneUrl 组件配置的场景页地址
 */
export function checkSceneOrigin(origin: unknown, sceneUrl: string): boolean {
  if (origin === 'null') {
    // sandbox="allow-scripts"（无 allow-same-origin）下场景页源不透明，origin 恒为 'null'，
    // 此时无法做源比对，安全性由 schema 校验 + API 白名单承担
    return true
  }
  if (typeof origin !== 'string' || !origin) return false
  try {
    return new URL(sceneUrl).origin === origin
  } catch {
    // 场景页地址非法时一律拒绝
    return false
  }
}

/** 校验单个锚点结构 */
function isSceneAnchor(value: unknown): value is { path: string; name: string; desc?: string } {
  if (!value || typeof value !== 'object') return false
  const anchor = value as Record<string, unknown>
  return typeof anchor.path === 'string' && anchor.path.length > 0 && typeof anchor.name === 'string'
}

/** 校验 API 转发请求结构（path 白名单在匹配后单独校验） */
function isSceneApiRequest(value: unknown): value is SceneApiRequest {
  if (!value || typeof value !== 'object') return false
  const req = value as Record<string, unknown>
  return (typeof req.id === 'string' || typeof req.id === 'number') && typeof req.path === 'string'
}

/** 校验订阅请求结构（频道白名单在匹配后单独校验） */
function isSceneSubscribeRequest(value: unknown): value is { id: string | number; channel: SceneSubscribeChannel } {
  if (!value || typeof value !== 'object') return false
  const req = value as Record<string, unknown>
  return (
    (typeof req.id === 'string' || typeof req.id === 'number') &&
    typeof req.channel === 'string' &&
    SUBSCRIBE_CHANNELS.has(req.channel)
  )
}

/**
 * 解析并校验 iframe→大屏的 postMessage 负载
 * type 必须在白名单内且负载符合对应 schema，否则返回 null（调用方丢弃该消息）
 * @param data postMessage 的 data（未经校验的 unknown）
 */
export function parseIframeMessage(data: unknown): ParsedIframeMessage | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const msg = data as Record<string, unknown>
  const type = msg.type
  if (typeof type !== 'string' || !IFRAME_MESSAGE_TYPES.has(type)) return null

  switch (type) {
    case SCENE_MSG.READY:
      return { type: SCENE_MSG.READY }
    case SCENE_MSG.ANCHORS: {
      if (!Array.isArray(msg.anchors) || msg.anchors.length === 0) return null
      if (!msg.anchors.every(isSceneAnchor)) return null
      // 锚点 path 去重（重复 path 的绑定会歧义）
      const paths = new Set(msg.anchors.map((a) => a.path))
      if (paths.size !== msg.anchors.length) return null
      return { type: SCENE_MSG.ANCHORS, anchors: msg.anchors }
    }
    case SCENE_MSG.API: {
      if (!isSceneApiRequest(msg)) return null
      return { type: SCENE_MSG.API, request: msg }
    }
    case SCENE_MSG.SUBSCRIBE: {
      if (!isSceneSubscribeRequest(msg)) return null
      return { type: SCENE_MSG.SUBSCRIBE, id: msg.id, channel: msg.channel }
    }
    default:
      return null
  }
}

// ── 大屏 → iframe 消息构造（附带 type 白名单校验，防内部拼包错误） ──

/** 校验 type 属于大屏→iframe 方向 */
function assertParentType(type: string): void {
  if (!PARENT_MESSAGE_TYPES.has(type)) throw new Error(`[EmbedPage] 非法下行消息类型: ${type}`)
}

/** 构造绑定表下发消息（ur-scene:init） */
export function buildInitMessage(bindings: SceneInitBinding[]) {
  assertParentType(SCENE_MSG.INIT)
  return { type: SCENE_MSG.INIT, bindings }
}

/** 构造单条实时值消息（ur-scene:data） */
export function buildDataMessage(payload: SceneDataPayload) {
  assertParentType(SCENE_MSG.DATA)
  return { type: SCENE_MSG.DATA, ...payload }
}

/** 构造 API 转发响应消息（ur-scene:api:res） */
export function buildApiResponseMessage(id: string | number, code: number, data: unknown, msg: string) {
  assertParentType(SCENE_MSG.API_RES)
  return { type: SCENE_MSG.API_RES, id, code, data, msg }
}

/** 构造订阅消息透传（ur-scene:ws） */
export function buildWsMessage(id: string | number, payload: unknown) {
  assertParentType(SCENE_MSG.WS)
  return { type: SCENE_MSG.WS, id, payload }
}

/** 构造编辑态点位选中联动消息（ur-scene:select） */
export function buildSelectMessage(path: string) {
  assertParentType(SCENE_MSG.SELECT)
  return { type: SCENE_MSG.SELECT, path }
}

/**
 * 把待 postMessage 的下行消息转换为可结构化克隆的副本。
 * 实时中枢/响应式 store 给出的 payload 可能是 Vue reactive proxy 或含特殊对象的数组，
 * 直接 postMessage 会抛 DataCloneError（发布页 ws 订阅转发曾因此静默失败）。
 * 优先 structuredClone；失败时降级 JSON 序列化拷贝（ur-scene 协议字段均为
 * string/number/bool/普通对象，JSON 丢 undefined/函数字段不影响协议语义）；
 * JSON 也失败（循环引用等）时返回原对象，保持调用方原行为不引入新异常。
 * @param message 待发送的协议消息
 */
export function toCloneableMessage<T>(message: T): T {
  try {
    return structuredClone(message)
  } catch {
    // proxy / 含不可克隆成员，走 JSON 降级
  }
  try {
    return JSON.parse(JSON.stringify(message)) as T
  } catch {
    return message
  }
}

/**
 * 把节点绑定表转换为下发给场景页的绑定表（仅保留场景页需要的字段）
 * @param bindings 当前绑定表（GlTFModel 的 NodeBinding 结构）
 */
export function toSceneInitBindings(
  bindings: Array<{ nodePath: string; productID: string; deviceName: string; dataID: string }>
): SceneInitBinding[] {
  return bindings
    .filter((b) => b.nodePath && b.productID && b.deviceName && b.dataID)
    .map((b) => ({ path: b.nodePath, productID: b.productID, deviceName: b.deviceName, identifier: b.dataID }))
}
