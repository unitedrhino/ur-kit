<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/saas/locales';
import { computed, ref, watch } from 'vue';

import { CoreApi } from '@vben/api';
import { useVbenModal, z } from '@vben/common-ui';

import { useMessage, NFormItem, NInput } from 'naive-ui';

import { useUserStore } from '@vben/stores';
import { preferences } from '@vben/preferences';

import { useVbenForm } from '../../adapter/form';
import { useAuthStore } from '../../store/auth';
import { useSessionStore } from '../../store/session';

import JoinTenantModal from './join-tenant-modal.vue';
import {
  buildTenantLicensePrompt,
  shouldRequireTenantLicense,
} from './add-tenant-modal.utils';

const emit = defineEmits(['success']);
const message = useMessage();
const authStore = useAuthStore();
const sessionStore = useSessionStore();
const userStore = useUserStore();
const userOwnTenantLimit = ref(0);
const currentTenantCount = ref(0);
const licenseCode = ref('');
const licenseCodeError = ref('');
const forceLicenseMode = ref(false);
const submitHint = ref('');

// 加入企业模态框引用
const joinTenantModalRef = ref<InstanceType<typeof JoinTenantModal>>();

// 打开加入企业模态框
function handleOpenJoinTenant() {
  modalApi.close();
  joinTenantModalRef.value?.open();
}

// 处理加入企业成功
function handleJoinTenantSuccess() {
  emit('success');
}

const isOverLimit = computed(() => {
  if (userOwnTenantLimit.value <= 0) return true;
  return currentTenantCount.value >= userOwnTenantLimit.value;
});

