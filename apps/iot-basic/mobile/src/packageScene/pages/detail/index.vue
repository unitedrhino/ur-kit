<template>
<app-navigation-bar title="场景详情" />

<scroll-view class="detail-page" scroll-y type="list">
  <loading v-if="loading" text="加载中..." />

  <template v-else-if="scene">
    <!-- 顶部信息卡 -->
    <view class="info-card">
      <view class="info-card__header">
        <view class="info-card__title-row">
          <text class="info-card__name">{{scene.name}}</text>
          <view :class="`info-card__status info-card__status--${scene.status}`">
            <text>{{statusText}}</text>
          </view>
        </view>
        <text v-if="scene.desc" class="info-card__desc">{{scene.desc}}</text>
      </view>
      <view class="info-card__meta">
        <view class="meta-item">
          <text class="meta-label">类型</text>
          <text class="meta-value">{{typeText}}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">上次执行</text>
          <text class="meta-value">{{lastRunTimeText}}</text>
        </view>
      </view>
      <!-- 自动化场景显示启用/禁用开关 -->
      <view v-if="scene.type === 'auto'" class="info-card__switch" @tap="handleToggleStatus">
        <text class="switch-label">{{scene.status === 1 ? '已启用' : '已禁用'}}</text>
        <view :class="`scene-switch ${scene.status === 1 ? 'scene-switch--on' : ''}`">
          <view class="scene-switch__thumb"></view>
        </view>
      </view>
    </view>

    <!-- 触发条件区域（仅自动化场景） -->
    <view v-if="scene.type === 'auto' && triggerTexts.length > 0" class="section-card">
      <view class="section-card__header">
        <text class="section-card__title">触发条件</text>
        <text class="section-card__count">{{triggerTexts.length}}个</text>
      </view>
      <view class="section-card__body">
        <view class="flow-item" v-for="(item, index) in triggerTexts" :key="item">
          <view class="flow-dot flow-dot--trigger"></view>
          <text class="flow-text">{{item}}</text>
        </view>
      </view>
    </view>

    <!-- 生效条件区域（仅自动化场景） -->
    <view v-if="scene.type === 'auto'" class="section-card">
      <view class="section-card__header">
        <text class="section-card__title">生效条件</text>
      </view>
      <view class="section-card__body">
        <view class="condition-row">
          <text class="condition-text">{{conditionText}}</text>
        </view>
      </view>
    </view>

    <!-- 执行动作区域 -->
    <view v-if="actionTexts.length > 0" class="section-card">
      <view class="section-card__header">
        <text class="section-card__title">执行动作</text>
        <text class="section-card__count">{{actionTexts.length}}个</text>
      </view>
      <view class="section-card__body">
        <view class="flow-item" v-for="(item, index) in actionTexts" :key="item">
          <view class="flow-dot flow-dot--action"></view>
          <view v-if="index < actionTexts.length - 1" class="flow-line"></view>
          <text class="flow-text">{{item}}</text>
        </view>
      </view>
    </view>

    <!-- 执行日志入口 -->
    <view class="section-card section-card--link" @tap="handleViewLog" hover-class="section-card--hover">
      <view class="section-card__header">
        <text class="section-card__title">执行日志</text>
        <text class="section-card__arrow">›</text>
      </view>
    </view>

    <!-- 异常原因（仅状态异常时） -->
    <view v-if="scene.status === 3 && scene.reason" class="error-card">
      <text class="error-card__title">异常原因</text>
      <text class="error-card__reason">{{scene.reason}}</text>
    </view>

    <!-- 底部操作区 -->
    <view class="action-bar">
      <view class="action-btn action-btn--trigger" @tap="handleTrigger" hover-class="action-btn--hover">
        <text class="action-btn__text">手动触发</text>
      </view>
      <view class="action-btn action-btn--edit" @tap="handleEdit" hover-class="action-btn--hover">
        <text class="action-btn__text">编辑</text>
      </view>
      <view class="action-btn action-btn--delete" @tap="handleShowDelete" hover-class="action-btn--hover">
        <text class="action-btn__text">删除</text>
      </view>
    </view>

    <!-- 底部安全区 -->
    <safe-area position="bottom" />
  </template>
