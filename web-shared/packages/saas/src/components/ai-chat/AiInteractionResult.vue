<!-- 文件说明：按结果 ID 鉴权读取快照，显示混排报告及真实查询口径。 -->
<script setup lang="ts">
import { $t } from '@vben/saas/locales';
import type { ChatInteractionResult, InteractionReference, ResultFollowUp } from './interaction';
import { onBeforeUnmount, ref, watch } from 'vue';
import { getInteractionResult } from './api';
import AiInteractionBlock from './AiInteractionBlock.vue';
import AiExportFiles from './AiExportFiles.vue';

/** reference 是 SSE 或历史恢复得到的服务端引用。 */
const props = defineProps<{ reference: InteractionReference; readOnly?: boolean }>();
/** followUp 透传所选内容块，保留结果 ID 和当前交互条件。 */
const emit = defineEmits<{ followUp: [reference: ResultFollowUp] }>();
const result = ref<ChatInteractionResult>();
const error = ref('');
let generation = 0;

/** load 不缓存业务快照；每次进入会话重新接受当前权限检查。 */
async function load() {
  const current = ++generation;
  result.value = undefined; error.value = '';
  try {
    const response = await getInteractionResult(props.reference.resultID);
    if (current !== generation) return;
    if (response.result.schemaVersion !== '1.0' || response.result.resultID !== props.reference.resultID) throw new Error($t('aiChat.ui.thisResultVersionIsNotSupportedYet'));
    result.value = response.result;
  } catch (cause) {
    if (current === generation) error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.resultNotAvailable');
  }
}
watch(() => props.reference.resultID, load, { immediate: true });
onBeforeUnmount(() => { generation++; });
</script>

<template>
  <article class="border-border bg-background min-w-0 w-full max-w-full space-y-4 rounded-xl border p-4" data-testid="ai-interaction-result">
    <div v-if="error" role="alert" class="text-destructive text-xs"><p>{{ error }}</p><button type="button" class="underline" @click="load">{{ $t('aiChat.ui.reread') }}</button></div>
    <p v-else-if="!result" role="status" class="text-muted-foreground text-xs">{{ $t('aiChat.ui.readingAnalysisResults') }}</p>
    <template v-else>
      <h3 class="text-foreground text-sm font-semibold">{{ result.title }}</h3>
      <p v-for="warning in result.warnings" :key="warning" class="text-muted-foreground text-xs">{{ warning }}</p>
      <AiInteractionBlock v-for="block in result.blocks" :key="block.id" :block="block" :result="result" :read-only="readOnly" @follow-up="emit('followUp', $event)" />
      <AiExportFiles :result-i-d="result.resultID" />
      <details class="text-muted-foreground text-xs"><summary class="cursor-pointer">{{ $t('aiChat.ui.dataSourcesAndStatisticalCaliber') }}</summary><p class="mt-2 break-words leading-relaxed">{{ result.source.description }}</p><p class="mt-1">{{ result.source.timeZone }} · {{ new Date(result.generatedAt).toLocaleString() }}</p><pre class="mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words">{{ JSON.stringify(result.source.query, null, 2) }}</pre></details>
    </template>
  </article>
</template>
