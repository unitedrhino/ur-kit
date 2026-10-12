<template>
<app-navigation-bar :title="title" />

<scroll-view class="re-body" scroll-y :show-scrollbar="false">
  <view class="re-content">
    <!-- 房间名 行式 input -->
    <view class="re-card">
      <view class="re-row">
        <text class="re-row__label">{{TERM.area}}名</text>
        <input
          class="re-row__input"
          :value="name"
          :placeholder="`请输入${TERM.area}名称`"
          placeholder-class="re-row__input-ph"
          maxlength="30"
          :focus="true"
          @blur="handleNameBlur"
        />
      </view>
    </view>

    <!-- 房间图标 -->
    <text class="re-section__title">{{TERM.area}}图标</text>
    <view class="re-icons">
      <view
        v-for="(item, index) in icons" :key="item.value"
        :class="`re-icon ${item.value === selectedIcon ? 're-icon--active' : ''}`"
        @tap="handleSelectIcon(item.value)"
        hover-class="re-icon--hover"
      >
        <app-icon class="re-icon__glyph" :name="item.value" :size="'56rpx'" />
      </view>
    </view>
  </view>
</scroll-view>

<view class="re-footer">
  <view
    :class="`re-btn re-btn--primary ${(submitting || !canSubmit) ? 're-btn--disabled' : ''}`"
    @tap="handleSubmitTap"
    hover-class="re-btn--hover"
  >
    <text>{{submitting ? '保存中...' : title}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { areaProvider } from '../../../providers/area.provider'
import { areaService } from '../../../services/area.service'
import { TERM } from '../../../config/terminology'
import { AREA_ICONS, AREA_ICON_DEFAULT, normalizeAreaIcon } from '../../../config/area-icons'
import { ensurePageReady } from '../../../utils/page-guard'
import { permissionWarmupService } from '../../../services/permission-warmup.service'

const icons = ref(AREA_ICONS)
const title = ref('')
const projectID = ref('')
const editingID = ref('')
const name = ref('')
const selectedIcon = ref(AREA_ICON_DEFAULT)
const submitting = ref(false)
const canSubmit = ref(false)

/** 名称输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于保存按钮 tap，保存处拿到最新值 */
function handleNameBlur(e: any) { name.value = e.detail.value }

/** 房间名输入变化时同步刷新保存按钮可用状态 */
watch(name, (next) => {
  canSubmit.value = !!next.trim()
})

onLoad(async (options: Record<string, string | undefined> = {}) => {
  const ready = await ensurePageReady('/packageUser/pages/room-edit/index', options)
  if (!ready) return
  const pid = options.projectID || ''
  const eid = options.areaID || ''
  projectID.value = pid
  editingID.value = eid
  title.value = eid ? TERM.areaEditTitle : TERM.areaCreateTitle
  if (!eid) { void permissionWarmupService.tryWarmupRoomCreate() }
  if (eid) {
    try {
      const area = await areaService.getOne(eid)
      const icon = normalizeAreaIcon(area.areaImg || AREA_ICON_DEFAULT)
      name.value = area.areaName
      selectedIcon.value = icon
      canSubmit.value = !!area.areaName.trim()
    } catch (err: unknown) {
      uni.showToast({ title: (err as Error).message || '加载失败', icon: 'none' })
    }
  }
})

function handleSelectIcon(icon: string) { selectedIcon.value = normalizeAreaIcon(icon) }

function handleSubmitTap() {
  if (submitting.value || !canSubmit.value) return
  void handleSubmit()
}

async function handleSubmit() {
  const n = (name.value || '').trim()
  if (!n) { uni.showToast({ title: `请输入${TERM.area}名称`, icon: 'none' }); return }
  if (submitting.value) return
  submitting.value = true
  try {
    if (editingID.value) {
      await areaProvider.updateArea({ areaID: editingID.value, areaName: n })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      await areaProvider.createArea({ projectID: projectID.value, areaName: n })
      uni.showToast({ title: '已创建', icon: 'success' })
    }
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500)
  } catch (err: unknown) {
    uni.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--page-bg);
  box-sizing: border-box;
}

.re-body {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.re-content {
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx 32rpx 32rpx;
}

/* 行式 input 卡片：左 label 右 input */
.re-card {
  background: var(--card-bg);
  border-radius: 24rpx;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.re-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 32rpx;
  min-height: 96rpx;
  width: 100%;
  box-sizing: border-box;
}

.re-row__label {
  font-size: 30rpx;
  color: var(--text-primary);
  flex-shrink: 0;
  margin-right: 24rpx;
}

.re-row__input {
  /* skyline 原生 input 是原生控件，不会自动收缩到 flex 可用空间，
     必须 width:0 + min-width:0 + flex:1 才能正确填满剩余宽度且不撑爆父行 */
  flex: 1;
  width: 0;
  min-width: 0;
  font-size: 30rpx;
  color: var(--text-primary);
  text-align: right;
  /* 重置 skyline native input 默认内边距 */
  padding: 0;
  margin: 0;
  height: 44rpx;
  line-height: 44rpx;
}

.re-row__input-ph {
  color: var(--text-tertiary);
}

.re-section__title {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  margin: 40rpx 8rpx 16rpx;
}

/* 图标网格：3 列，首尾紧贴卡片左右边缘 */
.re-icons {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
}

.re-icon {
  width: calc((100% - 32rpx) / 3);
  height: 160rpx;
  margin-bottom: 16rpx;
  background: var(--card-bg);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid transparent;
  box-sizing: border-box;
}

.re-icon--hover {
  opacity: 0.7;
}

.re-icon--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg, var(--color-primary-light));
}

.re-icon__glyph {
  color: var(--text-primary);
}

.re-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--divider);
}

.re-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.re-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.re-btn--hover {
  opacity: 0.85;
}

.re-btn--disabled {
  background: var(--text-tertiary);
  color: var(--color-on-primary);
}

</style>
