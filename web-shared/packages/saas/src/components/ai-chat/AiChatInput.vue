<!-- 文件说明：私有附件上传、失败重试与发送前限额校验；不把签名地址保存进消息。 -->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import type { ContentPart } from './api';

import { computed, markRaw, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { VbenButton, VbenIcon, VbenIconButton, VbenSpinner } from '@vben-core/shadcn-ui';

import { uploadChatAttachment } from './api';

interface PendingAttachment {
  id: string;
  part?: ContentPart;
  file: File;
  status: 'uploading' | 'ready' | 'failed';
  error?: string;
  controller?: AbortController;
  previewUrl?: string;
  name: string;
}

defineOptions({ name: 'AiChatInput' });

interface Props {
  disabled?: boolean;
  /** 生成中显示独立停止动作。 */
  generating?: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  send: [contents: ContentPart[]];
  stop: [];
  draftChange: [hasDraft: boolean];
}>();

const text = ref('');
const attachments = ref<PendingAttachment[]>([]);
/** 上传中或失败附件均禁止发送，避免把未登记原件交给模型。 */
const uploading = computed(() => attachments.value.some((item) => item.status === 'uploading'));
const uploadError = ref('');
let disposed = false;
const fileInput = ref<HTMLInputElement>();
const textareaRef = ref<HTMLTextAreaElement>();

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
}

watch(text, () => nextTick(autoResize));
/** 草稿包含上传中的附件，关闭弹窗时仍需保留当前会话。 */
watch([text, attachments], () => emit('draftChange', !!text.value.trim() || attachments.value.length > 0), { deep: true });

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  if (props.disabled || uploading.value || attachments.value.some((item) => item.status !== 'ready')) return;
  const contents: ContentPart[] = [];

  // 添加附件
  for (const att of attachments.value) {
    if (att.part) contents.push(att.part);
  }

  // 添加文字
  const trimmed = text.value.trim();
  if (trimmed) {
    contents.push({ type: 'text', text: trimmed });
  }

  if (contents.length === 0) return;

  emit('send', contents);
  text.value = '';
  for (const item of attachments.value) release(item);
  attachments.value = [];
  nextTick(autoResize);
}

function openFileChooser() {
  fileInput.value?.click();
}

/** uploadOne 重试沿用 requestID，避免网络中断后重复创建附件。 */
async function uploadOne(id: string) {
  const item = attachments.value.find((attachment) => attachment.id === id);
  if (!item || disposed) return;
  item.controller = markRaw(new AbortController());
  item.status = 'uploading'; item.error = '';
  try {
    const result = await uploadChatAttachment(item.file, item.id, item.controller.signal);
    if (disposed || !attachments.value.some((attachment) => attachment.id === id)) return;
    item.part = { type: result.kind === 'image' ? 'image_url' : result.kind === 'video' ? 'video_url' : 'file', artifactID: result.artifactID, fileMime: result.mime, fileName: result.name };
    item.status = 'ready';
  } catch (cause) {
    if (!disposed && attachments.value.some((attachment) => attachment.id === id)) {
      item.status = 'failed'; item.error = cause instanceof Error ? cause.message : $t('aiChat.ui.uploadFailed');
    }
  }
}

/** onFileChange 在上传前检查消息总量，服务端仍须独立验证真实文件格式。 */
async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []); input.value = '';
  await addFiles(files);
}

/** addFiles 让选择、拖拽和粘贴共用真实文件校验及上传队列。 */
async function addFiles(files: File[]) {
  if (props.disabled || uploading.value || !files.length) return;
  uploadError.value = '';
  for (const file of files) {
    if (disposed) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const max = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(extension) ? 20 : ['mp4', 'webm'].includes(extension) ? 100 : 50;
    if (!['png','jpg','jpeg','webp','gif','bmp','mp4','webm','pdf','docx','pptx','xlsx','csv','html','md','adoc','txt','eml','json'].includes(extension)) { uploadError.value = $t('aiChat.ui.unsupportedFileFormat', { name: file.name }); continue; }
    if (file.size === 0 || file.size > max * 1024 * 1024) { uploadError.value = $t('aiChat.ui.invalidFileSize', { name: file.name, max }); continue; }
    if (attachments.value.length >= 10 || attachments.value.reduce((sum, item) => sum + item.file.size, file.size) > 200 * 1024 * 1024) { uploadError.value = $t('aiChat.ui.eachMessageHasAMaximumOf10AttachmentsAndTheTotal'); break; }
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    attachments.value.push({ id, file: markRaw(file), name: file.name, status: 'uploading', previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined });
    await uploadOne(id);
  }
}

/** onDrop 只读取用户拖入的文件，不读取拖拽链接或 HTML。 */
function onDrop(event: DragEvent) { void addFiles(Array.from(event.dataTransfer?.files ?? [])); }
/** onPaste 只接收剪贴板图片；纯文本继续使用输入框默认行为。 */
function onPaste(event: ClipboardEvent) {
  const images = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
  if (images.length) { event.preventDefault(); void addFiles(images); }
}

