<!-- 文件说明：知识库共享检索面板，支持工作台固定作用域与自由多库/智能体检索模式。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeSearchChunkRelationResponse, KnowledgeSearchDocumentContent, KnowledgeSearchHit, KnowledgeSearchOption, KnowledgeSearchResponse } from './retrieval';

import { computed, onMounted, ref } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@unitedrhino/saas-ui/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { ChevronDown, FileSearch, LoaderCircle, Search } from 'lucide-vue-next';

import { buildKnowledgeSearchPayload, confidenceLabel, emptyStateHint, resolveKnowledgeSearchEmptyState, sourceTypeLabel } from './retrieval';
import { relationTypeLabel } from './graph';
import { RetrievalApi } from './retrieval.api';

import './workbench.css';

interface Props {
  /** 是否使用适合详情页的内嵌间距。 */
  embedded?: boolean;
  /** 固定知识库 ID；有值时隐藏作用域选择并强制传入该 ID。 */
  fixedKnowledgeId?: number;
  /** 固定知识库名称，用于工作台范围提示。 */
  fixedKnowledgeName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fixedKnowledgeId: 0,
  fixedKnowledgeName: '',
  embedded: false,
});

const agentOptions = ref<KnowledgeSearchOption[]>([]);
const knowledgeOptions = ref<KnowledgeSearchOption[]>([]);
const agentID = ref('');
const selectedKnowledgeIDs = ref<number[]>([]);
const query = ref('');
const topK = ref('5');
const loading = ref(false);
const optionLoading = ref(false);
const result = ref<KnowledgeSearchResponse | null>(null);
const statusError = ref('');
const advancedOpen = ref(false);
const activeDocumentContent = ref<KnowledgeSearchDocumentContent | null>(null);
const activeRelations = ref<KnowledgeSearchChunkRelationResponse | null>(null);
const detailLoading = ref(false);
const relationLoading = ref(false);

const hasResult = computed(
  () =>
    !!result.value && ((result.value.documents?.length ?? 0) > 0 || (result.value.chunks?.length ?? 0) > 0 || (result.value.expandedChunks?.length ?? 0) > 0),
);
/** 空结果区分"候选低于阈值"与"无结果"，两种空态给不同的处理建议。 */
const emptyHint = computed(() => emptyStateHint(resolveKnowledgeSearchEmptyState(result.value ?? {})));

/** loadOptions 仅在自由检索模式加载智能体和知识库选项。 */
async function loadOptions() {
  if (props.fixedKnowledgeId) return;
  optionLoading.value = true;
  try {
    const [agents, knowledgeBases] = await Promise.all([RetrievalApi.listAgents(), RetrievalApi.listKnowledgeBases()]);
    agentOptions.value = agents;
    knowledgeOptions.value = knowledgeBases;
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : $t('knowledgeBase.text_f26e7c72656b');
  } finally {
    optionLoading.value = false;
  }
}

/** toggleKnowledgeScope 维护多知识库联合检索的选中集合，并与智能体模式互斥。 */
function toggleKnowledgeScope(knowledgeID: number, checked: boolean) {
  selectedKnowledgeIDs.value = checked
    ? [...new Set([knowledgeID, ...selectedKnowledgeIDs.value])]
    : selectedKnowledgeIDs.value.filter((id) => id !== knowledgeID);
  if (checked) agentID.value = '';
}

/** runSearch 执行检索；工作台模式始终固定当前知识库。 */
async function runSearch() {
  if (!query.value.trim()) {
    statusError.value = $t('knowledgeBase.text_f848092fb9e3');
    return;
  }
  if (!props.fixedKnowledgeId && !agentID.value && selectedKnowledgeIDs.value.length === 0) {
    statusError.value = $t('knowledgeBase.text_eb7491c2a296');
    return;
  }

  loading.value = true;
  statusError.value = '';
  activeDocumentContent.value = null;
  activeRelations.value = null;
  try {
    result.value = await RetrievalApi.search(
      buildKnowledgeSearchPayload({
        agentID: Number(agentID.value || 0) || undefined,
        fixedKnowledgeID: props.fixedKnowledgeId || undefined,
        knowledgeBaseIDs: selectedKnowledgeIDs.value,
        query: query.value,
        topK: Math.min(20, Math.max(1, Number(topK.value || 5))),
      }),
    );
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : $t('knowledgeBase.text_34d083c99673');
    result.value = null;
  } finally {
    loading.value = false;
  }
}

