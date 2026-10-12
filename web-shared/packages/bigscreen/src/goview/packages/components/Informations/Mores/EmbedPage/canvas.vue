<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="scene-embed-root">
    <!-- 场景页加载外壳：sandbox 仅放开脚本能力，不放开同源（凭证不出父页面） -->
    <iframe
      v-if="sceneUrl"
      ref="iframeRef"
      class="scene-embed-frame"
      :src="sceneUrl"
      sandbox="allow-scripts"
      referrerpolicy="no-referrer"
      @load="handleIframeLoad"
    ></iframe>
    <div v-else class="scene-embed-tip">{{ $t('orgEnergy.ui.configureScenePageUrl') }}</div>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 内嵌页面组件画布（iframe + postMessage 数据桥）
 *
 * 职责：
 * - 嵌入用户自研页面（iframe sandbox="allow-scripts"，跨域自部署页面安全隔离）
 * - 协议桥（ur-scene v1，纯函数校验在 scene-bridge.ts）：
 *   ready → 下发绑定表；anchors → 回写 option.parsedNodes（绑定面板立即可用）；
 *   api → 带登录态转发平台 API（仅 /api/v1/ 前缀、仅 POST）；subscribe → 注册实时兴趣透传 WS。
 *   握手可靠性：SDK（v1.1+）未收到 init 前会重发 ready，组件对每个 ready 都回发绑定表；
 *   组件侧 message 监听在 setup 同步注册，iframe 每次 load 也会重发绑定表（覆盖双方重载窗口）
 * - 数据链路（仿 GlTFModel）：绑定表变化拉初值 + registerRealtimeInterest 增量推送，
 *   每条命中值经 ur-scene:data 下发场景页自行应用（变色等），1s 轮询兜底 WS 未连
 * - 编辑态联动：绑定面板选中锚点 → ur-scene:select 通知场景页自行高亮
 *
 * 注：sandbox 无 allow-same-origin 时场景页源不透明，postMessage 只能以 '*' 为
 * 目标源下发，来源侧安全性由 checkSceneOrigin + schema 校验承担。
 */
import { computed, onUnmounted, ref, watch, type PropType } from 'vue'

import { getRequestClient } from '@vben/api'
import { preferences } from '@vben/preferences'
import { $t } from '@vben/saas'

import type { CreateComponentType } from '@/packages/index.type'
import { realtimeStatus, registerRealtimeInterest } from '@/realtime/projectRealtime'
import { matchBindings } from '@/packages/components/Decorates/Three/GlTFModel/bindings'
import { fetchBindingLatestValues } from '@/packages/components/Decorates/Three/GlTFModel/data'
import type { NodeBinding } from '@/packages/components/Decorates/Three/GlTFModel/types'
import { option } from './config'
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
} from './scene-bridge'
import type { SceneSubscribeChannel } from './types'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})

const iframeRef = ref<HTMLIFrameElement>()

// option 各键通过 getter 访问：后端恢复的旧 content 可能缺键，getter + 默认值更稳
const opt = computed(() => (props.chartConfig.option ?? {}) as typeof option)
const sceneUrl = computed(() => (opt.value.url || '').trim())

/** 场景页是否已上报 ready（ready 前下发的消息场景页收不到，直接跳过） */
let iframeReady = false
/** 当前绑定表（读取快照，供实时分发） */
let currentBindings: NodeBinding[] = []
let unregisterRealtime: null | (() => void) = null
/** WS 未连接时的初值轮询兜底（本地调试/代理形态下 WS 可能不可用） */
let pollTimer: null | ReturnType<typeof setInterval> = null
/** 场景页订阅的实时兴趣注销表（订阅 id → 注销函数） */
const subscriptionCleanups = new Map<string | number, () => void>()

/** 向场景页 postMessage（sandbox 不透明源只能以 '*' 为目标源）；发送前转可克隆副本防 DataCloneError */
const postToScene = (message: Record<string, unknown>) => {
  const win = iframeRef.value?.contentWindow
  if (!win || !iframeReady) return
  win.postMessage(toCloneableMessage(message), '*')
}

