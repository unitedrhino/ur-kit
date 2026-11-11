<!-- 文件说明：第一方H5整页面板登录交接页，收到票据后立即从浏览器地址中移除。 -->
<template>
  <app-navigation-bar title="设备面板" />
  <view class="entry-page"><text class="entry-title">{{error ? '面板打开失败' : '正在打开设备面板'}}</text><text>{{error || '正在确认设备与登录状态…'}}</text><text v-if="error">请使用左上角返回，重新进入设备</text></view>
</template>
<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { openPanelHandoff } from '../../../providers/panel-launch.provider';
/** error 只显示业务失败原因，不展示票据、地址或认证响应。 */
const error = ref('');
/** closed 让离开交接页后的请求不能恢复身份或再次导航。 */
let closed = false;
onUnload(() => { closed = true; });
onLoad(async (options) => {
  const ticket = String(options?.panelTicket || '');
  // #ifdef H5
  history.replaceState(history.state, '', location.pathname + location.search + '#/packageDevice/pages/panel-entry/index');
  try { await openPanelHandoff(ticket, () => !closed); } catch (cause) { error.value = cause instanceof Error ? cause.message : '请返回设备重新打开'; }
  // #endif
});
</script>
<style scoped>
.entry-page{min-height:100vh;background:var(--page-bg);color:var(--text-secondary);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px;box-sizing:border-box}
.entry-title{font-size:20px;font-weight:600;color:var(--text-primary)}
</style>
