/**
 * 内嵌页面组件协议桥单测
 *
 * 覆盖 scene-bridge.ts 纯函数：
 * - parseIframeMessage type 白名单与各消息 schema 校验（畸形消息返回 null）
 * - isAllowedApiPath API 路径白名单（/api/v1/ 前缀、路径穿越、黑名单）
 * - checkSceneOrigin origin 校验（sandbox 'null' 源、同源匹配、非法场景地址）
 * - toSceneInitBindings 绑定表裁剪（剔除缺字段绑定、字段重命名）
 * - buildXxxMessage 构造消息类型合法性（内部白名单断言）
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SCENE_MSG,
  buildApiResponseMessage,
  buildDataMessage,
  buildInitMessage,
  buildSelectMessage,
  buildWsMessage,
  checkSceneOrigin,
  isAllowedApiPath,
  parseIframeMessage,
  toCloneableMessage,
  toSceneInitBindings
} from '../scene-bridge'

describe('parseIframeMessage 白名单与 schema 校验', () => {
  it('非对象 / 数组负载直接拒绝', () => {
    expect(parseIframeMessage(null)).toBeNull()
    expect(parseIframeMessage('ur-scene:ready')).toBeNull()
    expect(parseIframeMessage(['ur-scene:ready'])).toBeNull()
    expect(parseIframeMessage(42)).toBeNull()
  })

  it('type 不在白名单内拒绝（含大屏下行方向的消息）', () => {
    expect(parseIframeMessage({ type: 'ur-scene:hacked' })).toBeNull()
    // 大屏→iframe 方向的消息不允许由 iframe 上行
    expect(parseIframeMessage({ type: SCENE_MSG.DATA, productID: 'p1' })).toBeNull()
    expect(parseIframeMessage({ type: SCENE_MSG.INIT, bindings: [] })).toBeNull()
  })

  it('ready 消息解析通过', () => {
    expect(parseIframeMessage({ type: 'ur-scene:ready' })).toEqual({ type: 'ur-scene:ready' })
  })

  it('anchors 合法列表解析通过', () => {
    const parsed = parseIframeMessage({
      type: 'ur-scene:anchors',
      anchors: [
        { path: 'factory/line1/motor1', name: '1号电机', desc: '产线1电机' },
        { path: 'factory/boiler', name: '锅炉' }
      ]
    })
    expect(parsed?.type).toBe('ur-scene:anchors')
    if (parsed?.type === 'ur-scene:anchors') {
      expect(parsed.anchors).toHaveLength(2)
      expect(parsed.anchors[1]?.desc).toBeUndefined()
    }
  })

  it('anchors 畸形条目（缺 path/name）整体拒绝', () => {
    expect(
      parseIframeMessage({
        type: 'ur-scene:anchors',
        anchors: [{ path: 'a/b', name: 'x' }, { path: '', name: 'y' }]
      })
    ).toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:anchors', anchors: 'not-array' })).toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:anchors', anchors: [] })).toBeNull()
  })

  it('anchors path 重复（绑定歧义）拒绝', () => {
    expect(
      parseIframeMessage({
        type: 'ur-scene:anchors',
        anchors: [
          { path: 'a/b', name: 'x' },
          { path: 'a/b', name: 'y' }
        ]
      })
    ).toBeNull()
  })

  it('api 请求缺少 id/path 拒绝', () => {
    expect(parseIframeMessage({ type: 'ur-scene:api', id: 1 })).toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:api', path: '/api/v1/x' })).toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:api', id: 1, path: '/api/v1/x', body: { a: 1 } })).not.toBeNull()
  })

  it('subscribe 频道白名单外拒绝', () => {
    expect(parseIframeMessage({ type: 'ur-scene:subscribe', id: 1, channel: 'prop' })).not.toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:subscribe', id: 1, channel: 'conn' })).not.toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:subscribe', id: 1, channel: 'system.user.#' })).toBeNull()
    expect(parseIframeMessage({ type: 'ur-scene:subscribe', channel: 'prop' })).toBeNull()
  })
})

describe('isAllowedApiPath 路径白名单', () => {
  it('允许 /api/v1/ 前缀的常规业务路径', () => {
    expect(isAllowedApiPath('/api/v1/things/device/info/get-list')).toBe(true)
    expect(isAllowedApiPath('/api/v1/view/project/create')).toBe(true)
  })

  it('拒绝非 /api/v1/ 前缀（外部地址、其他前缀）', () => {
    expect(isAllowedApiPath('https://evil.example.com/api/v1/x')).toBe(false)
    expect(isAllowedApiPath('api/v1/x')).toBe(false)
    expect(isAllowedApiPath('/api/v2/x')).toBe(false)
    expect(isAllowedApiPath('/')).toBe(false)
    expect(isAllowedApiPath(123)).toBe(false)
    expect(isAllowedApiPath(undefined)).toBe(false)
  })

  it('拒绝路径穿越与超长路径', () => {
    expect(isAllowedApiPath('/api/v1/../../etc/passwd')).toBe(false)
    expect(isAllowedApiPath(`/api/v1/${'a'.repeat(600)}`)).toBe(false)
  })

  it('拒绝 WS 建连接口（黑名单）', () => {
    expect(isAllowedApiPath('/api/v1/system/common/websocket/connect')).toBe(false)
  })
})

describe('checkSceneOrigin origin 校验', () => {
  it("sandbox 不透明源（'null'）放行", () => {
    expect(checkSceneOrigin('null', 'https://scene.example.com/index.html')).toBe(true)
  })

  it('与场景页地址同源放行，跨源拒绝', () => {
    expect(checkSceneOrigin('https://scene.example.com', 'https://scene.example.com/a/b.html')).toBe(true)
    expect(checkSceneOrigin('https://evil.example.com', 'https://scene.example.com/a/b.html')).toBe(false)
    expect(checkSceneOrigin('http://scene.example.com', 'https://scene.example.com/')).toBe(false)
  })

  it('场景页地址非法时一律拒绝', () => {
    expect(checkSceneOrigin('https://scene.example.com', 'not-a-url')).toBe(false)
    expect(checkSceneOrigin('', 'https://scene.example.com/')).toBe(false)
  })
})

describe('toSceneInitBindings 绑定表裁剪', () => {
  it('剔除缺字段绑定并映射字段名', () => {
    const bindings = toSceneInitBindings([
      { nodePath: 'factory/m1', productID: 'p1', deviceName: 'dev1', dataID: 'temperature' },
      { nodePath: '', productID: 'p1', deviceName: 'dev1', dataID: 'humidity' },
      { nodePath: 'factory/m2', productID: 'p2', deviceName: '', dataID: 'status' }
    ])
    expect(bindings).toEqual([{ path: 'factory/m1', productID: 'p1', deviceName: 'dev1', identifier: 'temperature' }])
  })
})

describe('buildXxxMessage 下行消息构造', () => {
  it('构造 init/data/api:res/ws/select 消息', () => {
    expect(buildInitMessage([{ path: 'a', productID: 'p', deviceName: 'd', identifier: 'i' }])).toEqual({
      type: 'ur-scene:init',
      bindings: [{ path: 'a', productID: 'p', deviceName: 'd', identifier: 'i' }]
    })
    expect(buildDataMessage({ productID: 'p', deviceName: 'd', identifier: 'i', value: 25, ts: 1725_000_000_000 })).toEqual({
      type: 'ur-scene:data',
      productID: 'p',
      deviceName: 'd',
      identifier: 'i',
      value: 25,
      ts: 1725_000_000_000
    })
    expect(buildApiResponseMessage(1, 200, { ok: 1 }, '')).toEqual({
      type: 'ur-scene:api:res',
      id: 1,
      code: 200,
      data: { ok: 1 },
      msg: ''
    })
    expect(buildWsMessage(2, { device: { productID: 'p' } })).toEqual({
      type: 'ur-scene:ws',
      id: 2,
      payload: { device: { productID: 'p' } }
    })
    expect(buildSelectMessage('factory/m1')).toEqual({ type: 'ur-scene:select', path: 'factory/m1' })
  })
})

/**
 * scene-sdk.js 握手可靠性单测（ur-scene v1.1）
 *
 * 直接加载 docs/大屏/功能说明/内嵌页面组件/scene-sdk.js 文档交付版源码，
 * 注入伪 window（捕获上行 postMessage 与 message 监听），配合 vitest 假时钟验证：
 * - ready() 立即发送一次 READY
 * - 未收到 ur-scene:init 前按 1s 间隔重发（覆盖父页监听晚注册/组件重挂载竞态）
 * - 收到 ur-scene:init 后停止重发并触发 onInit 回调（携带绑定表）
 */
