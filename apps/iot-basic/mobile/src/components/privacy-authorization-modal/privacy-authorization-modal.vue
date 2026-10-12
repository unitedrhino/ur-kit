<!-- 文件说明：微信隐私授权弹窗；由真实授权按钮完成同意，遮罩及阴影使用应用主题。 -->
<template>
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="visible" class="privacy-modal">
    <view class="privacy-modal__panel">
      <text class="privacy-modal__title">隐私授权</text>
      <view class="privacy-modal__body">
        <text class="privacy-modal__text">请阅读并同意</text>
        <text class="privacy-modal__link" @tap="handleOpenContract">{{ contractName }}</text>
        <text class="privacy-modal__text">，以便继续使用手机号登录、设备管理等服务。</text>
      </view>
      <view class="privacy-modal__actions">
        <button class="privacy-modal__button privacy-modal__button--ghost" hover-class="privacy-modal__button--active" @tap="handleDisagree">
          拒绝
        </button>
        <button
          id="agree-privacy-btn"
          class="privacy-modal__button privacy-modal__button--primary"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="handleAgree"
          hover-class="privacy-modal__button--active"
        >
          同意
        </button>
      </view>
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { PRIVACY_AGREE_BUTTON_ID, privacyConsentService, type PrivacyPopupState } from '../../services/privacy-consent.service';

const visible = ref(false);
const contractName = ref('');
let unsubscribe: (() => void) | null = null;

/** syncPrivacyState 同步微信隐私接口 pending 时的弹窗展示状态。 */
function syncPrivacyState(state: PrivacyPopupState): void {
  visible.value = state.visible;
  contractName.value = state.contractName;
}

/** handleAgree 只在真实微信隐私同意按钮事件触发后继续原隐私接口。 */
function handleAgree(): void {
  privacyConsentService.handleAgree(PRIVACY_AGREE_BUTTON_ID);
}

/** handleDisagree 拒绝本次隐私授权并让原隐私接口返回失败。 */
function handleDisagree(): void {
  privacyConsentService.handleDisagree();
}

/** handleOpenContract 打开微信托管的隐私协议详情页。 */
async function handleOpenContract(): Promise<void> {
  const opened = await privacyConsentService.openPrivacyContract();
  if (!opened) {
    uni.showToast({ title: '暂无法打开隐私协议', icon: 'none' });
  }
}

onMounted(() => {
  privacyConsentService.init();
  syncPrivacyState(privacyConsentService.getState());
  unsubscribe = privacyConsentService.subscribe(syncPrivacyState);
});

onUnmounted(() => {
  unsubscribe?.();
});
</script>

<style lang="scss" scoped>
.privacy-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: var(--color-mask);
}

.privacy-modal__panel {
  width: 100%;
  max-width: 327px;
  padding: 24px 20px 18px;
  border-radius: 16px;
  box-sizing: border-box;
  background: var(--card-bg);
  box-shadow: 0 18px 48px var(--color-shadow);
}

.privacy-modal__title {
  display: block;
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  line-height: 25px;
  color: var(--text-primary);
  text-align: center;
}

.privacy-modal__body {
  display: block;
  margin-bottom: 22px;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-secondary);
}

.privacy-modal__text {
  font-size: 14px;
  line-height: 22px;
  color: var(--text-secondary);
}

.privacy-modal__link {
  font-size: 14px;
  line-height: 22px;
  color: var(--color-primary);
}

.privacy-modal__actions {
  display: flex;
  gap: 12px;
}

.privacy-modal__button {
  flex: 1;
  height: 44px;
  margin: 0;
  padding: 0 12px;
  border: none;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  line-height: 44px;
  text-align: center;
}

.privacy-modal__button::after {
  border: none;
}

.privacy-modal__button--ghost {
  color: var(--text-secondary);
  background: var(--surface-muted);
}

.privacy-modal__button--primary {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.privacy-modal__button--active {
  opacity: 0.82;
}
</style>
