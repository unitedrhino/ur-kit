<template>
<view class="login-screen">
  <app-navigation-bar title="登录" :back="true" />

  <view class="login-page">
    <!-- 品牌区：logo 在剩余高度内居中 -->
    <view class="login-brand">
      <image class="login-logo" :src="logoPath" mode="aspectFit" />
    </view>

    <!-- 底部操作区 -->
    <view class="login-bottom">
      <text class="login-slogan">{{appSlogan}}</text>

    <!-- #ifdef MP-WEIXIN -->
    <!-- 微信登录模式：协议确认后先 wx.login 探测，需要手机号时才替换为取号按钮 -->
    <template v-if="mode === 'wx'">
      <!-- 协议勾选 -->
      <view class="legal-row" @tap="handleToggleAgreement">
        <view :class="`legal-checkbox ${agreedProtocols ? 'legal-checkbox--checked' : ''}`">
          <app-icon v-if="agreedProtocols" class="legal-check-icon" name="tabler:check" :size="14" />
        </view>
        <text class="legal-text">
          <text class="legal-text__lead">我已阅读并同意</text>
          <text v-for="(item, index) in legalDocs" :key="item.key" class="legal-text__link" @tap.stop="handleOpenLegalDoc(item.key)">《{{item.title}}》</text>
        </text>
      </view>

      <view v-if="!requiresWxPhoneAuth" class="wx-auto-login-status" @tap="handleWxAutoLoginTap">
        <text class="wx-auto-login-status__text">一键快捷登录</text>
      </view>

      <button
        v-else-if="agreedProtocols"
        class="login-btn login-btn--primary"
        open-type="getPhoneNumber"
        @getphonenumber="handleWxQuickLogin"
        hover-class="login-btn--hover"
        :loading="loading"
      >
        <text class="login-btn__text">一键快捷登录</text>
      </button>

      <!-- 使用账户登录 -->
      <view class="login-switch" @tap="handleModeSwitch">
        <text class="login-switch__text">使用账号密码登录</text>
      </view>
    </template>
    <!-- #endif -->

    <!-- #ifdef APP-PLUS -->
    <!-- App 手机号模式：Android/iOS 使用短信验证码登录 -->
    <template v-if="mode === 'phone'">
      <!-- 协议勾选 -->
      <view class="legal-row" @tap="handleToggleAgreement">
        <view :class="`legal-checkbox ${agreedProtocols ? 'legal-checkbox--checked' : ''}`">
          <app-icon v-if="agreedProtocols" class="legal-check-icon" name="tabler:check" :size="14" />
        </view>
        <text class="legal-text">
          <text class="legal-text__lead">我已阅读并同意</text>
          <text v-for="(item, index) in legalDocs" :key="item.key" class="legal-text__link" @tap.stop="handleOpenLegalDoc(item.key)">《{{item.title}}》</text>
        </text>
      </view>

      <view class="phone-login-form">
        <view class="phone-login-field">
          <text class="phone-login-field__label">手机号</text>
          <input
            class="phone-login-field__input"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
            :value="phoneLoginPhone"
            @blur="handlePhoneLoginPhoneBlur"
          />
        </view>
        <view class="phone-login-field phone-login-field--inline">
          <view class="phone-login-field__main">
            <text class="phone-login-field__label">验证码</text>
            <input
              class="phone-login-field__input"
              type="number"
              maxlength="6"
              placeholder="请输入验证码"
              :value="phoneLoginCode"
              @blur="handlePhoneLoginCodeBlur"
            />
          </view>
          <view
            :class="`phone-login-code-btn ${phoneCodeCountdown > 0 || sendingPhoneCode ? 'phone-login-code-btn--disabled' : ''}`"
            @tap="handleSendPhoneLoginCode"
          >
            <text class="phone-login-code-btn__text">{{phoneCodeCountdown > 0 ? phoneCodeCountdown + 's后重发' : '获取验证码'}}</text>
          </view>
        </view>
      </view>

      <view class="login-btn login-btn--primary" @tap="handlePhoneLogin" hover-class="login-btn--hover">
        <text class="login-btn__text">{{loading ? '登录中...' : '手机号登录'}}</text>
      </view>

      <view class="login-switch" @tap="handleModeSwitch">
        <text class="login-switch__text">使用账号密码登录</text>
      </view>
    </template>
    <!-- #endif -->

    <!-- 账号密码模式 -->
    <template v-if="mode === 'password'">
      <!-- 协议勾选 -->
      <view class="legal-row" @tap="handleToggleAgreement">
        <view :class="`legal-checkbox ${agreedProtocols ? 'legal-checkbox--checked' : ''}`">
          <app-icon v-if="agreedProtocols" class="legal-check-icon" name="tabler:check" :size="14" />
        </view>
        <text class="legal-text">
          <text class="legal-text__lead">我已阅读并同意</text>
          <text v-for="(item, index) in legalDocs" :key="item.key" class="legal-text__link" @tap.stop="handleOpenLegalDoc(item.key)">《{{item.title}}》</text>
        </text>
      </view>

      <!-- 账号密码表单 -->
      <view class="login-form">
        <view class="login-form__item">
          <text class="login-form__label">账号</text>
          <input class="login-form__input" placeholder="请输入账号" :value="account" @blur="handleAccountBlur" />
        </view>
        <view class="login-form__item">
          <text class="login-form__label">密码</text>
          <input class="login-form__input" placeholder="请输入密码" password :value="password" @blur="handlePasswordBlur" />
        </view>
      </view>

      <view class="remember-row">
        <view class="remember-left" @tap="handleRememberChange">
          <view :class="`remember-checkbox ${rememberAccount ? 'remember-checkbox--checked' : ''}`">
            <app-icon v-if="rememberAccount" class="remember-check-icon" name="tabler:check" :size="14" />
          </view>
          <text class="remember-text">记住账号</text>
        </view>
        <text v-if="rememberAccount && account" class="remember-clear" @tap="clearSavedAccount">清除</text>
      </view>

      <view class="password-extra-row">
        <text class="password-forgot" @tap="handleForgotPassword">忘记密码？</text>
      </view>

      <view class="login-btn login-btn--primary" @tap="handlePasswordLogin" hover-class="login-btn--hover">
        <text class="login-btn__text">{{loading ? '登录中...' : '登录'}}</text>
      </view>

      <view class="login-switch" @tap="handleModeSwitch">
        <text class="login-switch__text">{{passwordSwitchText}}</text>
      </view>
    </template>

    </view>
  </view>
  <privacy-authorization-modal />
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import PrivacyAuthorizationModal from '../../../components/privacy-authorization-modal/privacy-authorization-modal.vue';
import { ref, onUnmounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { authProvider } from '../../../providers/auth.provider'
import { authService } from '../../../services/auth.service'
import { appContextProvider } from '../../../providers/app-context.provider'
import { permissionWarmupService } from '../../../services/permission-warmup.service'
import { BRAND, LEGAL_DOCS } from '../../../config/brand'
import { getSingleTenantBrandLogoPath, loadSingleTenantBrand } from '../../../utils/tenant-brand'
import { isApiError } from '../../../utils/request'
import { logger } from '../../../utils/logger'

function normalizeLoginError(error: unknown, fallback: string): string {
  const message = (error as Error)?.message || fallback
  if (isWxAccountUnboundError(error)) return '请授权手机号后继续登录'
  return message
}

type LoginMode = 'wx' | 'phone' | 'password'
type WxPhoneAuthPurpose = 'quickLogin' | 'bindAfterLogin'

/** 手机号登录验证码倒计时时长，单位秒 */
const COUNTDOWN_SECONDS = 60
/** 后端用户域错误码：微信身份尚未注册或尚未绑定账号时进入手机号授权补全。 */
const WX_ACCOUNT_UNBOUND_CODES = [1000003, 1000033]

/** 判断输入是否为当前登录支持的大陆手机号格式 */
function isPhone(phone: string): boolean {
  return /^1\d{10}$/.test(phone)
}

/** 按平台确定登录页默认模式：小程序走微信自动登录，App 走短信手机号登录 */
function resolveInitialLoginMode(): LoginMode {
  let initialMode: LoginMode = 'password'
  // #ifdef MP-WEIXIN
  initialMode = 'wx'
  // #endif
  // #ifdef APP-PLUS
  initialMode = 'phone'
  // #endif
  return initialMode
}

/** 按当前平台生成账号密码模式下的切换入口文案 */
function resolvePasswordSwitchText(): string {
  let switchText = '使用手机号登录'
  // #ifdef MP-WEIXIN
  switchText = '使用微信登录'
  // #endif
  // #ifdef APP-PLUS
  switchText = '使用手机号登录'
  // #endif
  return switchText
}

const mode = ref<LoginMode>(resolveInitialLoginMode())
const account = ref('')
const password = ref('')
const phoneLoginPhone = ref('')
const phoneLoginCode = ref('')
const phoneLoginCodeID = ref('')
const loading = ref(false)
const sendingPhoneCode = ref(false)
const phoneCodeCountdown = ref(0)
const rememberAccount = ref(false)
const agreedProtocols = ref(false)
const requiresWxPhoneAuth = ref(false)
const wxPhoneAuthPurpose = ref<WxPhoneAuthPurpose>('quickLogin')
/** 微信登录探测已成功但尚未由用户点击进入 */
const wxLoginProbeReady = ref(false)
const wxAutoLoginAttempted = ref(false)
const wxAutoLoginRequesting = ref(false)
const wxAutoLoginError = ref('')
const legalDocs = ref(LEGAL_DOCS)
const appSlogan = ref(BRAND.appSlogan)
const logoPath = ref(getSingleTenantBrandLogoPath())
const passwordSwitchText = ref(resolvePasswordSwitchText())
let phoneCodeTimer: ReturnType<typeof setInterval> | null = null

function clearPhoneCodeTimer() {
  if (phoneCodeTimer) {
    clearInterval(phoneCodeTimer)
    phoneCodeTimer = null
  }
}

/** 开始手机号登录验证码倒计时，倒计时结束后允许重新发送 */
function startPhoneCodeCountdown(seconds: number) {
  clearPhoneCodeTimer()
  phoneCodeCountdown.value = seconds
  phoneCodeTimer = setInterval(() => {
    const next = phoneCodeCountdown.value - 1
    if (next <= 0) {
      clearPhoneCodeTimer()
      phoneCodeCountdown.value = 0
      return
    }
    phoneCodeCountdown.value = next
  }, 1000)
}

onLoad(() => {
  const savedAccount = authService.getRememberedAccount()
  if (savedAccount && !account.value) { account.value = savedAccount; rememberAccount.value = true }
  logoPath.value = getSingleTenantBrandLogoPath()
  void loadSingleTenantBrand().then(() => {
    logoPath.value = getSingleTenantBrandLogoPath()
  })
})

onUnmounted(() => clearPhoneCodeTimer())

watch([agreedProtocols, mode], ([agreed, currentMode]) => {
  if (agreed && currentMode === 'wx') {
    void attemptWxLogin(false)
  }
})

function handleModeSwitch() { mode.value = mode.value === 'password' ? resolveInitialLoginMode() : 'password' }
/**
 * 输入框统一采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示
 * （微信小程序 iOS + 第三方输入法下，聚焦时 setData 回写 value 会导致粘贴内容不显示、失焦后才渲染）。
 * 点击页面内按钮时 blur 一定先于 tap 触发，登录/发送验证码等读取处拿到的均为最新值。
 */
function handleAccountBlur(e: any) { account.value = e.detail.value }
function handlePasswordBlur(e: any) { password.value = e.detail.value }
function handlePhoneLoginPhoneBlur(e: any) { phoneLoginPhone.value = e.detail.value }
function handlePhoneLoginCodeBlur(e: any) { phoneLoginCode.value = e.detail.value }
/** 手机号变更时清空已获取的验证码与倒计时，避免新旧号码混用已下发的验证码 */
watch(phoneLoginPhone, (nextPhone) => {
  const trimmed = nextPhone.trim()
  if (trimmed !== nextPhone) {
    phoneLoginPhone.value = trimmed
    return
  }
  phoneLoginCode.value = ''
  phoneLoginCodeID.value = ''
  clearPhoneCodeTimer()
  phoneCodeCountdown.value = 0
})
/** 验证码变更时同步去除首尾空白 */
watch(phoneLoginCode, (nextCode) => {
  const trimmed = nextCode.trim()
  if (trimmed !== nextCode) phoneLoginCode.value = trimmed
})
function handleToggleAgreement() {
  agreedProtocols.value = !agreedProtocols.value
  if (!agreedProtocols.value) {
    resetWxAutoLoginState()
  }
}

function handleOpenLegalDoc(key: string) {
  if (!key) return
  uni.navigateTo({ url: `/packageUser/pages/legal/index?key=${key}` })
}

/** 记录微信手机号授权回调形态，只保留是否存在 code 与错误文案，避免泄露一次性凭证。 */
function logWxPhoneNumberCallback(scopeMessage: string, e: any) {
  const detail = e?.detail || {}
  logger.info('auth', scopeMessage, {
    hasCode: !!detail.code,
    errMsg: detail.errMsg || '',
    hasEncryptedData: !!detail.encryptedData,
    hasIv: !!detail.iv,
    wxPhoneAuthPurpose: wxPhoneAuthPurpose.value,
  })
}

/** normalizeWxPhoneNumberFailure 把微信取号失败原因转成用户能理解的提示。 */
function normalizeWxPhoneNumberFailure(errMsg: string) {
  const message = errMsg || ''
  if (message.includes('未绑定手机')) {
    return '当前微信未绑定手机号，请先在微信客户端绑定手机号后重试'
  }
  if (message.includes('deny') || message.includes('取消') || message.includes('拒绝')) {
    return '需要授权手机号后继续登录'
  }
  return '获取微信手机号失败'
}

/** 小程序主操作点击：协议未确认只提示，登录失败后允许用户手动重试。 */
function handleWxAutoLoginTap() {
  if (!agreedProtocols.value) {
    uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' })
    return
  }
  if (wxAutoLoginRequesting.value || requiresWxPhoneAuth.value) return
  if (wxLoginProbeReady.value && authProvider.isLoggedIn()) {
    void handleAuthSuccess('登录成功')
    return
  }
  wxAutoLoginAttempted.value = false
  void attemptWxLogin(true)
}

/** 判断微信自动登录失败是否应进入手机号授权补全。 */
function isWxAccountUnboundError(error: unknown): boolean {
  if (isApiError(error) && WX_ACCOUNT_UNBOUND_CODES.includes(error.code)) {
    return true
  }
  const message = (error as Error)?.message || ''
  return ['未注册', '未绑定', '尚未绑定', '账号未绑定'].some((keyword) => message.includes(keyword))
}

/** 重置小程序自动登录状态，用于重新勾选协议后重新尝试。 */
function resetWxAutoLoginState() {
  requiresWxPhoneAuth.value = false
  wxPhoneAuthPurpose.value = 'quickLogin'
  wxLoginProbeReady.value = false
  wxAutoLoginAttempted.value = false
  wxAutoLoginRequesting.value = false
  wxAutoLoginError.value = ''
}

/** 小程序协议确认后先用 wxMiniP 登录探测；只有用户点击主按钮时才继续进入。 */
async function attemptWxLogin(resumeAfterSuccess = false) {
  if (mode.value !== 'wx' || !agreedProtocols.value) return
  if (wxAutoLoginRequesting.value || wxAutoLoginAttempted.value || requiresWxPhoneAuth.value) return
  wxAutoLoginRequesting.value = true
  loading.value = true
  wxAutoLoginError.value = ''
  try {
    if (!(await appContextProvider.prepareTenantContextBeforeAuth())) return
    await authProvider.loginByWx()
    const authState = authProvider.getState()
    if (authState.postLoginStep === 'bindPhone') {
      wxPhoneAuthPurpose.value = 'bindAfterLogin'
      requiresWxPhoneAuth.value = true
      return
    }
    wxLoginProbeReady.value = true
    if (resumeAfterSuccess) {
      await handleAuthSuccess('登录成功')
    }
  } catch (error) {
    if (isWxAccountUnboundError(error)) {
      wxPhoneAuthPurpose.value = 'quickLogin'
      requiresWxPhoneAuth.value = true
      return
    }
    wxAutoLoginError.value = normalizeLoginError(error, '微信登录失败，请稍后重试')
    uni.showToast({ title: wxAutoLoginError.value, icon: 'none' })
  } finally {
    wxAutoLoginAttempted.value = true
    wxAutoLoginRequesting.value = false
    loading.value = false
  }
}

async function handleWxQuickLogin(e: any) {
  logWxPhoneNumberCallback('get-phone-number:callback', e)
  if (!agreedProtocols.value) { uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' }); return }
  const phoneCode = e.detail?.code
  if (!phoneCode) {
    const errMsg = e.detail?.errMsg || ''
    uni.showToast({ title: normalizeWxPhoneNumberFailure(errMsg), icon: 'none' })
    return
  }
  loading.value = true
  try {
    if (!(await appContextProvider.prepareTenantContextBeforeAuth())) return
    if (wxPhoneAuthPurpose.value === 'bindAfterLogin') {
      await authProvider.bindPhoneByWxPhone(phoneCode)
      resetWxAutoLoginState()
      await handleAuthSuccess('绑定成功')
      return
    }
    await authProvider.quickLoginByWxPhone(phoneCode)
    await handleAuthSuccess('登录成功')
  } catch (err) {
    uni.showToast({ title: normalizeLoginError(err, '登录失败'), icon: 'none' })
  } finally { loading.value = false }
}

/** App 端发送手机号登录验证码，使用 login 场景避免影响绑定手机号流程 */
async function handleSendPhoneLoginCode() {
  if (phoneCodeCountdown.value > 0 || sendingPhoneCode.value) return
  if (!agreedProtocols.value) { uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' }); return }
  if (!isPhone(phoneLoginPhone.value)) { uni.showToast({ title: '请输入正确手机号', icon: 'none' }); return }
  sendingPhoneCode.value = true
  try {
    const result = await authProvider.sendPhoneLoginCaptcha(phoneLoginPhone.value)
    phoneLoginCodeID.value = result.codeID
    startPhoneCodeCountdown(COUNTDOWN_SECONDS)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '发送失败', icon: 'none' })
  } finally {
    sendingPhoneCode.value = false
  }
}

/** App 端使用手机号、验证码和 codeID 登录，成功后复用统一登录后处理 */
async function handlePhoneLogin() {
  if (!agreedProtocols.value) { uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' }); return }
  if (!isPhone(phoneLoginPhone.value)) { uni.showToast({ title: '请输入正确手机号', icon: 'none' }); return }
  if (!phoneLoginCodeID.value) { uni.showToast({ title: '请先获取验证码', icon: 'none' }); return }
  if (!phoneLoginCode.value) { uni.showToast({ title: '请输入验证码', icon: 'none' }); return }
  loading.value = true
  try {
    if (!(await appContextProvider.prepareTenantContextBeforeAuth())) return
    await authProvider.loginByPhone(phoneLoginPhone.value, phoneLoginCode.value, phoneLoginCodeID.value)
    await handleAuthSuccess('登录成功')
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '登录失败', icon: 'none' })
  } finally { loading.value = false }
}

