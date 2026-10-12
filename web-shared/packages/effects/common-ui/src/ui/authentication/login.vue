<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '@vben-core/form-ui';

import type { AuthenticationProps } from './types';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton, VbenCheckbox } from '@vben-core/shadcn-ui';

import Title from './auth-title.vue';
import ThirdPartyLogin from './third-party-login.vue';

interface Props extends AuthenticationProps {
  formSchema?: VbenFormSchema[];
}

defineOptions({
  name: 'AuthenticationLogin',
});

const props = withDefaults(defineProps<Props>(), {
  codeLoginPath: '/auth/code-login',
  emailCodeLoginPath: '/auth/code-login?type=email',
  forgetPasswordPath: '/auth/forget-password',
  formSchema: () => [],
  loading: false,
  qrCodeLoginPath: '/auth/qrcode-login',
  registerPath: '/auth/register',
  showCodeLogin: true,
  showEmailCodeLogin: false,
  showForgetPassword: true,
  showQrcodeLogin: true,
  showRegister: true,
  showRememberMe: true,
  showThirdPartyLogin: true,
  submitButtonText: '',
  subTitle: '',
  title: '',
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: true,
      hideRequiredMark: true,
    },
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);
const router = useRouter();

const REMEMBER_ME_KEY = `REMEMBER_ME_USERNAME_${location.hostname}`;

const localUsername = localStorage.getItem(REMEMBER_ME_KEY) || '';

const rememberMe = ref(!!localUsername);

// codeLoginEntries 汇总当前应用允许展示的辅助登录入口。
const codeLoginEntries = computed(() => {
  return [
    {
      label: $t('authentication.mobileLogin'),
      path: props.codeLoginPath,
      show: props.showCodeLogin,
    },
    {
      label: $t('authentication.emailLogin'),
      path: props.emailCodeLoginPath,
      show: props.showEmailCodeLogin,
    },
    {
      label: $t('authentication.qrcodeLogin'),
      path: props.qrCodeLoginPath,
      show: props.showQrcodeLogin,
    },
  ].filter((item) => item.show);
});

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.value ? values?.username : '');
    emit('submit', values);
  }
}

function handleGo(path: string) {
  router.push(path);
}

onMounted(() => {
  if (localUsername) {
    formApi.setFieldValue('username', localUsername);
  }
});

defineExpose({
  getFormApi: () => formApi,
});
</script>

<template>
  <div @keydown.enter.prevent="handleSubmit">
    <slot name="title">
      <Title>
        <slot name="title">
          {{ title || `${$t('authentication.welcomeBack')} 👋🏻` }}
        </slot>
        <template #desc>
          <span class="text-muted-foreground">
            <slot name="subTitle">
              {{ subTitle || $t('authentication.loginSubtitle') }}
            </slot>
          </span>
        </template>
      </Title>
    </slot>

    <Form />

    <div v-if="showRememberMe || showForgetPassword" class="mb-6 flex justify-between">
      <div class="flex-center">
        <VbenCheckbox v-if="showRememberMe" v-model:checked="rememberMe" name="rememberMe">
          {{ $t('authentication.rememberMe') }}
        </VbenCheckbox>
      </div>

      <span v-if="showForgetPassword" class="vben-link text-sm font-normal" @click="handleGo(forgetPasswordPath)">
        {{ $t('authentication.forgetPassword') }}
      </span>
    </div>
    <VbenButton
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      aria-label="login"
      class="w-full"
      @click="handleSubmit"
    >
      {{ submitButtonText || $t('common.login') }}
    </VbenButton>

    <div v-if="codeLoginEntries.length > 0" class="mb-2 mt-4 flex items-center gap-4">
      <VbenButton
        v-for="entry in codeLoginEntries"
        :key="entry.path"
        class="min-w-0 flex-1"
        variant="outline"
        @click="handleGo(entry.path)"
      >
        {{ entry.label }}
      </VbenButton>
    </div>

    <!-- 第三方登录 -->
    <slot name="third-party-login">
      <ThirdPartyLogin v-if="showThirdPartyLogin" />
    </slot>

    <slot name="to-register">
      <div v-if="showRegister" class="mt-3 text-center text-sm">
        {{ $t('authentication.accountTip') }}
        <span class="vben-link text-sm font-normal" @click="handleGo(registerPath)">
          {{ $t('authentication.createAccount') }}
        </span>
      </div>
    </slot>
  </div>
</template>
