<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useAuthStore } from '@vben/saas/store';

import { VbenButton } from '@vben-core/shadcn-ui';

import { useMessage } from 'naive-ui';

import { resolveAuthPath } from './auth-paths';
import { sha256Hex } from './crypto';
import { Api } from './index.api';

defineOptions({ name: 'ThirdLoginComplete' });

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const registerRef = ref<InstanceType<typeof AuthenticationRegister>>();

const pendingToken = computed(() => String(route.query.pendingToken || ''));
const provider = computed(() => String(route.query.provider || ''));
const registerType = ref<'email' | 'phone'>('phone');
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenRadioGroup',
    componentProps: {
      options: [
        { label: $t('authentication.mobile'), value: 'phone' },
        { label: $t('authentication.email'), value: 'email' },
      ],
      onUpdateValue: (value: 'email' | 'phone') => {
        registerType.value = value;
      },
    },
    fieldName: 'regType',
    defaultValue: registerType.value,
    label: $t('orgIotClient.auth.completeMethod'),
    rules: z.string().min(1),
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: registerType.value === 'phone' ? $t('orgIotClient.auth.enterPhone') : $t('orgIotClient.auth.emailPlaceholder'),
    },
    fieldName: 'account',
    label: $t('orgIotClient.auth.accountLabel'),
    rules: registerType.value === 'phone' ? z.string().min(1, { message: $t('orgIotClient.auth.enterPhone') }) : z.string().email({ message: $t('orgIotClient.auth.validEmailRequired') }),
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: $t('orgIotClient.auth.enterCode'),
    },
    fieldName: 'code',
    label: $t('authentication.code'),
    rules: z.string().min(1, { message: $t('orgIotClient.auth.enterCode') }),
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: $t('orgIotClient.auth.passwordOptional'),
    },
    fieldName: 'password',
    label: $t('authentication.password'),
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: $t('orgIotClient.auth.nicknameOptional'),
    },
    fieldName: 'nickName',
    label: $t('orgIotClient.auth.nickname'),
  },
]);

async function handleSubmit(values: Record<string, any>) {
  if (!pendingToken.value) {
    message.error($t('orgIotClient.auth.missingPendingToken'));
    return;
  }
  loading.value = true;
  try {
    const result = await Api.thirdRegister({
      pendingToken: pendingToken.value,
      regType: values.regType,
      account: values.account,
      code: values.code,
      password: values.password ? sha256Hex(values.password) : undefined,
      nickName: values.nickName || undefined,
    } as any);
    await authStore.authLoginWithResult(result);
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgIotClient.auth.completeRegisterFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

async function handleSendCode(values: Record<string, any>) {
  if (!values.account) {
    message.warning(registerType.value === 'phone' ? $t('orgIotClient.auth.phoneFirstShort') : $t('orgIotClient.auth.emailFirstShort'));
    return;
  }
  await (registerType.value === 'phone'
    ? Api.sendPhoneCode(values.account, undefined, undefined, CoreApi.UserCaptchaReqUseEnum.REGISTER)
    : Api.sendEmailCode(values.account, undefined, undefined, CoreApi.UserCaptchaReqUseEnum.REGISTER));
  message.success($t('console.bindAccount.codeSent'));
}

async function triggerSendCode() {
  const formApi = registerRef.value?.getFormApi?.();
  const values = formApi ? await formApi.getValues() : {};
  await handleSendCode(values);
}

function handleBackToLogin() {
  router.replace(resolveAuthPath(route, 'login'));
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center">
      <h2 class="text-foreground text-xl font-semibold">{{ $t('orgIotClient.auth.completeProfileTitle') }}</h2>
      <p class="text-muted-foreground mt-2 text-sm">
        {{
          provider
            ? $t('orgIotClient.auth.providerMissingInfo', { provider })
            : $t('orgIotClient.auth.completeProfileDesc')
        }}
      </p>
    </div>

    <AuthenticationRegister
      ref="registerRef"
      :form-schema="formSchema"
      :loading="loading"
      :login-path="resolveAuthPath(route, 'login')"
      @submit="handleSubmit"
    />
    <div class="space-y-3">
      <VbenButton class="w-full" variant="outline" @click="triggerSendCode">{{ $t('orgIotClient.auth.sendCodeText') }}</VbenButton>
      <VbenButton class="w-full" variant="ghost" @click="handleBackToLogin">{{ $t('orgIotClient.auth.backToLogin') }}</VbenButton>
    </div>
  </div>
</template>