async function handlePasswordLogin() {
  if (!agreedProtocols.value) { uni.showToast({ title: '请先阅读并勾选协议', icon: 'none' }); return }
  if (!account.value || !password.value) { uni.showToast({ title: '请输入账号和密码', icon: 'none' }); return }
  loading.value = true
  try {
    if (!(await appContextProvider.prepareTenantContextBeforeAuth())) return
    await authProvider.loginByPassword(account.value, password.value)
    if (rememberAccount.value) authService.saveRememberedAccount(account.value)
    else authService.clearRememberedAccount()
    await handleAuthSuccess('登录成功')
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '登录失败', icon: 'none' })
  } finally { loading.value = false }
}

async function handleAuthSuccess(toastTitle: string) {
  const authState = authProvider.getState()
  if (authState.postLoginStep === 'bindPhone') {
    // #ifdef MP-WEIXIN
    if (mode.value === 'password') {
      uni.navigateTo({ url: '/packageUser/pages/bind-phone/index' })
      return
    }
    wxPhoneAuthPurpose.value = 'bindAfterLogin'
    requiresWxPhoneAuth.value = true
    uni.showToast({ title: '请授权手机号后继续', icon: 'none' })
    return;
    // #endif
    uni.navigateTo({ url: '/packageUser/pages/bind-phone/index' })
    return
  }
  uni.showToast({ title: toastTitle, icon: 'success' })
  notifyAppLoginSuccess()
  const userID = authState.user?.userID || ''
  void permissionWarmupService.tryWarmupAfterLogin(userID)
  await appContextProvider.continueAfterLogin('/pages/home/index')
}

