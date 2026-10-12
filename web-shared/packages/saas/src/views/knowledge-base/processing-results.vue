<!-- 文件说明：高级信息只保留切片调试和处理状态，阅读产物在主区呈现。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeChunkRelation, KnowledgeDetail } from './data';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { DialogDescription, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unitedrhino/saas-ui/ui/tabs';

import { chunkOptionLabel } from './document-relations';
import { relationTypeLabel } from './graph';
import { Api } from './index.api';
import { chunkSectionSummary, listProcessingStages, processingStageLabel, processingStatusLabel, statusSectionSummary } from './processing';

/** canRetry 由知识库权限决定；initialSection 让章节异常直达阶段记录。 */
const props = defineProps<{ canRetry?: boolean; detail: KnowledgeDetail; initialSection?: string; retryError?: string; retrying?: boolean }>();
/** refresh 只读取结果；retry 由父页面核验权限后提交用户指定阶段。 */
const emit = defineEmits<{ refresh: []; retry: [stage: string] }>();
/** 搜索、切片选择和请求序号随当前高级面板隔离。 */
const section = ref(props.initialSection === 'status' ? 'status' : 'chunks');
const search = ref('');
const selectedChunk = ref('');
const relations = ref<KnowledgeChunkRelation[]>([]);
const loading = ref(false);
const error = ref('');
let request = 0;
const chunks = computed(() => props.detail.chunks ?? []);
const filteredChunks = computed(() =>
  chunks.value.filter((chunk) =>
    [chunk.headingPath, chunk.title, chunk.content, chunk.chunkIndex, chunk.id].join(' ').toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
  ),
);
const activeChunk = computed(() => chunks.value.find((chunk) => String(chunk.id) === selectedChunk.value));
const taskActive = computed(() => ['pending', 'processing'].includes(props.detail.lastCompileTask?.status || ''));
const stages = computed(() => listProcessingStages(props.detail));
/** 分区导航当前值摘要：不进分区即可见切片数量与处理进度，缺口以红点提示。 */
const chunkSummary = computed(() => chunkSectionSummary(props.detail));
const statusSummary = computed(() => statusSectionSummary(props.detail));

/** loadChunk 仅主动选择切片后获取最多 20 条关联，旧请求不能覆盖新选择。 */
async function loadChunk() {
  const current = ++request;
  relations.value = [];
  error.value = '';
  loading.value = false;
  if (section.value !== 'chunks' || !activeChunk.value?.id) return;
  loading.value = true;
  try {
    const result = await Api.getChunkRelations(activeChunk.value.id, { limit: 20, minScore: 0 });
    if (current === request) relations.value = result.relations ?? [];
  } catch {
    if (current === request) error.value = $t('knowledgeBase.text_2cdd0cac43db');
  } finally {
    if (current === request) loading.value = false;
  }
}
watch([section, selectedChunk], () => void loadChunk());
watch(
  () => props.detail,
  (detail, previous) => {
    if (detail.document.id !== previous?.document.id) {
      search.value = '';
      selectedChunk.value = '';
    }
    void loadChunk();
  },
);
onBeforeUnmount(() => request++);
</script>
<template>
  <div class="kb-ui flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
    <header class="shrink-0 border-b p-6 pr-14">
      <DialogTitle class="text-base">{{ $t('knowledgeBase.text_57109d2d3250') }}</DialogTitle>
      <DialogDescription class="mt-1 truncate">{{ detail.document.name }}</DialogDescription>
    </header>
    <Tabs v-model="section" class="flex min-h-0 flex-1 flex-col">
      <div class="shrink-0 border-b px-6 py-3">
        <TabsList class="h-auto gap-1">
          <TabsTrigger value="chunks" class="h-auto gap-0.5 px-3 py-1.5" data-testid="kb-section-chunks">
            <span class="relative inline-flex items-center">
              {{ $t('knowledgeBase.text_1a37ffe77511') }}
              <span
                v-if="chunkSummary.attention"
                class="bg-destructive absolute -right-2 -top-0.5 size-1.5 rounded-full"
                :aria-label="$t('knowledgeBase.sectionChunksAttention')"
                data-testid="kb-section-dot-chunks"
              ></span>
            </span>
            <span class="text-muted-foreground block text-[11px] font-normal">{{ chunkSummary.summary }}</span>
          </TabsTrigger>
          <TabsTrigger value="status" class="h-auto gap-0.5 px-3 py-1.5" data-testid="kb-section-status">
            <span class="relative inline-flex items-center">
              {{ $t('knowledgeBase.text_8542beb99054') }}
              <span
                v-if="statusSummary.attention"
                class="bg-destructive absolute -right-2 -top-0.5 size-1.5 rounded-full"
                :aria-label="$t('knowledgeBase.sectionStatusAttention')"
                data-testid="kb-section-dot-status"
              ></span>
            </span>
            <span class="text-muted-foreground block text-[11px] font-normal">{{ statusSummary.summary }}</span>
          </TabsTrigger>
        </TabsList>
      </div>
      <div class="min-h-0 flex-1 overflow-auto p-6">
        <TabsContent value="chunks" class="mt-0 space-y-4">
          <p class="text-muted-foreground text-xs">
            {{ $t('knowledgeBase.chunkCountNotice', { count: chunks.length }) }}
          </p>
          <Input v-model="search" :aria-label="$t('knowledgeBase.text_33e817d71503')" :placeholder="$t('knowledgeBase.text_23e60c142dbd')" class="kb-control" />
          <select
            v-model="selectedChunk"
            :aria-label="$t('knowledgeBase.text_aa23d0118d25')"
            class="kb-control border-input bg-background focus-visible:ring-ring h-9 w-full min-w-0 rounded-md border px-3 text-sm focus-visible:ring-2"
          >
            <option value="">{{ $t('knowledgeBase.text_b3716e11bfce') }}</option>
            <option v-if="activeChunk && !filteredChunks.some((chunk) => chunk.id === activeChunk?.id)" :value="String(activeChunk.id)">
              {{ chunkOptionLabel(activeChunk) }}
            </option>
            <option v-for="chunk in filteredChunks" :key="chunk.id" :value="String(chunk.id)">{{ chunkOptionLabel(chunk) }}</option>
          </select>
          <p v-if="filteredChunks.length === 0" class="text-muted-foreground text-sm">
            {{ search ? $t('knowledgeBase.text_21c2f29f3067') : $t('knowledgeBase.text_b92c977343e2') }}
          </p>
          <template v-if="activeChunk">
            <p class="text-muted-foreground text-xs">
              {{ $t('knowledgeBase.text_ed4ebae0e1a8') }} {{ activeChunk.id }} · {{ activeChunk.tokenEstimate || 0 }}
              {{ $t('knowledgeBase.text_63b0bc45b957') }} {{ activeChunk.sourceVersion || $t('knowledgeBase.text_f1b46a8c5d6c') }}
            </p>
            <p class="bg-muted/20 whitespace-pre-wrap break-words rounded-md p-4 text-sm leading-7">{{ activeChunk.content }}</p>
            <p v-if="loading" role="status" class="text-muted-foreground text-sm">{{ $t('knowledgeBase.text_b30289aa4ac8') }}</p>
            <div v-else-if="error" role="alert" class="text-destructive text-sm">
              {{ error }}
              <Button variant="outline" size="sm" @click="loadChunk">{{ $t('knowledgeBase.text_5982c44c18df') }}</Button>
            </div>
            <p v-else-if="relations.length === 0" class="text-muted-foreground text-sm">{{ $t('knowledgeBase.text_32de3695c96e') }}</p>
            <details v-for="relation in relations" :key="relation.id" class="rounded-md border p-4 text-sm">
              <summary class="focus-visible:ring-ring cursor-pointer break-words focus-visible:ring-2">
                {{ relation.targetDocument?.name || $t('knowledgeBase.text_682836a89a62') }} · {{ relationTypeLabel(relation.relationType) }}
              </summary>
              <p class="text-muted-foreground mt-3 break-words">
                {{ relation.evidence || $t('knowledgeBase.text_c6933bd22ec6') }} · {{ relation.fromArtifactID }} → {{ relation.toArtifactID }}
                {{ $t('knowledgeBase.text_3a92f0b705f0') }} {{ relation.score.toFixed(2) }}
              </p>
              <p class="mt-3 whitespace-pre-wrap break-words leading-7">
                {{ relation.targetArtifact?.content || relation.targetArtifact?.caption || $t('knowledgeBase.text_0332c193da62') }}
              </p>
            </details>
          </template>
        </TabsContent>
        <TabsContent value="status" class="mt-0 space-y-4">
          <div class="flex justify-end">
            <Button variant="outline" size="sm" @click="emit('refresh')">{{ $t('knowledgeBase.text_bc36a1a79ee7') }}</Button>
          </div>
          <p v-if="retryError" role="alert" class="text-destructive text-sm">{{ retryError }}</p>
          <section v-for="stage in stages" :key="stage.stage" class="space-y-3 rounded-lg border p-4">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="flex-1 text-sm font-medium">{{ processingStageLabel(stage.stage) }}</h3>
              <Badge variant="outline">
                {{
                  stage.sourceVersion && stage.sourceVersion !== detail.sourceVersion
                    ? $t('knowledgeBase.text_c25bd31a28b4')
                    : processingStatusLabel(stage.status)
                }}
              </Badge>
              <Button
                v-if="canRetry && stage.stage !== 'content'"
                variant="outline"
                size="sm"
                :disabled="retrying || taskActive"
                @click="emit('retry', stage.stage)"
              >
                {{ taskActive ? $t('knowledgeBase.text_8e5dbad1d12b') : $t('knowledgeBase.text_64c49fe74ffc') }}
              </Button>
            </div>
            <p class="text-muted-foreground whitespace-pre-wrap break-words text-sm leading-6">{{ stage.message || $t('knowledgeBase.text_83119a7b791c') }}</p>
            <p v-if="stage.sourceVersion" class="text-muted-foreground break-all text-xs">
              {{ $t('knowledgeBase.text_2b2c2fd2872a') }}{{ stage.sourceVersion }}
            </p>
          </section>
          <p v-if="detail.lastError || detail.lastCompileTask?.errorMessage" class="text-destructive whitespace-pre-wrap break-words text-sm">
            {{ detail.lastError || detail.lastCompileTask?.errorMessage }}
          </p>
        </TabsContent>
      </div>
    </Tabs>
  </div>
</template>
