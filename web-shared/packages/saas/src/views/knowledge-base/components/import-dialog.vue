<!-- 文件说明：文档上传导入对话框，管理文件/文件夹选择、上传白名单校验与逐文件上传进度。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { KnowledgeTreeNode } from '../data';

import { ref } from 'vue';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { LoaderCircle } from 'lucide-vue-next';

import { useToast } from '../../../hooks/use-toast';
import { KNOWLEDGE_UPLOAD_ACCEPT, KNOWLEDGE_UPLOAD_EXTENSIONS } from '../data';
import { Api } from '../index.api';
import { getErrorMessage } from '../workbench';

const props = defineProps<Props>();
const emit = defineEmits<{
  /** 导入任务提交成功，工作台据此刷新目录、编译状态与知识库信息。 */
  imported: [];
  /** 未选中任何受支持文件时上抛文案，由工作台写入头部错误条。 */
  invalidSelection: [message: string];
}>();

interface Props {
  /** 当前知识库 ID，导入任务提交目标。 */
  knowledgeId: number;
}

const { toast } = useToast();
const fileInputRef = ref<HTMLInputElement | null>(null);
const folderInputRef = ref<HTMLInputElement | null>(null);
const importTargetFolder = ref<KnowledgeTreeNode | null>(null);
const uploadOpen = ref(false);
const uploadPhase = ref<'done' | 'error' | 'importing' | 'uploading'>('uploading');
const uploadDone = ref(0);
const uploadTotal = ref(0);
const uploadError = ref('');

/** validateFile 使前端上传白名单与后端知识文档解析范围保持一致。 */
function validateFile(file: File) {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  return KNOWLEDGE_UPLOAD_EXTENSIONS.has(extension);
}

/** open 打开文件或文件夹选择器，target 为导入的目标目录（空表示根目录）。 */
function open(target: KnowledgeTreeNode | null = null, picker: 'file' | 'folder' = 'file') {
  importTargetFolder.value = target;
  (picker === 'folder' ? folderInputRef : fileInputRef).value?.click();
}

defineExpose({ open });

/** importFiles 逐个上传文件并一次提交导入任务，进度弹窗反馈当前阶段。 */
async function importFiles(fileList: FileList | null) {
  if (!fileList?.length || !props.knowledgeId) return;
  const files = [...fileList].filter((file) => validateFile(file));
  if (files.length === 0) {
    emit('invalidSelection', $t('knowledgeBase.text_2ac3a2b2ac88'));
    return;
  }
  uploadOpen.value = true;
  uploadPhase.value = 'uploading';
  uploadDone.value = 0;
  uploadTotal.value = files.length;
  uploadError.value = '';
  try {
    const uploadItems: Array<{ filePath: string; name: string; path: string }> = [];
    for (const file of files) {
      const response = await Api.uploadTempFile(file);
      uploadItems.push({ filePath: response.filePath, name: file.name, path: file.webkitRelativePath || file.name });
      uploadDone.value += 1;
    }
    uploadPhase.value = 'importing';
    await Api.importDocuments(props.knowledgeId, uploadItems, importTargetFolder.value?.id ?? 0);
    uploadPhase.value = 'done';
    toast({ title: $t('knowledgeBase.text_b17c661c45a8'), type: 'success' });
    emit('imported');
  } catch (error) {
    uploadPhase.value = 'error';
    uploadError.value = getErrorMessage(error, $t('knowledgeBase.text_00e20e349bee'));
  } finally {
    importTargetFolder.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    if (folderInputRef.value) folderInputRef.value.value = '';
  }
}
</script>
<template>
  <input
    ref="fileInputRef"
    class="hidden"
    type="file"
    multiple
    :accept="KNOWLEDGE_UPLOAD_ACCEPT"
    @change="importFiles(($event.target as HTMLInputElement).files)"
  />
  <input ref="folderInputRef" class="hidden" type="file" multiple webkitdirectory @change="importFiles(($event.target as HTMLInputElement).files)" />

  <Dialog :open="uploadOpen" @update:open="uploadOpen = $event">
    <DialogContent class="kb-ui p-6 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('knowledgeBase.text_955940df06e5') }}</DialogTitle>
        <DialogDescription>
          {{
            uploadPhase === 'uploading'
              ? $t('knowledgeBase.text_22524ca5ec4d')
              : uploadPhase === 'importing'
                ? $t('knowledgeBase.text_259e260390f4')
                : uploadPhase === 'done'
                  ? $t('knowledgeBase.text_7bdaa28ba6b3')
                  : $t('knowledgeBase.text_a6f805694be5')
          }}
        </DialogDescription>
      </DialogHeader>
      <div class="py-3">
        <div v-if="uploadPhase === 'uploading' || uploadPhase === 'importing'" class="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircle class="size-4 animate-spin" />
          {{ uploadDone }} / {{ uploadTotal }}
        </div>
        <div v-else-if="uploadPhase === 'done'" class="text-success text-sm">{{ $t('knowledgeBase.text_34ed1ffd6da5') }}</div>
        <div v-else class="text-destructive text-sm">{{ uploadError }}</div>
      </div>
    </DialogContent>
  </Dialog>
</template>