/** release 清理当前草稿的网络请求和浏览器预览，不删除服务端已发送附件。 */
function release(item: PendingAttachment) {
  item.controller?.abort();
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

/** removeAttachment 允许移除失败或选错的文件，之后可重新发送其他已就绪附件。 */
function removeAttachment(id: string) {
  const item = attachments.value.find((attachment) => attachment.id === id);
  if (item) release(item);
  attachments.value = attachments.value.filter((attachment) => attachment.id !== id);
}
onBeforeUnmount(() => { disposed = true; for (const item of attachments.value) release(item); });

function focus() {
  textareaRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="min-w-0" @dragover.prevent @drop.prevent="onDrop">
    <p v-if="uploadError" class="text-destructive mb-2 text-xs" role="alert">{{ uploadError }}</p>
    <div v-for="item in attachments.filter((entry) => entry.status !== 'ready')" :key="`state-${item.id}`" class="mb-2 text-xs">
      <span v-if="item.status === 'uploading'" class="text-muted-foreground" role="status">{{ item.name }} {{ $t('aiChat.ui.uploading') }}</span>
      <template v-else><span class="text-destructive" role="alert">{{ item.name }} · {{ item.error }}</span><button type="button" class="text-primary ml-2 underline" @click="uploadOne(item.id)">{{ $t('aiChat.ui.retryUpload') }}</button></template>
    </div>
    <!-- 附件预览区 -->
    <div v-if="attachments.length > 0" class="mb-2.5 flex flex-wrap gap-2">
      <div
        v-for="att in attachments"
        :key="att.id"
        class="bg-muted border-border group relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
      >
        <img
          v-if="att.previewUrl"
          :src="att.previewUrl"
          class="size-8 rounded object-cover"
          alt=""
        />
        <VbenIcon v-else icon="lucide:file" class="text-muted-foreground size-4" />
        <span class="text-foreground max-w-40 truncate">{{ att.name }}</span><span class="text-muted-foreground">{{ Math.max(1, Math.ceil(att.file.size / 1024)) }} KB</span>
        <button
          class="text-muted-foreground hover:text-destructive -mr-0.5 ml-1 transition-colors"
          :aria-label="$t('aiChat.ui.removeAttachment', { name: att.name })" @click="removeAttachment(att.id)"
        >
          <VbenIcon icon="lucide:x" class="size-3.5" />
        </button>
      </div>
    </div>

    <div class="border-border bg-muted/20 rounded-2xl border p-3 shadow-sm transition-colors focus-within:border-ring/50 focus-within:ring-2 focus-within:ring-ring/10">
      <textarea ref="textareaRef" v-model="text" class="text-foreground placeholder:text-muted-foreground block min-h-[56px] w-full resize-none bg-transparent px-1 py-1 text-sm leading-[1.7] outline-none disabled:cursor-not-allowed" :placeholder="generating ? $t('aiChat.ui.generatingReply') : $t('aiChat.ui.sendAMessageOrUploadAFileForAnalysisTogether')" :disabled="disabled" rows="2" style="max-height: 180px; overflow-y: auto" :aria-label="$t('aiChat.ui.conversationMessage')" @keydown="onKeydown" @paste="onPaste" />
      <div class="mt-2 flex items-center gap-2">
        <VbenIconButton class="size-8 shrink-0" :aria-label="$t('aiChat.ui.uploadAttachments')" :tooltip="$t('aiChat.ui.uploadAttachments')" tooltip-side="top" :disabled="uploading || disabled" @click="openFileChooser"><VbenSpinner v-if="uploading" class="size-4" /><VbenIcon v-else icon="lucide:paperclip" class="size-4" /></VbenIconButton>
        <input ref="fileInput" type="file" class="hidden" multiple accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.mp4,.webm,.pdf,.docx,.pptx,.xlsx,.csv,.html,.md,.adoc,.txt,.eml,.json" @change="onFileChange" />
        <span class="text-muted-foreground min-w-0 flex-1 text-[11px] max-sm:hidden">{{ $t('aiChat.ui.enterToSendShiftEnterToWrap') }}</span>
        <button v-if="generating" class="border-border bg-background ml-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" @click="emit('stop')"><VbenIcon icon="lucide:square" class="size-3" />{{ $t('aiChat.ui.stopGeneration') }}</button>
        <VbenButton v-else class="ml-auto size-9 shrink-0 rounded-xl p-0" :aria-label="$t('aiChat.ui.sendMessage')" :disabled="disabled || uploading || attachments.some((item) => item.status !== 'ready') || (text.trim() === '' && attachments.length === 0)" @click="handleSend"><VbenIcon icon="lucide:arrow-up" class="size-4" /></VbenButton>
      </div>
    </div>
  </div>
</template>
