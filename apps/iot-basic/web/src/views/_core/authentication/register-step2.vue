<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useVbenForm } from '@vben/saas';
import { useAuthStore, useSessionStore } from '@vben/saas/store';
import { useUserStore } from '@vben/stores';

import { NButton, NStep, NSteps, useMessage } from 'naive-ui';

import { resolveAuthPath, resolveHomePath } from './auth-paths';

defineOptions({ name: 'RegisterStep2' });

const router = useRouter();
const route = useRoute();
const message = useMessage();
const userStore = useUserStore();
// 注册补充流程创建企业后，需要同步当前会话中的企业编码
const sessionStore = useSessionStore();
// 注册补充流程创建企业后，需要刷新用户企业列表，避免顶部企业下拉沿用旧缓存
const authStore = useAuthStore();
const currentStep = ref(2);

// 需求选项
const requirementOptions = [
  { label: $t('orgIotClient.auth.agentIntent'), value: 'agent' },
  { label: $t('orgIotClient.auth.student'), value: 'student' },
  { label: $t('orgIotClient.auth.personalUse'), value: 'use' },
];

// 行业选项
const industryOptions = [
  { label: $t('orgIotClient.auth.industryInternet'), value: 'internet' },
  { label: $t('orgIotClient.auth.industryManufacturing'), value: 'manufacturing' },
  { label: $t('orgIotClient.auth.industryEducation'), value: 'education' },
  { label: $t('orgIotClient.auth.industryFinance'), value: 'finance' },
  { label: $t('orgIotClient.auth.industryRetail'), value: 'retail' },
  { label: $t('orgIotClient.auth.industryHealthcare'), value: 'healthcare' },
  { label: $t('orgIotClient.auth.industryRealEstate'), value: 'realestate' },
  { label: $t('orgIotClient.auth.industryOther'), value: 'other' },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('console.orgCreate.nameLabel'),
      rules: z.string().min(1, { message: $t('console.orgCreate.nameRequired') }).max(15, { message: $t('console.orgCreate.nameMax') }),
      componentProps: {
        placeholder: $t('console.orgCreate.namePlaceholder'),
        maxlength: 15,
        showCount: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'requirement',
      label: $t('orgIotClient.auth.demandLabel'),
      rules: z.string().optional(),
      componentProps: {
        placeholder: $t('orgIotClient.auth.demandPlaceholder'),
        options: requirementOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'industry',
      label: $t('orgIotClient.auth.industryLabel'),
      rules: z.string().optional(),
      componentProps: {
        placeholder: $t('orgIotClient.auth.industryPlaceholder'),
        options: industryOptions,
      },
    },
  ],
  showDefaultActions: false,
});

const loading = ref(false);

// 检查访问权限并恢复数据
onMounted(() => {
  // 如果已登录（有用户信息），说明注册流程已完成，重定向到首页
  if (userStore.userInfo) {
    router.replace(resolveHomePath(route));
    return;
  }

  // 未登录，恢复数据（如果有）
  const step2Data = localStorage.getItem('register_step2_data');
  if (step2Data) {
    try {
      const data = JSON.parse(step2Data);
      formApi.setValues(data);
    } catch (error) {
      console.error('恢复数据失败:', error);
    }
  }
});

// 保存数据到 localStorage
async function saveData() {
  const values = await formApi.getValues();
  localStorage.setItem('register_step2_data', JSON.stringify(values));
}

// 下一步
async function handleNext() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  const values = (await formApi.getValues()) as { industry?: string; name?: string; requirement?: string };
  await saveData();

  // 如果有企业名称，创建企业
  if (values.name) {
    loading.value = true;
    try {
      const res = await CoreApi.postApiV1SystemTenantInfoCreate({
        name: values.name,
        desc: undefined,
      });

      if (res.code) {
        // 设置企业编码到会话 store，由 store 统一同步 cookie 与响应式状态
        sessionStore.setTenant(res.code);
      }

      // 回到 console 布局前刷新用户信息，让顶部企业列表拿到刚创建的企业
      await authStore.fetchUserInfo();

      message.success($t('console.orgCreate.success'));
      // 跳转到第三步
      router.push(resolveAuthPath(route, 'register/step3'));
    } catch (error: any) {
      notifyRequestError(error, () => error?.msg || error?.message || $t('orgIotClient.auth.orgCreateFailed'), (text) => message.error(text));
    } finally {
      loading.value = false;
    }
  } else {
    // 如果没有企业名称，直接跳转到第三步
    router.push(resolveAuthPath(route, 'register/step3'));
  }
}

// 加入企业/团队
async function handleJoinTenant() {
  await saveData();
  router.push(resolveHomePath(route));
}
</script>

<template>
  <div class="bg-background-deep flex min-h-screen items-center justify-center p-4">
    <div class="bg-card w-full max-w-2xl rounded-lg p-6 shadow-lg">
      <!-- 步骤指示器 -->
      <div class="mb-6">
        <NSteps :current="currentStep">
          <NStep />
          <NStep />
          <NStep />
        </NSteps>
      </div>

      <!-- 标题 -->
      <div class="mb-6 text-center">
        <h2 class="text-foreground text-2xl font-semibold">{{ $t('console.routes.registerStep2') }}</h2>
        <p class="text-muted-foreground mt-2 text-sm">{{ $t('orgIotClient.auth.createOrgDesc') }}</p>
      </div>

      <!-- 表单 -->
      <Form />

      <!-- 操作按钮 -->
      <div class="mt-6 flex flex-col gap-3">
        <NButton type="primary" size="large" :loading="loading" block @click="handleNext"> {{ $t('orgIotClient.auth.next') }} </NButton>
        <div class="text-center">
          <NButton text size="medium" @click="handleJoinTenant"> {{ $t('orgIotClient.auth.joinOrg') }} </NButton>
        </div>
      </div>
    </div>
  </div>
</template>
