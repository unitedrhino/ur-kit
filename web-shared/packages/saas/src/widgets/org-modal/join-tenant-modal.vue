<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/saas/locales';
import { z, useVbenModal } from '@vben/common-ui';
import { useMessage } from 'naive-ui';

import { CoreApi } from '@vben/api';
import { preferences } from '@vben/preferences';
import { watch } from 'vue';
import { useVbenForm } from '../../adapter/form';
import { useAuthStore } from '../../store/auth';
import { getBackToConsoleUrl } from '../../utils';

const emit = defineEmits(['success', 'openAddTenant']);

const message = useMessage();
const authStore = useAuthStore();

// 打开添加企业模态框
function handleOpenAddTenant() {
  modalApi.close();
  emit('openAddTenant');
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('orgWidgets.ui.invitationCode'),
      rules: z.string().min(1, { message: $t('orgWidgets.ui.pleaseEnterTheInvitationCode') }),
      componentProps: {
        placeholder: $t('orgWidgets.ui.pleaseEnterTheInvitationCode'),
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: $t('orgWidgets.ui.joinTheCompanyTeam'),
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        await CoreApi.postApiV1SystemUserSelfTenantJoin({
          code: data.code,
          method: 'code',
        });

        message.success($t('orgWidgets.ui.joinedTheCompanySuccessfully'));
        modalApi.close();

        // 刷新用户信息，更新 tenants 列表
        await authStore.fetchUserInfo();

        // 重新加载企业列表
        emit('success');

        // 跳转到首页
        const urlHref = getBackToConsoleUrl('/index');
        window.location.href = urlHref;
      } catch (error: any) {
        notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.failedToJoin'), (text) => message.error(text));
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      formApi.resetForm();
    }
  },
});

/** 语言切换后更新邀请表单与弹窗标题。 */
watch(() => preferences.app.locale, () => {
  formApi.updateSchema([{ fieldName: 'code', label: $t('orgWidgets.ui.invitationCode'), rules: z.string().min(1, { message: $t('orgWidgets.ui.pleaseEnterTheInvitationCode') }), componentProps: { placeholder: $t('orgWidgets.ui.pleaseEnterTheInvitationCode') } }]);
  modalApi.setState({ title: $t('orgWidgets.ui.joinTheCompanyTeam') });
});

defineExpose({
  open: () => modalApi.open(),
});
</script>

<template>
  <Modal>
    <Form class="mx-4" />
    <div class="mx-4 mb-4 mt-2 text-center">
      <span class="text-muted-foreground text-sm">{{ $t('orgWidgets.ui.wantToStartABusiness') }}</span>
      <button type="button" class="text-primary ml-1 text-sm underline hover:no-underline"
        @click="handleOpenAddTenant">
        {{ $t('orgWidgets.ui.addCompany') }}
      </button>
    </div>
  </Modal>
</template>