function notifyAppLoginSuccess() {
  const app = getApp() as any
  app.onLoginSuccess?.()
}

function handleRememberChange() { rememberAccount.value = !rememberAccount.value }

function handleForgotPassword() {
  uni.navigateTo({ url: '/packageUser/pages/forgot-password/index' })
}

function clearSavedAccount() {
  authService.clearRememberedAccount()
  account.value = ''
  rememberAccount.value = false
  uni.showToast({ title: '已清除', icon: 'success' })
}
</script>

<style lang="scss" scoped>
/* 登录页 — 自定义导航栏 + 内容区共同占满整屏 */
.login-screen {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  overflow: hidden;
}

/* 登录内容区 — 白底，不可滚动，填满导航栏下方剩余高度 */
.login-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  overflow: hidden;
}

/* ── 品牌区：占满剩余高度，logo 垂直居中 ── */
.login-brand {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 32px 28px;
  box-sizing: border-box;
}

.login-logo {
  width: 168px;
  height: 168px;
  max-width: 44vw;
  max-height: 44vw;
}

/* ── 底部操作区 ── */
.login-bottom {
  flex-shrink: 0;
  padding: 20px 24px calc(32px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.login-slogan {
  display: block;
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-secondary);
  text-align: center;
}

.password-extra-row {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 12px;
}

.password-forgot {
  font-size: 13px;
  color: var(--color-primary);
}

/* 协议勾选行 */
.legal-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 20px;
}