/** openDocumentContent 在高级详情中加载命中文档全文。 */
async function openDocumentContent(documentID: number) {
  advancedOpen.value = true;
  detailLoading.value = true;
  try {
    activeDocumentContent.value = await RetrievalApi.getDocumentContent(documentID);
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : $t('knowledgeBase.text_be5c9400dc3e');
  } finally {
    detailLoading.value = false;
  }
}

/** openChunkRelations 在高级详情中加载切片关联。 */
async function openChunkRelations(artifactID: number) {
  advancedOpen.value = true;
  relationLoading.value = true;
  try {
    activeRelations.value = await RetrievalApi.getChunkRelations(artifactID, 8);
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : $t('knowledgeBase.text_8730f2aa6fc8');
  } finally {
    relationLoading.value = false;
  }
}

/** handleSearchKeydown 支持 Ctrl/Cmd + Enter 执行检索。 */
function handleSearchKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    void runSearch();
  }
}

/** 关联补充切片的关系分文本；旧载荷缺 relationScore 时回退检索分（扩展命中的 score 即关系综合分）。 */
function expandedRelationScoreText(hit: KnowledgeSearchHit) {
  const score = hit.relationScore ?? hit.score;
  return score === undefined ? '' : score.toFixed(2);
}

/** handleAdvancedToggle 同步原生 details 展开状态，供程序化打开使用。 */
function handleAdvancedToggle(event: Event) {
  advancedOpen.value = (event.currentTarget as HTMLDetailsElement).open;
}

onMounted(() => {
  void loadOptions();
});
</script>

