<template>
<app-navigation-bar :title="changingNetwork ? '更换 Wi-Fi' : '一键配网'" />

<scroll-view class="wifi-page" scroll-y type="list">
  <view class="steps">
    <text class="steps__item steps__item--done">1 准备设备</text>
    <text class="steps__item steps__item--active">2 选择 Wi-Fi</text>
    <text class="steps__item">3 {{changingNetwork ? '连接网络' : '完成添加'}}</text>
  </view>

  <view v-if="!bluetoothReady" class="bluetooth-banner" @tap="handleRetryBluetooth" hover-class="bluetooth-banner--hover">
    <app-icon class="bluetooth-banner__icon" name="tabler:alert-triangle" :size="18" />
    <text class="bluetooth-banner__text">{{bluetoothReason}}，点击重试</text>
  </view>

  <view class="card">
    <text class="card__title">想让设备连接哪个 Wi-Fi？</text>
    <text class="card__desc">{{changingNetwork ? '请选择 2.4GHz 网络并输入密码。新网络连接后会自动保存，原网络和绑定不变。' : '请选择 2.4GHz 网络，也可以手动输入网络名称。'}}</text>

    <view v-if="wifiMode === 'system-return' && !ssid" class="wifi-refresh" @tap="handleRefreshWifi" hover-class="wifi-refresh--hover">
      <text class="wifi-refresh__text">{{wifiGuideText}}</text>
    </view>

    <view class="field">
      <text class="field__label">WiFi 名称</text>
      <view :class="`field__input-wrap field__input-wrap--select ${wifiPickerVisible ? 'field__input-wrap--active' : ''}`">
        <input class="field__input" :value="ssid" placeholder="请输入 WiFi 名称" @input="handleSsidInput" @blur="handleSsidBlur" @focus="handleSsidFocus" />
        <view class="wifi-input-action" @tap="handleWifiInputAction" hover-class="wifi-input-action--hover">
          <loading v-if="wifiListLoading" :size="18" color="var(--color-primary)" />
          <view v-else :class="`wifi-input-action__chevron ${wifiPickerVisible ? 'wifi-input-action__chevron--open' : ''}`" />
        </view>
      </view>
      <scroll-view v-if="wifiPickerVisible && filteredWifiList.length > 0" class="wifi-select-list" scroll-y :style="{ height: wifiSelectListHeight }">
        <view v-for="item in filteredWifiList" :key="item.ssid" :class="`wifi-select-list__item ${ssid === item.ssid ? 'wifi-select-list__item--active' : ''}`" @tap="handleSelectWifi(item.ssid)" hover-class="wifi-select-list__item--hover">
          <text class="wifi-select-list__name">{{item.ssid}}</text>
          <text class="wifi-select-list__meta">{{formatWifiSignalText(item.rssi)}}</text>
        </view>
      </scroll-view>
    </view>

    <view class="field">
      <text class="field__label">WiFi 密码</text>
      <view class="field__input-wrap field__input-wrap--password">
        <input class="field__input" :value="password" :password="!passwordVisible" placeholder="请输入 WiFi 密码" @blur="handlePasswordBlur" />
        <view class="password-eye" @tap="togglePasswordVisible" hover-class="password-eye--hover">
          <app-icon class="password-eye__icon" :name="passwordVisible ? 'tabler:eye' : 'tabler:eye-off'" :size="20" />
        </view>
      </view>
    </view>
  </view>
</scroll-view>

<view v-if="guideVisible" class="guide-mask" @tap="handleGuideClose">
  <view class="guide-panel" @tap.stop="noop">
    <text class="guide-panel__title">如何获取 WiFi 列表</text>
    <text class="guide-panel__text">1. 打开系统 WiFi 设置页面</text>
    <text class="guide-panel__text">2. 连接家庭 WiFi</text>
    <text class="guide-panel__text">3. 返回小程序后允许微信定位权限，并确认 WiFi 名称</text>
    <view class="guide-panel__actions">
      <view class="guide-btn guide-btn--ghost" @tap="handleGuideClose"><text class="guide-btn__text guide-btn__text--ghost">取消</text></view>
      <view class="guide-btn" @tap="handleGoSystemWifi"><text class="guide-btn__text">去获取</text></view>
    </view>
  </view>
</view>

