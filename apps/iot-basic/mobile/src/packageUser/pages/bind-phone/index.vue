<template>
  <app-navigation-bar title="绑定手机号" :back="true" />

  <scroll-view class="bind-phone-page" scroll-y type="list">
    <view class="bind-phone-hero">
      <view class="bind-phone-hero__badge">
        <app-icon class="bind-phone-hero__badge-text" name="tabler:phone" :size="28" />
      </view>
      <text class="bind-phone-hero__title">绑定手机号</text>
      <text class="bind-phone-hero__sub">当前微信身份已通过验证，补充手机号后即可继续使用平台能力</text>
    </view>

    <view class="bind-phone-card">
      <view class="bind-phone-card__hint">
        <text class="bind-phone-card__hint-text">该手机号将用于账号识别、通知触达与后续安全验证</text>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <button
        v-if="bindMode === 'wx'"
        class="bind-phone-wx-btn"
        open-type="getPhoneNumber"
        @getphonenumber="handleWxBindPhone"
        :loading="submitting"
      >
        <text class="bind-phone-wx-btn__text">微信手机号快速验证</text>
      </button>
      <view
        v-if="bindMode === 'wx'"
        class="bind-phone-mode-entry"
      >
        <text class="bind-phone-mode-entry__text" @tap="handleModeSwitch('sms')">手机号绑定</text>
      </view>
      <!-- #endif -->

      <template v-if="bindMode === 'sms'">
        <view class="bind-phone-field">
          <text class="bind-phone-field__label">手机号</text>
          <input
            class="bind-phone-field__input"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
            :value="phone"
            @blur="handlePhoneBlur"
          />
        </view>

        <view class="bind-phone-field bind-phone-field--inline">
          <view class="bind-phone-field__main">
            <text class="bind-phone-field__label">验证码</text>
            <input
              class="bind-phone-field__input"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              :value="verifyCode"
              @blur="handleVerifyCodeBlur"
            />
          </view>
          <view
            :class="`bind-phone-code-btn ${countdown > 0 ? 'bind-phone-code-btn--disabled' : ''}`"
            @tap="handleSendCode"
          >
            <text class="bind-phone-code-btn__text">{{ countdown > 0 ? countdown + 's后重发' : '获取验证码' }}</text>
          </view>
        </view>
        <view
          class="bind-phone-mode-entry"
        >
          <text class="bind-phone-mode-entry__text" @tap="handleModeSwitch('wx')">使用微信一键取号</text>
        </view>
      </template>
    </view>

    <view
      v-if="bindMode === 'sms'"
      :class="`bind-phone-submit ${isSmsSubmitDisabled ? 'bind-phone-submit--disabled' : ''}`"
      @tap="handleSubmit"
      hover-class="bind-phone-submit--hover"
    >
      <text class="bind-phone-submit__text">{{ submitting ? '提交中...' : '确认绑定' }}</text>
    </view>

    <view v-if="bindMode === 'sms'" class="bind-phone-footer">
      <text class="bind-phone-footer__text">如果未收到验证码，请稍后重试并确认短信服务正常</text>
    </view>
    <safe-area />
  </scroll-view>
  <privacy-authorization-modal />
</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue'
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue'
import PrivacyAuthorizationModal from '../../../components/privacy-authorization-modal/privacy-authorization-modal.vue'
import SafeArea from '../../../components/safe-area/safe-area.vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { authProvider } from '../../../providers/auth.provider'
import { appContextProvider } from '../../../providers/app-context.provider'
import { logger } from '../../../utils/logger'

type BindMode = 'wx' | 'sms'

const COUNTDOWN_SECONDS = 60

function isPhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone)
}

const phone = ref('')
const verifyCode = ref('')
const codeID = ref('')
const countdown = ref(0)
const sendingCode = ref(false)
const submitting = ref(false)
const fromSecurity = ref(false)
const bindMode = ref<BindMode>('sms')
let timer: ReturnType<typeof setInterval> | null = null

const isSmsSubmitDisabled = computed(() => {
  return (
    bindMode.value !== 'sms' ||
    submitting.value ||
    !isPhone(phone.value) ||
    !codeID.value ||
    !verifyCode.value
  )
})

/**
 * 输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示
 * （微信小程序 iOS + 第三方输入法下，聚焦时回写会导致粘贴内容不显示）。blur 先于 tap 触发，
 * 发送验证码、提交绑定等按钮读取处拿到的均为最新值。
 */
function handlePhoneBlur(e: any) { phone.value = e.detail.value }
function handleVerifyCodeBlur(e: any) { verifyCode.value = e.detail.value }

/** 手机号输入时去除首尾空格，避免号码两侧空白导致校验失败 */
watch(phone, (next) => {
  const trimmed = next.trim()
  if (trimmed !== next) phone.value = trimmed
})
/** 验证码输入时去除首尾空格 */
watch(verifyCode, (next) => {
  const trimmed = next.trim()
  if (trimmed !== next) verifyCode.value = trimmed
})

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startCountdown(seconds: number) {
  clearTimer()
  countdown.value = seconds
  timer = setInterval(() => {
    const next = countdown.value - 1
    if (next <= 0) {
      clearTimer()
      countdown.value = 0
      return
    }
    countdown.value = next
  }, 1000)
}

onLoad((query: any) => {
  // #ifdef MP-WEIXIN
  bindMode.value = 'wx'
  // #endif
  if (!authProvider.isLoggedIn()) {
    uni.redirectTo({ url: '/packageUser/pages/login/index' })
    return
  }
  fromSecurity.value = query?.from === 'security'
  const user = authProvider.getState().user
  phone.value = user?.phone || ''
})

