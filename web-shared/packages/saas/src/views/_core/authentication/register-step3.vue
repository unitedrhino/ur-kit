<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

/** 注册第三步：个人资料与来源选项随当前语言显示。 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { NSteps, NStep, NButton, useMessage } from 'naive-ui';

import { useVbenForm } from '@vben/saas';
import { CoreApi } from '@vben/api';
import { useUserStore } from '@vben/stores';

defineOptions({ name: 'RegisterStep3' });

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();
const currentStep = ref(3);

// 了解渠道选项
const sourceOptions = [
  { label: $t('orgIotClient.auth.sourceShortVideo'), value: 'shortvideo' },
  { label: $t('orgIotClient.auth.sourceWechat'), value: 'wechat' },
  { label: $t('orgIotClient.auth.sourceRecommendation'), value: 'recommendation' },
  { label: $t('orgIotClient.auth.sourceOther'), value: 'other' },
  { label: $t('orgIotClient.auth.sourceXiaohongshu'), value: 'xiaohongshu' },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'nickName',
      label: $t('orgIotClient.auth.nickname'),
      rules: z.string().min(1, { message: $t('orgIotClient.auth.nicknameRequired') }),
      componentProps: {
        placeholder: $t('orgIotClient.auth.nicknamePlaceholder'),
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'source',
      label: $t('orgIotClient.auth.sourceLabel'),
      rules: z.string().min(1, { message: $t('orgIotClient.auth.sourceRequired') }),
      componentProps: {
        options: sourceOptions,
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
  ],
  showDefaultActions: false,
});

const loading = ref(false);

// 检查访问权限并恢复数据
onMounted(() => {
  console.log('userStore.userInfo========+++++++',userStore.userInfo);
  // 如果已登录（有用户信息），说明注册流程已完成，重定向到首页
  if (userStore.userInfo) {
    router.replace('/index');
    return;
  }

  // 未登录，恢复数据（如果有）
  const savedData = localStorage.getItem('register_step3_data');
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      formApi.setValues(data);
    } catch (error) {
      console.error('恢复数据失败:', error);
    }
  }
});

// 保存数据到 localStorage
async function saveData() {
  const values = await formApi.getValues();
  localStorage.setItem('register_step3_data', JSON.stringify(values));
}

// 完成
async function handleComplete() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }

  const values = (await formApi.getValues()) as { nickName?: string; source?: string };
  await saveData();

  loading.value = true;
  try {
    // 更新用户信息（昵称）
    await CoreApi.postApiV1SystemUserSelfUpdate({
      nickName: values.nickName,
    });

    message.success($t('orgIotClient.auth.registerDone'));

    // 清除注册步骤数据
    localStorage.removeItem('register_step2_data');
    localStorage.removeItem('register_step3_data');

    // 跳转到首页
    router.push('/index');
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgIotClient.auth.updateProfileFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background-deep p-4">
    <div class="w-full max-w-2xl rounded-lg bg-card shadow-lg p-6">
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
        <h2 class="text-2xl font-semibold text-foreground">{{ $t('console.routes.registerStep3') }}</h2>
        <p class="mt-2 text-sm text-muted-foreground">{{ $t('orgIotClient.auth.profileDesc') }}</p>
      </div>

      <!-- 表单 -->
      <Form />

      <!-- 操作按钮 -->
      <div class="mt-6">
        <NButton
          type="primary"
          size="large"
          :loading="loading"
          block
          @click="handleComplete"
        >
          {{ $t('orgIotClient.auth.finish') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