<view class="footer">
  <view class="secondary-btn" @tap="handleBack" hover-class="secondary-btn--hover">
    <text class="secondary-btn__text">上一步</text>
  </view>
  <view class="primary-btn" @tap="handleSubmit" hover-class="primary-btn--hover">
    <loading v-if="loading" :size="20" color="var(--color-on-primary)" />
    <text v-else class="primary-btn__text">连接网络</text>
  </view>
</view>

<privacy-authorization-modal />

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import PrivacyAuthorizationModal from '../../../components/privacy-authorization-modal/privacy-authorization-modal.vue';
import { computed, ref, onUnmounted } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { provisionProvider, type ProvisionProviderState } from '../../../providers/provision.provider'
import { ensurePageReady } from '../../../utils/page-guard'
import type { BleScanResult } from '../../../domain/models/ble-scan-result.model'
import type { WifiCredentialSource, WifiOption, WifiPrepareMode } from '../../../domain/models/wifi-credential.model'
import { ensureBluetoothReady, ensureBluetoothReadyWithGuide } from '../../../utils/ble-readiness'
import { eventBus } from '../../../utils/event-bus'
import { localStorage } from '../../../data/datasources/local-storage.datasource'

interface LocalWifiCredentialCache {
  ssid: string
  password: string
  updatedAt: number
}

// WIFI_CREDENTIAL_CACHE_KEY 保存最近一次点击下一步时的 WiFi 名称和密码。
const WIFI_CREDENTIAL_CACHE_KEY = 'provision_wifi_credential'

function decodeQueryValue(value: string | undefined): string {
  if (!value) return ''
  try { return decodeURIComponent(value) } catch { return value }
}

function buildScannedDeviceFromQuery(query: Record<string, string | undefined>): BleScanResult | null {
  const deviceId = decodeQueryValue(query.deviceId)
  if (!deviceId) return null
  const deviceName = decodeQueryValue(query.deviceName)
  const productID = decodeQueryValue(query.productID)
  const mac = decodeQueryValue(query.mac)
  const moduleVersionValue = Number(decodeQueryValue(query.moduleVersion))
  return {
    deviceId,
    name: deviceName,
    localName: deviceName,
    RSSI: 0,
    advertisServiceUUIDs: [],
    serviceData: {},
    productID,
    deviceName,
    mac,
    moduleVersion: Number.isFinite(moduleVersionValue) ? moduleVersionValue : undefined,
  }
}

function reasonToText(reason: string | undefined): string {
  switch (reason) {
    case 'system_off': return '系统蓝牙未打开'
    case 'app_unauthorized': return '微信蓝牙权限未授权'
    case 'location_off': return '手机定位未打开'
    case 'location_unauthorized': return '微信位置权限未授权'
    case 'location_not_determined': return '待授权位置权限'
    case 'location_reduced_accuracy': return '需开启精确位置'
    case 'privacy_not_declared': return '蓝牙隐私声明未配置'
    case 'scope_not_determined': return '待授权蓝牙权限'
    case 'scope_denied': return '小程序蓝牙权限被拒绝'
    case 'adapter_busy': return '蓝牙暂不可用'
    default: return '蓝牙不可用'
  }
}

const wifiMode = ref<WifiPrepareMode>('manual')
/** 页面不重置已准备的换网会话，保留目标和本次请求标识。 */
const changingNetwork = ref(provisionProvider.getState().mode === 'changeNetwork')
/** redirectTo 的主动页面交接不取消事务，用户返回或销毁则取消本地等待。 */
const networkPage = { closed: false, handedOff: false }
const wifiList = ref<WifiOption[]>([])
const currentSsid = ref('')
const ssid = ref('')
// ssidInputKeyword 是 WiFi 名称输入框聚焦时的实时筛选关键字：聚焦期间只更新它而不回写 ssid.value，
// 避免 setData 回写 value 干扰原生输入框显示；失焦时才把最终值同步回 ssid。
const ssidInputKeyword = ref('')
// ssidDirty 标记用户是否已手动输入或选择 WiFi 名称，避免刷新时覆盖用户输入。
const ssidDirty = ref(false)
// ssidFromLocalCache 标记当前 WiFi 名称是否只来自本地缓存，避免蜂窝网络下误认为已连接 WiFi。
const ssidFromLocalCache = ref(false)
const password = ref('')
// passwordVisible 控制 WiFi 密码输入框的小眼睛显隐状态。
const passwordVisible = ref(false)
const guideVisible = ref(false)
const loading = ref(false)
// wifiListLoading 只表示 WiFi 列表获取状态，用于输入框右侧的轻量反馈。
const wifiListLoading = ref(false)
// wifiPickerVisible 控制 WiFi 名称输入框下方的可选列表，输入仍保持可编辑。
const wifiPickerVisible = ref(false)
// wifiInputFilterActive 仅标记用户正在键入筛选，不把“已选择的 SSID”当作筛选条件。
const wifiInputFilterActive = ref(false)
const bluetoothReady = ref(true)
const bluetoothReason = ref('')
const unsubscribes: Array<() => void> = []