.legal-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  margin-right: 8px;
  margin-top: 1px;
}

.legal-checkbox--checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.legal-check-icon {
  font-size: 11px;
  color: var(--color-on-primary);
}

.legal-text {
  flex: 1;
}

.legal-text__lead {
  font-size: 12px;
  color: var(--text-secondary);
}

.legal-text__link {
  font-size: 12px;
  color: var(--color-primary);
}

/* 登录按钮 */
.login-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  padding: 0 15px;
  text-align: center;
  border-radius: 48px;
  margin-bottom: 16px;
  box-sizing: border-box;
  border: none;
  background: transparent;
  white-space: nowrap;
  overflow: hidden;
}

.login-btn--primary {
  background: var(--color-primary);
}

.login-btn--hover {
  opacity: 0.8;
}

.login-btn__text {
  color: var(--color-on-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

/* 微信自动登录提示：协议确认前只做状态说明，不触发手机号授权能力 */
.wx-auto-login-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  margin-bottom: 16px;
  border-radius: 48px;
  background: var(--color-primary-light);
  box-sizing: border-box;
}

.wx-auto-login-status__text {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-primary);
  text-align: center;
}

/* 切换方式链接 */
.login-switch {
  text-align: center;
  padding: 8px 0;
}

.login-switch__text {
  font-size: 14px;
  color: var(--color-primary);
}

