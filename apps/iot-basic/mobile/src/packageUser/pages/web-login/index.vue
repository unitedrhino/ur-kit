<!-- 小程序电脑登录确认页：仅认证及手机号绑定，不要求先创建企业或项目。 -->
<template>
  <view class="web-login-screen">
    <app-navigation-bar :title="bindingMode ? '微信账号绑定' : '登录电脑端'" :back="true" />
    <view class="web-login-card">
      <text class="web-login-title">{{ session?.appName || '电脑端登录' }}</text>
      <text class="web-login-description">{{ bindingMode ? '请确认将当前微信绑定到下方联犀账号；换绑成功前保留原绑定' : '请确认这是你本人发起的扫码登录' }}</text>
      <text v-if="user" class="web-login-account">当前账号：{{ user.nickName || user.userName || '微信用户' }}</text>
      <text v-if="hint" class="web-login-hint">{{ hint }}</text>
      <template v-if="bindingMode">
        <text v-if="session?.accountName" class="web-login-account">接收账号：{{ session.accountName }}</text>
        <template v-if="session?.status === 'pending'">
          <button class="web-login-primary" :loading="busy" :disabled="busy" @tap="decideBinding('confirm')">确认绑定当前微信</button>
          <button class="web-login-secondary" :disabled="busy" @tap="decideBinding('reject')">取消绑定</button>
        </template>
      </template>
      <template v-else-if="session?.status === 'scanned'">
        <button v-if="!user?.phone" open-type="getPhoneNumber" class="web-login-primary" :loading="busy" :disabled="busy" @getphonenumber="bindPhone">授权绑定手机号</button>
        <button v-else class="web-login-primary" :loading="busy" :disabled="busy" @tap="decide('confirm')">确认登录电脑端</button>
        <button class="web-login-secondary" :disabled="busy" @tap="decide('reject')">取消登录</button>
      </template>
      <button v-if="failed" class="web-login-secondary" :disabled="busy" @tap="loadSession">重试</button>
    </view>
    <safe-area />
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';
import { appContextProvider } from '../../../providers/app-context.provider';
import { webLoginService } from '../../../services/web-login.service';
import type { WebLoginSession } from '../../../domain/models/web-login.model';
import type { UserEntity } from '../../../domain/entities/user.entity';

