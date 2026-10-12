<!-- 系统初始化页面：首次配置流程与已完成状态共用，页头、管理员首步和完成提示随界面语言显示。 -->
<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { preferences } from '@vben/preferences';

import { NButton, NGrid, NGridItem, NStep, NSteps, NSwitch } from 'naive-ui';
import { createProForm, ProSelect, ProSwitch, ProForm, ProInput, ProDigit, ProPassword, ProUpload } from 'pro-naive-ui';

import { message } from '../../adapter/naive';
import { $t } from '../../locales';
import { validatePasswordByLevel } from '../../utils/password';
import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';

import { uploadFileInit } from '../../api/upload';
import { useSystemConfigStore } from '@vben/stores';

import SnowfallBg from '../../components/SnowfallBg.vue';
import LiquidGlass from '../../components/LiquidGlass.vue';

defineOptions({ name: 'SystemInit' });

const router = useRouter();

const systemConfigStore = useSystemConfigStore();

const alreadyInited = ref(false);

onMounted(async () => {
  // 判断是否已初始化：oem.title 未初始化时为空字符串，执行 /system/init 后有值
  const config = await systemConfigStore.getSystemConfig();
  if (config?.oem?.title?.trim()) {
    alreadyInited.value = true;
  }
});

const currentStep = ref<number>(1);
const totalSteps = 2;
const submitting = ref(false);
const showConfirm = ref(false);
const showFreeTenantConfig = ref(false);

// 存储上传成功后的文件路径
const avatarFilePath = ref<string>('');
const oemAvatarFilePath = ref<string>('');

// OEM Logo 受控 fileList
const oemUploadFileList = ref<UploadFileInfo[]>([]);
let oemObjectUrl = '';

const oemUploadFieldProps = computed(() => ({
  listType: 'image-card' as const,
  onlyAcceptImage: true,
  max: 1,
  fileList: oemUploadFileList.value,
  'onUpdate:fileList': (list: UploadFileInfo[]) => {
    oemUploadFileList.value = list;
  },
  onUnAcceptType: () => {
    message.warning($t('initPage.unsupportedFormat'));
  },
  customRequest: customOemAvatarRequestFn,
  onRemove: handleOemAvatarRemove,
}));

// ───── 下载配置清单 ─────

