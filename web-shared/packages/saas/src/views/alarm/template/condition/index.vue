<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/**
 * 文件说明：触发条件模板列表页
 * 负责模板查询、状态切换和删除；新增与编辑统一进入独立页面。
 */
import type { ConditionTemplate } from '../../types/alarm-v2.types';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from '@vben/saas';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { deleteConditionTemplate, getConditionTemplateList, updateConditionTemplate } from '../../api/alarm-condition-template.api';
import AlarmConfirmDialog from '../../components/AlarmConfirmDialog.vue';
import { fromConditionTemplate, toConditionTemplateUpdateReq } from '../../composables/useAlarmConvert';
import { useAlarmTemplateMeta } from '../../composables/useAlarmTemplateMeta';

type BindType = 'category' | 'none' | 'product';

interface ConditionTemplateItem extends ConditionTemplate {
  bindType: BindType;
  bindValue: string;
  ref: number;
  status: 1 | 2;
}

/** routePrefix 用于拼接模板新建/编辑跳转路径，供 iot（默认）与能源中心等宿主复用。 */
const props = withDefaults(
  defineProps<{
    routePrefix?: string;
  }>(),
  {
    routePrefix: '/iot/alarm',
  },
);

const router = useRouter();

const loading = ref(false);
const templates = ref<ConditionTemplateItem[]>([]);
const deleteTargetId = ref('');
const { bindOptions, load: loadMeta, bindValueLabel } = useAlarmTemplateMeta();

function bindLabel(item: ConditionTemplateItem): string {
  if (item.bindType === 'none') return $t('iotApp.alarmCondTpl.genericTemplate');
  const option = bindOptions.value.find((option) => option.value === item.bindType);
  const typeLabel = option ? $t(option.label) : item.bindType;
  return `${typeLabel}：${bindValueLabel(item.bindType, item.bindValue)}`;
}

function openEditor(id?: string) {
  router.push(id ? `${props.routePrefix}/template/condition/edit/${id}` : `${props.routePrefix}/template/condition/edit`);
}

async function loadTemplates() {
  loading.value = true;
  try {
    const response = await getConditionTemplateList({ page: { page: 1, size: 100 } });
    templates.value = (response.list ?? []).map((item) => ({
      ...fromConditionTemplate(item),
      bindType: item.productCategoryID ? 'category' : (item.productID ? 'product' : 'none'),
      bindValue: item.productCategoryID || item.productID || '',
      status: item.status === 2 ? 2 : 1,
      ref: item.refCount ?? 0,
    }));
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(template: ConditionTemplateItem) {
  try {
    await updateConditionTemplate({
      ...toConditionTemplateUpdateReq(template, template.bindType, template.bindValue),
      status: template.status === 1 ? 2 : 1,
    });
    await loadTemplates();
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('orgManage.common.updateFailed'), (text) => message.error(text));
  }
}

/** requestDelete 打开当前模板的删除确认弹窗。 */
function requestDelete(id: string) {
  deleteTargetId.value = id;
}

/** onDeleteDialogOpenChange 在取消确认时清理待删除模板。 */
function onDeleteDialogOpenChange(open: boolean) {
  if (!open) deleteTargetId.value = '';
}

/** removeTemplate 删除已确认的触发条件模板。 */
async function removeTemplate() {
  const id = deleteTargetId.value;
  if (!id) return;
  deleteTargetId.value = '';
  try {
    await deleteConditionTemplate(id);
    message.success('模板已删除');
    await loadTemplates();
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('orgManage.common.deleteFailed'), (text) => message.error(text));
  }
}

onMounted(async () => {
  await Promise.all([loadMeta(), loadTemplates()]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4">
      <div class="flex justify-end">
        <Button @click="openEditor()">{{ $t('iotApp.alarmCondTpl.addTemplate') }}</Button>
      </div>

      <div v-if="loading || templates.length > 0" class="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/40">
              <TableHead>ID</TableHead>
              <TableHead>{{ $t('iotApp.alarmCommon.templateName') }}</TableHead>
              <TableHead>{{ $t('iotApp.alarmCondTpl.colSummary') }}</TableHead>
              <TableHead>{{ $t('iotApp.alarmCondTpl.colBindScope') }}</TableHead>
              <TableHead>{{ $t('iotApp.alarmCondTpl.colRef') }}</TableHead>
              <TableHead>{{ $t('iotApp.common.status') }}</TableHead>
              <TableHead>{{ $t('iotApp.common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="7" class="text-muted-foreground py-6 text-center">{{ $t('iotApp.alarmCommon.loading') }}</TableCell>
            </TableRow>
            <TableRow v-for="template in templates" :key="template.id">
              <TableCell>{{ template.id }}</TableCell>
              <TableCell>{{ template.name }}</TableCell>
              <TableCell>{{ template.summary || '-' }}</TableCell>
              <TableCell>{{ bindLabel(template) }}</TableCell>
              <TableCell>{{ template.ref }}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" class="h-auto p-0" @click="toggleStatus(template)">
                  <Badge :variant="template.status === 1 ? 'secondary' : 'outline'">
                    {{ template.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}
                  </Badge>
                </Button>
              </TableCell>
              <TableCell>
                <Button variant="link" size="sm" class="h-auto px-0" @click="openEditor(template.id)">{{ $t('iotApp.common.edit') }}</Button>
                <Button variant="link" size="sm" class="text-destructive h-auto px-2" @click="requestDelete(template.id)">{{ $t('iotApp.common.delete') }}</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Empty v-else class="min-h-0 flex-1 border">
        <EmptyHeader>
          <EmptyTitle>{{ $t('iotApp.alarmCondTpl.emptyTitle') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.alarmCondTpl.emptyDesc') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <AlarmConfirmDialog
        :open="!!deleteTargetId"
        title="删除触发条件模板"
        description="删除后将无法恢复，确定继续吗？"
        confirm-text="删除"
        @update:open="onDeleteDialogOpenChange"
        @confirm="removeTemplate"
      />
    </div>
  </Page>
</template>