/** 把当前语言直接发送给已加载的 iframe，独立于数据桥 ready 状态。 */
const sendSceneLocale = () => {
  iframeRef.value?.contentWindow?.postMessage({ type: 'ur-scene:locale', locale: preferences.app.locale }, '*')
}

/** 把当前绑定表下发场景页（ready 与绑定表变化时调用） */
const sendInitBindings = () => {
  postToScene(buildInitMessage(toSceneInitBindings(currentBindings)))
  sendSceneLocale()
}

/** 已加载的场景在宿主切换语言后收到同一语言标识，不需要重载模型。 */
watch(() => preferences.app.locale, () => {
  sendSceneLocale()
})

/**
 * iframe 每次加载完成（含场景页自身 reload）时重发绑定表。
 * 场景页 SDK（v1.1+）在收到 init 前会周期重发 ready，双方重发叠加保证
 * 任意一方晚就绪/重挂载后仍能完成握手；旧版 SDK 只发一次 ready，
 * 依赖这里的 load 重发覆盖「组件已 ready、iframe 后加载」的窗口。
 */
const handleIframeLoad = () => {
  sendSceneLocale()
  sendInitBindings()
  void fetchLatestAndApply()
}

// ── 协议消息处理 ────────────────────────────────────────────

const handleSceneMessage = (event: MessageEvent) => {
  if (event.source !== iframeRef.value?.contentWindow) return
  if (!checkSceneOrigin(event.origin, sceneUrl.value)) return
  const parsed = parseIframeMessage(event.data)
  if (!parsed) return

  switch (parsed.type) {
    case SCENE_MSG.READY:
      iframeReady = true
      // 场景页（重）加载完成后补发绑定表并重放初值，覆盖加载前下发的丢失窗口
      sendInitBindings()
      void fetchLatestAndApply()
      break
    case SCENE_MSG.ANCHORS: {
      // 锚点快照回写 option.parsedNodes：映射为 GlTFModel 的节点结构，绑定面板零改动复用
      opt.value.parsedNodes = parsed.anchors.map((a) => ({
        uuid: '',
        name: a.name,
        path: a.path,
        type: 'Anchor'
      }))
      // 锚点自带描述：首次上报回写到 nodeDescs（用户已手工编辑过的路径不覆盖）
      const descs = { ...(opt.value.nodeDescs ?? {}) }
      let dirty = false
      for (const anchor of parsed.anchors) {
        if (anchor.desc && !descs[anchor.path]) {
          descs[anchor.path] = anchor.desc
          dirty = true
        }
      }
      if (dirty) opt.value.nodeDescs = descs
      break
    }
    case SCENE_MSG.API:
      void forwardApiRequest(parsed.request)
      break
    case SCENE_MSG.SUBSCRIBE:
      registerSceneSubscription(parsed.id, parsed.channel)
      break
  }
}

/** 代调平台 API：走统一 requestClient（自动注入登录态/app-id 头），凭证不出父页面 */
const forwardApiRequest = async (request: { id: string | number; path: string; body?: unknown }) => {
  if (!isAllowedApiPath(request.path)) {
    postToScene(buildApiResponseMessage(request.id, 403, null, editorT('bigscreenEditor.ui.componentAPIPathIsNotAllowedOnlyPOSTRequests')))
    return
  }
  try {
    // 应用级 requestClient 挂有 defaultResponseInterceptor（codeField/dataField），
    // 已成功响应会被解包为业务负载本身（非 200 走 reject），故 res 即平台 data，原样透传
    const res = (await getRequestClient().post(request.path, request.body)) as unknown
    postToScene(buildApiResponseMessage(request.id, 200, res ?? null, ''))
  } catch (error: any) {
    console.error('[EmbedPage] 场景页 API 转发失败:', request.path, error)
    const status = Number(error?.response?.status ?? 500)
    postToScene(buildApiResponseMessage(request.id, status, null, String(error?.message || editorT('bigscreenEditor.ui.componentAPIForwardingFailed'))))
  }
}

