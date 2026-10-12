<!-- 文件说明：按长期附件 ID 鉴权展示媒体和下载；短期链接只驻留当前组件内存。 -->
<script setup lang="ts">
import { $t } from '@vben/saas/locales';
import type { ChatAttachmentInfo } from './api';
import { onBeforeUnmount, ref, watch } from 'vue';
import { getChatAttachment, getChatAttachmentDownload } from './api';

/** 附件引用可来自用户消息或生成文件卡片；名称仅作加载失败时的提示。 */
/** 视频续签只恢复播放位置，不自动开始播放。 */
const video = ref<HTMLVideoElement>();
let resumeAt = 0;
const props = defineProps<{ artifactID: string; name?: string }>();
const file = ref<ChatAttachmentInfo>();
const url = ref('');
const expiresAt = ref(0);
const error = ref('');
const loading = ref(false);
const previewFailed = ref(false);
const dialog = ref<HTMLDialogElement>();
let generation = 0;
/** 单个媒体载入最多自动续签一次，避免反复失败产生请求循环。 */
let renewals = 0;

/** signedURL 拒绝可执行 URL，只使用服务端签发的 HTTP(S) 链接。 */
function signedURL(value: string) {
  const target = new URL(value, window.location.origin);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) throw new Error($t('aiChat.ui.invalidDownloadAddress'));
  return target.href;
}

/** load 同时检查元数据与链接，过期或权限变化会显示明确失败。 */
async function load() {
  const current = ++generation;
  loading.value = true; error.value = ''; file.value = undefined; url.value = ''; previewFailed.value = false;
  try {
    const metadata = await getChatAttachment(props.artifactID);
    if (current !== generation) return;
    file.value = metadata;
    if (metadata.status !== 'ready') throw new Error($t('aiChat.ui.theAttachmentIsNotReadyYetPleaseTryAgain'));
    if (metadata.kind !== 'file') {
      const download = await getChatAttachmentDownload(props.artifactID);
      if (current !== generation) return;
      url.value = signedURL(download.url); expiresAt.value = Number(download.expiresAt);
    }
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.attachmentNotAvailable'); }
  finally { if (current === generation) loading.value = false; }
}

/** download 每次点击重新鉴权签发，避免保存过期地址或绕过权限变更。 */
async function download() {
  const current = generation;
  try {
    const response = await getChatAttachmentDownload(props.artifactID);
    if (current !== generation) return;
    const anchor = document.createElement('a');
    anchor.href = signedURL(response.url); anchor.download = file.value?.name ?? props.name ?? $t('aiChat.ui.attachment');
    anchor.rel = 'noopener noreferrer'; anchor.target = '_blank'; anchor.click();
  } catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.downloadFailed'); }
}

/** previewError 过期时重新签发一次；编码不支持时保留下载入口。 */
function previewError() {
  if (expiresAt.value && expiresAt.value <= Date.now() && renewals < 1) { resumeAt = video.value?.currentTime ?? 0; renewals++; void load(); }
  else previewFailed.value = true;
}
/** restoreVideoTime 在重新获取元数据后恢复原位置，避免签名过期导致用户从头播放。 */
function restoreVideoTime() {
  if (!video.value || !Number.isFinite(resumeAt) || resumeAt <= 0) return;
  const duration = video.value.duration;
  video.value.currentTime = Number.isFinite(duration) ? Math.min(resumeAt, duration) : resumeAt;
  resumeAt = 0;
}
watch(() => props.artifactID, () => { resumeAt = 0; renewals = 0; void load(); }, { immediate: true });
onBeforeUnmount(() => { generation++; dialog.value?.close(); });
</script>

<template>
  <div class="border-border bg-card min-w-0 max-w-full space-y-2 rounded-lg border p-3 text-xs" data-testid="ai-attachment">
    <div class="flex items-start justify-between gap-3"><p class="text-foreground min-w-0 break-all font-medium">{{ file?.name ?? name ?? $t('aiChat.ui.attachment') }}</p><span v-if="file" class="text-muted-foreground shrink-0 uppercase">{{ file.name.split('.').pop() }}</span></div>
    <p v-if="file" class="text-muted-foreground">{{ file.size >= 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.ceil(file.size / 1024))} KB` }}</p>
    <p v-if="loading" class="text-muted-foreground" role="status">{{ $t('aiChat.ui.readingAttachments') }}</p>
    <div v-else-if="error" class="text-destructive" role="alert"><p>{{ error }}</p><button type="button" class="underline" @click="load">{{ $t('aiChat.ui.reacquire') }}</button></div>
    <template v-else>
      <button v-if="file?.kind === 'image' && url && !previewFailed" type="button" :aria-label="$t('aiChat.ui.enlargePicture')" @click="dialog?.showModal()"><img :src="url" :alt="file.name" class="max-h-64 max-w-full rounded object-contain" @error="previewError" /></button>
      <video ref="video" @loadedmetadata="restoreVideoTime" v-if="file?.kind === 'video' && url && !previewFailed" :src="url" controls preload="metadata" class="max-h-72 w-full rounded" :aria-label="file.name" @error="previewError" />
      <p v-if="previewFailed" class="text-muted-foreground">{{ $t('aiChat.ui.theBrowserCannotPreviewThisFileYouCanDownloadItA') }}</p>
      <button type="button" class="text-primary underline" @click="download">{{ $t('aiChat.ui.download') }}</button>
      <!-- 图片放大层独立处理 Esc，不触发外层工作台关闭。 -->
      <dialog ref="dialog" @keydown.esc.stop class="bg-background text-foreground max-h-[90vh] max-w-[90vw] rounded-lg p-3"><button type="button" class="mb-2 block" @click="dialog?.close()">{{ $t('aiChat.ui.close') }}</button><img v-if="url" :src="url" :alt="file?.name" class="max-h-[80vh] max-w-full object-contain" /></dialog>
    </template>
  </div>
</template>
