<!-- 文件说明：结果导出、生成进度和可恢复文件卡片；不在浏览器生成文件。 -->
<script setup lang="ts">
import { $t } from '@vben/saas/locales';
import type { ChatExportInfo } from './api';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { createChatExport, getChatExports, retryChatExport } from './api';
import AiAttachment from './AiAttachment.vue';

/** resultID 是服务端已保存的不可变结果。 */
const props = defineProps<{ resultID: string }>();
const jobs = ref<ChatExportInfo[]>([]);
const error = ref('');
const busy = ref(false);
/** 未确认创建成功时保留同一请求键，网络重试不创建重复导出。 */
const requests = new Map<string, string>();
/** 导出状态文案随当前界面语言更新。 */
const statusText = computed(() => ({ pending: $t('aiChat.ui.waitingForGeneration'), generating: $t('aiChat.ui.generating'), uploading: $t('aiChat.ui.uploading_f8d6e4'), success: $t('aiChat.ui.generationCompleted'), failed: $t('aiChat.ui.generationFailed') }));
let generation = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** refresh 恢复服务端状态，仅活跃任务持续轮询；失败保留明确的重新读取入口。 */
async function refresh() {
  clearTimeout(timer);
  const current = generation;
  try {
    const response = await getChatExports(props.resultID);
    if (current !== generation) return;
    jobs.value = response.list;
    error.value = '';
    if (jobs.value.some((job) => ['pending', 'generating', 'uploading'].includes(job.status))) timer = setTimeout(refresh, 3000);
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.unableToReadBuildProgress');
  }
}

/** generate 同一格式生成中禁用重复点击，已完成后可明确重新生成过期文件。 */
async function generate(format: 'xlsx' | 'pdf') {
  if (busy.value) return;
  const current = generation;
  busy.value = true; error.value = '';
  if (!requests.has(format)) requests.set(format, Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join(''));
  try {
    await createChatExport(props.resultID, format, requests.get(format)!);
    if (current !== generation) return;
    requests.delete(format);
    await refresh();
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.failedToCreateExportTask');
  } finally { if (current === generation) busy.value = false; }
}

/** retry 仅重试服务端已标记失败的任务。 */
async function retry(taskID: string) {
  if (busy.value) return;
  const current = generation; busy.value = true;
  try { await retryChatExport(taskID); if (current === generation) await refresh(); }
  catch (cause) { if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.retryFailed'); }
  finally { if (current === generation) busy.value = false; }
}
watch(() => props.resultID, () => { generation++; jobs.value = []; busy.value = false; requests.clear(); void refresh(); }, { immediate: true });
onBeforeUnmount(() => { generation++; clearTimeout(timer); });
</script>

<template>
  <section class="space-y-2 border-t pt-2 text-xs" :aria-label="$t('aiChat.ui.exportAnalysisResults')">
    <div class="flex gap-3">
      <button v-for="format in (['xlsx', 'pdf'] as const)" :key="format" type="button" class="text-primary disabled:opacity-50" :disabled="busy || jobs.some((job) => job.format === format && ['pending', 'generating', 'uploading'].includes(job.status))" @click="generate(format)">{{ $t('aiChat.ui.export') }} {{ format === 'xlsx' ? 'Excel' : 'PDF' }}</button>
    </div>
    <p v-if="error" role="alert">{{ error }} <button type="button" class="underline" @click="refresh">{{ $t('aiChat.ui.reread') }}</button></p>
    <div v-for="job in jobs" :key="job.taskID" class="space-y-1 rounded border p-2">
      <AiAttachment v-if="job.status === 'success' && job.artifactID" :artifact-i-d="job.artifactID" />
      <p v-else role="status">{{ job.format.toUpperCase() }} · {{ statusText[job.status] }} <button v-if="job.status === 'failed'" type="button" class="underline" :disabled="busy" @click="retry(job.taskID)">{{ $t('aiChat.ui.retry') }}</button></p>
      <p v-if="job.status === 'failed'" class="text-muted-foreground">{{ job.errorCode === 'FILE_UPLOAD_FAILED' ? $t('aiChat.ui.fileUploadIsNotCompletedPleaseTryAgain') : $t('aiChat.ui.theDownloadableFileCouldNotBeGeneratedThisTimePl') }}</p>
    </div>
  </section>
</template>
