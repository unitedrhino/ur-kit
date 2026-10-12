<!-- 文件说明：知识库 ZIP 导入导出，管理任务创建、150×2s 轮询与结果下载；进度轮询可随时取消。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import { computed, onUnmounted, ref } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Download, LoaderCircle } from 'lucide-vue-next';

import { Api } from '../index.api';
import { getErrorMessage } from '../workbench';

const props = defineProps<Props>();
const emit = defineEmits<{
  /** ZIP 导入任务成功完成，工作台据此刷新目录、编译状态与知识库信息。 */
  imported: [];
}>();

interface Props {
  /** 当前知识库 ID，导入导出任务提交目标。 */
  knowledgeId: number;
  /** 对话框副标题展示的知识库名称。 */
  knowledgeName?: string;
}

const zipInputRef = ref<HTMLInputElement | null>(null);
const transferOpen = ref(false);
const transferKind = ref<'export' | 'import'>('export');
const transferStatus = ref('pending');
const transferError = ref('');
const transferDownloadURL = ref('');
let transferPollTimer: null | ReturnType<typeof setTimeout> = null;
/** 轮询是否正在推进；上传文件阶段没有轮询，不提供取消。 */
const pollingActive = ref(false);

/** transferBusy 任务进度轮询进行中，控制取消按钮显示。 */
const transferBusy = computed(() => pollingActive.value);

/** startTransferPoll 轮询 ZIP 导入或导出任务，完成导入后请求工作台刷新。 */
function startTransferPoll(taskID: number, kind: 'export' | 'import') {
  let count = 0;
  pollingActive.value = true;
  const poll = async () => {
    count += 1;
    if (count > 150) {
      pollingActive.value = false;
      transferStatus.value = 'timeout';
      transferError.value = $t('knowledgeBase.text_43edbcde3eab');
      return;
    }
    try {
      const response = await Api.getExportStatus(taskID);
      transferStatus.value = response.status;
      transferDownloadURL.value = response.downloadURL || '';
      if (response.status === 'success') {
        pollingActive.value = false;
        if (kind === 'import') emit('imported');
      } else if (response.status === 'failed') {
        pollingActive.value = false;
      } else {
        transferPollTimer = setTimeout(poll, 2000);
      }
    } catch (error) {
      pollingActive.value = false;
      transferStatus.value = 'failed';
      transferError.value = getErrorMessage(error, $t('knowledgeBase.text_f3919527c5c9'));
    }
  };
  transferPollTimer = setTimeout(poll, 500);
}

/** cancelTransferPoll 停止前端进度轮询；任务仍在后端执行，仅停止刷新。 */
function cancelTransferPoll() {
  pollingActive.value = false;
  if (transferPollTimer) {
    clearTimeout(transferPollTimer);
    transferPollTimer = null;
  }
  transferStatus.value = 'poll-cancelled';
}

/** resetTransfer 发起新任务前清理上一轮轮询与结果状态。 */
function resetTransfer() {
  pollingActive.value = false;
  if (transferPollTimer) {
    clearTimeout(transferPollTimer);
    transferPollTimer = null;
  }
  transferDownloadURL.value = '';
  transferError.value = '';
}

/** exportZip 创建当前知识库的 ZIP 导出任务。 */
async function exportZip() {
  resetTransfer();
  transferKind.value = 'export';
  transferStatus.value = 'pending';
  transferOpen.value = true;
  try {
    const response = await Api.exportZip(props.knowledgeId);
    startTransferPoll(response.taskID, 'export');
  } catch (error) {
    transferStatus.value = 'failed';
    transferError.value = getErrorMessage(error, $t('knowledgeBase.text_637f7490a5e2'));
  }
}

/** openImport 打开 ZIP 文件选择器，由文件变更事件发起导入。 */
function openImport() {
  zipInputRef.value?.click();
}

/** importZip 上传 ZIP 并创建导入任务。 */
async function importZip(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  resetTransfer();
  transferKind.value = 'import';
  transferStatus.value = 'uploading';
  transferOpen.value = true;
  try {
    const upload = await Api.uploadTempFile(file);
    const response = await Api.importZip(props.knowledgeId, upload.fileUri || upload.filePath);
    transferStatus.value = 'processing';
    startTransferPoll(response.taskID, 'import');
  } catch (error) {
    transferStatus.value = 'failed';
    transferError.value = getErrorMessage(error, $t('knowledgeBase.text_9db5d02ae8e0'));
  }
}

/** downloadTransferExport 在新窗口打开已完成的 ZIP 导出地址。 */
function downloadTransferExport() {
  if (!transferDownloadURL.value) return;
  window.open(transferDownloadURL.value, '_blank', 'noopener,noreferrer');
}

onUnmounted(() => {
  if (transferPollTimer) clearTimeout(transferPollTimer);
});

defineExpose({ exportZip, openImport });
</script>
<template>
  <input ref="zipInputRef" class="hidden" type="file" accept=".zip" @change="importZip" />

  <Dialog :open="transferOpen" @update:open="transferOpen = $event">
    <DialogContent class="kb-ui p-6 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>ZIP {{ transferKind === 'export' ? $t('knowledgeBase.text_188896795f1d') : $t('knowledgeBase.text_60e2bcad85ac') }}</DialogTitle>
        <DialogDescription class="truncate">{{ props.knowledgeName }}</DialogDescription>
      </DialogHeader>
      <!-- 取消在途时整块降透明呈现，提示任务仍在后台执行，避免误读为失败。 -->
      <div class="py-3 text-sm" :class="transferStatus === 'poll-cancelled' ? 'opacity-50' : ''">
        <div v-if="['uploading', 'pending', 'processing'].includes(transferStatus)" class="text-muted-foreground flex items-center gap-2">
          <LoaderCircle class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_f6337b004e23') }}
        </div>
        <div v-else-if="transferStatus === 'success'" class="text-success">{{ $t('knowledgeBase.text_0f84f0febf4c') }}</div>
        <div v-else-if="transferStatus === 'poll-cancelled'" class="text-muted-foreground">{{ $t('knowledgeBase.text_20414d799709') }}</div>
        <div v-else class="text-destructive">{{ transferError || $t('knowledgeBase.text_763284f0fbc6') }}</div>
      </div>
      <DialogFooter class="flex items-center gap-2 sm:justify-between">
        <Button v-if="transferBusy" variant="ghost" size="sm" class="kb-control" @click="cancelTransferPoll">{{
          $t('knowledgeBase.text_4413711b9406')
        }}</Button>
        <span class="flex-1"></span>
        <Button v-if="transferKind === 'export' && transferStatus === 'success' && transferDownloadURL" @click="downloadTransferExport" class="kb-control">
          <Download class="size-4" /> {{ $t('knowledgeBase.text_b25a3f04047f') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
