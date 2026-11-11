<!-- 四个主页面共用的悬浮导航，保留原生 switchTab 的页面状态与路由合同。 -->
<template>
  <view class="mobile-tabs" role="navigation" aria-label="主导航">
    <view v-for="item in TAB_BAR_ICONS" :key="item.pagePath"
      :class="['mobile-tabs__item', { 'mobile-tabs__item--active': active === item.pagePath }]"
      role="button" :aria-label="item.text" :aria-current="active === item.pagePath ? 'page' : undefined"
      @tap="switchPage(item.pagePath)">
      <view class="mobile-tabs__icon"><app-icon :name="item.icon" :size="25" /><view v-if="item.pagePath === 'pages/message/index' && unreadCount > 0" class="mobile-tabs__dot" /></view>
      <text class="mobile-tabs__label">{{ item.text }}</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppIcon from '../app-icon/app-icon.vue';
import { TAB_BAR_ICONS } from '../../config/icons';
import { messageProvider } from '../../providers/message.provider';
/** active 为当前主页面路径；组件没有业务事件或插槽。 */
const props = defineProps<{ active: string }>();
const unreadCount = ref(0);
let unsubscribeMessage: (() => void) | null = null;
/** switching 防止快速重复点击造成重入，路由失败后仍可再次操作。 */
let switching = false;
/** switchPage 切换已注册的主页面，不新增导航栈。 */
function switchPage(path: string): void {
  if (switching || props.active === path) return;
  switching = true;
  uni.switchTab({ url: `/${path}`, complete: () => { switching = false; } });
}
onMounted(() => {
  const syncMessageState = (): void => { unreadCount.value = messageProvider.getState().unreadCount; };
  unsubscribeMessage = messageProvider.subscribe(syncMessageState);
  syncMessageState();
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false });
  // #endif
});
onUnmounted(() => { unsubscribeMessage?.(); unsubscribeMessage = null; });
</script>
<style lang="scss" scoped>
.mobile-tabs {
  position: fixed; left: 16px; right: 16px; bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 50; display: flex; padding: 5px; box-sizing: border-box;
  border-radius: var(--radius-full); background: var(--card-bg);
  box-shadow: 0 8px 32px var(--color-shadow);
}
.mobile-tabs__item { flex: 1; min-width: 0; height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border-radius: var(--radius-full); color: var(--text-primary); }
.mobile-tabs__item--active { color: var(--navigation-active); background: var(--navigation-container); }
.mobile-tabs__icon { position: relative; display: flex; width: 25px; height: 25px; align-items: center; justify-content: center; }
.mobile-tabs__dot { position: absolute; top: -2px; right: -4px; width: 8px; height: 8px; border: 2px solid var(--card-bg); border-radius: 50%; background: var(--color-danger); }
.mobile-tabs__label { font-size: var(--font-caption); line-height: 18px; }
</style>
