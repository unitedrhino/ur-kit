<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

/** 密码登录表单：保留各应用路由及验证码流程，复用当前应用的凭证模式。 */
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useSystemConfigStore } from '@vben/stores';
import { useMessage } from 'naive-ui';

// import { getCaptchaApi } from '#/api/core/auth';
import { CoreApi } from '@vben/api';

import { resolveLoginOemConfig } from '../../../layouts/login-oem';
import { useAuthStore } from '../../../store';
import { useAppInfoStore } from '../../../store';

import { Api } from './index.api';
import { normalizeInviteRedirectPath } from './invite-link';
import { useLoginPasswordMode } from '../../../password-login';
import { buildPwdLoginPayload } from './login.utils';
import { isWxOpenOnlyLogin } from './qrcode-login-visibility';
import { canShowRegisterEntry } from './register-visibility';
import ThirdLoginEntry from './third-login-entry.vue';

defineOptions({ name: 'Login' });


const message = useMessage();

const authStore = useAuthStore();
/** passwordMode 与页脚及过期弹窗共享，提交时读取最新模式。 */
const passwordMode = useLoginPasswordMode();
const appInfoStore = useAppInfoStore();
const systemConfigStore = useSystemConfigStore();
const route = useRoute();
const router = useRouter();

const loginRef = ref();



const captchaImgUrl = ref('');
const codeID = ref('');

async function refreshCaptcha() {
  const res = await Api.getImageCaptcha();

  if(!res.url || !res.codeID) {
    message.error($t('orgIotClient.auth.getCaptchaFailed'));
    return;
  }
  captchaImgUrl.value = res.url;
  codeID.value = res.codeID;
}

//登录选项

//邮箱 邮箱登录
//手机号 验证码等
//微信小程序 微信内登录 web不支持
//微信开放平台 扫码
//钉钉应用 钉钉扫码？
//账号密码 账号密码登录

// :show-code-login="true"
//     :show-qrcode-login="true"
//     :show-third-party-login="false"
//     :show-register="true"
//     :show-forget-password="true"

const appInfo = ref<CoreApi.AppInfo | null>(null);
// 应用登录配置返回前不渲染密码表单，避免扫码专用应用短暂闪现账号密码入口。
const appInfoResolved = ref(false);

// 登录类型对应关系：
// "email": 邮箱登录（系统配置里配置了才能开启）
// "phone": 手机号登录（系统配置里配置了才能开启）
// "wxMiniP": 微信小程序（app里配置了微信小程序才能开启）
// "wxOpen": 微信开放平台登录（app里配置了微信开放才能开启）
// "ding": 钉钉应用（app里配置了钉钉才能开启）
// "pwd": 账号密码登录（账号密码注册）

function supportLoginType(type: string) {
  //mock
  // return true;

  if(appInfo.value ==  null) return false;

  // loginTypes 未配置（null/undefined）或为空数组时，与后端语义保持一致，均视为支持全部登录方式
  if (!Array.isArray(appInfo.value.loginTypes) || appInfo.value.loginTypes.length === 0) {
    return true;
  }
  return appInfo.value.loginTypes.includes(type);
}

const showEmailLogin = computed(() => supportLoginType('email'));
const showPhoneLogin = computed(() => supportLoginType('phone'));

// 第三方/扫码登录入口的接入配置门控映射：除 loginTypes 包含该类型外，
// 应用还必须配置了对应的第三方接入（配置对象非空），未配置的一律不显示入口，
// 避免 loginTypes 为空（后端语义：不填支持全部）时把未接入的钉钉/华为/Google/GitHub/Apple/扫码全显示出来。
const thirdConfigFields: Record<string, 'dingConfig' | 'huaweiConfig' | 'googleConfig' | 'githubConfig' | 'appleConfig' | 'wxOpenConfig'> = {
  ding: 'dingConfig',
  huawei: 'huaweiConfig',
  google: 'googleConfig',
  github: 'githubConfig',
  apple: 'appleConfig',
  wxOpen: 'wxOpenConfig',
};

/** hasThirdLoginConfig 判断指定登录方式的第三方接入配置是否已配置（非空对象） */
function hasThirdLoginConfig(type: string) {
  const field = thirdConfigFields[type];
  const cfg = field ? appInfo.value?.[field] : undefined;
  return !!cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0;
}

const showWxOpenLogin = computed(() => supportLoginType('wxOpen') && hasThirdLoginConfig('wxOpen'));
const thirdProviders = computed(() => {
  const providers = ['ding', 'google', 'github', 'apple', 'huawei'].filter(
    (type) => supportLoginType(type) && hasThirdLoginConfig(type),
  );
  return providers;
});

