<template>
<app-navigation-bar :title="title" />

<scroll-view class="te-body" scroll-y type="list" :show-scrollbar="false">
  <view v-if="loading" class="te-loading">
    <loading text="加载中..." />
  </view>

  <view v-else class="te-form">
    <view class="te-field">
      <text class="te-field__label">组织名称</text>
      <input
        class="te-field__input"
        :value="name"
        placeholder="请输入组织名称"
        maxlength="30"
        :focus="true"
        @blur="handleNameBlur"
      />
    </view>

    <view class="te-field">
      <text class="te-field__label">组织描述</text>
      <textarea
        class="te-field__textarea"
        :value="desc"
        placeholder="请输入组织描述（可选）"
        maxlength="80"
        @blur="handleDescBlur"
      />
    </view>
  </view>
</scroll-view>

<view class="te-footer">
  <view
    :class="`te-btn te-btn--primary ${submitting ? 'te-btn--disabled' : ''}`"
    @tap="handleSubmitTap"
    hover-class="te-btn--hover"
  >
    <text>{{submitting ? '保存中...' : '保存'}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { tenantProvider } from '../../../providers/tenant.provider'
import { appContextProvider } from '../../../providers/app-context.provider'

const mode = ref<'manage' | 'select'>('manage')
const editingCode = ref('')
const title = ref('')
const name = ref('')
const desc = ref('')
const loading = ref(false)
const submitting = ref(false)

onLoad(async (options: Record<string, string | undefined> = {}) => {
  const m = options.mode === 'select' ? 'select' : 'manage'
  const code = decodeURIComponent(options.code || '')
  mode.value = m
  editingCode.value = code
  title.value = code ? '编辑组织' : '新建组织'
  loading.value = !!code
  if (!code) return
  try {
    const detail = await tenantProvider.getTenantDetail(code)
    name.value = detail.name
    desc.value = detail.desc
  } catch (error) {
    uni.showToast({ title: (error as Error).message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

/** 输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于保存按钮 tap，保存处拿到最新值 */
function handleNameBlur(e: any) { name.value = e.detail.value }
function handleDescBlur(e: any) { desc.value = e.detail.value }

function handleSubmitTap() {
  if (submitting.value) return
  void handleSubmit()
}

async function handleSubmit() {
  const n = (name.value || '').trim()
  const d = (desc.value || '').trim()
  if (!n) { uni.showToast({ title: '请输入组织名称', icon: 'none' }); return }
  if (submitting.value) return
  submitting.value = true
  try {
    if (editingCode.value) {
      await tenantProvider.updateTenant({ code: editingCode.value, name: n, desc: d })
      uni.showToast({ title: '已更新', icon: 'success' })
      setTimeout(() => uni.navigateBack({ delta: 1 }), 500)
    } else {
      await tenantProvider.createTenant({ name: n, desc: d })
      uni.showToast({ title: '已创建', icon: 'success' })
      if (mode.value === 'select') {
        await appContextProvider.continueAfterLogin('/pages/home/index')
        return
      }
      setTimeout(() => uni.navigateBack({ delta: 1 }), 500)
    }
  } catch (error) {
    uni.showToast({ title: (error as Error).message || '操作失败', icon: 'none' })
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
  background: var(--color-bg-secondary);
}

.te-body {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.te-loading {
  padding: 80rpx 0;
}

.te-form {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.te-field {
  background: var(--card-bg);
  border-radius: 24rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.te-field__label {
  font-size: 26rpx;
  color: var(--text-primary);
}

.te-field__input,
.te-field__textarea {
  width: 100%;
  font-size: 30rpx;
  color: var(--text-primary);
}

.te-field__textarea {
  min-height: 180rpx;
}

.te-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  border-top: 2rpx solid var(--color-bg-secondary);
}

.te-btn {
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
}

.te-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.te-btn--disabled {
  opacity: 0.6;
}

</style>
