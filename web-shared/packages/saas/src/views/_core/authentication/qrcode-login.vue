<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

  /** 微信扫码登录页：固定错误提示与备用说明随当前语言显示。 */
  import { onMounted, onUnmounted, ref, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';
  import { loadScript } from '@vben/utils';

  import { VbenButton } from '@vben-core/shadcn-ui';
  import { useMessage } from 'naive-ui';

  import { useAuthStore } from '../../../store';

  import { Api } from './index.api';
  import { canShowQrCodeBack } from './qrcode-login-visibility';
  import { createWxLoginState, wxOpenCallbackUri } from './wechat-login-relay';

  import Title from './auth-title.vue';

  import { usePreferences } from '@vben/preferences';

  import { CoreApi } from '@vben/api';


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

  // mock login config（本地联调时请替换为真实微信应用凭证）
  // appid : <your-wx-appid>
  // AppSecret : <your-wx-appsecret>

  const { isDark } = usePreferences();
  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'));

  const router = useRouter();
  const route = useRoute();
  const message = useMessage();
  const authStore = useAuthStore();
  const qrcodeContainerId = 'wx_login_container';
  const wxLoginScriptUrl = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
  const wxLoginStateKey = 'wx_login_state';
  const wxLoginStatePrefix = `${wxLoginStateKey}:`;
  const wxLoginStateTtlMs = 10 * 60 * 1000;
  const wxLoginInstance = ref<any>(null);
  // appLoginTypes 在应用配置返回前保持 null，避免返回按钮短暂闪现。
  const appLoginTypes = ref<null | string[]>(null);
  const showBackButton = computed(() => canShowQrCodeBack(props.showBack, appLoginTypes.value));

  // generateState 生成包含受控回跳目标的一次性 state，用于防止 CSRF 与任意地址回跳。
  function generateState(): string {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return createWxLoginState(window.location.hostname, nonce);
  }

  // getCallbackQuery 兼容微信把回调参数写在 hash 路由查询或页面查询中的两种形式。
  function getCallbackQuery(name: string): string {
    const routeValue = route.query[name];
    if (typeof routeValue === 'string') return routeValue;
    if (Array.isArray(routeValue) && typeof routeValue[0] === 'string') return routeValue[0];
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  // rememberLoginState 同时保存标签页状态和短时跨页面状态，兼容微信回跳到新的浏览上下文。
  function rememberLoginState(state: string) {
    sessionStorage.setItem(wxLoginStateKey, state);
    localStorage.setItem(`${wxLoginStatePrefix}${state}`, String(Date.now()));
  }

  // consumeLoginState 校验并消费一次性 state，过期或非当前页面生成的值均拒绝。
  function consumeLoginState(state: string): boolean {
    const sessionState = sessionStorage.getItem(wxLoginStateKey);
    const persistedStateKey = `${wxLoginStatePrefix}${state}`;
    const persistedAt = Number(localStorage.getItem(persistedStateKey));
    const persistedStateValid = Number.isFinite(persistedAt) && Date.now() - persistedAt <= wxLoginStateTtlMs;

    sessionStorage.removeItem(wxLoginStateKey);
    localStorage.removeItem(persistedStateKey);
    return sessionState === state || persistedStateValid;
  }

  // 处理微信回调(URL 中的 code 和 state 参数)
  async function handleWeChatCallback() {
    const code = getCallbackQuery('code');
    const state = getCallbackQuery('state');

    if (code && state) {
      try {
        // 从 sessionStorage 中获取保存的 state,验证是否匹配
        if (!consumeLoginState(state)) {
          message.error($t('orgIotClient.auth.loginStateMismatch'));
          // 清除 URL 参数
          router.replace({ path: route.path, query: {} });
          return;
        }

        // 调用登录 API
        await authStore.authLogin({
          loginType: CoreApi.UserLoginReqLoginTypeEnum.WX_OPEN,
          code: code,
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
      appLoginTypes.value = Array.isArray(appInfo.loginTypes) ? appInfo.loginTypes : [];

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
      rememberLoginState(state);

      // 清除容器内容
      const container = document.getElementById(qrcodeContainerId);
      if (container) {
        container.innerHTML = '';
      }

      // 初始化微信登录二维码
      // @ts-ignore
      wxLoginInstance.value = new (window as any).WxLogin({
        self_redirect: false, // 设置为 false,在 top window 跳转
        id: qrcodeContainerId,
        appid: wxOpenConfig.appID,
        scope: 'snsapi_login',
        redirect_uri: encodeURIComponent(wxOpenCallbackUri),
        state: state,
        // style: 'black', // 黑色文字描述,适合浅色背景
        stylelite: "1",
        color_scheme: currentTheme.value === 'dark' ? 'dark' : 'light',
        // fast_login: 0,
        href: '', // 自定义样式链接(可选)
        onReady: function (isReady: boolean) {
          if (!isReady) {
            message.error($t('orgIotClient.auth.qrcodeLoadFailed'));
          }
        },
        onQRcodeReady: function () {
          console.log('微信登录二维码加载完成');
        },
      });
    } catch (error: any) {
      // 配置读取失败时保留返回入口，避免用户被困在不可用的扫码页。
      appLoginTypes.value = [];
      notifyRequestError(error, () => $t('orgIotClient.auth.wxLoginInitFailedWithMsg', { msg: error?.message ? `: ${error?.message}` : '' }), (text) => message.error(text));
    }
  }

  onMounted(async () => {
    // 先检查是否有回调参数
    if (getCallbackQuery('code') && getCallbackQuery('state')) {
      // 处理回调
      await handleWeChatCallback();
    } else {
      // 初始化二维码
      await initWeChatLogin();
    }
  });

  onUnmounted(() => {
    // 清理资源
    if (wxLoginInstance.value) {
      wxLoginInstance.value = null;
    }
    // 清除保存的 state
    sessionStorage.removeItem(wxLoginStateKey);
  });

  function goToLogin() {
    router.push(props.loginPath);
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
        <p class="text-muted-foreground mt-4 text-sm text-center">
          <slot name="description">
            {{ description || $t('authentication.qrcodePrompt') || $t('orgIotClient.auth.wechatScanFallback') }}
          </slot>
        </p>
      </div>

      <VbenButton v-if="showBackButton" class="mt-4 w-full" variant="outline" @click="goToLogin()">
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