/** ticket 仅用于当前手机会话，不能兑换电脑端令牌。 */
let ticket = '';
/** bindingTicket 只进入显式绑定授权，不进入平台登录和注册守卫。 */
const bindingTicket = ref('');
const bindingMode = computed(() => !!bindingTicket.value);
/** session 和 user 展示服务端应用名称与当前已认证账号。 */
const session = ref<WebLoginSession>();
const user = ref<UserEntity | null>(null);
/** busy 防止重复确认；hint 为可恢复错误或终态提示。 */
const busy = ref(false);
const failed = ref(false);
const hint = ref('');
/** loadSession 先确保登录，再领取扫码会话；续跳携带原票据。 */
async function loadSession() {
  if (busy.value) return;
  if (bindingMode.value) {
    busy.value = true; failed.value = false;
    try { session.value = await webLoginService.describeBinding(bindingTicket.value); hint.value = describeBindingStatus(session.value.status); }
    catch (error) { failed.value = true; hint.value = (error as Error).message || '授权信息加载失败，请重新扫码'; }
    finally { busy.value = false; }
    return;
  }
  if (!/^[a-f0-9]{64}$/.test(ticket)) { hint.value = '扫码链接无效，请在电脑端刷新二维码'; return; }
  const target = `/packageUser/pages/web-login/index?ticket=${encodeURIComponent(ticket)}`;
  busy.value = true; failed.value = false;
  try {
    // 先等待缓存身份恢复，避免冷启动时把已有账号误判为未登录。
    if (authProvider.getState().loggedIn) await authProvider.restoreSession();
    if (!(await appContextProvider.ensureReady(target))) return;
    user.value = authProvider.getState().user;
    session.value = await webLoginService.approve(ticket, 'claim');
    hint.value = describeStatus(session.value.status);
  } catch (error) { failed.value = true; hint.value = (error as Error).message || '二维码加载失败，请重试'; }
  finally { busy.value = false; }
}
/** describeStatus 为过期、取消和已确认等终态展示明确结果。 */
function describeStatus(status: string): string {
  if (status === 'scanned') return user.value?.phone ? '请核对应用和账号后确认登录' : '绑定手机号后才能确认登录电脑端';
  if (status === 'confirmed' || status === 'consumed') return '已确认，请返回电脑端继续使用';
  if (status === 'cancelled') return '已取消电脑端登录';
  if (status === 'expired') return '二维码已过期，请在电脑端刷新后重新扫码';
  return '该二维码已处理，请返回电脑端查看';
}
/** decide 只有用户明确点击按钮才向服务端提交确认或取消。 */
async function decide(action: 'confirm' | 'reject') {
  if (busy.value) return;
  busy.value = true;
  try { session.value = await webLoginService.approve(ticket, action); hint.value = describeStatus(session.value.status); appContextProvider.clearPendingRoute(); }
  catch (error) { hint.value = (error as Error).message || '操作失败，请重试'; }
  finally { busy.value = false; }
}
/** bindPhone 消费微信取号 code，成功后仍由用户单独确认电脑端登录。 */
async function bindPhone(event: { detail?: { code?: string } }) {
  if (busy.value) return;
  const code = event.detail?.code;
  if (!code) { hint.value = '需要同意手机号授权后才能继续登录电脑端'; return; }
  busy.value = true;
  try { await authProvider.bindPhoneByWxPhone(code); user.value = authProvider.getState().user; hint.value = '手机号已绑定，请确认登录电脑端'; }
  catch (error) { hint.value = (error as Error).message || '手机号绑定失败，请重新授权'; }
  finally { busy.value = false; }
}
/** describeBindingStatus 明确说明绑定授权结果，避免与电脑登录混淆。 */
function describeBindingStatus(status: string): string {
  if (status === 'pending') return '请核对接收账号后，确认绑定当前微信';
  if (status === 'consumed') return '绑定已更新，请返回电脑端查看';
  if (status === 'cancelled') return '已取消绑定，原绑定保持不变';
  if (status === 'processing') return '正在验证并更新绑定，请稍候';
  return '授权已失效或未完成，请在电脑端重新发起';
}
/** decideBinding 只有明确点击确认才验证当前微信身份；不创建或切换平台账号。 */
async function decideBinding(action: 'confirm' | 'reject') {
  if (busy.value) return;
  busy.value = true;
  try { session.value = await webLoginService.approveBinding(bindingTicket.value, action); hint.value = describeBindingStatus(session.value.status); }
  catch (error) { hint.value = (error as Error).message || '绑定未完成，请在电脑端重新发起'; }
  finally { busy.value = false; }
}
onLoad((options) => { bindingTicket.value = typeof options?.bindTicket === 'string' ? options.bindTicket : ''; ticket = typeof options?.ticket === 'string' ? options.ticket : ''; void loadSession(); });
</script>
<style scoped lang="scss">
.web-login-screen { min-height: 100vh; background: var(--page-bg); }
.web-login-card { margin: 48rpx 32rpx; padding: 48rpx 32rpx; border-radius: 24rpx; background: var(--card-bg); display: flex; flex-direction: column; gap: 32rpx; text-align: center; }
.web-login-title { color: var(--text-primary); font-size: 40rpx; font-weight: 600; }
.web-login-description, .web-login-hint { color: var(--text-secondary); font-size: 28rpx; line-height: 1.6; }
.web-login-account { color: var(--text-primary); font-size: 30rpx; }
.web-login-primary, .web-login-secondary { width: 100%; border-radius: 16rpx; font-size: 30rpx; }
.web-login-primary { background: var(--color-primary); color: var(--card-bg); }
.web-login-secondary { color: var(--text-secondary); background: var(--page-bg); }
</style>