const filteredWifiList = computed(() => {
  const keyword = ssidInputKeyword.value.trim().toLowerCase()
  if (!keyword || !wifiInputFilterActive.value) return wifiList.value
  const matched = wifiList.value.filter((item) => item.ssid.toLowerCase().includes(keyword))
  return matched.length > 0 ? matched : wifiList.value
})
// wifiFailureCode 保存 WiFi 准备失败原因，便于页面区分蜂窝网络和权限问题。
const wifiFailureCode = ref<ProvisionProviderState['wifiFailureCode']>(undefined)
// wifiGuideText 根据失败原因展示打开 WiFi 或定位授权的引导文案。
const wifiGuideText = computed(() => wifiFailureCode.value === 'WIFI_NOT_CONNECTED'
  ? '当前手机未连接 WiFi，请先打开并连接家庭 WiFi 后返回刷新'
  : '未自动获取到 WiFi 名称，请允许微信定位权限后点此刷新')
// wifiSelectListHeight 按最多 4 条 WiFi 的高度限制下拉列表，超出后在列表内部滚动。
const wifiSelectListHeight = computed(() => `${Math.min(filteredWifiList.value.length, 4) * 44}px`)

/** normalizeWifiListBySsid 按 WiFi 名称去重，重复名称保留信号值更高的一项。 */
function normalizeWifiListBySsid(list: WifiOption[]): WifiOption[] {
  const deduped = new Map<string, WifiOption>()
  list.forEach((item) => {
    const key = item.ssid.trim()
    if (!key) return
    const existing = deduped.get(key)
    const existingSignal = existing?.rssi ?? -1
    const nextSignal = item.rssi ?? -1
    if (!existing || nextSignal > existingSignal) deduped.set(key, item)
  })
  return Array.from(deduped.values())
}

/** formatWifiSignalText 将微信返回的信号强度数值转换为用户可读的文字。 */
function formatWifiSignalText(rssi: number | undefined): string {
  if (typeof rssi !== 'number') return '信号未知'
  if (rssi >= 70) return '信号强'
  if (rssi >= 35) return '信号一般'
  return '信号弱'
}

/** syncSsidFromCurrent 将系统当前 WiFi 名称同步到表单，前提是用户尚未手动改过名称。 */
function syncSsidFromCurrent() {
  if (ssidDirty.value) return
  if (!currentSsid.value) return
  ssid.value = currentSsid.value
  ssidFromLocalCache.value = false
}

/** readLocalWifiCredential 读取本机保存的最近一次 WiFi 凭据。 */
function readLocalWifiCredential(): LocalWifiCredentialCache | null {
  const cache = localStorage.get<LocalWifiCredentialCache>(WIFI_CREDENTIAL_CACHE_KEY)
  if (!cache || typeof cache.ssid !== 'string' || typeof cache.password !== 'string') return null
  return cache
}

/** applyLocalWifiCredential 用本地缓存补齐空表单，避免覆盖用户当前已输入内容。 */
function applyLocalWifiCredential() {
  const cache = readLocalWifiCredential()
  if (!cache) return
  if (!ssid.value && cache.ssid) {
    ssid.value = cache.ssid
    ssidFromLocalCache.value = true
  }
  if (!password.value) password.value = cache.password
}

/** saveLocalWifiCredential 在点击下一步时立即保存 WiFi 凭据，不依赖后续配网结果。 */
function saveLocalWifiCredential(ssidValue: string, passwordValue: string) {
  localStorage.set<LocalWifiCredentialCache>(WIFI_CREDENTIAL_CACHE_KEY, {
    ssid: ssidValue,
    password: passwordValue,
    updatedAt: Date.now(),
  })
}

