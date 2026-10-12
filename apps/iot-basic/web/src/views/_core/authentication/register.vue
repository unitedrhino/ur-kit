<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from '@vben/saas/naive';
import { useAppInfoStore, useAuthStore } from '@vben/saas/store';
import { getPasswordHint, validatePasswordByLevel } from '@vben/saas/utils';

import { NModal, NSpin, NStep, NSteps } from 'naive-ui';

import { resolveAuthPath } from './auth-paths';
import { sha256Hex } from './crypto';
import { Api } from './index.api';
import { extractInviteCodeFromRedirect, getPendingInviteCode, savePendingInviteCode } from './invite-link';
import { supportsRegisterChannel } from './register-visibility';

defineOptions({ name: 'Register' });

const router = useRouter();
const route = useRoute();
const appInfo = ref<CoreApi.AppInfo | null>(null);

const appInfoStore = useAppInfoStore();
const authStore = useAuthStore();

const currentStep = ref(1);

const loading = ref(false);

const CODE_LENGTH = 6;
// 图形验证码相关状态
const needImageCaptcha = ref(false);
const captchaImgUrl = ref('');
const codeID = ref('');
const codePhoneID = ref('');
const codeEmailID = ref('');
const registerRef = ref<InstanceType<typeof AuthenticationRegister>>();

// 协议相关状态
const agreements = ref<Record<string, CoreApi.Agreement>>({});
const showAgreementModal = ref(false);
const currentAgreement = ref<CoreApi.Agreement>({});
const agreementContent = ref('');
const agreementLoading = ref(false);

/**
 * 发送验证码
 */
async function sendCodeApi(account: string, imageCode?: string, imageCodeId?: string) {
  try {
    const res = await (registerType.value === CoreApi.UserRegisterReqRegTypeEnum.PHONE
      ? Api.sendPhoneCode(account, imageCode, imageCodeId, CoreApi.UserCaptchaReqUseEnum.REGISTER)
      : Api.sendEmailCode(account, imageCode, imageCodeId, CoreApi.UserCaptchaReqUseEnum.REGISTER));

    // 发送成功
    if (registerType.value === CoreApi.UserRegisterReqRegTypeEnum.PHONE) {
      codePhoneID.value = res.codeID || '';
      message.success($t('orgIotClient.auth.codeSentToPhone', { account }));
    } else {
      codeEmailID.value = res.codeID || '';
      message.success($t('orgIotClient.auth.codeSentToEmail', { account }));
    }

    // 清除图形验证码相关状态
    needImageCaptcha.value = false;
    const formApi = registerRef.value?.getFormApi();
    if (formApi) {
      formApi.setFieldValue('imageCode', '');
    }
    captchaImgUrl.value = '';
    codeID.value = '';
  } catch (error: any) {
    // 如果返回错误码 1000034，需要图形验证码
    if (error?.code === 1_000_034 || error?.code === '1000034') {
      needImageCaptcha.value = true;
      await refreshCaptcha();
      const formApi = registerRef.value?.getFormApi();
      if (formApi) {
        // 清除所有验证错误，避免图形验证码字段显示之前的验证错误
        await formApi.resetValidate();
      }
      message.warning($t('orgIotClient.auth.imageCaptchaPending'));
      throw error;
    }

    // 如果是图形验证码错误，自动刷新
    if (needImageCaptcha.value) {
      const errorMsg = error?.msg || error?.message || $t('console.changePwd.codeWrong');
      notifyRequestError(error, () => errorMsg, (text) => message.error(text));
      const formApi = registerRef.value?.getFormApi();
      if (formApi) {
        formApi.setFieldValue('imageCode', '');
      }
      await refreshCaptcha();
      throw error;
    }

    throw error;
  }
}

// 注册相关的计算属性
const hasEmailRegister = computed(() => supportsRegisterChannel(appInfo.value, 'email'));
const hasPhoneRegister = computed(() => supportsRegisterChannel(appInfo.value, 'phone'));
const showToggle = computed(() => hasEmailRegister.value && hasPhoneRegister.value);
const showRegisterForm = computed(() => hasEmailRegister.value || hasPhoneRegister.value);