/** 注册场景页实时订阅：经实时中枢登记兴趣，命中消息原样透传（ur-scene:ws） */
const registerSceneSubscription = (id: string | number, channel: SceneSubscribeChannel) => {
  // 同 id 重复订阅：先注销旧兴趣再重建，避免泄漏
  subscriptionCleanups.get(id)?.()
  const forward = (payload: unknown) => postToScene(buildWsMessage(id, payload))
  const unregister = registerRealtimeInterest(
    channel === 'prop'
      ? {
          chartKey: props.chartConfig.chartConfig?.chartKey ?? 'VEmbedPage',
          applyProps: (msgs) => msgs.forEach(forward)
        }
      : {
          chartKey: props.chartConfig.chartConfig?.chartKey ?? 'VEmbedPage',
          applyConn: forward
        }
  )
  subscriptionCleanups.set(id, unregister)
}

// ── 数据链路：初值 + 实时推送 ────────────────────────────────

/** 拉取绑定表全部属性最新值并下发场景页 */
const fetchLatestAndApply = async () => {
  const bindings = currentBindings
  if (bindings.length === 0) return
  const values = await fetchBindingLatestValues(bindings)
  // 绑定可能在请求期间变化，应用前校验仍是当前绑定表
  if (currentBindings !== bindings) return
  for (const binding of bindings) {
    const key = `${binding.productID}|${binding.deviceName}|${binding.dataID}`
    const value = values.get(key)
    if (value !== undefined) {
      postToScene(
        buildDataMessage({
          productID: binding.productID,
          deviceName: binding.deviceName,
          identifier: binding.dataID,
          value,
          ts: Date.now()
        })
      )
    }
  }
}

/** 重建实时订阅与初值（绑定表变化时调用），同时把最新绑定表同步给场景页 */
const rebuildDataLink = () => {
  currentBindings = (opt.value.nodeBindings ?? []).filter(
    (b: NodeBinding) => b.productID && b.deviceName && b.dataID
  )
  unregisterRealtime?.()
  unregisterRealtime = null

  sendInitBindings()

  if (currentBindings.length === 0) return

  unregisterRealtime = registerRealtimeInterest({
    chartKey: props.chartConfig.chartConfig?.chartKey ?? 'VEmbedPage',
    // 不按 productID 过滤：绑定可跨产品，命中判断在 matchBindings 内完成
    applyProps: (msgs) => {
      const hits = matchBindings(currentBindings, msgs)
      for (const { binding, value } of hits) {
        postToScene(
          buildDataMessage({
            productID: binding.productID,
            deviceName: binding.deviceName,
            identifier: binding.dataID,
            value,
            ts: Date.now()
          })
        )
      }
    },
    refetch: () => void fetchLatestAndApply()
  })

  void fetchLatestAndApply()

  // 轮询兜底：WS 未连接（本地调试/代理形态）时周期拉初值，保证无推送也能持续驱动
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    if (realtimeStatus.value !== 'connected') void fetchLatestAndApply()
  }, 1_000)
}

watch(
  () => opt.value.nodeBindings,
  () => rebuildDataLink(),
  { deep: true, immediate: true }
)

// ── 场景页地址与选中联动 ─────────────────────────────────────

// 场景页地址变化：iframe 自动重载，清空旧锚点快照并等待新的 anchors 上报
watch(sceneUrl, () => {
  iframeReady = false
  opt.value.parsedNodes = []
  opt.value.selectedNodePath = ''
})

// 编辑态绑定面板选中锚点 → 通知场景页自行高亮（发布端 selectedNodePath 不变更，不会触发）
watch(
  () => opt.value.selectedNodePath,
  (path) => postToScene(buildSelectMessage(path || ''))
)

// ── 生命周期 ────────────────────────────────────────────────

// message 监听在 setup 同步阶段注册（而非 onMounted）：goview 预览渲染 iframe 后
// 场景页 ready 可能立即到达，onMounted 注册会错过首条消息导致握手卡死；
// 事件回调不会早于当前 task 执行，setup 注册与 onMounted 注册等价且更早。
window.addEventListener('message', handleSceneMessage)

onUnmounted(() => {
  window.removeEventListener('message', handleSceneMessage)
  unregisterRealtime?.()
  unregisterRealtime = null
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  for (const cleanup of subscriptionCleanups.values()) cleanup()
  subscriptionCleanups.clear()
})
</script>

<style scoped>
.scene-embed-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.scene-embed-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

.scene-embed-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 6px 14px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 13px;
  pointer-events: none;
  white-space: nowrap;
}
</style>