onUnload(() => clearTimer())
onUnmounted(() => clearTimer())

function handleModeSwitch(mode: BindMode) {
  if (bindMode.value === mode) return
  bindMode.value = mode
  if (mode === 'wx') {
    codeID.value = ''
    verifyCode.value = ''
    clearTimer()
  } else {
    clearTimer()
  }
}

/** 记录绑定页微信手机号授权回调形态，只保留是否存在 code 与错误文案。 */
function logWxBindPhoneCallback(e: any) {
  const detail = e?.detail || {}
  logger.info('auth', 'bind-phone:get-phone-number:callback', {
    hasCode: !!detail.code,
    errMsg: detail.errMsg || '',
    hasEncryptedData: !!detail.encryptedData,
    hasIv: !!detail.iv,
  })
}

/** normalizeWxPhoneNumberFailure 把微信取号失败原因转成绑定页可执行的提示。 */
function normalizeWxPhoneNumberFailure(errMsg: string) {
  const message = errMsg || ''
  if (message.includes('未绑定手机')) {
    return '当前微信未绑定手机号，可使用手机号绑定'
  }
  if (message.includes('deny') || message.includes('取消') || message.includes('拒绝')) {
    return '已取消授权，可使用手机号绑定'
  }
  return '微信手机号验证不可用'
}

async function handleSendCode() {
  if (countdown.value > 0 || sendingCode.value) return
  if (!isPhone(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  sendingCode.value = true
  try {
    const result = await authProvider.sendPhoneCaptcha(phone.value)
    codeID.value = result.codeID
    startCountdown(COUNTDOWN_SECONDS)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '发送失败', icon: 'none' })
  } finally {
    sendingCode.value = false
  }
}

async function handleSubmit() {
  if (isSmsSubmitDisabled.value) return
  if (!codeID.value) {
    uni.showToast({ title: '请先获取验证码', icon: 'none' })
    return
  }
  if (!verifyCode.value) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await authProvider.bindPhoneBySms(phone.value, verifyCode.value, codeID.value)
    uni.showToast({ title: '绑定成功', icon: 'success' })
    await finishBindPhone()
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '绑定失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function handleWxBindPhone(e: any) {
  logWxBindPhoneCallback(e)
  const phoneCode = e.detail?.code
  if (!phoneCode) {
    const errMsg = e.detail?.errMsg || ''
    uni.showToast({
      title: normalizeWxPhoneNumberFailure(errMsg),
      icon: 'none',
    })
    return
  }
  submitting.value = true
  try {
    await authProvider.bindPhoneByWxPhone(phoneCode)
    uni.showToast({ title: '绑定成功', icon: 'success' })
    await finishBindPhone()
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '请使用验证码绑定', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function finishBindPhone() {
  if (fromSecurity.value) {
    setTimeout(() => uni.navigateBack(), 300)
    return
  }
  notifyAppLoginSuccess()
  await appContextProvider.continueAfterLogin('/pages/home/index')
}

function notifyAppLoginSuccess() {
  const app = getApp() as any
  app.onLoginSuccess?.()
}
</script>

<style lang="scss" scoped>
.bind-phone-page {
  flex: 1;
  min-height: 0;
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--page-bg) 40%, var(--page-bg) 100%);
}

.bind-phone-hero {
  padding: 30px 16px 20px;
}

.bind-phone-hero__badge {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px var(--color-primary-shadow);
}

.bind-phone-hero__badge-text {
  font-size: 26px;
}

.bind-phone-hero__title {
  display: block;
  margin-top: 16px;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.bind-phone-hero__sub {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.bind-phone-card {
  margin: 0 16px 20px;
  padding: 14px 16px 16px;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 10px 28px var(--color-shadow);
}

.bind-phone-card__hint {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-primary-light);
}

.bind-phone-card__hint-text {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-primary);
}

.bind-phone-mode-entry {
  margin-top: 4px;
  text-align: center;
}

.bind-phone-mode-entry__text {
  font-size: 12px;
  color: var(--color-primary);
  line-height: 1;
  text-decoration: underline;
}

.bind-phone-wx-btn {
  margin: 4px 0 12px;
  height: 48px;
  border-radius: 14px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bind-phone-wx-btn__text {
  font-size: 14px;
  font-weight: 500;
}

.bind-phone-field {
  margin-bottom: 12px;
}

.bind-phone-field--inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bind-phone-field__main {
  flex: 1;
}

.bind-phone-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.bind-phone-field__input {
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  padding: 0 12px;
  line-height: 46px;
  border-radius: 10px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-light);
  color: var(--text-primary);
  font-size: 15px;
}

.bind-phone-code-btn {
  height: 36px;
  min-width: 96px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 12px;
}

.bind-phone-code-btn--disabled {
  opacity: 0.6;
}

.bind-phone-code-btn__text {
  padding: 0 8px;
  text-align: center;
}

.bind-phone-submit {
  margin: 0 16px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 500;
}

.bind-phone-submit--hover {
  background: var(--color-primary);
}

.bind-phone-submit--disabled {
  opacity: 0.55;
  pointer-events: none;
  background: var(--color-offline) !important;
}

.bind-phone-submit__text {
  font-size: 15px;
}

.bind-phone-footer {
  margin: 0 16px;
  text-align: center;
}

.bind-phone-footer__text {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