describe('scene-sdk 握手可靠性（ready 重发 + onInit）', () => {
  // vitest 从 apps/web 启动，docs 目录在仓库根（apps/web 的上两级）
  const SDK_PATH = join(process.cwd(), '../../docs/大屏/功能说明/内嵌页面组件/scene-sdk.js')

  /** 加载 SDK 源码并注入伪运行环境，返回 SDK 实例与抓包句柄 */
  const loadSdk = () => {
    const src = readFileSync(SDK_PATH, 'utf8')
    const posted: Array<Record<string, unknown>> = []
    const listeners: Array<(event: { data: unknown }) => void> = []
    const fakeWindow = {
      parent: {
        postMessage: (message: Record<string, unknown>) => posted.push(message)
      },
      addEventListener: (_type: string, cb: (event: { data: unknown }) => void) => {
        listeners.push(cb)
      }
    }
    const factory = new Function('window', 'console', `${src}\nreturn window.UrSceneSDK`) as (w: unknown, c: unknown) => any
    const sdk = factory(fakeWindow, console)
    /** 模拟大屏下行消息（父页 postMessage 到场景页） */
    const deliver = (data: unknown) => listeners.forEach((cb) => cb({ data }))
    return { deliver, posted, sdk }
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ready() 立即发送一次 READY', () => {
    const { posted, sdk } = loadSdk()
    sdk.ready()
    expect(posted).toEqual([{ type: 'ur-scene:ready' }])
  })

  it('未收到 init 前按 1s 间隔重发 READY', () => {
    const { posted, sdk } = loadSdk()
    sdk.ready()
    vi.advanceTimersByTime(3500)
    // 首条 + 3.5s 内的 3 次重发
    expect(posted.filter((m) => m.type === 'ur-scene:ready')).toHaveLength(4)
    vi.advanceTimersByTime(60_000)
    // 超过 60 次上限后停止重发（首条 + 60 次重发 = 61 条封顶）
    expect(posted.filter((m) => m.type === 'ur-scene:ready')).toHaveLength(61)
  })

  it('收到 init 后停止重发并触发 onInit（携带绑定表）', () => {
    const { deliver, posted, sdk } = loadSdk()
    const received: unknown[][] = []
    sdk.onInit((bindings: unknown[]) => received.push(bindings))
    sdk.ready()
    vi.advanceTimersByTime(2500)
    const sentBefore = posted.length
    deliver({ type: 'ur-scene:init', bindings: [{ path: 'factory/boiler/temp', productID: 'p1', deviceName: 'd1', identifier: 'temperature' }] })
    expect(received).toHaveLength(1)
    expect(received[0]).toEqual([{ path: 'factory/boiler/temp', productID: 'p1', deviceName: 'd1', identifier: 'temperature' }])
    vi.advanceTimersByTime(10_000)
    // init 到达后 READY 不再重发
    expect(posted.length).toBe(sentBefore)
  })

  it('onInit 注销函数生效', () => {
    const { deliver, sdk } = loadSdk()
    const calls: unknown[] = []
    const off = sdk.onInit((bindings: unknown) => calls.push(bindings))
    off()
    deliver({ type: 'ur-scene:init', bindings: [] })
    expect(calls).toHaveLength(0)
  })
})

