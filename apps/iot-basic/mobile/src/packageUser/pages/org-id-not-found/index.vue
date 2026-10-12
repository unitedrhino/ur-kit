<!-- 组织不可用提示页：公开 org-id 不存在或未开通当前应用时展示。 -->
<template>
<view class="org-id-not-found-page">
  <app-navigation-bar title="访问受限" :back="false" />

  <view class="org-id-not-found-content">
    <view class="org-id-not-found-icon">
      <app-icon name="tabler:building-off" :size="44" />
    </view>
    <text class="org-id-not-found-title">组织不可用</text>
    <text class="org-id-not-found-desc">当前组织不存在，或尚未开通此应用。</text>
    <view class="org-id-not-found-action" @tap="handleBackHome" hover-class="org-id-not-found-action--hover">
      <text class="org-id-not-found-action__text">返回首页</text>
    </view>
  </view>
</view>
</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';

/** handleBackHome 返回访客首页，避免停留在失效的组织入口。 */
function handleBackHome() {
  uni.switchTab({ url: '/pages/home/index' });
}
</script>

<style lang="scss" scoped>
.org-id-not-found-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
}

.org-id-not-found-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 28px calc(48px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.org-id-not-found-icon {
  width: 96px;
  height: 96px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.org-id-not-found-title {
  margin-bottom: 10px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  text-align: center;
}

.org-id-not-found-desc {
  max-width: 260px;
  margin-bottom: 32px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  text-align: center;
}

.org-id-not-found-action {
  width: 100%;
  max-width: 280px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full, 9999px);
  background: var(--color-primary);
}

.org-id-not-found-action--hover {
  opacity: 0.82;
}

.org-id-not-found-action__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-on-primary);
}
</style>