onMounted(() => {
  const inviteCode = extractInviteCodeFromRedirect(route.query.redirect as string);
  if (inviteCode) {
    savePendingInviteCode(inviteCode);
  }

  const appID = import.meta.env.VITE_GLOB_APPID;
  Api.read(appID, ['user-agreement', 'privacy-policy', 'legal-statement', 'compliance-guide']).then((res) => {
    appInfo.value = res;

    if (res?.agreementsMap) {
      agreements.value = res.agreementsMap;
    }

    if (res) {
      appInfoStore.updateSingleAppInfo(res);

      // 根据 loginTypes 设置初始注册类型
      // 注意：如果启用了测试模式，这里会使用测试配置的值（通过计算属性 hasEmailRegister 和 hasPhoneRegister）
      const hasEmail = hasEmailRegister.value;
      const hasPhone = hasPhoneRegister.value;

      if (hasEmail && hasPhone) {
        // 两个都有，默认使用手机号
        registerType.value = CoreApi.UserRegisterReqRegTypeEnum.PHONE;
        registerTipTitle.value = $t('orgIotClient.auth.emailRegTip');
      } else if (hasEmail) {
        // 只有邮箱
        registerType.value = CoreApi.UserRegisterReqRegTypeEnum.EMAIL;
        registerTipTitle.value = $t('orgIotClient.auth.emailRegTip');
      } else if (hasPhone) {
        // 只有手机号
        registerType.value = CoreApi.UserRegisterReqRegTypeEnum.PHONE;
        registerTipTitle.value = $t('orgIotClient.auth.phoneRegTip');
      }
      // 如果都没有，不设置 registerType，表单不会显示
    }
  });
});

async function refreshCaptcha() {
  try {
    const formApi = registerRef.value?.getFormApi();
    const formValues = formApi ? await formApi.getValues() : undefined;
    const account = formValues?.account || '';

    const res = await Api.getImageCaptcha(account, CoreApi.UserCaptchaReqUseEnum.REGISTER);

    if (!res.url || !res.codeID) {
      message.error($t('console.bindAccount.captchaLoadFailed'));
      return;
    }

    captchaImgUrl.value = res.url;
    codeID.value = res.codeID;

    // 清空用户输入的图形验证码
    if (formApi) {
      formApi.setFieldValue('imageCode', '');
    }
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || $t('console.bindAccount.captchaLoadFailed');
    notifyRequestError(error, () => errorMsg, (text) => message.error(text));
  }
}

const registerTipTitle = ref($t('orgIotClient.auth.emailRegTip'));
const registerType = ref<CoreApi.UserRegisterReqRegTypeEnum>(CoreApi.UserRegisterReqRegTypeEnum.PHONE);

// 动态计算 placeholder
const accountPlaceholder = computed(() => {
  return registerType.value === CoreApi.UserRegisterReqRegTypeEnum.EMAIL ? $t('orgIotClient.auth.enterYourEmail') : $t('orgIotClient.auth.enterYourPhone');
});

// 动态计算 rules
const accountRules = computed(() => {
  return registerType.value === CoreApi.UserRegisterReqRegTypeEnum.EMAIL
    ? z.string().email({ message: $t('orgIotClient.auth.validEmailRequired') })
    : z.string().min(1, { message: $t('orgIotClient.auth.validPhoneRequired') });
});

function toggleRegisterType() {
  // 只在允许切换时执行
  if (!showToggle.value) return;

  const formApi = registerRef.value?.getFormApi();

  // 切换类型
  const newType =
    registerType.value === CoreApi.UserRegisterReqRegTypeEnum.EMAIL ? CoreApi.UserRegisterReqRegTypeEnum.PHONE : CoreApi.UserRegisterReqRegTypeEnum.EMAIL;
  registerType.value = newType;
  registerTipTitle.value = newType === CoreApi.UserRegisterReqRegTypeEnum.EMAIL ? $t('orgIotClient.auth.emailRegTip') : $t('orgIotClient.auth.phoneRegTip');

  // 重置图形验证码相关状态
  needImageCaptcha.value = false;
  captchaImgUrl.value = '';
  codeID.value = '';

  // 切换后清空当前字段的值
  if (formApi) {
    formApi.setFieldValue('account', '');
    formApi.setFieldValue('imageCode', '');
  }
}