describe('toCloneableMessage 可克隆转换', () => {
  it('普通协议消息深拷贝且字段完整', () => {
    const msg = buildWsMessage(7, { params: { temperature: 25.5 }, timestamp: 123 })
    const cloned = toCloneableMessage(msg)
    expect(cloned).toEqual(msg)
    expect(cloned).not.toBe(msg)
    expect((cloned as any).payload).not.toBe((msg as any).payload)
  })

  it('含 reactive proxy 的数组 payload 不抛错且协议字段完整', () => {
    // 模拟 Vue reactive 包装的 payload：structuredClone 对 proxy 抛 DataCloneError
    const raw = [{ device: { productID: 'p1', deviceName: 'd1' }, params: { speed: 100 } }]
    const proxyPayload = new Proxy(raw, {})
    const msg = buildWsMessage('sub-1', proxyPayload as unknown)
    expect(() => structuredClone(msg)).toThrow()
    const cloned = toCloneableMessage(msg) as any
    expect(cloned.type).toBe('ur-scene:ws')
    expect(cloned.id).toBe('sub-1')
    expect(cloned.payload).toEqual(raw)
  })

  it('structuredClone 不可用时 JSON 降级保留协议字段', () => {
    vi.stubGlobal('structuredClone', () => {
      throw new Error('DataCloneError')
    })
    const msg = buildApiResponseMessage(3, 200, { lists: [[{ value: '42' }]] }, 'success')
    const cloned = toCloneableMessage(msg) as any
    expect(cloned.type).toBe('ur-scene:api:res')
    expect(cloned.id).toBe(3)
    expect(cloned.code).toBe(200)
    expect(cloned.data).toEqual({ lists: [[{ value: '42' }]] })
    expect(cloned.msg).toBe('success')
    vi.unstubAllGlobals()
  })

  it('循环引用且 structuredClone 抛错时兜底返回原对象不抛异常', () => {
    vi.stubGlobal('structuredClone', () => {
      throw new Error('DataCloneError')
    })
    const cyclic: any = { type: 'ur-scene:ws', id: 1 }
    cyclic.self = cyclic
    expect(toCloneableMessage(cyclic)).toBe(cyclic)
    vi.unstubAllGlobals()
  })
})