/** syncState 将配网 provider 状态同步到页面表单和 WiFi 下拉列表。 */
function syncState(state: ProvisionProviderState) {
  changingNetwork.value = state.mode === 'changeNetwork'
  wifiMode.value = state.wifiMode
  wifiList.value = normalizeWifiListBySsid(state.wifiList)
  currentSsid.value = state.currentSsid
  wifiFailureCode.value = state.wifiFailureCode
  if (state.wifiFailureCode === 'WIFI_NOT_CONNECTED' && ssidFromLocalCache.value && !ssidDirty.value) {
    ssid.value = ''
    ssidFromLocalCache.value = false
  }
  syncSsidFromCurrent()
  guideVisible.value = state.needsGuide && !ssid.value && state.wifiFailureCode !== 'WIFI_NOT_CONNECTED'
}

// refreshBluetoothStatus 只更新存活页面，权限查询迟到时不覆盖退出后的状态。
async function refreshBluetoothStatus() {
  if (networkPage.closed) return
  const result = await ensureBluetoothReady()
  if (networkPage.closed) return
  bluetoothReady.value = result.ok
  bluetoothReason.value = result.ok ? '' : reasonToText(result.reason)
}

// prepareWifiWithLoading 控制当前页面加载态，退出后不再启动 Wi-Fi 准备。
async function prepareWifiWithLoading() {
  if (networkPage.closed) return
  wifiListLoading.value = true
  try {
    await provisionProvider.prepareWifi()
  } finally {
    if (!networkPage.closed) wifiListLoading.value = false
  }
}

// 初始化按页面存活检查逐步推进，避免卸载后的续步重新订阅事件。
onLoad(async (query: Record<string, string | undefined> = {}) => {
  const ready = await ensurePageReady('/packageBluetooth/pages/wifi/index')
  if (!ready || networkPage.closed) return
  if (query.changeNetwork === '1' && provisionProvider.getState().mode !== 'changeNetwork') {
    uni.showToast({ title: '换网会话已失效，请从设备设置重新进入', icon: 'none' })
    uni.navigateBack({ delta: 1 })
    return
  }
  if (query.fromScan === '1') {
    provisionProvider.startSession()
    const scannedDevice = buildScannedDeviceFromQuery(query)
    if (scannedDevice) provisionProvider.selectScannedDevice(scannedDevice)
    provisionProvider.confirmPrepared()
  }
  applyLocalWifiCredential()
  unsubscribes.push(provisionProvider.subscribe(syncState))
  await prepareWifiWithLoading()
  if (networkPage.closed) return
  await refreshBluetoothStatus()
  if (networkPage.closed) return
  const adapterListener = (...args: unknown[]) => {
    if (networkPage.closed) return
    const res = args[0] as { available?: boolean } | undefined
    bluetoothReady.value = !!res?.available
    bluetoothReason.value = res?.available ? '' : '蓝牙已关闭'
  }
  eventBus.on('ble:adapter-state', adapterListener)
  unsubscribes.push(() => eventBus.off('ble:adapter-state', adapterListener))
})

onShow(() => {
  if (wifiMode.value === 'system-return' || ssid.value.length === 0) void prepareWifiWithLoading()
  void refreshBluetoothStatus()
})

// disposePage 幂等释放订阅；迟到初始化不能给已退出页面重新挂监听或影响下一会话。
function disposePage() {
  if (networkPage.closed) return
  networkPage.closed = true
  unsubscribes.splice(0).forEach(fn => fn())
  if (changingNetwork.value && !networkPage.handedOff) provisionProvider.cancel('PAGE_UNLOADED')
}
onUnload(disposePage)
onUnmounted(disposePage)

function handleSelectWifi(selectedSsid: string) {
  ssidDirty.value = true
  ssidFromLocalCache.value = false
  ssid.value = selectedSsid
  wifiInputFilterActive.value = false
  wifiPickerVisible.value = false
}