async function openAgreement(item: CoreApi.Agreement) {
  currentAgreement.value = item;
  showAgreementModal.value = true;
  agreementContent.value = '';
  agreementLoading.value = true;
  try {
    const res = await Api.publicPreviewRender({
      id: item.id,
      appID: import.meta.env.VITE_GLOB_APPID,
    });
    agreementContent.value = res?.content || '';
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || $t('orgIotClient.auth.agreementLoadFailed'), (text) => message.error(text));
  } finally {
    agreementLoading.value = false;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: accountPlaceholder.value,
      },
      fieldName: 'account',
      label: $t('authentication.username'),
      rules: accountRules.value,
    },
  ];

  // 图形验证码字段（动态显示/隐藏）
  if (needImageCaptcha.value) {
    schema.push({
      component: 'Input',
      fieldName: 'imageCode',
      label: $t('console.bindAccount.imageCode'),
      componentProps: {
        placeholder: $t('orgIotClient.auth.imageCaptchaPlaceholder'),
      },
      renderComponentContent: () => ({
        suffix: () =>
          h('img', {
            src: captchaImgUrl.value,
            style: 'cursor:pointer;height:32px;background-color: #fff;',
            onClick: refreshCaptcha,
            title: $t('orgIotClient.auth.refreshCaptcha'),
          }),
      }),
      rules: z.string().min(1, { message: $t('orgIotClient.auth.imageCaptchaRequired') }).max(6, { message: $t('console.bindAccount.codeRequired') }),
    });
  }

  // 验证码输入字段
  schema.push({
    component: 'VbenPinInput',
    componentProps: {
      codeLength: CODE_LENGTH,
      createText: (countdown: number) => {
        const text = countdown > 0 ? $t('authentication.sendText', [countdown]) : $t('authentication.sendCode');
        return text;
      },
      handleSendCode: async () => {
        // 发送验证码
        loading.value = true;
        try {
          const formApi = registerRef.value?.getFormApi();
          if (!formApi) {
            throw new Error($t('orgIotClient.auth.formNotReady'));
          }

          // 验证账号字段（根据类型动态验证）
          await formApi.validateField('account');
          const isAccountReady = await formApi.isFieldValid('account');
          if (!isAccountReady) {
            throw new Error(registerType.value === CoreApi.UserRegisterReqRegTypeEnum.EMAIL ? $t('orgIotClient.auth.emailFirst') : $t('orgIotClient.auth.phoneFirst'));
          }

          // 如果需要图形验证码，验证图形验证码字段
          if (needImageCaptcha.value) {
            await formApi.validateField('imageCode');
            const isImageCodeValid = await formApi.isFieldValid('imageCode');
            if (!isImageCodeValid) {
              throw new Error($t('orgIotClient.auth.imageCaptchaFirst'));
            }
          }

          const values = await formApi.getValues();
          const account = values.account;
          const imageCode = needImageCaptcha.value ? values.imageCode || '' : undefined;
          const imageCodeId = needImageCaptcha.value ? codeID.value : undefined;

          if (registerType.value === CoreApi.UserRegisterReqRegTypeEnum.PHONE || registerType.value === CoreApi.UserRegisterReqRegTypeEnum.EMAIL) {
            await sendCodeApi(account, imageCode, imageCodeId);
          }
        } catch (error: any) {
          // sendCodeApi 内部已经处理了错误提示
          // 重新抛出错误，确保 VbenPinInput 组件不会启动倒计时
          if (error?.code !== 1_000_034 && error?.code !== '1000034') {
            const errorMsg = error?.msg || error?.message || $t('console.bindAccount.codeSendFailed');
            notifyRequestError(error, () => errorMsg, (text) => message.error(text));
          }
          // 所有错误都重新抛出，确保倒计时不会启动
          throw error;
        } finally {
          loading.value = false;
        }
      },
      placeholder: $t('authentication.code'),
    },
    fieldName: 'code',
    label: $t('authentication.code'),
    rules: z.string().length(CODE_LENGTH, {
      message: $t('authentication.codeTip', [CODE_LENGTH]),
    }),
  });

  // eslint-disable-next-line unicorn/prefer-single-call
  schema.push({
    component: 'VbenInputPassword',
    componentProps: {
      passwordStrength: true,
      placeholder: $t('authentication.password'),
    },
    fieldName: 'password',
    label: $t('authentication.password'),
    renderComponentContent() {
      return {
        strengthText: () => $t('authentication.passwordStrength'),
      };
    },
    rules: z
      .string()
      .min(1, { message: $t('authentication.passwordTip') })
      .refine((v) => validatePasswordByLevel(v) === null, {
        message: getPasswordHint(),
      }),
  });

  // 协议勾选框
  const agreementList = Object.values(agreements.value);
  if (agreementList.length > 0) {
    schema.push({
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('orgIotClient.auth.agreePrefix'),
            ...agreementList.map((item, index) =>
              h('span', [
                h(
                  'a',
                  {
                    class: 'vben-link ml-1',
                    href: 'javascript:void(0)',
                    onClick: (e: Event) => {
                      e.preventDefault();
                      openAgreement(item);
                    },
                  },
                  item.name || item.title || item.code,
                ),
                index < agreementList.length - 1 ? $t('orgIotClient.auth.agreementsSeparator') : '',
              ]),
            ),
          ]),
      }),
      rules: z.boolean().refine((value) => !!value, {
        message: $t('orgIotClient.auth.agreeRequired'),
      }),
    });
  }

  return schema;
});

