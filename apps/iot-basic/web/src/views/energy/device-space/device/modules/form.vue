<script lang="ts" setup>
import { computed } from 'vue';
import { useVbenDrawer } from '@vben/common-ui';
import { useVbenForm } from '@vben/saas';
import { $t } from '@vben/saas';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { useFormSchema } from '../data';
import { Api } from '../index.api';

const emit = defineEmits<{
  success: [];
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    try {
      const data = await formApi.getValues();
      await Api.create(data as any);
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
</script>

<template>
  <Drawer class="w-full max-w-[600px]" :title="$t('ui.actionTitle.create')">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