const shouldShowLicenseInput = computed(() => isOverLimit.value || forceLicenseMode.value);
const licensePromptText = computed(() => buildTenantLicensePrompt(userOwnTenantLimit.value));

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'UploadImage',
      fieldName: 'avatar',
      label: $t('orgWidgets.ui.corporateLogoOptionalIfNotUploadedTheInitialsOfT'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('orgWidgets.ui.companyName'),
      rules: z
        .string()
        .min(1, { message: $t('orgWidgets.ui.pleaseEnterTheCompanyName') })
        .max(15, { message: $t('orgWidgets.ui.theCompanyNameCannotExceed15Characters') }),
      componentProps: {
        placeholder: $t('orgWidgets.ui.pleaseEnterTheCompanyNameRequiredWithin15Charact'),
        maxlength: 15,
        showCount: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('orgWidgets.ui.companyDescription'),
      rules: z
        .string()
        .max(50, { message: $t('orgWidgets.ui.businessDescriptionCannotExceed50Characters') })
        .optional(),
      componentProps: {
        placeholder: $t('orgWidgets.ui.pleaseEnterACompanyDescriptionOptionalWithin50Wo'),
        maxlength: 50,
        showCount: true,
        type: 'textarea',
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

async function loadQuota() {
  try {
    const configResp = await CoreApi.postApiV1SystemCommonSysConfigCoreGetOne({});
    userOwnTenantLimit.value = configResp?.user?.userOwnTenantLimit ?? 0;
    const tenants = (userStore.userInfo as any)?.tenants ?? [];
    currentTenantCount.value = tenants.filter((t: any) => t.isTenantOwner === 1).length;
  } catch {
    userOwnTenantLimit.value = 0;
    currentTenantCount.value = 0;
  }
}

const [Modal, modalApi] = useVbenModal({
  title: $t('orgWidgets.ui.createABusiness'),
  async onConfirm() {
    if (shouldShowLicenseInput.value && !licenseCode.value.trim()) {
      licenseCodeError.value = $t('orgWidgets.ui.ifYouNeedToCreateMoreEnterprisesPleaseEnterLicen');
      return;
    }
    licenseCodeError.value = '';
    submitHint.value = '';

    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const res = await CoreApi.postApiV1SystemTenantInfoCreate({
          avatar: data.avatar || undefined,
          name: data.name,
          desc: data.desc || undefined,
          licenseCode: shouldShowLicenseInput.value ? licenseCode.value.trim() || undefined : undefined,
        });
        message.success($t('orgWidgets.ui.enterpriseCreatedSuccessfully'));
        modalApi.close();

        if (res.code) {
          sessionStore.setTenant(res.code);
        }

        // 刷新用户信息，更新 tenants 列表
        await authStore.fetchUserInfo();

        emit('success');
      } catch (error: any) {
        if (shouldRequireTenantLicense(error)) {
          forceLicenseMode.value = true;
          submitHint.value = $t('orgWidgets.ui.ifYouNeedToCreateMoreEnterprisesPleaseEnterLicen_e72450');
          licenseCodeError.value = '';
          message.warning($t('orgWidgets.ui.theFreeEnterpriseLimitHasBeenReachedPleaseEnterL'));
          return;
        }
        notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.creationFailed'), (text) => message.error(text));
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      licenseCode.value = '';
      licenseCodeError.value = '';
      forceLicenseMode.value = false;
      submitHint.value = '';
      userOwnTenantLimit.value = 0;
      currentTenantCount.value = 0;
      loadQuota();
    }
  },
});

/** 语言切换后同步已挂载的表单与弹窗标题。 */
watch(() => preferences.app.locale, () => {
  formApi.updateSchema([
    { fieldName: 'avatar', label: $t('orgWidgets.ui.corporateLogoOptionalIfNotUploadedTheInitialsOfT') },
    { fieldName: 'name', label: $t('orgWidgets.ui.companyName'), rules: z.string().min(1, { message: $t('orgWidgets.ui.pleaseEnterTheCompanyName') }).max(15, { message: $t('orgWidgets.ui.theCompanyNameCannotExceed15Characters') }), componentProps: { placeholder: $t('orgWidgets.ui.pleaseEnterTheCompanyNameRequiredWithin15Charact'), maxlength: 15, showCount: true } },
    { fieldName: 'desc', label: $t('orgWidgets.ui.companyDescription'), rules: z.string().max(50, { message: $t('orgWidgets.ui.businessDescriptionCannotExceed50Characters') }).optional(), componentProps: { placeholder: $t('orgWidgets.ui.pleaseEnterACompanyDescriptionOptionalWithin50Wo'), maxlength: 50, showCount: true, type: 'textarea', rows: 3 } },
  ]);
  modalApi.setState({ title: $t('orgWidgets.ui.createABusiness') });
});

defineExpose({
  open: () => modalApi.open(),
});
</script>

<template>
  <div>
    <Modal>
      <div class="mx-2 space-y-5">
        <div
          v-if="shouldShowLicenseInput || submitHint"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
        >
          {{ submitHint || licensePromptText }}
        </div>

        <Form />

        <div
          v-if="shouldShowLicenseInput"
          class="bg-card/70 rounded-2xl border border-slate-200/80 p-4 shadow-sm backdrop-blur-sm"
        >
          <div class="mb-3">
            <div class="text-sm font-semibold text-foreground">License</div>
            <div class="mt-1 text-xs leading-5 text-muted-foreground">
              {{ $t('orgWidgets.ui.whenYouNeedToCreateMoreEnterprisesPleaseEnterLic') }}
            </div>
          </div>
          <NFormItem :label="$t('orgWidgets.ui.authorizationCode')" :feedback="licenseCodeError" :validation-status="licenseCodeError ? 'error' : undefined">
            <NInput
              v-model:value="licenseCode"
              :placeholder="$t('orgWidgets.ui.pleaseEnterLicense')"
              @keyup.enter="() => {}"
            />
          </NFormItem>
        </div>

        <div class="pb-2 text-center">
          <span class="text-muted-foreground text-sm">{{ $t('orgWidgets.ui.alreadyHaveAnInvitationCode') }}</span>
          <button
            type="button"
            class="text-primary ml-1 text-sm font-medium underline-offset-4 hover:underline"
            @click="handleOpenJoinTenant"
          >
            {{ $t('orgWidgets.ui.joinTheCompanyTeam') }}
          </button>
        </div>
      </div>
    </Modal>
    <JoinTenantModal ref="joinTenantModalRef" @success="handleJoinTenantSuccess" />
  </div>
</template>
