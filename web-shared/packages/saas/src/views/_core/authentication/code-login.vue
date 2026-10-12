<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '../../../adapter/naive';

import { Api } from './index.api';

import { useAuthStore } from '../../../store';
import { CoreApi } from '@vben/api';

defineOptions({ name: 'CodeLogin' });

const loading = ref(false);
const CODE_LENGTH = 6;
const route = useRoute();

/**
 * resolveInitialLoginType 根据登录入口 query 决定验证码登录默认通道。
 */
function resolveInitialLoginType() {
  return route.query.type === CoreApi.UserLoginReqLoginTypeEnum.EMAIL
    ? CoreApi.UserLoginReqLoginTypeEnum.EMAIL
    : CoreApi.UserLoginReqLoginTypeEnum.PHONE;
}

// 登录类型：phone | email
const loginType = ref<CoreApi.UserLoginReqLoginTypeEnum>(resolveInitialLoginType());

// 图形验证码相关状态
const needImageCaptcha = ref(false);
const imageCaptchaUrl = ref('');
const imageCodeID = ref('');

// 验证码ID：分别存储手机和邮箱的codeID
const codePhoneID = ref('');
const codeEmailID = ref('');

const authStore = useAuthStore();
const loginRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('loginRef');

/**
 * 刷新图形验证码
 */
async function refreshImageCaptcha() {
  try {
    const formApi = loginRef.value?.getFormApi();
    const account = formApi ? (await formApi.getValues())[loginType.value === 'phone' ? 'phoneNumber' : 'email'] || '' : '';

    const res = await Api.getImageCaptcha(account);

    if (!res.url || !res.codeID) {
      message.error($t('console.bindAccount.captchaLoadFailed'));
      return;
    }

    imageCaptchaUrl.value = res.url;
    imageCodeID.value = res.codeID;

    // 清空用户输入的图形验证码
    if (formApi) {
      formApi.setFieldValue('imageCode', '');
    }
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || $t('console.bindAccount.captchaLoadFailed');
    notifyRequestError(error, () => errorMsg, (text) => message.error(text));
  }
}

/**
 * 切换登录类型
 */
async function switchLoginType() {
  // 切换登录类型
  loginType.value = loginType.value === CoreApi.UserLoginReqLoginTypeEnum.PHONE ? CoreApi.UserLoginReqLoginTypeEnum.EMAIL : CoreApi.UserLoginReqLoginTypeEnum.PHONE;

  // 重置相关状态
  needImageCaptcha.value = false;
  imageCaptchaUrl.value = '';
  imageCodeID.value = '';

  // 重置表单（清除所有验证错误和字段值）
  const formApi = loginRef.value?.getFormApi();
  if (formApi) {
    await formApi.resetForm();
  }
}

/**
 * 发送验证码
 */
