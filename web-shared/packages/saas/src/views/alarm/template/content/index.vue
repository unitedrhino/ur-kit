<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { ContentTemplate } from '../../composables/useAlarmConvert';

/**
 * 文件说明：通知内容模板列表页
 * 负责模板查询、状态切换和删除；新增与编辑统一进入独立页面。
 */
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from '@vben/saas';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { deleteNotifyTemplate, getNotifyTemplateList, updateNotifyTemplate } from '../../api/alarm-notify-template.api';
import AlarmConfirmDialog from '../../components/AlarmConfirmDialog.vue';
import { fromNotifyTemplate, toNotifyTemplateUpdateReq } from '../../composables/useAlarmConvert';
import { useAlarmNotifyChannel } from '../../composables/useAlarmNotifyChannel';

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
const templates = ref<ContentTemplate[]>([]);
const deleteTargetId = ref('');
const { channels, loadChannels } = useAlarmNotifyChannel();

function channelName(code: string): string {
  return channels.value.find((channel) => channel.code === code)?.name ?? code;
}

function openEditor(id?: string) {
  router.push(id ? `${props.routePrefix}/template/content/edit/${id}` : `${props.routePrefix}/template/content/edit`);
}

async function loadTemplates() {
  loading.value = true;
  try {
    const response = await getNotifyTemplateList({ page: { page: 1, size: 100 } });
    templates.value = (response.list ?? []).map(fromNotifyTemplate);
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(template: ContentTemplate) {
  try {
    await updateNotifyTemplate(toNotifyTemplateUpdateReq({ ...template, status: template.status === 1 ? 2 : 1 }));
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

/** removeTemplate 删除已确认的通知内容模板。 */
async function removeTemplate() {
  const id = deleteTargetId.value;
  if (!id) return;
  deleteTargetId.value = '';
  try {
    await deleteNotifyTemplate(id);
    message.success('模板已删除');
    await loadTemplates();
  } catch (error: any) {
    notifyRequestError(error, () => error?.response?.data?.message ?? error?.message ?? $t('orgManage.common.deleteFailed'), (text) => message.error(text));
  }
}

onMounted(async () => {
  await Promise.all([loadChannels(), loadTemplates()]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4">
      <div class="flex justify-end">
        <Button @click="openEditor()">{{ $t('iotApp.alarmContentTpl.addTemplate') }}</Button>
      </div>

      <div v-if="loading || templates.length > 0" class="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/40">
              <TableHead>ID</TableHead>
              <TableHead>{{ $t('iotApp.alarmCommon.templateName') }}</TableHead>
              <TableHead>{{ $t('iotApp.alarmNotify.colChannel') }}</TableHead>
              <TableHead>{{ $t('iotApp.alarmCondTpl.colRef') }}</TableHead>
              <TableHead>{{ $t('iotApp.common.status') }}</TableHead>
              <TableHead>{{ $t('iotApp.common.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="6" class="text-muted-foreground py-6 text-center">{{ $t('iotApp.alarmCommon.loading') }}</TableCell>
            </TableRow>
            <TableRow
              v-for="template in templates"
              :key="template.id"
              data-testid="notify-template-row"
              :data-template-id="template.id"
              :data-template-name="template.name"
            >
              <TableCell>{{ template.id }}</TableCell>
              <TableCell>{{ template.name }}</TableCell>
              <TableCell>{{ channelName(template.channel) }}</TableCell>
              <TableCell>{{ template.ref }}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" class="h-auto p-0" @click="toggleStatus(template)">
                  <Badge :variant="template.status === 1 ? 'secondary' : 'outline'">
                    {{ template.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}
                  </Badge>
                </Button>
              </TableCell>
              <TableCell>
                <Button data-testid="notify-template-edit" variant="link" size="sm" class="h-auto px-0" @click="openEditor(template.id)">{{ $t('iotApp.common.edit') }}</Button>
                <Button data-testid="notify-template-delete" variant="link" size="sm" class="text-destructive h-auto px-2" @click="requestDelete(template.id)">
                  {{ $t('iotApp.common.delete') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Empty v-else class="min-h-0 flex-1 border">
        <EmptyHeader>
          <EmptyTitle>{{ $t('iotApp.alarmContentTpl.emptyTitle') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.alarmContentTpl.emptyDesc') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <AlarmConfirmDialog
        :open="!!deleteTargetId"
        title="删除通知内容模板"
        description="删除后将无法恢复，确定继续吗？"
        confirm-text="删除"
        @update:open="onDeleteDialogOpenChange"
        @confirm="removeTemplate"
      />
    </div>
  </Page>
</template>
