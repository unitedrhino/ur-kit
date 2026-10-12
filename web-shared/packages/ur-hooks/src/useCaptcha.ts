import { onUnmounted, ref } from 'vue';

import { CoreApi } from '@vben/api';

/**
 * 图片验证码 Composable
 * @param account 账号（手机号）
 * @param useType 验证码使用类型
 * @param autoRefreshInterval 自动刷新间隔（毫秒），默认2分钟
 * @returns 
 */
export function useCaptcha(
  account: () => string,
  useType: CoreApi.UserCaptchaReqUseEnum,
  autoRefreshInterval: number = 2 * 60 * 1000
) {
  const captchaImgUrl = ref('');
  const imageCodeID = ref('');
  const captchaCountdown = ref(120); // 验证码倒计时（秒）
  
  let captchaTimer: NodeJS.Timeout | null = null; // 图片验证码刷新定时器
  let captchaCountdownTimer: NodeJS.Timeout | null = null; // 图片验证码倒计时定时器

  /**
   * 刷新图片验证码
   */
  async function refreshCaptcha() {
    // 清除旧的图片验证码定时器
    if (captchaTimer) {
      clearTimeout(captchaTimer);
      captchaTimer = null;
    }
    
    // 清除倒计时定时器
    if (captchaCountdownTimer) {
      clearInterval(captchaCountdownTimer);
      captchaCountdownTimer = null;
    }

    const accountValue = account();
    
    const res = await CoreApi.postApiV1SystemUserSelfCaptcha({
      account: accountValue,
      type: CoreApi.UserCaptchaReqTypeEnum.IMAGE,
      use: useType,
    });

    captchaImgUrl.value = res.url || '';
    imageCodeID.value = res.codeID || '';

    // 重置倒计时
    captchaCountdown.value = autoRefreshInterval / 1000;
    
    // 启动倒计时
    captchaCountdownTimer = setInterval(() => {
      captchaCountdown.value--;
      if (captchaCountdown.value <= 0) {
        if (captchaCountdownTimer) {
          clearInterval(captchaCountdownTimer);
          captchaCountdownTimer = null;
        }
      }
    }, 1000);

    // 设置自动刷新图片验证码
    captchaTimer = setTimeout(() => {
      refreshCaptcha();
    }, autoRefreshInterval);
  }

  /**
   * 清理定时器
   */
  function cleanup() {
    // 清除图片验证码刷新定时器
    if (captchaTimer) {
      clearTimeout(captchaTimer);
      captchaTimer = null;
    }
    
    // 清除图片验证码倒计时定时器
    if (captchaCountdownTimer) {
      clearInterval(captchaCountdownTimer);
      captchaCountdownTimer = null;
    }
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    cleanup();
  });

  return {
    captchaImgUrl,
    imageCodeID,
    captchaCountdown,
    refreshCaptcha,
    cleanup,
  };
}

