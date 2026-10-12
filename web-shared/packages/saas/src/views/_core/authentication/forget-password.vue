<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

/** 忘记密码表单：账号、验证码和重置提示随当前语言显示。 */
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { CoreApi } from '@vben/api';

import { message } from '../../../adapter/naive';
import { validatePasswordByLevel, getPasswordHint } from '../../../utils/password';
import { sha256Hex } from '../../../utils/crypto';

import { Api } from './index.api';

defineOptions({ name: 'ForgetPassword' });

const router = useRouter();
const loading = ref(false);
const CODE_LENGTH = 6;

// 登录类型：phone | email
const loginType = ref<'phone' | 'email'>('phone');

// 图形验证码相关状态
const needImageCaptcha = ref(false);
const imageCaptchaUrl = ref('');
const imageCodeID = ref('');

// 验证码ID：分别存储手机和邮箱的codeID
const codePhoneID = ref('');
const codeEmailID = ref('');

const forgetPasswordRef = useTemplateRef<InstanceType<typeof AuthenticationCodeLogin>>('forgetPasswordRef');

/**
 * 刷新图形验证码
 */
async function refreshImageCaptcha() {
  try {
    const formApi = forgetPasswordRef.value?.getFormApi();
    const account = formApi ? (await formApi.getValues())[loginType.value === 'phone' ? 'phoneNumber' : 'email'] || '' : '';

    const res = await Api.getImageCaptcha(account, CoreApi.UserCaptchaReqUseEnum.FORGET_PWD);

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
  loginType.value = loginType.value === 'phone' ? 'email' : 'phone';

  // 重置相关状态
  needImageCaptcha.value = false;
  imageCaptchaUrl.value = '';
  imageCodeID.value = '';
  codePhoneID.value = '';
  codeEmailID.value = '';

  // 重置表单（清除所有验证错误和字段值）
  const formApi = forgetPasswordRef.value?.getFormApi();
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
    const formApi = forgetPasswordRef.value?.getFormApi();
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
        res = await Api.sendPhoneCode(account, imageCode, imageCodeId, CoreApi.UserCaptchaReqUseEnum.FORGET_PWD);
      } else {
        res = await Api.sendEmailCode(account, imageCode, imageCodeId, CoreApi.UserCaptchaReqUseEnum.FORGET_PWD);
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

  // 密码输入字段
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

  return schema;
});

/**
 * 异步处理重置密码操作
 * @param values 表单数据
 */
async function handleSubmit(values: Recordable<any>) {
  loading.value = true;

  try {
    const account = loginType.value === 'phone' ? values.phoneNumber : values.email;
    const codeID = loginType.value === 'phone' ? codePhoneID.value : codeEmailID.value;

    if (!codeID) {
      message.error($t('console.bindAccount.getCodeFirst'));
      loading.value = false;
      return;
    }

    await CoreApi.postApiV1SystemUserSelfForgetPwd({
      type: loginType.value === 'phone' ? CoreApi.UserForgetPwdReqTypeEnum.PHONE : CoreApi.UserForgetPwdReqTypeEnum.EMAIL,
      account: account,
      code: values.code,
      codeID: codeID,
      // 后端使用 bcrypt(SHA256(password)) 做哈希存储，前端先 SHA256 预处理
      password: sha256Hex(values.password || ''),
    });

    message.success($t('orgIotClient.auth.resetPasswordSuccess'));
    router.push('/auth/login');
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || '';
    notifyRequestError(error, () => $t('orgIotClient.auth.resetPasswordFailedWithMsg', { msg: errorMsg ? `: ${errorMsg}` : '' }), (text) => message.error(text));

    // 清空验证码和密码字段
    const formApi = forgetPasswordRef.value?.getFormApi();
    if (formApi) {
      formApi.setFieldValue('code', '');
      formApi.setFieldValue('password', '');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <AuthenticationCodeLogin ref="forgetPasswordRef" :form-schema="formSchema" :loading="loading" @submit="handleSubmit">
      <template #title>
        {{ $t('console.routes.resetPassword') }} {{ loginType === 'phone' ? '📲' : '📧' }}
      </template>
      <template #subTitle>
        <div class="flex items-center mt-2">
          <span class="text-muted-foreground">{{ $t('console.changePwd.newRequired') }}</span>
          <button
            type="button"
            class="text-primary hover:underline text-sm ml-2"
            @click="switchLoginType"
          >
            {{ loginType === 'phone' ? $t('orgIotClient.auth.switchToEmail') : $t('orgIotClient.auth.switchToPhone') }}
          </button>
        </div>
      </template>
      <template #submitButtonText>
        {{ $t('console.routes.resetPassword') }}
      </template>
    </AuthenticationCodeLogin>
  </div>
</template>