function handleSubmit(value: Recordable<any>) {
  // eslint-disable-next-line no-console
  console.log('register submit:', value);

  // 普通用户注册
  const isWithLogin = true;
  const hasPendingInvite = !!getPendingInviteCode();
  CoreApi.postApiV1SystemUserSelfRegister({
    regType: registerType.value,
    account: value.account,
    password: sha256Hex(value.password || ''),
    code: value.code,
    codeID: registerType.value === CoreApi.UserRegisterReqRegTypeEnum.PHONE ? codePhoneID.value : codeEmailID.value,
    isWithLogin,
  })
    .then(async (res) => {
      // 如果注册时设置了自动登录，则执行登录流程
      if (isWithLogin && res) {
        try {
          await authStore.authLoginWithResult(
            res,
            hasPendingInvite
              ? undefined
              : () => {
                  // 注册成功后跳转到第二步页面
                  router.push(resolveAuthPath(route, 'register/step2'));
                },
          );
        } catch (loginError) {
          console.error('自动登录失败:', loginError);
          message.destroyAll();
          notifyRequestError(loginError, () => $t('orgIotClient.auth.registerOkAutoLoginFailed'), (text) => message.error(text));
          // 即使登录失败，也跳转到注册第二步
          router.push(resolveAuthPath(route, 'register/step2'));
        }
      } else {
        // 注册成功后跳转到第二步页面
        router.push(resolveAuthPath(route, 'register/step2'));
      }
    })
    .catch((error) => {
      console.error('注册失败:', error);
      message.destroyAll();
      notifyRequestError(error, () => error?.msg || error?.message || $t('orgIotClient.auth.registerFailed'), (text) => message.error(text));
    });
}
</script>

<template>
  <div v-if="showRegisterForm">
    <!-- 步骤指示器 -->
    <div class="mb-6">
      <NSteps :current="currentStep">
        <NStep />
        <NStep />
        <NStep />
      </NSteps>
    </div>
    <AuthenticationRegister
      ref="registerRef"
      :title="$t('orgIotClient.auth.registerTitle')"
      :sub-title="$t('orgIotClient.auth.registerSubtitle')"
      :form-schema="formSchema"
      :login-path="resolveAuthPath(route, 'login')"
      :loading="loading"
      @submit="handleSubmit"
    >
      <template #subTitle>
        <span v-if="showToggle">{{ registerTipTitle }}</span>
        <span v-if="showToggle" class="vben-link text-sm font-normal" @click="toggleRegisterType()"> {{ $t('orgIotClient.auth.clickHere') }} </span>
      </template>
    </AuthenticationRegister>

    <!-- 协议内容弹窗 -->
    <NModal
      v-model:show="showAgreementModal"
      preset="card"
      :title="currentAgreement.name || currentAgreement.title || $t('orgIotClient.auth.agreementFallback')"
      style="width: 800px; max-width: 90vw; max-height: 80vh"
    >
      <div v-if="agreementLoading" class="flex justify-center py-8">
        <NSpin size="large" />
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else class="overflow-y-auto" style="max-height: 60vh" v-html="agreementContent"></div>
    </NModal>
  </div>
  <div v-else class="flex min-h-[400px] flex-col items-center justify-center">
    <div class="text-center">
      <p class="text-muted-foreground mb-4 text-lg">{{ $t('orgIotClient.auth.registerDisabled') }}</p>
    </div>
  </div>
</template>
