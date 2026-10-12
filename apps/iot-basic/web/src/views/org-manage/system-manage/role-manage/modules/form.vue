<script lang="ts" setup>
// import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import { CoreApi } from '@vben/api';
import { useVbenDrawer, Tree as VbenTree } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useVbenForm } from '@vben/saas';
// import { createRole, updateRole } from '#/api/system/role';
import { $t } from '@vben/saas';

import { useFormSchema } from '../data';

import { Api } from '../index.api';


const emits = defineEmits(['success']);

const formData = ref<CoreApi.RoleInfo>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});



const tenantApps = ref<any[]>([]);
// const tenantAppTree = ref<CoreApi.TenantAppInfo[]>([]);
const loadingTenantApps = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();

    try {
      if (id.value) {
        await Api.updateRoleApps(id.value, values.tenantApps);
        await Api.updateRole(values);
      } else {
        await Api.createRole(values);
      }
      emits('success');
      drawerApi.close();

    } catch (error) {
      console.error('error ======== 更新角色对应应用列表错误 ============= ', error);
      drawerApi.unlock();

    }

  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<CoreApi.RoleInfo>();
      // formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
        formApi.setValues(data);
      } else {
        id.value = undefined;
      }

      if (tenantApps.value.length === 0) {
        await loadTenantApps();
      }

    }
  },
});

async function loadTenantApps() {
  loadingTenantApps.value = true;
  try {
    const res = await Api.listTenantAllApps();

    tenantApps.value = res.list.map(item => ({
      id: item.appID,
      label: item.app?.name,
      meta: {
        title: item.app?.name + '(' + item.appID + ')',
        icon: "mdi:application",
      },
      // icon: item.app?.icon,
    }));

    // 如果是编辑模式，获取角色对应的菜单权限
    if (formData.value?.id) {
      const res_role_apps = await Api.listRoleApps(formData.value.id);

      if (res_role_apps?.appIDs && Array.isArray(res_role_apps.appIDs)) {
        formApi.setFieldValue('tenantApps', res_role_apps.appIDs);
      }
    }
  } finally {
    loadingTenantApps.value = false;
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
    <Form v-loading="loadingTenantApps">
      <template #tenantApps="slotProps">
        <VbenTree :tree-data="tenantApps" multiple bordered :default-expanded-level="2" :get-node-class="getNodeClass"
          v-bind="slotProps" value-field="id" label-field="meta.title" icon-field="meta.icon">
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