function handleSsidInput(e: any) {
  ssidDirty.value = true
  ssidFromLocalCache.value = false
  wifiInputFilterActive.value = true
  // 聚焦输入期间只更新筛选关键字，不回写 ssid.value，避免 setData 回写干扰原生输入框显示。
  ssidInputKeyword.value = e.detail.value
  if (wifiMode.value === 'android-list' && wifiList.value.length > 0) wifiPickerVisible.value = true
}

/** ssid 失焦时把最终输入同步回表单值，并让筛选关键字与之一致 */
function handleSsidBlur(e: any) {
  ssid.value = e.detail.value
  ssidInputKeyword.value = e.detail.value
}

function handleSsidFocus() {
  wifiInputFilterActive.value = false
  if (wifiMode.value === 'android-list' && wifiList.value.length > 0) wifiPickerVisible.value = true
}

function handleWifiInputAction() {
  if (wifiListLoading.value) return
  if (wifiMode.value === 'android-list' && wifiList.value.length > 0) {
    wifiPickerVisible.value = !wifiPickerVisible.value
    return
  }
  void handleRefreshWifi()
}

function togglePasswordVisible() { passwordVisible.value = !passwordVisible.value }

/** WiFi 密码失焦同步：聚焦期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于下一步按钮 tap */
function handlePasswordBlur(e: any) { password.value = e.detail.value }
function handleGuideClose() { guideVisible.value = false }

function handleGoSystemWifi() {
  guideVisible.value = false
  uni.showToast({ title: '请前往系统 WiFi 设置后返回确认', icon: 'none' })
}

function promptLocationSetting() {
  uni.showModal({
    title: '开启定位权限', content: 'iOS 获取 WiFi 名称需要微信定位权限。请开启后返回本页刷新。', confirmText: '去开启', cancelText: '手动填',
    success: (res) => {
      if (!res.confirm) return
      uni.openSetting({ success: (setting) => { if (setting.authSetting['scope.userLocation'] === true) void prepareWifiWithLoading() } })
    }
  })
}

async function handleRefreshWifi() {
  loading.value = true
  try {
    ssidDirty.value = false
    ssidFromLocalCache.value = false
    wifiInputFilterActive.value = false
    await prepareWifiWithLoading()
    if (!ssid.value && wifiFailureCode.value !== 'WIFI_NOT_CONNECTED') promptLocationSetting()
  } finally { loading.value = false }
}

function handleBack() { uni.navigateBack({ delta: 1 }) }
function noop() {}

async function handleRetryBluetooth(): Promise<boolean> {
  const result = await ensureBluetoothReadyWithGuide()
  bluetoothReady.value = result.ok
  bluetoothReason.value = result.ok ? '' : reasonToText(result.reason)
  return result.ok
}

/** navigateProvisionPage 只允许仍在前台的表单交接会话，路由失败不遗留后台配网。 */
function navigateProvisionPage(url: string) {
  if (networkPage.closed) return
  networkPage.handedOff = true
  uni.redirectTo({
    url,
    fail: () => {
      networkPage.handedOff = false
      provisionProvider.cancel('NAVIGATION_FAILED')
      uni.showToast({ title: '页面打开失败，请重新开始', icon: 'none' })
    },
  })
}

