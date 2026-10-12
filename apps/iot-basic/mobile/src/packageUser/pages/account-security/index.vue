<template>
<app-navigation-bar title="账号与安全" :back="true" />

<scroll-view class="security-page" scroll-y type="list">
  <view class="security-card">
    <view class="security-item" @tap="handleNavTo('/packageUser/pages/bind-phone/index?from=security')" hover-class="security-item--hover">
      <view class="security-item__main">
        <text class="security-item__label">手机号</text>
        <text class="security-item__value">{{user?.phone || '未绑定'}}</text>
      </view>
      <text class="security-item__status">{{user?.phone ? '已绑定' : '去绑定'}}</text>
      <text class="security-item__arrow">›</text>
    </view>
    <view class="security-item" @tap="handleNavTo('/packageUser/pages/bind-email/index')" hover-class="security-item--hover">
      <view class="security-item__main">
        <text class="security-item__label">邮箱</text>
        <text class="security-item__value">{{user?.email || '未绑定'}}</text>
      </view>
      <text class="security-item__status">{{user?.email ? '已绑定' : '去绑定'}}</text>
      <text class="security-item__arrow">›</text>
    </view>
    <view class="security-item" @tap="handleNavTo('/packageUser/pages/change-password/index')" hover-class="security-item--hover">
      <view class="security-item__main">
        <text class="security-item__label">登录密码</text>
        <text class="security-item__value">{{user?.password ? '已设置' : '未设置'}}</text>
      </view>
      <text class="security-item__status">{{user?.password ? '修改' : '设置'}}</text>
      <text class="security-item__arrow">›</text>
    </view>
  </view>
  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';
import type { UserEntity } from '../../../domain/entities/user.entity';

const user = ref<UserEntity | null>(null);

function syncUser() {
  user.value = authProvider.getState().user;
}

onLoad(() => {
  if (!authProvider.isLoggedIn()) {
    uni.redirectTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  syncUser();
});

onShow(() => {
  syncUser();
  if (authProvider.isLoggedIn()) void authProvider.checkNeedSetPassword();
});

function handleNavTo(url: string) {
  uni.navigateTo({ url });
}
</script>

<style lang="scss" scoped>
.security-page { flex: 1; min-height: 0; background: var(--page-bg); }
.security-card { margin: 16px; background: var(--card-bg); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px var(--color-shadow); }
.security-item { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1rpx solid var(--border-color); }
.security-item:last-child { border-bottom: none; }
.security-item--hover { background: var(--page-bg); }
.security-item__main { flex: 1; min-width: 0; }
.security-item__label { display: block; font-size: 15px; color: var(--text-primary); }
.security-item__value { display: block; margin-top: 5px; font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.security-item__status { font-size: 13px; color: var(--color-primary); }
.security-item__arrow { color: var(--text-tertiary); font-size: 18px; }
</style>
