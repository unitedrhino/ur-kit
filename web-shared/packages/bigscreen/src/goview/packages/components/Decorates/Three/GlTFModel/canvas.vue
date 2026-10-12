<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="gltf-model-root">
    <!-- 加载/错误/空态提示层 -->
    <div v-if="loading" class="gltf-model-tip">{{ editorT('bigscreenEditor.ui.componentLoadingModel') }} {{ progress > 0 ? `${progress}%` : '…' }}</div>
    <div v-else-if="errorMsg" class="gltf-model-tip gltf-model-tip--error">{{ errorMsg }}</div>
    <div v-else-if="!modelUrl" class="gltf-model-tip">{{ editorT('bigscreenEditor.ui.componentUploadAGLBModelInTheRightPanel') }}</div>
    <!-- 模型画布挂载点。
         视角调整（全屏）时 Teleport 到 body：GoView 画布祖先链带 transform:scale，
         position:fixed 会被降级为相对该祖先定位导致全屏失效，搬离后 fixed 才相对视口 -->
    <Teleport to="body" :disabled="!viewEditing">
      <div ref="canvasRef" :class="['gltf-model-canvas', { 'gltf-model-fullscreen': viewEditing }]"></div>
      <!-- 全屏视角调整模式的退出按钮 -->
      <button v-if="viewEditing" class="gltf-model-exit" @click="exitViewEdit">{{ editorT('bigscreenEditor.ui.componentDoneSaveViewpointAutomatically') }}</button>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 3D 模型组件画布（three 实际渲染层）
 *
 * 职责：
 * - 挂载 GlTFViewer：模型加载/解析（回写 option.parsedNodes）/拾取联动/尺寸响应
 * - 数据链路：绑定表变化时拉初值 + 注册实时兴趣，WS 推送经规则引擎驱动节点
 * - 编辑态联动：画布点击选中节点 ↔ 右侧节点树（通过 option.selectedNodePath）
 *
 * 本文件静态 import three（经 index.vue 异步组件链独立分包）。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, toRefs, watch, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import throttle from 'lodash/throttle'

import type { CreateComponentType } from '@/packages/index.type'
import { realtimeStatus, registerRealtimeInterest } from '@/realtime/projectRealtime'
import { GlTFViewer } from './viewer'
import { matchBindings, resolveBindingTarget } from './bindings'
import { fetchBindingLatestValues } from './data'
import { option } from './config'
import type { NodeBinding } from './types'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType & typeof option>,
    required: true
  }
})

const route = useRoute()
const canvasRef = ref<HTMLElement>()
const loading = ref(false)
const progress = ref(0)
const errorMsg = ref('')

const { w, h } = toRefs(props.chartConfig.attr)
// option 各键通过 getter 访问：不同加载路径下运行时对象可能缺键（如后端恢复的旧 content），
// toRefs 解构会得到 undefined 的 ref 导致 .value 抛错，getter + 默认值更稳
const opt = computed(() => (props.chartConfig.option ?? {}) as typeof option)
const modelUrl = computed(() => opt.value.modelUrl || '')
const autoRotate = computed(() => Boolean(opt.value.autoRotate))
const bgTransparent = computed(() => opt.value.bgTransparent !== false)
const cameraState = computed(() => opt.value.cameraState)
const saveViewToken = computed(() => opt.value.saveViewToken)
const viewEditToken = computed(() => opt.value.viewEditToken)

/** 全屏视角调整模式（编辑器里进入，遮罩 GoView 交互层专调模型视角） */
const viewEditing = ref(false)

/** 编辑器路由（编辑器/组件编辑器）才开放画布拾取联动；发布端点击不改变选中态 */
const isEditorRoute = computed(() => route.path.includes('editor'))

let viewer: GlTFViewer | null = null
let unregisterRealtime: null | (() => void) = null
/** WS 未连接时的初值轮询兜底（本地调试/代理形态下 WS 可能不可用） */
let pollTimer: null | ReturnType<typeof setInterval> = null

/** 当前绑定表（读取快照，供实时分发） */
let currentBindings: NodeBinding[] = []

// ── 数据链路：初值 + 实时推送 ────────────────────────────────

/** 拉取绑定表全部属性最新值并应用到节点 */
const fetchLatestAndApply = async () => {
  const bindings = currentBindings
  if (!viewer || bindings.length === 0) return
  const values = await fetchBindingLatestValues(bindings)
  // 模型/绑定可能在请求期间变化，应用前校验仍是当前绑定表
  if (currentBindings !== bindings) return
  for (const binding of bindings) {
    const key = `${binding.productID}|${binding.deviceName}|${binding.dataID}`
    const value = values.get(key)
    if (value !== undefined) viewer.applyBindingValue(binding, value)
  }
}

/** 重建实时订阅与初值（绑定表变化时调用） */
const rebuildDataLink = () => {
  currentBindings = (props.chartConfig.option.nodeBindings ?? []).filter(
    (b: NodeBinding) => b.productID && b.deviceName && b.dataID
  )
  unregisterRealtime?.()
  unregisterRealtime = null

  if (currentBindings.length === 0) return

  unregisterRealtime = registerRealtimeInterest({
    chartKey: props.chartConfig.chartConfig?.chartKey ?? 'VGlTFModel',
    // 不按 productID 过滤：绑定可跨产品，命中判断在 matchBindings 内完成
    applyProps: (msgs) => {
      if (!viewer) return
      const hits = matchBindings(currentBindings, msgs)
      for (const { binding, value } of hits) {
        viewer.applyBindingValue(binding, value)
      }
    },
    refetch: () => void fetchLatestAndApply()
  })

  void fetchLatestAndApply()

  // 轮询兜底：WS 未连接（本地调试/代理形态）时周期拉初值，保证无推送也能持续驱动；
  // WS 已连接时轮询空转判断后跳过，零额外请求
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    if (realtimeStatus.value !== 'connected') void fetchLatestAndApply()
  }, 1_000)
}