async function handleSendCode() {
  loading.value = true;

  try {
    const formApi = loginRef.value?.getFormApi();
    if (!formApi) {
      throw new Error($t('orgIotClient.auth.formNotReady'));
    }

    // 验证账号格式
    const accountField = loginType.value === 'phone' ? 'phoneNumber' : 'email';
    await formApi.validateField(accountField);
    const isAccountValid = await formApi.isFieldValid(accountField);
    if (!isAccountValid) {
      throw new Error(loginType.value === 'phone' ? $t('orgIotClient.auth.phoneFirst') : $t('orgIotClient.auth.emailFirst'));
    }

    // 如果需要图形验证码，验证图形验证码
    if (needImageCaptcha.value) {
      await formApi.validateField('imageCode');
      const isImageCodeValid = await formApi.isFieldValid('imageCode');
      if (!isImageCodeValid) {
        throw new Error($t('orgIotClient.auth.imageCaptchaFirst'));
      }
    }

    const values = await formApi.getValues();
    const account = values[accountField];
    const imageCode = needImageCaptcha.value ? (values.imageCode || '') : undefined;
    const imageCodeId = needImageCaptcha.value ? imageCodeID.value : undefined;

    // 首次尝试获取验证码（如果需要图形验证码，则带上图形验证码参数）
    try {
      let res;
      if (loginType.value === 'phone') {
        res = await Api.sendPhoneCode(account, imageCode, imageCodeId);
      } else {
        res = await Api.sendEmailCode(account, imageCode, imageCodeId);
      }

      // 发送成功
      if (loginType.value === 'phone') {
        codePhoneID.value = res.codeID || '';
        message.success($t('orgIotClient.auth.codeSentToPhone', { account }));
      } else {
        codeEmailID.value = res.codeID || '';
        message.success($t('orgIotClient.auth.codeSentToEmail', { account }));
      }

      // 清除图形验证码相关状态
      needImageCaptcha.value = false;
      if (formApi) {
        formApi.setFieldValue('imageCode', '');
      }
      imageCaptchaUrl.value = '';
      imageCodeID.value = '';
    } catch (error: any) {
      // 如果返回错误码 1000034，需要图形验证码
      if (error?.code === 1000034 || error?.code === '1000034') {
        needImageCaptcha.value = true;
        await refreshImageCaptcha();
        message.warning($t('orgIotClient.auth.imageCaptchaPending'));
        return;
      }

      // 如果是图形验证码错误，自动刷新
      if (needImageCaptcha.value) {
        const errorMsg = error?.msg || error?.message || $t('console.bindAccount.codeWrong');
        notifyRequestError(error, () => errorMsg, (text) => message.error(text));
        if (formApi) {
          formApi.setFieldValue('imageCode', '');
        }
        await refreshImageCaptcha();
        return;
      }

      throw error;
    }
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || $t('console.bindAccount.codeSendFailed');
    notifyRequestError(error, () => errorMsg, (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  const schema: VbenFormSchema[] = [
    // 账号输入字段（动态切换手机号/邮箱）
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: loginType.value === 'phone' ? $t('authentication.mobile') : $t('orgIotClient.auth.emailPlaceholder'),
      },
      fieldName: loginType.value === 'phone' ? 'phoneNumber' : 'email',
      label: loginType.value === 'phone' ? $t('authentication.mobile') : $t('authentication.email'),
      rules: loginType.value === 'phone'
        ? z
            .string()
            .min(1, { message: $t('authentication.mobileTip') })
            .refine((v) => /^\d{11}$/.test(v), {
              message: $t('authentication.mobileErrortip'),
            })
        : z
            .string()
            .min(1, { message: $t('orgIotClient.auth.emailPlaceholder') })
            .email({ message: $t('console.bindAccount.emailInvalid') }),
    },
  ];

  // 图形验证码字段（动态显示/隐藏）
  if (needImageCaptcha.value) {
    schema.push({
      component: 'Input',
      fieldName: 'imageCode',
      label: $t('console.bindAccount.imageCode'),
      renderComponentContent: () => ({
        suffix: () =>
          h('img', {
            src: imageCaptchaUrl.value,
            style: 'cursor:pointer;height:32px;background-color: #fff;',
            onClick: refreshImageCaptcha,
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
      handleSendCode: handleSendCode,
      placeholder: $t('authentication.code'),
    },
    fieldName: 'code',
    label: $t('authentication.code'),
    rules: z.string().length(CODE_LENGTH, {
      message: $t('authentication.codeTip', [CODE_LENGTH]),
    }),
  });

  return schema;
});

/**
 * 异步处理登录操作
 * Asynchronously handle the login process
 * @param values 登录表单数据
 */
async function handleLogin(values: Recordable<any>) {
  loading.value = true;

  try {
    const account = loginType.value === 'phone' ? values.phoneNumber : values.email;
    const codeID = loginType.value === 'phone' ? codePhoneID.value : codeEmailID.value;

    if (!codeID) {
      message.error($t('console.bindAccount.getCodeFirst'));
      loading.value = false;
      return;
    }

    await authStore.authLogin({
      loginType: loginType.value,
      code: values.code,
      codeID: codeID,
      account: account,
    });

    // message.success('登录成功');
  } catch (error: any) {
    notifyRequestError(error, () => $t('orgIotClient.auth.loginFailedWithMsg', { msg: error?.msg ? `: ${error?.msg}` : '' }), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <AuthenticationCodeLogin ref="loginRef" :form-schema="formSchema" :loading="loading" @submit="handleLogin">
      <template #title>
        {{ $t('authentication.welcomeBack') }} {{ loginType === 'phone' ? '📲' : '📧' }}
      </template>
      <template #subTitle>
        <div class="flex items-center mt-2">
          <span class="text-muted-foreground">{{ $t('orgIotClient.auth.cannotLogin') }}</span>
          <button
            type="button"
            class="text-primary hover:underline text-sm ml-2"
            @click="switchLoginType"
          >
            {{ loginType === 'phone' ? $t('orgIotClient.auth.switchToEmailLogin') : $t('orgIotClient.auth.switchToPhoneLogin') }}
          </button>
        </div>
      </template>
    </AuthenticationCodeLogin>
  </div>
</template>
