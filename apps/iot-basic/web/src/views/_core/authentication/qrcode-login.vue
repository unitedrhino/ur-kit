<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';
import { usePreferences } from '@vben/preferences';
import { useAuthStore } from '@vben/saas/store';
import { loadScript } from '@vben/utils';

import { VbenButton } from '@vben-core/shadcn-ui';

import { useMessage } from 'naive-ui';

import { resolveAuthPath } from './auth-paths';
import Title from './auth-title.vue';
import { Api } from './index.api';

interface Props {
  /**
   * @zh_CN 是否处于加载处理状态
   */
  loading?: boolean;
  /**
   * @zh_CN 登录路径
   */
  loginPath?: string;
  /**
   * @zh_CN 标题
   */
  title?: string;
  /**
   * @zh_CN 描述
   */
  subTitle?: string;
  /**
   * @zh_CN 按钮文本
   */
  submitButtonText?: string;
  /**
   * @zh_CN 描述
   */
  description?: string;
  /**
   * @zh_CN 是否显示返回按钮
   */
  showBack?: boolean;
}

defineOptions({
  name: 'AuthenticationQrCodeLogin',
});

const props = withDefaults(defineProps<Props>(), {
  description: '',
  loading: false,
  showBack: true,
  loginPath: '/auth/login',
  submitButtonText: '',
  subTitle: '',
  title: '',
});

// mock login config
// appid : <your-wx-appid>
//  AppSecret : <your-wx-appsecret>

const { isDark } = usePreferences();
const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'));

const router = useRouter();
const route = useRoute();
const message = useMessage();
const authStore = useAuthStore();
const qrcodeContainerId = 'wx_login_container';
const wxLoginScriptUrl = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
const wxLoginInstance = ref<any>(null);

// 生成随机 state 参数,用于防止 CSRF 攻击
function generateState(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

// 处理微信回调(URL 中的 code 和 state 参数)
async function handleWeChatCallback() {
  const query = route.query;
  const code = query.code as string;
  const state = query.state as string;

  if (code && state) {
    try {
      // 从 sessionStorage 中获取保存的 state,验证是否匹配
      const savedState = sessionStorage.getItem('wx_login_state');
      if (!savedState || savedState !== state) {
        message.error($t('orgIotClient.auth.loginStateMismatch'));
        // 清除 URL 参数
        router.replace({ path: route.path, query: {} });
        return;
      }

      // 清除保存的 state
      sessionStorage.removeItem('wx_login_state');

      // 调用登录 API
      await authStore.authLogin({
        loginType: CoreApi.UserLoginReqLoginTypeEnum.WX_OPEN,
        code,
        codeID: state,
      });

      // message.success('登录成功');
    } catch (error: any) {
      notifyRequestError(error, () => $t('orgIotClient.auth.loginFailedWithMsg', { msg: error?.msg ? `: ${error?.msg}` : '' }), (text) => message.error(text));
      // 清除 URL 参数
      router.replace({ path: route.path, query: {} });
    }
  }
}

// 初始化微信登录二维码
async function initWeChatLogin() {
  try {
    // 获取应用信息
    const appID = import.meta.env.VITE_GLOB_APPID;
    const appInfo = await Api.read(appID);

    const wxOpenConfig = appInfo.wxOpenConfig;
    if (!wxOpenConfig || !wxOpenConfig.appID) {
      message.error($t('orgIotClient.auth.wxOpenNotConfigured'));
      return;
    }

    // 加载微信登录 JS SDK
    if (!(window as any).WxLogin) {
      await loadScript(wxLoginScriptUrl);
    }

    // 生成 state 参数
    const state = generateState();
    // 保存 state 到 sessionStorage,用于回调时验证
    sessionStorage.setItem('wx_login_state', state);

    // 清除容器内容
    const container = document.querySelector<HTMLElement>(`#${qrcodeContainerId}`);
    if (container) {
      container.innerHTML = '';
    }

    // 初始化微信登录二维码
    // @ts-ignore
    wxLoginInstance.value = new (window as any).WxLogin({
      self_redirect: false, // 设置为 false,在 top window 跳转
      id: qrcodeContainerId,
      // appid: wxOpenConfig.appID,
      // mock login config
      appid: '<your-wx-appid>',
      scope: 'snsapi_login',
      redirect_uri: encodeURIComponent(new URL(resolveAuthPath(route, 'qrcode-login-success'), window.location.origin).toString()),
      state,
      // style: 'black', // 黑色文字描述,适合浅色背景
      stylelite: '1',
      color_scheme: currentTheme.value === 'dark' ? 'dark' : 'light',
      // fast_login: 0,
      href: '', // 自定义样式链接(可选)
      onReady(isReady: boolean) {
        if (!isReady) {
          message.error($t('orgIotClient.auth.qrcodeLoadFailed'));
        }
      },
    });
  } catch (error: any) {
    notifyRequestError(error, () => $t('orgIotClient.auth.wxLoginInitFailedWithMsg', { msg: error?.message ? `: ${error?.message}` : '' }), (text) => message.error(text));
  }
}

onMounted(async () => {
  // 先检查是否有回调参数
  const query = route.query;
  await (query.code && query.state ? handleWeChatCallback() : initWeChatLogin());
});

onUnmounted(() => {
  // 清理资源
  if (wxLoginInstance.value) {
    wxLoginInstance.value = null;
  }
  // 清除保存的 state
  sessionStorage.removeItem('wx_login_state');
});

function goToLogin() {
  router.push(props.loginPath === '/auth/login' ? resolveAuthPath(route, 'login') : props.loginPath);
}
</script>

<template>
  <div>
    <Title>
      <slot name="title"> {{ title || $t('authentication.welcomeBack') }} 📱 </slot>
      <template #desc>
        <span class="text-muted-foreground">
          <slot name="subTitle">
            {{ subTitle || $t('authentication.qrcodeSubtitle') }}
          </slot>
        </span>
      </template>
    </Title>

    <div class="flex-col-center mt-6">
      <div :id="qrcodeContainerId" class="wx-login-container"></div>
      <p class="text-muted-foreground mt-4 text-center text-sm">
        <slot name="description">
          {{ description || $t('authentication.qrcodePrompt') || $t('orgIotClient.auth.wechatScanFallback') }}
        </slot>
      </p>
    </div>

    <VbenButton v-if="showBack" class="mt-4 w-full" variant="outline" @click="goToLogin()">
      {{ $t('common.back') }}
    </VbenButton>
  </div>
</template>

<style scoped>
.wx-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 300px;
}
</style>