/* App 手机号验证码登录表单 */
.phone-login-form {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.phone-login-field {
  padding: 12px 0;
  border-bottom: 1rpx solid var(--border-color);
}

.phone-login-field:last-child {
  border-bottom: none;
}

.phone-login-field--inline {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
}

.phone-login-field__main {
  flex: 1;
  min-width: 0;
}

.phone-login-field__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.phone-login-field__input {
  width: 100%;
  min-width: 0;
  font-size: 15px;
  color: var(--text-primary);
  padding: 0;
  margin: 0;
}

.phone-login-code-btn {
  flex-shrink: 0;
  min-width: 100px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-login-code-btn--disabled {
  opacity: 0.6;
}

.phone-login-code-btn__text {
  font-size: 13px;
  color: var(--color-primary);
  white-space: nowrap;
}

/* 账号密码表单 */
.login-form {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.login-form__item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1rpx solid var(--border-color);
}

.login-form__item:last-child {
  border-bottom: none;
}

.login-form__label {
  width: 48px;
  font-size: 14px;
  color: var(--text-primary);
  flex-shrink: 0;
}

.login-form__input {
  flex: 1;
  width: 0;
  min-width: 0;
  font-size: 14px;
  color: var(--text-primary);
  padding: 0;
  margin: 0;
}

/* 记住账号行 */
.remember-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.remember-left {
  display: flex;
  align-items: center;
}

.remember-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  background: var(--card-bg);
}

.remember-checkbox--checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.remember-check-icon {
  font-size: 11px;
  color: var(--color-on-primary);
}

.remember-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.remember-clear {
  font-size: 13px;
  color: var(--color-primary);
}

.legal-check-icon {
  font-size: 11px;
  color: var(--color-on-primary);
}

.legal-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.legal-text__lead {
  color: var(--text-secondary);
}

.legal-text__link {
  color: var(--color-primary);
}

</style>
