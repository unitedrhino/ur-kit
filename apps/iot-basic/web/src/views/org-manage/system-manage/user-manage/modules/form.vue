<script lang="ts" setup>
// import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

// import type { SystemMenuApi } from '#/api/system/menu';
// import type { SystemRoleApi } from '#/api/system/role';

import { computed, nextTick, ref } from 'vue';

// import { CoreApi } from '@vben/api';
import { useVbenDrawer, Tree as VbenTree } from '@vben/common-ui';
// import { Spin } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { useVbenForm } from '@vben/saas';
// import { getMenuList } from '#/api/system/menu';
// import { createRole, updateRole } from '#/api/system/role';
import { $t } from '@vben/saas';
import{ CoreApi } from '@vben/api';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<CoreApi.MenuInfo>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const permissions = ref<CoreApi.MenuInfo[]>([]);
const loadingPermissions = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    // const { valid } = await formApi.validate();
    // if (!valid) return;
    // const values = await formApi.getValues();
    // drawerApi.lock();
    // (id.value ? updateRole(id.value, values) : createRole(values))
    //   .then(() => {
    //     emits('success');
    //     drawerApi.close();
    //   })
    //   .catch(() => {
    //     drawerApi.unlock();
    //   });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<CoreApi.MenuInfo>();
      formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }

      if (permissions.value.length === 0) {
        await loadPermissions();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    // TODO: 实现权限加载逻辑
  } finally {
    loadingPermissions.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id ? $t('common.edit', $t('system.role.name')) : $t('common.create', $t('system.role.name'));
});

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === 'button') {
    classes.push('inline-flex');
    if (node.index % 3 >= 1) {
      classes.push('!pl-0');
    }
  }

  return classes.join(' ');
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form v-loading="loadingPermissions">
      <template #permissions="slotProps">
        <VbenTree
          :tree-data="permissions"
          multiple
          bordered
          :default-expanded-level="2"
          :get-node-class="getNodeClass"
          v-bind="slotProps"
          value-field="id"
          label-field="meta.title"
          icon-field="meta.icon"
        >
          <template #node="{ value }">
            <IconifyIcon v-if="value.meta.icon" :icon="value.meta.icon" />
            {{ $t(value.meta.title) }}
          </template>
        </VbenTree>
      </template>
    </Form>
  </Drawer>
</template>
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    display: none;
    margin-left: 20px;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    display: flex;
    flex: auto;
    justify-content: flex-end;
    margin-left: 20px;
  }
}
</style>