function downloadConfigTxt() {
  const v = form.values.value as any;
  // 与提交逻辑保持一致：开关关闭时按“禁止/无限”展示
  const freeTenantLimit = userOwnTenantLimitEnabled.value ? Number(v?.config?.user?.userOwnTenantLimit ?? 1) : 0;

  const fmtLimit = (value: number) => {
    if (value === -1) return $t('initPage.text_09c4fc252cfb');
    if (value === 0) return $t('initPage.text_c5a804b2c015');
    return String(value);
  };

  const lines = [
    $t('initPage.text_0c877d41d9df'),
    $t('initPage.text_2fbfe91d497f', { arg0: new Date().toLocaleString(preferences.app.locale) }),
    '',
    $t('initPage.text_e54cef07307e'),
    $t('initPage.text_baf8db737ab5', { arg0: v?.ownerUser?.userName ?? '' }),
    $t('initPage.text_593b27df0294', { arg0: v?.ownerUser?.password ?? '' }),
    $t('initPage.text_33dd940f4bed', { arg0: v?.ownerUser?.nickName ?? '' }),
    $t('initPage.text_6da60f9f885d', { arg0: v?.ownerUser?.email ?? $t('initPage.text_6271a050a05b') }),
    $t('initPage.text_56f2daf74539', { arg0: v?.ownerUser?.phone ?? $t('initPage.text_6271a050a05b') }),
    '',
    $t('initPage.text_d74620a46827'),
    $t('initPage.text_01fa6def4b6d', { arg0: v?.config?.oem?.title ?? '' }),
    $t('initPage.text_cf44cf85f19c', { arg0: v?.config?.oem?.footer?.companyName ?? '' }),
    $t('initPage.text_74be783b3310', { arg0: v?.config?.oem?.footer?.companySiteLink ?? $t('initPage.text_6271a050a05b') }),
    '',
    $t('initPage.text_048afc21b41f'),
    $t('initPage.text_f9e5928c3c81', { arg0: v?.config?.user?.captchaLen ?? 6 }),
    $t('initPage.text_a589c43591b7', { arg0: v?.config?.user?.passLevel ?? 2 }),
    $t('initPage.text_1005dc118e54', { arg0: freeTenantLimit === 0 ? $t('initPage.text_1ddb70d003b1') : freeTenantLimit }),
    freeTenantLimit <= 0 ? $t('initPage.text_92c21b566131') : $t('initPage.text_e4a59b4a26cc'),
    '',
    $t('initPage.text_fa2852a6a1a5'),
    freeTenantLimit <= 0
      ? $t('initPage.text_47d46854b1e1')
      : $t('initPage.text_4584fe799897', { arg0: fmtLimit(Number(v?.config?.tenant?.defaultLimit?.deviceNum ?? -1)) }),
    freeTenantLimit <= 0
      ? $t('initPage.text_59c91475d8af')
      : $t('initPage.text_e3f5162b6065', { arg0: fmtLimit(Number(v?.config?.tenant?.defaultLimit?.userNum ?? -1)) }),
    freeTenantLimit <= 0
      ? $t('initPage.text_7b1a22f87f45')
      : $t('initPage.text_25eacba8b688', { arg0: fmtLimit(Number(v?.config?.tenant?.defaultLimit?.aiTokenMonthly ?? -1)) }),
    freeTenantLimit <= 0
      ? $t('initPage.text_388ed505d752')
      : $t('initPage.text_05dd02dd4389', { arg0: fmtLimit(Number(v?.config?.tenant?.defaultLimit?.diskSpaceGB ?? -1)) }),
    freeTenantLimit <= 0
      ? $t('initPage.text_796ad8c66330')
      : $t('initPage.text_1f94b346ad44', { arg0: fmtLimit(Number(v?.config?.tenant?.defaultLimit?.deviceMsgPerDay ?? -1)) }),
    '',
    $t('initPage.text_b04fbbc78642'),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = $t('initPage.text_a55f8368ef0a');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ───── 步骤控制 ─────

async function nextStep() {
  if (currentStep.value === 1) {
    try {
      await form.validate(['ownerUser.userName', 'ownerUser.password', 'ownerUser._confirmPassword', 'ownerUser.email', 'ownerUser.phone']);
    } catch {
      return;
    }

    const values = form.values.value as any;
    const pw = values?.ownerUser?.password ?? '';
    const confirmPw = values?.ownerUser?._confirmPassword ?? '';
    if (pw !== confirmPw) {
      message.warning($t('authentication.confirmPasswordTip'));
      return;
    }

    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  } else {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

const formRules = {
  'config.oem.title': [
    {
      required: true,
      message: $t('initPage.text_61235372321e'),
      trigger: ['input', 'blur'],
    },
  ],
  'config.oem.footer.companyName': [
    {
      required: true,
      message: $t('initPage.text_1987ad617ee1'),
      trigger: ['input', 'blur'],
    },
  ],
  'ownerUser.userName': [
    {
      required: true,
      message: $t('authentication.usernameTip'),
      trigger: ['input', 'blur'],
    },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/,
      message: $t('initPage.usernamePattern'),
      trigger: ['input', 'blur'],
    },
  ],
  'ownerUser.email': [
    {
      message: $t('authentication.emailValidErrorTip'),
      trigger: ['input', 'blur'],
      validator: (_rule: any, value: string) => {
        if (!value || !value.trim()) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
    },
  ],
  'ownerUser.phone': [
    {
      message: $t('authentication.mobileErrortip'),
      trigger: ['input', 'blur'],
      validator: (_rule: any, value: string) => {
        if (!value || !value.trim()) return true;
        return /^1[3-9]\d{9}$/.test(value);
      },
    },
  ],
  'ownerUser.password': [
    {
      required: true,
      message: $t('authentication.passwordTip'),
      trigger: ['input', 'blur'],
    },
    {
      trigger: ['input', 'blur'],
      validator: (_rule: any, value: string) => {
        if (!value) {
          _rule.message = $t('authentication.passwordTip');
          return false;
        }
        const error = validatePasswordByLevel(value, 2);
        if (error) {
          // 保持共用密码强度校验规则，仅按错误类别显示本页译文。
          _rule.message = value.length < 8 ? $t('initPage.passwordTooShort') : $t('initPage.passwordNeedsTwoTypes');
          return false;
        }
        return true;
      },
    },
  ],
  'ownerUser._confirmPassword': [
    {
      required: true,
      message: $t('initPage.confirmPasswordRequired'),
      trigger: ['input', 'blur'],
    },
  ],
};

// 用于监听页脚是否启用
const isFooterEnabled = ref(false);

// 免费企业默认配额「是否限制」开关：关闭 = 无限（-1），打开 = 填额度（0 禁止 / >0 具体限制）
const limitSwitches = reactive({
  deviceNum: false,
  userNum: false,
  aiTokenMonthly: false,
  diskSpaceGB: false,
  deviceMsgPerDay: false,
});

// 「用户可直接创建免费企业数量」开关：打开 = 允许创建（上限由输入框决定，默认 1），关闭 = 禁止直接创建（0）
const userOwnTenantLimitEnabled = ref(true);

const form = createProForm({
  initialValues: {
    config: {
      oem: {
        footer: {
          isEnable: 2,
        },
      },
      tenant: {
        defaultLimit: {
          deviceNum: -1,
          userNum: -1,
          aiTokenMonthly: -1,
          diskSpaceGB: -1,
          deviceMsgPerDay: -1,
        },
      },
      user: {
        captchaLen: 6,
        passLevel: 2,
        remindSetPassword: 1,
        forceSetPassword: 2,
        userOwnTenantLimit: 1,
      },
    },
  },
  onSubmit: async () => {},
});

// 免费企业是否可直接创建：开关关闭时为 0（禁止），打开时取表单值（>=1）
const freeTenantLimit = computed(() => {
  if (!userOwnTenantLimitEnabled.value) return 0;
  return Number((form.values.value as any)?.config?.user?.userOwnTenantLimit ?? 1);
});

watch(
  freeTenantLimit,
  (value) => {
    if (value <= 0) {
      showFreeTenantConfig.value = false;
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (submitting.value) return;
  try {
    await form.validate(['config.oem.title', 'config.oem.footer.companyName']);
  } catch {
    return;
  }
  if (!oemAvatarFilePath.value?.trim()) {
    message.warning($t('initPage.text_b5983f39a4bf'));
    return;
  }

  const values = form.values.value as any;

  // 免费企业数量：开关打开时需 >=1
  if (userOwnTenantLimitEnabled.value) {
    const v = Number(values?.config?.user?.userOwnTenantLimit);
    if (!v || v < 1) {
      message.warning($t('initPage.text_ae75036fb5b1'));
      return;
    }
  }

  // 免费企业默认配额：开关打开时需 >=0（0 表示禁止，>0 表示具体限制）
  const limitFields = ['deviceNum', 'userNum', 'aiTokenMonthly', 'diskSpaceGB', 'deviceMsgPerDay'] as const;
  for (const key of limitFields) {
    if (limitSwitches[key]) {
      const v = Number(values?.config?.tenant?.defaultLimit?.[key]);
      if (Number.isNaN(v) || v < 0) {
        message.warning($t('initPage.text_16f8613f6df3'));
        return;
      }
    }
  }

  showConfirm.value = true;
}

async function handleConfirmSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  const values = JSON.parse(JSON.stringify(form.values.value)) as any;
  try {
    values.ownerUser.avatar = avatarFilePath.value;
    delete values.ownerUser._confirmPassword;
    values.config.oem.avatar = oemAvatarFilePath.value;

    // 免费企业数量：开关关闭 → 禁止直接创建（0）；开启 → 保留表单值（>=1）
    if (!userOwnTenantLimitEnabled.value) {
      values.config.user.userOwnTenantLimit = 0;
    }

    // 免费企业默认配额：开关关闭 → 无限（-1）；开启 → 保留表单值（0 或 >0）
    const limitFields = ['deviceNum', 'userNum', 'aiTokenMonthly', 'diskSpaceGB', 'deviceMsgPerDay'] as const;
    for (const key of limitFields) {
      if (!limitSwitches[key]) {
        values.config.tenant.defaultLimit[key] = -1;
      }
    }

    await CoreApi.postApiV1SystemCommonSystemInit(values);

    systemConfigStore.updateSystemConfig(values.config as any);

    message.success($t('initPage.text_fbb8f22f9fa2'));
    setTimeout(() => {
      router.replace('/auth/login');
    }, 1500);
  } catch (error: any) {
    const errorMessage = error?.msg || error?.message || $t('initPage.text_c50a2390900a');
    notifyRequestError(error, () => $t('initPage.text_8c6f420e50a0', { arg0: errorMessage }), (text) => message.error(text));
    console.error($t('initPage.text_32d3a0e56caf'), error);
    submitting.value = false;
  }
}

function customRequestFn({ file, onFinish, onError }: UploadCustomRequestOptions) {
  uploadFileInit(file.file as File)
    .then((res: any) => {
      if (res?.filePath) avatarFilePath.value = res.filePath;
      onFinish();
    })
    .catch((error) => {
      if (onError) {
        try {
          (onError as any)(error);
        } catch {
          onError();
        }
      }
    });
}

function handleAvatarRemove() {
  avatarFilePath.value = '';
  return true;
}

function customOemAvatarRequestFn({ file, onFinish, onError }: UploadCustomRequestOptions) {
  uploadFileInit(file.file as File)
    .then((res: any) => {
      if (res?.filePath) oemAvatarFilePath.value = res.filePath;
      onFinish();
    })
    .catch((error) => {
      if (onError) {
        try {
          (onError as any)(error);
        } catch {
          onError();
        }
      }
    });
}

function handleOemAvatarRemove() {
  oemAvatarFilePath.value = '';
  if (oemObjectUrl) {
    URL.revokeObjectURL(oemObjectUrl);
    oemObjectUrl = '';
  }
  return true;
}

function handleFooterIsEnableChange(value: number) {
  isFooterEnabled.value = value === 1;
}
</script>

<template>
  <div class="relative min-h-dvh">
    <div class="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <SnowfallBg class="h-full w-full" color="#94a3b8" :quantity="120" :speed="0.8" :max-radius="4" :min-radius="1" />
    </div>
    <div class="relative flex min-h-dvh items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="w-full max-w-5xl">
        <LiquidGlass
          container-class="!static"
          class="p-6 sm:p-8"
          :radius="28"
          :border="0.05"
          :frost="0.15"
          :lightness="92"
          :alpha="0.75"
          :blur="14"
          :scale="-150"
          :r-offset="-5"
          :g-offset="8"
          :b-offset="15"
        >
          <!-- 表单头部 -->
          <div class="mb-6 border-b border-slate-200/50 px-2 pb-6 text-center sm:px-4 dark:border-slate-700/50">
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">{{ $t('initPage.title') }}</h1>
            <p class="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">{{ $t('initPage.subtitle') }}</p>
          </div>

          <!-- ── 已初始化提示 ── -->
          <div v-if="alreadyInited" class="px-2 sm:px-4">
            <div class="flex flex-col items-center gap-6 py-8 text-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                <svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="space-y-2">
                <h2 class="text-xl font-bold text-slate-900 dark:text-slate-50">{{ $t('initPage.doneTitle') }}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('initPage.doneDescription') }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('initPage.doneSettingsHint') }}</p>
              </div>
              <NButton type="primary" size="large" @click="router.replace('/auth/login')">{{ $t('initPage.goToLogin') }}</NButton>
            </div>
          </div>

          <!-- ── 表单区域（提交确认前显示） ── -->
          <div v-if="!alreadyInited && !showConfirm" class="px-2 sm:px-4">
            <ProForm :form="form" :rules="formRules">
              <!-- 步骤指示器 -->
              <div class="mb-8">
                <NSteps :current="currentStep" :status="currentStep === totalSteps ? 'finish' : 'process'">
                  <NStep :title="$t('initPage.ownerStep')" :description="$t('initPage.ownerStepDescription')" />
                  <NStep :title="$t('initPage.settingsStep')" :description="$t('initPage.settingsStepDescription')" />
                </NSteps>
              </div>

              <!-- 步骤1: 所有者用户信息 -->
              <div v-show="currentStep === 1" class="space-y-6">
                <NGrid cols="1 s:2" :x-gap="16" :y-gap="20" responsive="screen">
                  <NGridItem>
                    <ProInput
                      path="ownerUser.userName"
                      :label="$t('authentication.username')"
                      required
                      :placeholder="$t('initPage.usernamePlaceholder')"
                      :tooltip="$t('initPage.usernameHint')"
                      :field-props="{ inputProps: { autocomplete: 'off' } }"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProPassword
                      path="ownerUser.password"
                      :label="$t('authentication.password')"
                      required
                      :placeholder="$t('authentication.passwordTip')"
                      :tooltip="$t('initPage.passwordHint')"
                      :field-props="{ showPasswordOn: 'click', inputProps: { autocomplete: 'new-password' } }"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProPassword
                      path="ownerUser._confirmPassword"
                      :label="$t('authentication.confirmPassword')"
                      required
                      :placeholder="$t('initPage.confirmPasswordPlaceholder')"
                      :field-props="{ showPasswordOn: 'click' }"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProInput
                      path="ownerUser.email"
                      :label="$t('authentication.email')"
                      placeholder="admin@example.com"
                      :tooltip="$t('initPage.emailHint')"
                      :field-props="{ inputProps: { autocomplete: 'off' } }"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProInput
                      path="ownerUser.phone"
                      :label="$t('authentication.mobile')"
                      placeholder="13800138000"
                      :tooltip="$t('initPage.phoneHint')"
                      :field-props="{ inputProps: { autocomplete: 'off' } }"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProInput
                      path="ownerUser.nickName"
                      :label="$t('initPage.nickname')"
                      :placeholder="$t('initPage.nicknamePlaceholder')"
                      :tooltip="$t('initPage.nicknameHint')"
                    />
                  </NGridItem>
                  <NGridItem>
                    <ProUpload
                      path="ownerUser.avatar"
                      :label="$t('initPage.avatar')"
                      :tooltip="$t('initPage.avatarHint')"
                      :field-props="{
                        listType: 'image-card',
                        onlyAcceptImage: true,
                        max: 1,
                        onUnAcceptType: () => {
                          message.warning($t('initPage.unsupportedFormat'));
                        },
                        customRequest: customRequestFn,
                        onRemove: handleAvatarRemove,
                      }"
                      >{{ $t('initPage.upload') }}</ProUpload
                    >
                  </NGridItem>
                </NGrid>
              </div>

              <!-- 步骤2: 系统配置 -->
              <div v-show="currentStep === 2" class="space-y-8">
                <!-- OEM配置 -->
                <div class="space-y-6">
                  <div class="border-b border-slate-200 pb-3 dark:border-slate-700">
                    <h3 class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50">{{ $t('initPage.text_6342f08c932d') }}</h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ $t('initPage.text_ffc7c7f8e216') }}</p>
                  </div>
                  <NGrid cols="1 s:2" :x-gap="16" :y-gap="20" responsive="screen">
                    <NGridItem>
                      <ProInput
                        path="config.oem.title"
                        :label="$t('initPage.text_9741afecd13d')"
                        :placeholder="$t('initPage.text_ffafb552d6a1')"
                        :tooltip="$t('initPage.text_c06b9ebbb5c2')"
                        required
                      />
                    </NGridItem>
                    <NGridItem>
                      <ProUpload
                        path="config.oem.avatar"
                        :label="$t('initPage.text_1f238b68e181')"
                        :tooltip="$t('initPage.text_9038e4d8ecc4')"
                        :field-props="oemUploadFieldProps"
                        required
                        >{{ $t('initPage.upload') }}</ProUpload
                      >
                    </NGridItem>
                    <NGridItem>
                      <ProInput
                        path="config.oem.footer.companyName"
                        :label="$t('initPage.text_94c4852ffb13')"
                        :placeholder="$t('initPage.text_6336f1daa0fe')"
                        :tooltip="$t('initPage.text_23f855ed876c')"
                        required
                      />
                    </NGridItem>
                    <NGridItem>
                      <ProInput
                        path="config.oem.footer.companySiteLink"
                        :label="$t('initPage.text_a6a6743266b1')"
                        :placeholder="$t('initPage.text_d5a4f4cb2c88')"
                        :tooltip="$t('initPage.text_dcecea0cd682')"
                      />
                    </NGridItem>
                    <NGridItem>
                      <ProSwitch
                        path="config.oem.footer.isEnable"
                        :label="$t('initPage.text_8ab7a8c052cb')"
                        :tooltip="$t('initPage.text_176f7f7a466f')"
                        :field-props="{
                          checkedValue: 1,
                          uncheckedValue: 2,
                        }"
                        @change="handleFooterIsEnableChange"
                      />
                    </NGridItem>
                    <template v-if="isFooterEnabled">
                      <NGridItem>
                        <ProInput
                          path="config.oem.footer.date"
                          :label="$t('initPage.text_a44817d4275b')"
                          :placeholder="$t('initPage.text_f84774f6addb')"
                          :tooltip="$t('initPage.text_56591f95dd87')"
                        />
                      </NGridItem>
                      <NGridItem>
                        <ProInput
                          path="config.oem.footer.icp"
                          :label="$t('initPage.text_c370da62df02')"
                          :placeholder="$t('initPage.text_fb242fcbedcb')"
                          :tooltip="$t('initPage.text_45e57dfd51f3')"
                        />
                      </NGridItem>
                      <NGridItem>
                        <ProInput
                          path="config.oem.footer.icpLink"
                          :label="$t('initPage.text_700c8df109ae')"
                          :placeholder="$t('initPage.text_01d08afa9267')"
                          :tooltip="$t('initPage.text_5df4acc682a3')"
                        />
                      </NGridItem>
                      <NGridItem>
                        <ProInput
                          path="config.oem.footer.beian"
                          :label="$t('initPage.text_92ca564a7734')"
                          :placeholder="$t('initPage.text_2b1f52bd3e29')"
                          :tooltip="$t('initPage.text_831ad7b89e13')"
                        />
                      </NGridItem>
                      <NGridItem>
                        <ProInput
                          path="config.oem.footer.beianLink"
                          :label="$t('initPage.text_07025b42dd89')"
                          :placeholder="$t('initPage.text_b5708ab17797')"
                          :tooltip="$t('initPage.text_76db449e1582')"
                        />
                      </NGridItem>
                    </template>
                  </NGrid>
                </div>

                <!-- 用户配置 -->
                <div class="space-y-6">
                  <div class="border-b border-slate-200 pb-3 dark:border-slate-700">
                    <h3 class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50">{{ $t('initPage.text_1c98a4253774') }}</h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ $t('initPage.text_88720009df79') }}</p>
                  </div>
                  <NGrid cols="1 s:2 m:3" :x-gap="16" :y-gap="20" responsive="screen">
                    <NGridItem>
                      <ProDigit
                        path="config.user.captchaLen"
                        :label="$t('initPage.text_b790f19b3fc7')"
                        :placeholder="$t('initPage.text_46c6449ff671')"
                        :tooltip="$t('initPage.text_87cd502cd01e')"
                        :field-props="{ min: 4, max: 8 }"
                      />
                    </NGridItem>
                    <NGridItem>
                      <ProSelect
                        path="config.user.passLevel"
                        :label="$t('initPage.text_e7b511e93278')"
                        :tooltip="$t('initPage.text_40231ed903cd')"
                        :field-props="{
                          options: [
                            { label: $t('initPage.text_c90a2d861e29'), value: 1 },
                            { label: $t('initPage.text_d250388ce69e'), value: 2 },
                            { label: $t('initPage.text_5d979dc33a03'), value: 3 },
                            { label: $t('initPage.text_cc453f735d7e'), value: 4 },
                          ],
                        }"
                        :placeholder="$t('initPage.text_f6aa5b359dba')"
                      />
                    </NGridItem>
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_9ca3d76dfd60') }}</span>
                          <NSwitch v-model:value="userOwnTenantLimitEnabled" />
                        </div>
                        <ProDigit
                          v-if="userOwnTenantLimitEnabled"
                          path="config.user.userOwnTenantLimit"
                          :label="$t('initPage.text_4643b30a2cc8')"
                          :placeholder="$t('initPage.text_f32167e8bb39')"
                          :tooltip="$t('initPage.text_e8f4160e1259')"
                          :field-props="{ min: 1 }"
                        />
                      </div>
                    </NGridItem>
                  </NGrid>

                  <div class="rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-4 dark:border-slate-700/70 dark:bg-slate-800/40">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div class="space-y-1 text-sm">
                        <p class="font-medium text-slate-900 dark:text-slate-100">{{ $t('initPage.text_e897871fad0f') }}</p>
                        <p class="text-slate-500 dark:text-slate-400">{{ $t('initPage.text_c2a2c6252656') }}</p>
                        <p v-if="freeTenantLimit <= 0" class="text-amber-600 dark:text-amber-400">{{ $t('initPage.text_fcf20e6f108c') }}</p>
                      </div>
                      <NButton v-if="freeTenantLimit > 0" secondary type="primary" @click="showFreeTenantConfig = !showFreeTenantConfig">
                        {{ showFreeTenantConfig ? $t('initPage.text_6d4595a18e16') : $t('initPage.text_0f00d6d14c0c') }}
                      </NButton>
                    </div>
                  </div>
                </div>

                <!-- 免费企业配置 -->
                <div v-if="freeTenantLimit > 0 && showFreeTenantConfig" class="space-y-6">
                  <div class="border-b border-slate-200 pb-3 dark:border-slate-700">
                    <h3 class="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50">{{ $t('initPage.text_3bb6b4eb2b0a') }}</h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ $t('initPage.text_54e938d20358') }}</p>
                  </div>
                  <NGrid cols="1 s:2 m:3" :x-gap="16" :y-gap="20" responsive="screen">
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_6c4c7f079c3b') }}</span>
                          <NSwitch v-model:value="limitSwitches.deviceNum" />
                        </div>
                        <ProDigit
                          v-if="limitSwitches.deviceNum"
                          path="config.tenant.defaultLimit.deviceNum"
                          :label="$t('initPage.text_c4ecd321403e')"
                          :placeholder="$t('initPage.text_f32167e8bb39')"
                          :tooltip="$t('initPage.text_a97fbd17c4c0')"
                          :field-props="{ min: 0 }"
                        />
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_7e4050aa80a5') }}</span>
                          <NSwitch v-model:value="limitSwitches.userNum" />
                        </div>
                        <ProDigit
                          v-if="limitSwitches.userNum"
                          path="config.tenant.defaultLimit.userNum"
                          :label="$t('initPage.text_3f680fa3d204')"
                          :placeholder="$t('initPage.text_f32167e8bb39')"
                          :tooltip="$t('initPage.text_a97fbd17c4c0')"
                          :field-props="{ min: 0 }"
                        />
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_65cf57f98fcc') }}</span>
                          <NSwitch v-model:value="limitSwitches.aiTokenMonthly" />
                        </div>
                        <ProDigit
                          v-if="limitSwitches.aiTokenMonthly"
                          path="config.tenant.defaultLimit.aiTokenMonthly"
                          :label="$t('initPage.text_65cf57f98fcc')"
                          :placeholder="$t('initPage.text_cd477090d9b2')"
                          :tooltip="$t('initPage.text_cc030a207752')"
                          :field-props="{ min: 0 }"
                        />
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_a3b83b21c795') }}</span>
                          <NSwitch v-model:value="limitSwitches.diskSpaceGB" />
                        </div>
                        <ProDigit
                          v-if="limitSwitches.diskSpaceGB"
                          path="config.tenant.defaultLimit.diskSpaceGB"
                          :label="$t('initPage.text_a3b83b21c795')"
                          :placeholder="$t('initPage.text_dc6538707085')"
                          :tooltip="$t('initPage.text_cc030a207752')"
                          :field-props="{ min: 0 }"
                        />
                      </div>
                    </NGridItem>
                    <NGridItem>
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm">{{ $t('initPage.text_b4d880227859') }}</span>
                          <NSwitch v-model:value="limitSwitches.deviceMsgPerDay" />
                        </div>
                        <ProDigit
                          v-if="limitSwitches.deviceMsgPerDay"
                          path="config.tenant.defaultLimit.deviceMsgPerDay"
                          :label="$t('initPage.text_b4d880227859')"
                          :placeholder="$t('initPage.text_f32167e8bb39')"
                          :tooltip="$t('initPage.text_11885be858d1')"
                          :field-props="{ min: 0 }"
                        />
                      </div>
                    </NGridItem>
                  </NGrid>
                </div>
              </div>

              <!-- 按钮区域 -->
              <div class="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-6 sm:gap-4 dark:border-slate-700">
                <NButton v-if="currentStep > 1" size="large" class="w-full sm:w-auto" @click="prevStep">{{ $t('initPage.text_75ef1241c0f4') }}</NButton>
                <NButton v-if="currentStep < totalSteps" type="primary" size="large" class="w-full sm:w-auto" @click="nextStep">
                  {{ $t('initPage.nextStep') }}
                </NButton>
                <NButton
                  v-if="currentStep === totalSteps"
                  type="primary"
                  size="large"
                  class="w-full sm:w-auto"
                  :loading="submitting"
                  :disabled="submitting"
                  @click="handleSubmit"
                >
                  {{ $t('initPage.text_f51bb65724fe') }}
                </NButton>
              </div>
            </ProForm>
          </div>

          <!-- ── 确认提交界面（替代弹窗） ── -->
          <div v-if="!alreadyInited && showConfirm" class="px-2 sm:px-4">
            <div class="flex flex-col items-center gap-6 py-4 text-center">
              <!-- 警告图标 -->
              <div class="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
                <svg class="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              <div class="space-y-2">
                <h2 class="text-xl font-bold text-slate-900 dark:text-slate-50">{{ $t('initPage.text_a85819e24125') }}</h2>
                <p class="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ $t('initPage.text_6d63279d9dd5')
                  }}<span class="font-medium text-amber-600 dark:text-amber-400">{{ $t('initPage.text_3212801cbcc4') }}</span
                  >{{ $t('initPage.text_85ae0f475542') }}<span class="font-medium text-red-500">{{ $t('initPage.text_bfdb3c99eb57') }}</span
                  >{{ $t('initPage.text_2f790b95a2d8') }}
                </p>
              </div>

              <!-- 配置摘要 -->
              <div
                class="w-full max-w-md space-y-2 rounded-xl border border-slate-200/60 bg-slate-50/80 px-6 py-4 text-left dark:border-slate-700/60 dark:bg-slate-800/60"
              >
                <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{{ $t('initPage.text_86a20b528efd') }}</h3>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ $t('initPage.text_284e268846b7') }}</span>
                  <span class="font-mono font-medium text-slate-800 dark:text-slate-200">{{ (form.values.value as any)?.ownerUser?.userName }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ $t('initPage.text_25124ed74c69') }}</span>
                  <span class="font-medium text-slate-800 dark:text-slate-200">{{ (form.values.value as any)?.ownerUser?.nickName || '—' }}</span>
                </div>
                <div class="my-2 border-t border-slate-200/60 dark:border-slate-700/40" />
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ $t('initPage.text_9741afecd13d') }}</span>
                  <span class="font-medium text-slate-800 dark:text-slate-200">{{ (form.values.value as any)?.config?.oem?.title }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 dark:text-slate-400">{{ $t('initPage.text_94c4852ffb13') }}</span>
                  <span class="font-medium text-slate-800 dark:text-slate-200">{{ (form.values.value as any)?.config?.oem?.footer?.companyName || '—' }}</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
                <NButton text type="primary" class="text-sm" @click="downloadConfigTxt">
                  <template #icon>
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </template>
                  {{ $t('initPage.text_e9983a0ca235') }}
                </NButton>
                <NButton size="large" :disabled="submitting" @click="showConfirm = false">{{ $t('initPage.text_9a233f23b4ec') }}</NButton>
                <NButton type="primary" size="large" :loading="submitting" :disabled="submitting" @click="handleConfirmSubmit">
                  {{ $t('initPage.text_d384f5e5bd56') }}
                </NButton>
              </div>
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
