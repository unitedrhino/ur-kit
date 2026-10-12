<script lang="ts" setup>
import { $t } from '@vben/saas/locales';

import { notifyRequestError } from '@vben/saas/request-error';

/**
 * 报表新建/编辑抽屉（照大屏项目 FormDrawer 布局：useVbenDrawer + naive-ui 表单）。
 * 宿主通过 drawerApi.setData({ item?, routePrefix? }).open() 打开：
 * item 为空 = 新建（创建后跳转设计器）；item 有值 = 编辑（保存后 emit success 刷新列表）。
 */
import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NButton, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui';

import { ReportApi, type ReportInfo } from '../api';

type ReportFormData = {
  item?: ReportInfo | null;
  routePrefix?: string;
};

const emit = defineEmits<{
  success: [];
}>();

const message = useMessage();
const loading = ref(false);

const draft = reactive({
  desc: '',
  name: '',
  status: 1,
});

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];

const drawerTitle = computed(() =>
  drawerApi.getData<ReportFormData>().item ? '编辑报表' : '新建报表',
);

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const { item } = drawerApi.getData<ReportFormData>();
    draft.name = item?.name || '';
    draft.desc = item?.desc || '';
    draft.status = Number(item?.status) || 1;
  },
});

function openCreate() {
  drawerApi.setData({ item: null }).open();
}

function openEdit(item: ReportInfo) {
  drawerApi.setData({ item }).open();
}

async function onSubmit() {
  const { item, routePrefix = '/iot/report' } = drawerApi.getData<ReportFormData>();
  const name = draft.name.trim();
  if (!name) {
    message.error('报表名称不能为空');
    return;
  }
  loading.value = true;
  try {
    if (item?.id) {
      await ReportApi.update({
        id: String(item.id),
        name,
        desc: draft.desc,
        status: draft.status,
      });
      message.success('已保存修改');
      drawerApi.close();
      emit('success');
    } else {
      const resp = await ReportApi.create({ name, desc: draft.desc });
      drawerApi.close();
      message.success('创建成功，进入设计器');
      emit('success');
      window.location.hash = `#${routePrefix}/editor/${resp.id}`;
    }
  } catch (e: any) {
    notifyRequestError(e, () => $t('orgManage.common.saveFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer :title="drawerTitle">
    <NForm label-placement="top" class="mt-2">
      <NFormItem label="名称" required>
        <NInput v-model:value="draft.name" placeholder="报表名称（必填）" />
      </NFormItem>
      <NFormItem label="描述">
        <NInput
          v-model:value="draft.desc"
          placeholder="报表描述（可选）"
          type="textarea"
          :rows="3"
        />
      </NFormItem>
      <NFormItem v-if="drawerApi.getData<ReportFormData>().item" label="状态">
        <NSelect v-model:value="draft.status" :options="statusOptions" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NButton class="mr-3" @click="drawerApi.close()">取消</NButton>
      <NButton type="primary" :loading="loading" @click="drawerApi.onConfirm()">确定</NButton>
    </template>
  </Drawer>
</template>
