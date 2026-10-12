<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { useLocalizedForm as useVbenForm } from '../../shared/manage-i18n';

import { $t as t } from '@vben/saas/locales';

import type { ComponentInfo } from '../index.api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { message} from '@vben/saas';
import { useUserStore } from '@vben/stores';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { GroupApi } from '../../shared/group.api';
import { useFormSchema } from '../data';
import { ComponentApi } from '../index.api';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<ComponentInfo>();
const userStore = useUserStore();
const adminRoles = new Set(['admin', 'super', 'super-admin', 'supper']);
const canManagePreset = computed(() => (userStore.userInfo?.roles ?? []).some((role: string) => adminRoles.has(role)));

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm(() => ({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema(canManagePreset.value),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
}));

async function loadGroupOptions() {
  try {
    const res = await GroupApi.list('component');
    const options = (res.list ?? []).map((g) => ({
      label: g.name || '',
      value: g.id || '',
    }));
    formApi.updateSchema([{ fieldName: 'groupId', componentProps: { options } }]);
  } catch {
    // ignore
  }
}

const [Drawer, drawerApi] = useVbenDrawer({
  closeOnClickModal: false,
  onConfirm: onSubmit,
  async onOpenChange(isOpen) {
    if (isOpen) {
      formApi.updateSchema([
        {
          fieldName: 'categoryId',
          componentProps: {
            // VbenFormSchema.componentProps 的类型未声明 options 键，但 Select 组件真实消费该字段，收窄断言后取值
            options:
              (
                useFormSchema(canManagePreset.value).find((item) => item.fieldName === 'categoryId')?.componentProps as
                  | Record<string, unknown>
                  | undefined
              )?.options ?? [],
          },
        },
      ]);
      await loadGroupOptions();
      const info = drawerApi.getData<ComponentInfo>();
      if (info && info.id) {
        formData.value = info;
        formApi.setValues({
          name: info.name,
          groupId: info.groupId,
          categoryId: info.categoryId,
          version: info.version,
          entry: info.entry,
          cover: info.cover,
          description: info.description,
        });
      } else {
        formData.value = undefined;
        formApi.resetForm();
      }
    }
  },
});

async function onSubmit() {
  try {
    await formApi.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  const values = await formApi.getValues<Record<string, any>>();

  const payload: ComponentInfo = {
    id: formData.value?.id,
    name: values.name,
    groupId: values.groupId,
    categoryId: values.categoryId,
    version: values.version,
    entry: values.entry,
    cover: values.cover,
    description: values.description,
  };

  try {
    if (formData.value?.id) {
      await ComponentApi.update(payload);
      message.success(t('orgManage.common.updateSuccess'));
    } else {
      await ComponentApi.create(payload);
      message.success(t('orgManage.common.createSuccess'));
    }
    drawerApi.close();
    emit('success');
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToSubmit', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    drawerApi.unlock();
  }
}

const getDrawerTitle = computed(() => (formData.value?.id ? t('bigscreenManagement.ui.editComponent') : t('bigscreenManagement.ui.addComponent')));
</script>

<template>
  <Drawer class="w-full max-w-[820px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