<template>
  <div class="kb-ui flex min-h-0 flex-col gap-4" :class="[embedded ? 'h-full' : 'p-4']">
    <Card class="shrink-0 rounded-lg shadow-sm">
      <CardContent class="p-4">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-foreground text-base font-semibold">{{ $t('knowledgeBase.text_a268bd3edc58') }}</div>
              <div class="text-muted-foreground mt-0.5 text-sm">
                <template v-if="fixedKnowledgeId">
                  {{ $t('knowledgeBase.retrievalScope', { name: fixedKnowledgeName || $t('knowledgeBase.text_7bf45a54e66f', { arg0: fixedKnowledgeId }) }) }}
                </template>
                <template v-else> {{ $t('knowledgeBase.text_c2754a5dbc11') }} </template>
              </div>
            </div>
            <Badge v-if="result" variant="outline">
              {{ confidenceLabel(result.confidenceBand, hasResult) }}
            </Badge>
          </div>

          <div v-if="!fixedKnowledgeId" class="grid gap-3 md:grid-cols-2">
            <Select v-model="agentID" :disabled="optionLoading" @update:model-value="selectedKnowledgeIDs = []">
              <SelectTrigger>
                <SelectValue :placeholder="$t('knowledgeBase.text_de04d74968c2')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in agentOptions" :key="option.value" :value="String(option.value)">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button type="button" variant="outline" class="kb-control w-full justify-between" :disabled="optionLoading">
                  {{
                    selectedKnowledgeIDs.length > 0
                      ? $t('knowledgeBase.text_0d3e012c5136', { arg0: selectedKnowledgeIDs.length })
                      : $t('knowledgeBase.text_d966730f775c')
                  }}
                  <ChevronDown class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="max-h-72 w-72 overflow-y-auto">
                <DropdownMenuLabel>{{ $t('knowledgeBase.text_7688f4e55e2b') }}</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  v-for="option in knowledgeOptions"
                  :key="option.value"
                  :model-value="selectedKnowledgeIDs.includes(option.value)"
                  @select.prevent
                  @update:model-value="(checked: boolean) => toggleKnowledgeScope(option.value, checked)"
                >
                  {{ option.label }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Textarea
              id="knowledge-search-query"
              :aria-label="$t('knowledgeBase.text_2a1d305a06c3')"
              v-model="query"
              class="min-h-20 flex-1 resize-y"
              :placeholder="$t('knowledgeBase.text_1e614ed9d82c')"
              @keydown="handleSearchKeydown"
            />
            <Button class="kb-control h-9 shrink-0 px-4" :disabled="loading" @click="runSearch">
              <LoaderCircle v-if="loading" class="size-4 animate-spin" />
              <Search v-else class="size-4" />
              {{ loading ? $t('knowledgeBase.text_a4ff2631ff71') : $t('knowledgeBase.text_9d041618da83') }}
            </Button>
          </div>

          <div v-if="statusError" class="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {{ statusError }}
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="min-h-0 flex-1 overflow-auto">
      <Empty v-if="!result && !loading" class="bg-card min-h-72 rounded-lg border">
        <EmptyHeader>
          <FileSearch class="text-muted-foreground mx-auto size-8" />
          <EmptyTitle>{{ $t('knowledgeBase.text_5e8faaf22464') }}</EmptyTitle>
          <EmptyDescription>{{ $t('knowledgeBase.text_f7300b8a850c') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Empty v-else-if="result && !hasResult" class="bg-card min-h-72 rounded-lg border" data-testid="kb-retrieval-empty">
        <EmptyHeader>
          <EmptyTitle>{{ $t(emptyHint.titleKey) }}</EmptyTitle>
          <EmptyDescription>{{ $t(emptyHint.descriptionKey, emptyHint.values ?? {}) }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div v-else-if="result" class="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card class="min-w-0 rounded-lg shadow-sm">
          <CardHeader class="p-4 pb-0">
            <CardTitle class="text-base">{{ $t('knowledgeBase.text_4a5f20b88fc3') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3 p-4">
            <div
              v-for="doc in result.documents"
              :key="doc.documentID"
              class="bg-background hover:bg-muted/30 rounded-md border p-3 transition-colors duration-200"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-foreground truncate text-sm font-medium">{{ doc.documentName }}</div>
                  <div class="text-muted-foreground mt-1 truncate text-xs">{{ doc.path }}</div>
                </div>
                <Badge variant="secondary">{{ doc.score.toFixed(2) }}</Badge>
              </div>
              <p class="text-muted-foreground mt-2 text-sm leading-6">{{ doc.snippet || $t('knowledgeBase.text_c49610046cbe') }}</p>
              <Button variant="ghost" size="sm" class="kb-control mt-2" @click="openDocumentContent(doc.documentID)">
                {{ $t('knowledgeBase.text_3d83cc6efb13') }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card class="min-w-0 rounded-lg shadow-sm">
          <CardHeader class="p-4 pb-0">
            <CardTitle class="text-base">{{ $t('knowledgeBase.text_5e0d1c86ed5a') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3 p-4">
            <div
              v-for="hit in result.chunks"
              :key="hit.artifactID"
              class="bg-background hover:bg-muted/30 rounded-md border p-3 transition-colors duration-200"
            >
              <div class="flex flex-wrap items-center gap-2">
                <Badge>{{ sourceTypeLabel(hit.sourceType) }}</Badge>
                <Badge variant="outline">{{ $t('knowledgeBase.text_72add8a89eda') }}{{ hit.chunkIndex || '-' }}</Badge>
                <span class="text-muted-foreground text-xs">{{ $t('knowledgeBase.text_0e1b55305ef6') }} {{ hit.score.toFixed(2) }}</span>
              </div>
              <div class="text-muted-foreground mt-2 truncate text-xs">{{ hit.path }}</div>
              <div class="bg-muted/50 text-foreground/90 mt-2 whitespace-pre-wrap rounded-md p-3 text-sm leading-6">
                {{ hit.content || hit.snippet || $t('knowledgeBase.text_7b21430b7e8a') }}
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" @click="openDocumentContent(hit.documentID)" class="kb-control">{{
                  $t('knowledgeBase.text_3d83cc6efb13')
                }}</Button>
                <Button variant="ghost" size="sm" @click="openChunkRelations(hit.artifactID)" class="kb-control">{{
                  $t('knowledgeBase.text_3285d4e0d323')
                }}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <details v-if="result" :open="advancedOpen" class="bg-card mt-4 rounded-lg border shadow-sm" @toggle="handleAdvancedToggle">
        <summary
          class="text-foreground focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2"
        >
          <span>{{ $t('knowledgeBase.text_2339a846743d') }}</span>
          <ChevronDown class="size-4 transition-transform duration-200" :class="advancedOpen ? 'rotate-180' : ''" />
        </summary>
        <div class="grid gap-4 border-t p-4 xl:grid-cols-2">
          <div class="space-y-3">
            <div class="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
              <label for="knowledge-search-top-k" class="text-muted-foreground text-sm">TopK</label>
              <Input id="knowledge-search-top-k" v-model="topK" type="number" min="1" max="20" />
            </div>
            <div class="bg-muted/40 rounded-md p-3 text-sm leading-6">
              <div>
                <span class="text-muted-foreground">{{ $t('knowledgeBase.text_8448d7d65949') }}</span
                >{{ result.originalQuery || '-' }}
              </div>
              <div class="mt-1">
                <span class="text-muted-foreground">{{ $t('knowledgeBase.text_91f80fb9cf7c') }}</span
                >{{ result.rewrittenQuery || '-' }}
              </div>
              <div class="mt-1"><span class="text-muted-foreground">searchReady：</span>{{ result.searchReady ? 'true' : 'false' }}</div>
            </div>
            <div v-if="result.expandedChunks?.length" class="space-y-2">
              <div class="text-sm font-medium">{{ $t('knowledgeBase.text_48dad3382f39') }}</div>
              <div v-for="hit in result.expandedChunks" :key="`${hit.sourceArtifactID}-${hit.artifactID}`" class="rounded-md border p-3 text-sm">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{{ sourceTypeLabel(hit.sourceType) }}</Badge>
                  <Badge variant="outline">{{ relationTypeLabel(hit.relationType || '') }}</Badge>
                  <span v-if="expandedRelationScoreText(hit)" class="text-muted-foreground text-xs">关系分 {{ expandedRelationScoreText(hit) }}</span>
                </div>
                <div v-if="hit.relationEvidence" class="text-muted-foreground mt-2 leading-6">关联依据：{{ hit.relationEvidence }}</div>
                <div class="text-muted-foreground mt-2 whitespace-pre-wrap leading-6">{{ hit.content || hit.snippet }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="rounded-md border p-3">
              <div class="text-sm font-medium">{{ $t('knowledgeBase.text_9c885cdffb5d') }}</div>
              <div v-if="detailLoading" class="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                <LoaderCircle class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_ce56f617e402') }}
              </div>
              <pre
                v-else-if="activeDocumentContent?.parsedFullText"
                class="bg-muted/50 mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md p-3 text-xs leading-5"
                >{{ activeDocumentContent.parsedFullText }}</pre>
              <div v-else class="text-muted-foreground mt-2 text-sm">{{ $t('knowledgeBase.text_8bc2005e1f2b') }}</div>
            </div>
            <div class="rounded-md border p-3">
              <div class="text-sm font-medium">{{ $t('knowledgeBase.text_107d80805fdb') }}</div>
              <div v-if="relationLoading" class="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                <LoaderCircle class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_ce56f617e402') }}
              </div>
              <div v-else-if="activeRelations?.relations?.length" class="mt-3 space-y-2">
                <div v-for="item in activeRelations.relations" :key="item.id" class="bg-muted/40 rounded-md p-3 text-sm">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">{{ item.relationType }}</Badge>
                    <span class="text-muted-foreground text-xs">{{ item.score.toFixed(2) }}</span>
                  </div>
                  <div v-if="item.evidence" class="text-muted-foreground mt-2 leading-6">{{ item.evidence }}</div>
                </div>
              </div>
              <div v-else class="text-muted-foreground mt-2 text-sm">{{ $t('knowledgeBase.text_c1ef1942e3ee') }}</div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>
