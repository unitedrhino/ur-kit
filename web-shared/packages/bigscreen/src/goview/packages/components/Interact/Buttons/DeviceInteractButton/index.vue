<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div
    class="device-interact-wrapper"
    :class="{ 'is-public-mode': isPublic }"
    @mouseenter="isPublic && (showTip = true)"
    @mouseleave="showTip = false"
  >

    <!-- 公开模式气泡提示 -->
    <Transition name="tip-fade">
      <div v-if="isPublic && showTip" class="public-bubble">{{ editorT('bigscreenEditor.ui.componentDeviceControlIsNotSupportedInPublicDashboards') }}</div>
    </Transition>

    <!-- 形态一：下压按钮 (Button) -->
    <div
      v-if="optionData.uiMode === 'button'"
      class="iot-action-btn"
      :class="{ 'is-loading': loading }"
      @click.stop="handleButtonClick"
    >
      <span class="btn-text">{{ optionData.btnText || editorT('bigscreenEditor.ui.componentSendCommand') }}</span>
      <div class="cyber-border"></div>
    </div>

    <!-- 形态二：拨动开关 (Switch) -->
    <div
      v-else-if="optionData.uiMode === 'switch'"
      class="iot-toggle-switch"
      :class="{ 'is-active': isToggled, 'is-loading': loading, 'is-error': isError }"
      @click.stop="handleToggleClick"
    >
      <div class="switch-knob"></div>
      <span class="switch-text">{{ isToggled ? optionData.onText : optionData.offText }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref, computed, type PropType, onMounted } from 'vue'
import { isPreview } from '@/utils'
import { useAccessStore } from '@vben/stores'
import config, { option } from './config'
import { sendProperty, sendPropertyBatch, sendAction } from '@/api/thingsDevice'

/** 安全 Toast：使用 window.$message（兼容编辑态和预览态） */
const toast = (type: 'success' | 'error' | 'warning', msg: string) => {
  const wm = (window as any).$message
  if (wm?.[type]) {
    wm[type](msg)
  } else {
    console.log(`[DeviceBtn ${type}]`, msg)
  }
}

const props = defineProps({
  chartConfig: {
    // 使用 config 类精确类型（其 option 为具体结构），避免 GlobalThemeJsonType 索引签名兜底
    type: Object as PropType<config>,
    required: true
  }
})

const optionData = computed(() => props.chartConfig.option || option)

// ========== 状态 ==========
const isToggled = ref(false)
const loading = ref(false)
const isError = ref(false)
const isPublic = ref(false)
const showTip = ref(false)

// ========== 免登检测 ==========
const checkPublicMode = (): boolean => {
  // /view/ 路由 = 已发布大屏，无论访问者登录与否均为公开模式
  if (window.location.pathname.includes('/view/')) return true
  // ?share=1 明确标记为公开分享模式
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('share')) return true
  // 使用大屏自身的鉴权 Store（与 axios.ts / http-headers.ts 一致）
  try {
    const token = useAccessStore().accessToken
    return !token
  } catch {
    return true
  }
}
isPublic.value = checkPublicMode()

// ========== JSON 校验 ==========
const isValidJson = (str: string): boolean => {
  if (!str || str.trim() === '') return true
  try { JSON.parse(str); return true } catch { return false }
}