const showRegister = computed(() => {
  return canShowRegisterEntry(appInfo.value);
});

const loginOemConfig = computed(() => resolveLoginOemConfig(systemConfigStore.systemConfig?.oem));

const registerPath = computed(() => {
  const redirectPath = normalizeInviteRedirectPath(route.query.redirect as string);
  if (!redirectPath) return '/auth/register';
  return `/auth/register?redirect=${encodeURIComponent(redirectPath)}`;
});

/**
 * 是否需要图片验证码挑战
 *
 *
 */
const isRequireImageCaptchaChallenge = ref(false)

onMounted(async () => {

  // //本应用登录不需要 org-id
  // const cookies = useCookies([ORG_ID_KEY], { doNotParse: true });
  // cookies.set(ORG_ID_KEY, '',{path:'/'});

  // 租户信息会通过 dependencies 自动更新
  // 获取租户详情
  // /api/v1/system/tenant/info/read
  // CoreApi.postApiV1SystemTenantInfoRead({
  //获取应用信息
  ///api/v1/system/tenant/app/core/read
  const appID = import.meta.env.VITE_GLOB_APPID;
  try {
    const res = await Api.read(appID);
    // console.log('应用信息==========', res);
    appInfo.value = res;

    if(res) {
      appInfoStore.updateSingleAppInfo(res);
    }

    // 唯一登录方式为微信开放平台时直接进入扫码页，并保留登录后的原始跳转参数。
    if (isWxOpenOnlyLogin(res.loginTypes)) {
      await router.replace({ path: '/auth/qrcode-login', query: route.query });
      return;
    }
  } finally {
    appInfoResolved.value = true;
  }

  // 扫码专用应用不需要请求账号密码登录使用的图片验证码。
  await refreshCaptcha();

});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'account',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('authentication.code'),
      renderComponentContent: () => ({
        suffix: () =>
          h('img', {
            src: captchaImgUrl.value,
            style: 'cursor:pointer;height:32px;background-color: #fff;',
            onClick: refreshCaptcha,
            title: $t('orgIotClient.auth.refreshCaptcha'),
          }),
      }),
      // hidden: isRequireImageCaptchaChallenge.value,
      hide: !isRequireImageCaptchaChallenge.value,
    },
    // {
    //   component: markRaw(SliderCaptcha),
    //   fieldName: 'captcha',
    //   rules: z.boolean().refine((value) => value, {
    //     message: $t('authentication.verifyRequiredTip'),
    //   }),
    // },
  ];
});

const handleSubmit = async (values: Record<string, any>) => {
  try {
    await authStore.authLogin(buildPwdLoginPayload(values, codeID.value, passwordMode.mode));

    // message.success('登录成功');

    // notification.success({
    //   content: '登录成功',
    //   description: '登录成功',
    //   duration: 1500,
    // });
  } catch (error: any) {
    // console.log('登录失败==========', error);
    notifyRequestError(error, () => $t('orgIotClient.auth.loginFailedWithMsg', { msg: error?.msg ? `: ${error?.msg}` : '' }), (text) => message.error(text));

    if(error?.code == 1000034) {
      isRequireImageCaptchaChallenge.value = true;
    }
    // notification.error({
    //   description: '登录失败' + (error?.msg ? ': ' + error?.msg : ''),
    //   content: '登录失败',
    //   duration: 1500,
    // });
    refreshCaptcha();

    const formApi = loginRef.value?.getFormApi();
    formApi?.setFieldValue('code', '');
  }
};

async function handleThirdLoginStart(provider: string) {
  try {
    const providerEnum = provider as CoreApi.UserThirdAuthStartReqProviderEnum;
    const result = await Api.thirdAuthStart(providerEnum, 'web');
    if (!result.authUrl) {
      message.error($t('orgIotClient.auth.noAuthUrl'));
      return;
    }
    window.location.href = result.authUrl;
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgIotClient.auth.thirdLoginStartFailed'), (text) => message.error(text));
  }
}
</script>

<template>
  <AuthenticationLogin
    v-if="appInfoResolved"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleSubmit"
    :show-code-login="showPhoneLogin"
    :show-email-code-login="showEmailLogin"
    :show-qrcode-login="showWxOpenLogin"
    :show-third-party-login="false"
    :show-register="showRegister"
    :register-path="registerPath"
    :show-forget-password="showPhoneLogin || showEmailLogin"
    :sub-title="loginOemConfig.loginFormDescription"
    :title="loginOemConfig.loginFormTitle"
    ref="loginRef"
  >
    <template #third-party-login>
      <ThirdLoginEntry :providers="thirdProviders" :loading="authStore.loginLoading" @start="handleThirdLoginStart" />
    </template>
  </AuthenticationLogin>
</template>