async function handleSubmit() {
  if (loading.value || networkPage.closed) return
  const ssidTrimmed = ssid.value.trim()
  if (!ssidTrimmed) {
    uni.showToast({ title: wifiFailureCode.value === 'WIFI_NOT_CONNECTED' ? '请先打开并连接 WiFi' : '请输入 WiFi 名称', icon: 'none' })
    return
  }
  saveLocalWifiCredential(ssidTrimmed, password.value)
  if (!bluetoothReady.value) {
    const ok = await handleRetryBluetooth()
    if (!ok || networkPage.closed) return
  }
  loading.value = true
  try {
    await provisionProvider.submitWifi({
      ssid: ssidTrimmed,
      password: password.value,
      source: wifiMode.value as WifiCredentialSource,
    })
    navigateProvisionPage('/packageBluetooth/pages/progress/index')
  } catch { navigateProvisionPage('/packageBluetooth/pages/result/index') }
  finally { loading.value = false }
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageBluetooth/pages/wifi/index', () => guideVisible.value ? [
  { id: 'close-guide', label: '关闭引导', role: 'button', enabled: true, tap: handleGuideClose },
] : [
  { id: 'ssid', label: 'Wi-Fi 名称', role: 'input', enabled: !loading.value,
    input: (value) => { handleSsidInput({ detail: { value } }); handleSsidBlur({ detail: { value } }); } },
  { id: 'password', label: 'Wi-Fi 密码', role: 'input', enabled: !loading.value,
    input: (value) => handlePasswordBlur({ detail: { value } }) },
  { id: 'wifi-picker', label: '选择 Wi-Fi', role: 'button', enabled: !loading.value, tap: handleWifiInputAction },
  ...(!bluetoothReady.value ? [{ id: 'retry-bluetooth', label: '重新连接蓝牙', role: 'button' as const,
    enabled: !loading.value, tap: handleRetryBluetooth }] : []),
  ...(wifiPickerVisible.value ? filteredWifiList.value.map((item, index) => ({
    id: 'wifi-' + index, label: item.ssid, role: 'button' as const, enabled: !loading.value,
    tap: () => handleSelectWifi(item.ssid),
  })) : []),
  { id: 'submit', label: '连接网络', role: 'button', enabled: !loading.value && !!ssid.value.trim(), tap: handleSubmit },
  { id: 'back', label: '返回上一步', role: 'button', enabled: !loading.value, tap: handleBack },
]);
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.wifi-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: hidden;
  padding: 16px;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.steps__item {
  font-size: 12px;
  color: var(--text-secondary);
}

.steps__item--active,
.steps__item--done {
  color: var(--color-primary);
  font-weight: 600;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px 20px 24px;
}

.card__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.card__desc {
  display: block;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-all;
  color: var(--text-secondary);
}

.wifi-refresh {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-primary-light);
}

.wifi-refresh--hover {
  opacity: 0.72;
}

.wifi-refresh__text {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-primary);
}

.field {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

.field__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.field__input-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.field__input-wrap--select {
  padding-right: 8px;
}

.field__input-wrap--password {
  padding-right: 8px;
}

.field__input-wrap--active {
  background: var(--color-primary-light);
}

.field__input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 46px;
  line-height: 46px;
  background: transparent;
  font-size: 15px;
  color: var(--text-primary);
}

.wifi-input-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 8px;
}

.wifi-input-action--hover {
  background: var(--color-bg-secondary);
}

.password-eye {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 8px;
  color: var(--text-secondary);
}

.password-eye--hover {
  background: var(--card-bg);
}

.password-eye__icon {
  color: var(--text-secondary);
}

.wifi-input-action__chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--text-secondary);
  border-bottom: 2px solid var(--text-secondary);
  transform: rotate(45deg);
  transition: transform 0.16s ease;
}

.wifi-input-action__chevron--open {
  transform: rotate(225deg);
}

.wifi-select-list {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  max-height: 188px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--card-bg);
}

.wifi-select-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border-color);
}

.wifi-select-list__item:last-child {
  border-bottom: 0;
}

.wifi-select-list__item--active {
  background: var(--color-primary-light);
}

.wifi-select-list__item--hover {
  opacity: 0.72;
}

.wifi-select-list__name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-all;
  color: var(--text-primary);
}

.wifi-select-list__meta {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.guide-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  background: var(--color-mask);
  z-index: 10;
}

.guide-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: var(--card-bg);
}

.guide-panel__title {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.guide-panel__text {
  display: block;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.guide-panel__actions {
  display: flex;
  margin-top: 10px;
}

.guide-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary);
}

.guide-btn--ghost {
  background: var(--color-bg-secondary);
  margin-right: 12px;
}

.guide-btn__text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-on-primary);
}

.guide-btn__text--ghost {
  color: var(--text-primary);
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--card-bg);
}

.primary-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 14px;
  background: var(--color-primary);
}

.secondary-btn {
  width: 96px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 14px;
  background: var(--color-bg-secondary);
}

.secondary-btn--hover {
  opacity: 0.72;
}

.secondary-btn__text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.primary-btn--hover {
  opacity: 0.78;
}

.primary-btn__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-on-primary);
}

.bluetooth-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-bg);
  border-radius: 8px;
}

.bluetooth-banner--hover {
  background: var(--color-warning-bg);
}

.bluetooth-banner__icon {
  color: var(--color-warning);
}

.bluetooth-banner__text {
  flex: 1;
  font-size: 14px;
  color: var(--color-warning);
}

</style>