// ========== API 路由 ==========
const executeInteract = async (opt: typeof option, overrideParams?: string): Promise<void> => {
  const params = overrideParams ?? opt.params
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    if (opt.interactType === 'action') {
      await sendAction({
        productID: opt.productID,
        deviceName: opt.deviceName,
        actionID: opt.dataIdentifier,
        inputParams: params,
        isAsync: opt.isAsync,
      })
    } else if (opt.deviceScope === 'single') {
      await sendProperty({
        productID: opt.productID,
        deviceName: opt.deviceName,
        data: params,
        isAsync: opt.isAsync,
        shadowControl: opt.shadowControl || undefined,
      })
    } else {
      await sendPropertyBatch({
        productID: opt.productID || undefined,
        data: params,
        ...(opt.deviceScope === 'area' && opt.areaID ? { areaID: opt.areaID } : {}),
        ...(opt.deviceScope === 'group' && opt.groupID ? { groupID: opt.groupID } : {}),
        isAsync: opt.isAsync,
        shadowControl: opt.shadowControl || undefined,
      })
    }
    toast('success', editorT('bigscreenEditor.ui.componentCommandDelivered'))
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      toast('error', editorT('bigscreenEditor.ui.componentNetworkErrorPleaseTryAgain'))
    } else {
      const errMsg = err?.message || err?.msg || editorT('bigscreenEditor.ui.componentCommandDeliveryFailed')
      toast('error', errMsg)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// ========== Button 点击 ==========
const handleButtonClick = async () => {
  if (!isPreview()) return
  if (loading.value || isPublic.value) return

  const opt = optionData.value
  if (!isValidJson(opt.params)) {
    toast('warning', editorT('bigscreenEditor.ui.componentInvalidParameterJSONFormat'))
    return
  }

  loading.value = true
  try {
    await executeInteract(opt)
  } catch {
    // error already toasted in executeInteract
  } finally {
    loading.value = false
  }
}

// ========== Switch 点击 (乐观 UI) ==========
const handleToggleClick = async () => {
  if (!isPreview()) return
  if (loading.value || isPublic.value) return

  const opt = optionData.value
  const nextState = !isToggled.value
  const payloadParams = nextState ? opt.paramsOn : opt.paramsOff

  if (!isValidJson(payloadParams)) {
    toast('warning', editorT('bigscreenEditor.ui.componentInvalidSwitchParameterJSONCheckTheConfiguration'))
    return
  }

  // 乐观 UI：立即切换视觉
  isToggled.value = nextState
  loading.value = true
  isError.value = false

  try {
    await executeInteract(opt, payloadParams)
    // 成功保持乐观状态
  } catch {
    // 回滚
    isToggled.value = !nextState
    isError.value = true
    setTimeout(() => { isError.value = false }, 500)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 组件挂载完成
})
</script>

<style lang="scss" scoped>
/* ==============================
   外层容器
   ============================== */
.device-interact-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.is-public-mode {
    filter: grayscale(100%);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .public-bubble {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }

  .public-bubble::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
  }

  .tip-fade-enter-active,
  .tip-fade-leave-active {
    transition: opacity 0.15s;
  }
  .tip-fade-enter-from,
  .tip-fade-leave-to {
    opacity: 0;
  }
}

/* ==============================
   形态一：下压脉冲按钮 (Button)
   ============================== */
.iot-action-btn {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 210, 255, 0.1);
  border: 1px solid #00d2ff;
  color: #00d2ff;
  font-size: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease;
  user-select: none;

  &:active:not(.is-loading) {
    transform: scale(0.95);
    background: rgba(0, 210, 255, 0.2);
  }

  &.is-loading {
    pointer-events: none;
    animation: pulse-border 1.5s infinite;
  }

  .btn-text {
    position: relative;
    z-index: 1;
  }

  .cyber-border {
    display: none;
  }
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(0, 210, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 210, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 210, 255, 0); }
}

/* ==============================
   形态二：拨动开关 (Switch)
   ============================== */
.iot-toggle-switch {
  position: relative;
  width: 100%;
  max-width: 80px;
  height: 50%;
  max-height: 36px;
  min-height: 24px;
  border-radius: 999px;
  background-color: #2c3e50;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  user-select: none;

  &.is-active {
    background-color: #00d2ff;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 210, 255, 0.5);
  }

  &.is-loading {
    opacity: 0.6;
    pointer-events: none;
  }

  &.is-error {
    animation: shake 0.4s ease-in-out;
    background-color: #ff4d4f !important;
  }

  .switch-knob {
    width: 45%;
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: #ffffff;
    position: absolute;
    left: 4%;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &.is-active .switch-knob {
    transform: translateX(105%);
  }

  .switch-text {
    position: absolute;
    right: 12%;
    font-size: 12px;
    color: #fff;
    opacity: 0.8;
  }

  &.is-active .switch-text {
    right: auto;
    left: 12%;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