watch(
  () => props.chartConfig.option.nodeBindings,
  () => rebuildDataLink(),
  { deep: true, immediate: true }
)

// ── 模型加载 ────────────────────────────────────────────────

const loadModel = async (url: string) => {
  if (!viewer) return
  if (!url) {
    viewer.clearModel()
    props.chartConfig.option.parsedNodes = []
    return
  }
  loading.value = true
  errorMsg.value = ''
  progress.value = 0
  try {
    const nodes = await viewer.loadModel(url)
    props.chartConfig.option.parsedNodes = nodes
    // 绑定目标自愈：three 名字清理规则可能随版本变化（如 Model.001 → Model001），旧绑定的
    // uuid/path 失效时按三级降级重新命中并回写最新标识，保证变色、拾取与运动驱动不断链
    const bindings = props.chartConfig.option.nodeBindings ?? []
    let migrated = false
    for (const binding of bindings) {
      const hit = resolveBindingTarget(binding, nodes)
      if (hit.node && (hit.node.path !== binding.nodePath || hit.node.uuid !== binding.nodeID)) {
        binding.nodeID = hit.node.uuid
        binding.nodePath = hit.node.path
        migrated = true
      }
    }
    if (migrated) props.chartConfig.option.nodeBindings = [...bindings]
    // 应用保存的视角（模型默认位置/朝向）
    if (cameraState.value?.camera?.length) viewer.applyViewState(cameraState.value)
    // 模型晚于初值请求完成时（registry 此前为空），加载完成后重放一次最新值
    void fetchLatestAndApply()
  } catch (error: any) {
    // 输出完整堆栈定位异常来源
    console.error('[GlTFModel] loadModel failed:', error?.stack || error?.message || error)
    const message = String(error?.message || error || '')
    errorMsg.value = message.includes('DRACO') || message.includes('draco')
      ? editorT('bigscreenEditor.ui.componentFailedToLoadModelDRACOCompressionIsNot')
      : editorT('bigscreenEditor.dynamic.modelLoadFailed', { message: String(message || editorT('orgManage.systemConfig.unknownError')) })
    props.chartConfig.option.parsedNodes = []
  } finally {
    loading.value = false
  }
}

watch(modelUrl, (url) => void loadModel(url))

// ── 场景选项 ────────────────────────────────────────────────

watch(autoRotate, (v) => viewer?.setAutoRotate(Boolean(v)))
// 「定制」页签点「保存当前视角」→ 把编辑态当前相机位置/目标写入 option.cameraState（发布端按此展示）
watch(saveViewToken, () => {
  if (!viewer) return
  opt.value.cameraState = viewer.getViewState()
})
// 进入全屏视角调整：画布容器 Teleport 到 body 并切全屏（脱离 GoView 画布的 transform:scale 祖先，
// 否则 position:fixed 被降级、全屏失效），鼠标直达 OrbitControls，退出时自动保存视角
watch(viewEditToken, () => {
  viewEditing.value = true
  nextTick(() => {
    viewer?.updateSize(window.innerWidth, window.innerHeight)
  })
})

function exitViewEdit() {
  viewEditing.value = false
  nextTick(() => {
    viewer?.updateSize(w.value, h.value)
    opt.value.cameraState = viewer?.getViewState()
    ;(window as any).$message?.success?.(editorT('bigscreenEditor.ui.componentViewpointSaved'))
  })
}
watch(
  bgTransparent,
  (v) => viewer?.setBackgroundTransparent(v !== false),
  { immediate: true }
)

// 尺寸变化节流响应
watch(
  () => [w.value, h.value],
  throttle(([nw], [nh]) => viewer?.updateSize(nw, nh), 100)
)

// ── 编辑态拾取联动 ────────────────────────────────────────────

watch(
  () => props.chartConfig.option.selectedNodePath,
  (path) => viewer?.selectNode(path || '')
)

// ── 生命周期 ────────────────────────────────────────────────

onMounted(() => {
  if (!canvasRef.value) return
  viewer = new GlTFViewer(canvasRef.value)
  viewer.onProgress = (percent) => (progress.value = percent)
  viewer.onPick = (node) => {
    if (!isEditorRoute.value) return
    props.chartConfig.option.selectedNodePath = node?.path ?? ''
  }
  viewer.setBackgroundTransparent(bgTransparent.value !== false)
  viewer.updateSize(w.value, h.value)
  viewer.setAutoRotate(Boolean(autoRotate.value))
  if (modelUrl.value) void loadModel(modelUrl.value)
  // watch immediate 触发的初值拉取发生在 viewer 挂载前，挂载后主动补一次
  if (currentBindings.length > 0) void fetchLatestAndApply()
})

onUnmounted(() => {
  unregisterRealtime?.()
  unregisterRealtime = null
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  viewer?.dispose()
  viewer = null
})
</script>

<style scoped>
.gltf-model-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gltf-model-canvas {
  position: absolute;
  inset: 0;
}

/* 全屏视角调整模式：盖过编辑器交互层，鼠标直达 OrbitControls */
.gltf-model-canvas.gltf-model-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 99999;
}

.gltf-model-exit {
  /* 全屏时随 Teleport 挂在 body 下，用 fixed 相对视口定位（右上角） */
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 100000;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: rgba(24, 160, 251, 0.9);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.gltf-model-tip {
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

.gltf-model-tip--error {
  background: rgba(120, 22, 22, 0.75);
}
</style>