</scroll-view>

<!-- 删除确认弹窗 -->
<view v-if="showDeleteConfirm" class="confirm-mask" @tap="handleCancelDelete">
  <view class="confirm-dialog" @tap.stop="">
    <text class="confirm-dialog__title">确认删除</text>
    <text class="confirm-dialog__content">删除后无法恢复，确认删除该场景？</text>
    <view class="confirm-dialog__actions">
      <view class="confirm-btn confirm-btn--cancel" @tap="handleCancelDelete">
        <text>取消</text>
      </view>
      <view class="confirm-btn confirm-btn--confirm" @tap="handleConfirmDelete">
        <text>删除</text>
      </view>
    </view>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { sceneService } from '../../../services/scene.service'
import { sceneProvider } from '../../../providers/scene.provider'
import type { SceneEntity } from '../../../domain/entities/scene.entity'
import { ensurePageReady } from '../../../utils/page-guard'

const scene = ref<SceneEntity | null>(null)
const loading = ref(true)
const typeText = ref('')
const statusText = ref('')
const lastRunTimeText = ref('')
const triggerTexts = ref<string[]>([])
const conditionText = ref('')
const actionTexts = ref<string[]>([])
const showDeleteConfirm = ref(false)
let sceneID = ''

function formatScene(s: SceneEntity) {
  const typeTextVal = s.type === 'auto' ? '自动化' : '手动触发'
  const statusMap: Record<number, string> = { 1: '已启用', 2: '已禁用', 3: '异常' }
  const statusTextVal = statusMap[s.status] || '未知'
  let lastRunTimeTextVal = '未执行'
  if (s.lastRunTime) {
    const d = new Date(s.lastRunTime * 1000)
    lastRunTimeTextVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const triggerTextsVal = (s.triggers || []).map((t: any) => {
    if (t.type === 'device') {
      const m: Record<string, string> = { connected: '设备上线时', disConnected: '设备离线时', propertyReport: '属性上报时', eventReport: '事件上报时' }
      return m[t.device?.type || ''] || '设备触发'
    } else if (t.type === 'timer') {
      const m: Record<string, string> = { at: '指定时间', loop: '循环执行', sunRises: '日出时', sunSet: '日落时' }
      let text = m[t.timer?.execType || ''] || '定时触发'
      if (t.timer?.execType === 'at' && t.timer.execAt) {
        const h = Math.floor(t.timer.execAt / 3600)
        const min = Math.floor((t.timer.execAt % 3600) / 60)
        text += ` ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      }
      return text
    } else if (t.type === 'weather') return '天气变化时'
    return '未知触发'
  })
  let conditionTextVal = '全天生效'
  if (s.conditions) {
    const timeRange = s.conditions.validRanges?.find((r: any) => r.type === 'time')?.timeRange
    if (timeRange && timeRange.type === 'customRange') {
      const sh = Math.floor((timeRange.startTime || 0) / 3600), sm = Math.floor(((timeRange.startTime || 0) % 3600) / 60)
      const eh = Math.floor((timeRange.endTime || 0) / 3600), em = Math.floor(((timeRange.endTime || 0) % 3600) / 60)
      conditionTextVal = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')} ~ ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
    } else if (timeRange?.type === 'light') conditionTextVal = '白天(日出到日落)'
    else if (timeRange?.type === 'night') conditionTextVal = '夜间(日落到日出)'
  }
  const actionTextsVal = (s.actions || []).map((a: any) => {
    switch (a.type) {
      case 'device': return '控制设备' + (a.device?.deviceAlias ? ` (${a.device.deviceAlias})` : '')
      case 'delay': return `延时 ${a.delay || 0} 秒`
      case 'notify': return '发送通知'
      case 'alarm': return a.alarm?.mode === 'relieve' ? '解除告警' : '触发告警'
      case 'scene': return `执行场景${a.scene?.sceneName ? ` (${a.scene.sceneName})` : ''}`
      default: return '未知动作'
    }
  })
  return { typeTextVal, statusTextVal, lastRunTimeTextVal, triggerTextsVal, conditionTextVal, actionTextsVal }
}

async function loadScene() {
  try {
    const s = await sceneService.getDetail(sceneID)
    const { typeTextVal, statusTextVal, lastRunTimeTextVal, triggerTextsVal, conditionTextVal, actionTextsVal } = formatScene(s)
    scene.value = s
    typeText.value = typeTextVal
    statusText.value = statusTextVal
    lastRunTimeText.value = lastRunTimeTextVal
    triggerTexts.value = triggerTextsVal
    conditionText.value = conditionTextVal
    actionTexts.value = actionTextsVal
    loading.value = false
  } catch {
    loading.value = false
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

onLoad(async (query: Record<string, string | undefined> = {}) => {
  const ready = await ensurePageReady('/packageScene/pages/detail/index', query as Record<string, string>)
  if (!ready) { loading.value = false; return }
  sceneID = query.id || ''
  await loadScene()
})

onShow(async () => {
  if (sceneID && !loading.value && scene.value) await loadScene()
})

async function handleTrigger() {
  if (!scene.value) return
  try { await sceneService.manualTrigger(scene.value.id); uni.showToast({ title: '已触发', icon: 'success' }) }
  catch { uni.showToast({ title: '触发失败', icon: 'none' }) }
}

function handleEdit() {
  if (!scene.value) return
  uni.navigateTo({ url: `/packageScene/pages/create/index?id=${scene.value.id}` })
}

async function handleToggleStatus() {
  if (!scene.value) return
  const { id, status } = scene.value
  try {
    await sceneProvider.toggleStatus(id, status)
    const newStatus = status === 1 ? 2 : 1
    scene.value = { ...scene.value, status: newStatus }
    statusText.value = newStatus === 1 ? '已启用' : '已禁用'
    uni.showToast({ title: newStatus === 1 ? '已启用' : '已禁用', icon: 'success' })
  } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
}

function handleViewLog() {
  if (!scene.value) return
  uni.navigateTo({ url: `/packageScene/pages/log/index?sceneID=${scene.value.id}&sceneName=${encodeURIComponent(scene.value.name)}` })
}

function handleShowDelete() { showDeleteConfirm.value = true }
function handleCancelDelete() { showDeleteConfirm.value = false }

async function handleConfirmDelete() {
  if (!scene.value) return
  try {
    await sceneProvider.deleteScene(scene.value.id)
    uni.showToast({ title: '已删除', icon: 'success' })
    setTimeout(() => uni.navigateBack({ delta: 1 }), 800)
  } catch { uni.showToast({ title: '删除失败', icon: 'none' }) }
  showDeleteConfirm.value = false
}
</script>

<style lang="scss" scoped>
/* 页面容器 */
.detail-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
  padding-bottom: 32rpx;
}

/* 导航栏编辑按钮 */
.nav-edit-btn {
  padding: 8rpx 20rpx;
  font-size: 28rpx;
  color: var(--color-primary);
}
.nav-edit-btn--hover {
  opacity: 0.6;
}

/* ========== 顶部信息卡 ========== */
.info-card {
  margin: 24rpx 32rpx;
  padding: 32rpx;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
}
.info-card__header {
  margin-bottom: 24rpx;
}
.info-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.info-card__name {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-card__status {
  padding: 4rpx 16rpx;
  border-radius: var(--radius-full, 9999px);
  font-size: 22rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}
.info-card__status--1 {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.info-card__status--2 {
  background: var(--color-shadow);
  color: var(--text-secondary);
}
.info-card__status--3 {
  background: var(--color-error-bg);
  color: var(--color-error);
}
.info-card__desc {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-top: 12rpx;
  line-height: 1.5;
}
.info-card__meta {
  display: flex;
  gap: 48rpx;
  padding-top: 24rpx;
  border-top: 1px solid var(--border-color);
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.meta-label {
  font-size: 22rpx;
  color: var(--text-secondary);
}
.meta-value {
  font-size: 26rpx;
  color: var(--text-primary);
}

/* 开关行 */
.info-card__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1px solid var(--border-color);
}
.switch-label {
  font-size: 28rpx;
  color: var(--text-primary);
}

/* 自定义开关 */
.scene-switch {
  width: 96rpx;
  height: 52rpx;
  border-radius: 26rpx;
  background: var(--border-color);
  display: flex;
  align-items: center;
  padding: 4rpx;
  transition: background 0.25s;
}
.scene-switch--on {
  background: var(--color-success);
}
.scene-switch__thumb {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  background: var(--card-bg);
  transition: margin-left 0.25s;
}
.scene-switch--on .scene-switch__thumb {
  margin-left: 44rpx;
}

/* ========== 区域卡片 ========== */
.section-card {
  margin: 24rpx 32rpx;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
}
.section-card--hover {
  opacity: 0.7;
}
.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
}
.section-card__title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-primary);
}
.section-card__count {
  font-size: 24rpx;
  color: var(--text-secondary);
}
.section-card__arrow {
  font-size: 36rpx;
  color: var(--text-secondary);
}
.section-card__body {
  padding: 0 32rpx 28rpx;
}

/* ========== 流程项 ========== */
.flow-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  position: relative;
}
.flow-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.flow-dot--trigger {
  background: var(--color-primary);
}
.flow-dot--action {
  background: var(--color-success);
}
.flow-line {
  position: absolute;
  left: 7rpx;
  top: 40rpx;
  width: 2rpx;
  height: 32rpx;
  background: var(--border-color);
}
.flow-text {
  font-size: 28rpx;
  color: var(--text-primary);
}

/* ========== 条件行 ========== */
.condition-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0;
}
.condition-text {
  font-size: 28rpx;
  color: var(--text-primary);
}

/* ========== 异常卡片 ========== */
.error-card {
  margin: 24rpx 32rpx;
  padding: 24rpx 32rpx;
  background: var(--color-error-bg);
  border-radius: var(--radius-md, 12px);
  border-left: 6rpx solid var(--color-error);
}
.error-card__title {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
  color: var(--color-error);
  margin-bottom: 8rpx;
}
.error-card__reason {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ========== 底部操作区 ========== */
.action-bar {
  display: flex;
  gap: 24rpx;
  padding: 32rpx;
  margin-top: 16rpx;
}
.action-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  border-radius: var(--radius-md, 12px);
}
.action-btn--trigger {
  background: var(--color-primary);
}
.action-btn--edit {
  background: var(--card-bg);
  border: 1px solid var(--color-primary);
}
.action-btn--delete {
  background: var(--card-bg);
  border: 1px solid var(--color-error);
}
.action-btn--hover {
  opacity: 0.7;
}
.action-btn__text {
  font-size: 30rpx;
  font-weight: 500;
}
.action-btn--trigger .action-btn__text {
  color: var(--color-on-primary);
}
.action-btn--edit .action-btn__text {
  color: var(--color-primary);
}
.action-btn--delete .action-btn__text {
  color: var(--color-error);
}

/* ========== 删除确认弹窗 ========== */
.confirm-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.confirm-dialog {
  width: 560rpx;
  background: var(--card-bg);
  border-radius: var(--radius-lg, 16px);
  padding: 48rpx 40rpx 36rpx;
}
.confirm-dialog__title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 20rpx;
}
.confirm-dialog__content {
  display: block;
  font-size: 28rpx;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 40rpx;
}
.confirm-dialog__actions {
  display: flex;
  gap: 20rpx;
}
.confirm-btn {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  border-radius: var(--radius-md, 12px);
  font-size: 30rpx;
}
.confirm-btn--cancel {
  background: var(--page-bg);
  color: var(--text-primary);
}
.confirm-btn--confirm {
  background: var(--color-error);
  color: var(--color-on-primary);
}

</style>
