<!-- 文件说明：主内容区文档关联，实际容器像素布局与独立证据栏，不缩放节点文字；字段引用子视图复用同一搜索与操作面板。 -->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '../../locales';
import type { KnowledgeChunkRelation, KnowledgeDetail, KnowledgeFieldReference } from './data';
import type { DocumentRelationGroup } from './document-relations';
import type { KnowledgeFieldReferenceAnchor, KnowledgeFieldReferenceSubmitPayload } from './field-reference';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@unitedrhino/saas-ui/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@unitedrhino/saas-ui/ui/tabs';
import { useElementSize } from '@vueuse/core';

import { useToast } from '../../hooks/use-toast';
import { groupDocumentRelations } from './document-relations';
import FieldReferenceForm from './field-reference-form.vue';
import FieldReferencePanel from './field-reference-panel.vue';
import { filterFieldReferences, groupFieldReferences, referenceEditableSide } from './field-reference';
import { Api } from './index.api';
import { getProcessingStage } from './processing';
import ProcessingNotice from './processing-notice.vue';
import RelationEvidence from './relation-evidence.vue';
import { getErrorMessage } from './workbench';
/** detail 仅提供当前文档及阶段；关系与引用接口在实际挂载后调用。 */
const props = defineProps<{ canWrite?: boolean; detail: KnowledgeDetail; pendingCount?: number }>();
/** advanced 让异常提示进入高级状态面板；changed 让父级同步引用失效统计。 */
const emit = defineEmits<{ advanced: []; changed: [] }>();
const { toast } = useToast();
/** 子视图默认保持语义关联图谱；字段引用按需加载。 */
const subView = ref<'field' | 'semantic'>('semantic');
/** relationsIdleEmpty 语义阶段尚未生成（等待/延后/未记录）且没有关系数据：合并「暂未完成」条与空白画布为一个明确空态；失败类状态与历史版本仍走原提示条。 */
const relationsIdleEmpty = computed(() => {
  if (subView.value !== 'semantic') return false;
  const stage = getProcessingStage(props.detail, 'relations');
  const status = stage.status || '';
  if (['success', 'notApplicable', 'failed', 'partial', 'blocked'].includes(status)) return false;
  if (stage.sourceVersion && stage.sourceVersion !== props.detail.sourceVersion) return false;
  return true;
});
/** relationsGenerating 语义关联阶段正在排队或执行中，空态文案改为「生成中」。 */
const relationsGenerating = computed(() => getProcessingStage(props.detail, 'relations').status === 'processing');
/** 主区、画布各自测量，证据打开后画布自动使用剩余空间。 */
const root = ref<HTMLElement>();
const canvas = ref<HTMLElement>();
const evidencePanel = ref<HTMLElement>();
const { width: mainWidth } = useElementSize(root);
const { width: canvasWidth, height: canvasHeight } = useElementSize(canvas);
const relations = ref<KnowledgeChunkRelation[]>([]);
const loading = ref(false);
const error = ref('');
const hasMore = ref(false);
const search = ref('');
const page = ref(0);
const selectedDocument = ref<null | number>(null);
/** 关闭时回到真实触发节点；重排导致节点消失则回到图谱区。 */
let evidenceTrigger: HTMLElement | null | SVGElement = null;
let request = 0;
const groups = computed(() => groupDocumentRelations(props.detail.document.id, relations.value));
const filteredGroups = computed(() => groups.value.filter((group) => group.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())));
const pageSize = computed(() => Math.max(3, Math.min(6, Math.floor((canvasHeight.value - 24) / 88))));
const pages = computed(() => Math.max(1, Math.ceil(filteredGroups.value.length / pageSize.value)));
const visibleGroups = computed(() => filteredGroups.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value));
const selectedGroup = computed(() => groups.value.find((group) => group.documentID === selectedDocument.value));
const inlineEvidence = computed(() => mainWidth.value >= 1040);
const evidenceOpen = computed({
  get: () => !!selectedGroup.value && !inlineEvidence.value,
  set: (open: boolean) => {
    if (!open) closeEvidence();
  },
});

/** 字段引用子视图：正向（本文引用）与反向（影响分析）共用一次列表装配。 */
const fieldReferences = ref<KnowledgeFieldReference[]>([]);
const fieldLoading = ref(false);
const fieldError = ref('');
const fieldHasMore = ref(false);
const fieldBusyId = ref(0);
let fieldRequest = 0;
const fieldFormOpen = ref(false);
const fieldFormState = ref<{
  anchor: KnowledgeFieldReferenceAnchor | null;
  mode: 'create' | 'update';
  reference: KnowledgeFieldReference | null;
  side: 'from' | 'to';
} | null>(null);
const fieldSubmitting = ref(false);
const outgoingPanel = ref<InstanceType<typeof FieldReferencePanel>>();
const incomingPanel = ref<InstanceType<typeof FieldReferencePanel>>();
const incomingSection = ref<HTMLElement>();
/** 表单关闭后焦点回到触发入口，保持键盘动线。 */
let fieldFormTrigger: HTMLElement | null = null;
const fieldGroups = computed(() => groupFieldReferences(props.detail.document.id, fieldReferences.value));
const filteredOutgoing = computed(() => filterFieldReferences(fieldGroups.value.outgoing, search.value));
const filteredIncoming = computed(() => filterFieldReferences(fieldGroups.value.incoming, search.value));

/** SVG 宽高与 CSS 像素一致，foreignObject 中的 14px 文本不会随画布缩放。 */
const graphHeight = computed(() => Math.max(canvasHeight.value, visibleGroups.value.length * 88 + 24));
const nodeWidth = computed(() => Math.min(256, Math.max(208, canvasWidth.value * 0.3)));
const targetX = computed(() => canvasWidth.value - nodeWidth.value - 16);
/** targetY 均匀分布当页文档，保留 88px 以上的节点空间。 */
function targetY(index: number) {
  return ((index + 0.5) * graphHeight.value) / visibleGroups.value.length;
}
/** edgePath 用实际像素连接两端节点，坐标变化不缩放字号。 */
function edgePath(index: number) {
  const start = nodeWidth.value + 16;
  const middle = (start + targetX.value) / 2;
  return `M ${start} ${graphHeight.value / 2} C ${middle} ${graphHeight.value / 2}, ${middle} ${targetY(index)}, ${targetX.value} ${targetY(index)}`;
}
/** loadOverview 用独立序号隔离切换文档/刷新/卸载，不把加载失败当空数据。 */
async function loadOverview() {
  const current = ++request;
  loading.value = true;
  error.value = '';
  try {
    const result = await Api.getDocumentRelations(props.detail.document.id);
    if (current !== request) return;
    relations.value = result.relations ?? [];
    hasMore.value = result.hasMore ?? false;
  } catch {
    if (current === request) error.value = $t('knowledgeBase.text_6e9abcef2a2d');
  } finally {
    if (current === request) loading.value = false;
  }
}
/** loadFieldReferences 正反两向各查一次并按 id 去重，失效置顶排序在分组函数内完成。 */
async function loadFieldReferences() {
  const knowledgeID = props.detail.document.knowledgeID;
  if (!knowledgeID) return;
  const current = ++fieldRequest;
  fieldLoading.value = true;
  fieldError.value = '';
  try {
    const [outgoing, incoming] = await Promise.all([
      Api.getFieldReferences({ fromDocumentID: props.detail.document.id, knowledgeID, size: 300 }),
      Api.getFieldReferences({ knowledgeID, size: 300, toDocumentID: props.detail.document.id }),
    ]);
    if (current !== fieldRequest) return;
    const seen = new Set<number>();
    fieldReferences.value = [...(outgoing.references ?? []), ...(incoming.references ?? [])].filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    fieldHasMore.value = !!(outgoing.hasMore || incoming.hasMore);
  } catch {
    if (current === fieldRequest) fieldError.value = $t('knowledgeBase.text_49a556308315');
  } finally {
    if (current === fieldRequest) fieldLoading.value = false;
  }
}
/** switchView 切换子视图；首次进入字段引用视图时才发起查询。 */
function switchView(value: number | string) {
  subView.value = value === 'field' ? 'field' : 'semantic';
  if (subView.value === 'field' && fieldReferences.value.length === 0 && !fieldLoading.value) void loadFieldReferences();
}
/** showEvidence 内联时聚焦证据标题，侧栏焦点由标准 Sheet 管理。 */
async function showEvidence(group: DocumentRelationGroup, event: Event) {
  evidenceTrigger = event.currentTarget as HTMLElement | SVGElement;
  selectedDocument.value = group.documentID;
  await nextTick();
  if (inlineEvidence.value) evidencePanel.value?.focus({ preventScroll: true });
}
/** restoreEvidenceFocus 只恢复当前仍存在的节点，避免焦点落到已卸载 DOM。 */
function restoreEvidenceFocus() {
  (evidenceTrigger?.isConnected ? evidenceTrigger : canvas.value)?.focus({ preventScroll: true });
}
/** closeEvidence 不重置搜索分页，便于继续浏览邻接文档。 */
function closeEvidence() {
  selectedDocument.value = null;
  void nextTick(restoreEvidenceFocus);
}
/** groupEvidenceTitle 取组内首条关系判定依据，供关系边与文档节点悬浮提示解释关联原因。 */
function groupEvidenceTitle(group: DocumentRelationGroup) {
  return group.relations.find((relation) => relation.evidence)?.evidence ?? '';
}
/** jumpToPendingReview 从提示条跳到反向分组的失效条目并聚焦。 */
async function jumpToPendingReview() {
  subView.value = 'field';
  if (fieldReferences.value.length === 0 && !fieldLoading.value) await loadFieldReferences();
  await nextTick();
  incomingSection.value?.scrollIntoView({ block: 'start', behavior: 'instant' });
  await incomingPanel.value?.revealPending();
}

/** runFieldMutation 统一执行确认/拒绝/复核/删除，成功后刷新列表并同步父级统计。 */
async function runFieldMutation(referenceID: number, action: () => Promise<unknown>, successTitle: string) {
  if (fieldBusyId.value) return;
  fieldBusyId.value = referenceID;
  try {
    await action();
    toast({ title: successTitle, type: 'success' });
    await loadFieldReferences();
    emit('changed');
  } catch (mutationError) {
    notifyRequestError(mutationError, () => getErrorMessage(mutationError, $t('knowledgeBase.text_51d3cb57e67e')), (text) => toast({ type: 'error', title: text }));
  } finally {
    fieldBusyId.value = 0;
  }
}

function confirmFieldReference(reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runFieldMutation(reference.id, () => Api.reviewFieldReference(reference.id!, 'confirm'), $t('knowledgeBase.text_ea9d163144cd'));
}
function rejectFieldReference(reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runFieldMutation(reference.id, () => Api.reviewFieldReference(reference.id!, 'reject'), $t('knowledgeBase.text_1590868f1692'));
}
function markFieldReferenceReviewed(reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runFieldMutation(reference.id, () => Api.reviewFieldReference(reference.id!, 'markReviewed'), $t('knowledgeBase.text_07ca7a5eaf74'));
}
function removeFieldReference(reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runFieldMutation(reference.id, () => Api.deleteFieldReference(reference.id!), $t('knowledgeBase.text_dac3de635cfd'));
}
/** openEditFieldReference 编辑属于本文的一侧，避免触碰对端文档的快照。 */
function openEditFieldReference(reference: KnowledgeFieldReference) {
  fieldFormTrigger = document.activeElement as HTMLElement | null;
  const side = referenceEditableSide(reference, props.detail.document.id);
  fieldFormState.value = { anchor: reference[side] ?? null, mode: 'update', reference, side };
  fieldFormOpen.value = true;
}
/** openReviewFieldReference 重新指定：自动重锚定失败后重挂 to 侧到新位置。 */
function openReviewFieldReference(reference: KnowledgeFieldReference) {
  fieldFormTrigger = document.activeElement as HTMLElement | null;
  fieldFormState.value = { anchor: reference.to ?? null, mode: 'update', reference, side: 'to' };
  fieldFormOpen.value = true;
}
/** submitFieldForm 提交单侧更新，成功后关闭表单并刷新引用列表。 */
async function submitFieldForm(payload: KnowledgeFieldReferenceSubmitPayload) {
  if (fieldSubmitting.value || payload.kind !== 'update') return;
  fieldSubmitting.value = true;
  try {
    await Api.updateFieldReference(payload.data);
    toast({ title: $t('knowledgeBase.text_7fe47451c992'), type: 'success' });
    fieldFormOpen.value = false;
    await loadFieldReferences();
    emit('changed');
  } catch (formError) {
    notifyRequestError(formError, () => getErrorMessage(formError, $t('knowledgeBase.text_18b4e26f241c')), (text) => toast({ type: 'error', title: text }));
  } finally {
    fieldSubmitting.value = false;
  }
}
/** markFieldReviewedFromForm 处理重挂表单里的「标记无影响」快捷动作。 */
async function markFieldReviewedFromForm(reference: KnowledgeFieldReference) {
  if (!reference.id || fieldSubmitting.value) return;
  fieldSubmitting.value = true;
  try {
    await Api.reviewFieldReference(reference.id, 'markReviewed');
    toast({ title: $t('knowledgeBase.text_07ca7a5eaf74'), type: 'success' });
    fieldFormOpen.value = false;
    await loadFieldReferences();
    emit('changed');
  } catch (formError) {
    notifyRequestError(formError, () => getErrorMessage(formError, $t('knowledgeBase.text_51d3cb57e67e')), (text) => toast({ type: 'error', title: text }));
  } finally {
    fieldSubmitting.value = false;
  }
}
/** 表单关闭后把焦点还给触发按钮。 */
watch(fieldFormOpen, (open) => {
  if (open) return;
  const trigger = fieldFormTrigger;
  fieldFormTrigger = null;
  void nextTick(() => trigger?.focus({ preventScroll: true }));
});
watch(search, () => {
  page.value = 0;
});
watch(pages, (value) => {
  page.value = Math.min(page.value, value - 1);
});
watch(
  () => props.detail,
  (detail, previous) => {
    if (detail.document.id !== previous?.document.id) {
      relations.value = [];
      selectedDocument.value = null;
      hasMore.value = false;
      search.value = '';
      page.value = 0;
      evidenceTrigger = null;
      fieldReferences.value = [];
      fieldHasMore.value = false;
      fieldError.value = '';
    }
    void loadOverview();
    if (detail.document.id !== previous?.document.id && subView.value === 'field') void loadFieldReferences();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  request++;
  fieldRequest++;
});
</script>
<template>
  <section ref="root" class="bg-background flex h-full min-h-0 min-w-0 flex-col gap-3 p-4" :aria-label="$t('knowledgeBase.text_cf953dd7e2b8')">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <Tabs :model-value="subView" @update:model-value="switchView">
        <TabsList class="bg-muted/60 h-9 p-1">
          <TabsTrigger value="semantic" class="data-[state=active]:text-foreground h-7 px-4 text-sm data-[state=active]:font-medium">{{
            $t('knowledgeBase.text_23859db100ac')
          }}</TabsTrigger>
          <TabsTrigger value="field" class="data-[state=active]:text-foreground h-7 px-4 text-sm data-[state=active]:font-medium">
            {{ $t('knowledgeBase.text_6a0e4493e8a9') }}
            <span
              v-if="pendingCount"
              class="bg-destructive/10 text-destructive ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-normal leading-none"
            >
              {{ pendingCount }} {{ $t('knowledgeBase.text_47daa24eec17') }}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p class="text-muted-foreground text-xs">
        {{
          subView === 'semantic'
            ? $t('knowledgeBase.text_2a5eed30d0eb', { arg0: groups.length, arg1: hasMore ? $t('knowledgeBase.text_037b61b866fb') : '' })
            : $t('knowledgeBase.text_b8cb8b973b69', { arg0: fieldReferences.length, arg1: fieldHasMore ? $t('knowledgeBase.text_037b61b866fb') : '' })
        }}
      </p>
      <Input
        v-model="search"
        class="kb-control w-full sm:w-52"
        :aria-label="subView === 'semantic' ? $t('knowledgeBase.text_0b27dafed1d7') : $t('knowledgeBase.text_bbd5483fc267')"
        :placeholder="subView === 'semantic' ? $t('knowledgeBase.text_0b27dafed1d7') : $t('knowledgeBase.text_8abd7d67e208')"
      />
    </div>
    <div
      v-if="pendingCount"
      role="status"
      class="border-warning/30 bg-warning/10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-1.5 text-sm"
    >
      <span>{{ $t('knowledgeBase.text_448f340ef1aa') }} {{ pendingCount }} {{ $t('knowledgeBase.text_d9da3cde8228') }}</span>
      <Button variant="outline" size="sm" class="bg-background kb-control ml-auto" @click="jumpToPendingReview">{{
        $t('knowledgeBase.text_f7acefd2d4cd')
      }}</Button>
    </div>
    <template v-if="subView === 'semantic'">
      <ProcessingNotice v-if="!relationsIdleEmpty" :detail="detail" stage="relations" @details="emit('advanced')" />
      <p v-if="hasMore" role="status" class="text-muted-foreground shrink-0 text-xs">{{ $t('knowledgeBase.text_16f3f0ac55a4') }}</p>
      <div v-if="loading && relations.length === 0" role="status" class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {{ $t('knowledgeBase.text_bbc2a2557f6c') }}
      </div>
      <div v-else-if="error" role="alert" class="text-destructive space-y-3 rounded-lg border p-4">
        <p>{{ error }}</p>
        <Button variant="outline" size="sm" @click="loadOverview">{{ $t('knowledgeBase.text_5982c44c18df') }}</Button>
      </div>
      <Empty v-else-if="filteredGroups.length === 0" class="flex-1">
        <EmptyHeader>
          <EmptyTitle>{{
            search
              ? $t('knowledgeBase.text_0fae2b99d48d')
              : relationsIdleEmpty
                ? relationsGenerating
                  ? $t('knowledgeBase.text_86c340bda9ba')
                  : $t('knowledgeBase.text_f565d311216b')
                : $t('knowledgeBase.text_30c32488946c')
          }}</EmptyTitle>
          <EmptyDescription v-if="search"> {{ $t('knowledgeBase.text_399ecfdfa91c') }} </EmptyDescription>
          <EmptyDescription v-else-if="relationsIdleEmpty">
            {{ relationsGenerating ? $t('knowledgeBase.text_d7c1888cb0bc') : $t('knowledgeBase.text_513abe95f9cf') }}
          </EmptyDescription>
          <EmptyDescription v-else> {{ $t('knowledgeBase.text_5973fd3c7255') }} </EmptyDescription>
        </EmptyHeader>
        <Button v-if="relationsIdleEmpty && !search && !relationsGenerating" variant="outline" size="sm" class="mt-3" @click="emit('advanced')">
          {{ $t('knowledgeBase.text_5cb34e456138') }}
        </Button>
      </Empty>
      <div v-else class="flex min-h-0 flex-1 gap-4">
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div
            ref="canvas"
            tabindex="-1"
            class="bg-muted/20 focus-visible:ring-ring min-h-0 flex-1 overflow-auto rounded-lg border focus-visible:ring-2"
            :aria-label="$t('knowledgeBase.text_b20209767ce0')"
          >
            <svg v-if="canvasWidth >= 640" :width="canvasWidth" :height="graphHeight" role="group" :aria-label="$t('knowledgeBase.text_43ee516ccef3')">
              <g v-for="(group, index) in visibleGroups" :key="group.documentID">
                <path :d="edgePath(index)" class="stroke-primary/40 fill-none" stroke-width="2" />
                <path
                  :d="edgePath(index)"
                  class="focus-visible:stroke-primary/50 cursor-pointer fill-none stroke-transparent focus-visible:outline-none"
                  stroke-width="16"
                  tabindex="0"
                  role="button"
                  :aria-label="$t('knowledgeBase.text_b78b0e323c2d', { arg0: group.name })"
                  @click="showEvidence(group, $event)"
                  @keydown.enter.prevent="showEvidence(group, $event)"
                  @keydown.space.prevent="showEvidence(group, $event)"
                >
                  <title v-if="groupEvidenceTitle(group)">{{ groupEvidenceTitle(group) }}</title>
                </path>
                <foreignObject :x="targetX" :y="targetY(index) - 36" :width="nodeWidth" height="72">
                  <button
                    type="button"
                    class="bg-background border-border hover:border-primary/50 focus-visible:ring-ring h-full w-full rounded-lg border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2"
                    :aria-label="$t('knowledgeBase.text_9e5dd684d738', { arg0: group.name, arg1: group.relations.length })"
                    :title="groupEvidenceTitle(group) || undefined"
                    @click="showEvidence(group, $event)"
                  >
                    <span class="line-clamp-2 break-all text-sm font-medium" :title="group.name">{{ group.name }}</span>
                    <span class="text-muted-foreground text-xs">{{ group.relations.length }} {{ $t('knowledgeBase.text_79359b4e83aa') }}</span>
                  </button>
                </foreignObject>
              </g>
              <foreignObject x="16" :y="graphHeight / 2 - 44" :width="nodeWidth" height="88">
                <div class="border-primary/30 bg-primary/5 flex h-full flex-col justify-center rounded-lg border p-3">
                  <span class="text-primary mb-1 text-xs">{{ $t('knowledgeBase.text_8b8d795da2ec') }}</span>
                  <span class="line-clamp-2 break-all text-sm font-semibold" :title="detail.document.name">{{ detail.document.name }}</span>
                </div>
              </foreignObject>
            </svg>
            <div v-else class="space-y-3 p-3" :aria-label="$t('knowledgeBase.text_b8f9573f50fb')">
              <button
                v-for="group in visibleGroups"
                :key="group.documentID"
                type="button"
                class="bg-background focus-visible:ring-ring min-h-11 w-full rounded-md border p-3 text-left text-sm focus-visible:ring-2"
                :title="groupEvidenceTitle(group) || undefined"
                @click="showEvidence(group, $event)"
              >
                <span class="block break-words font-medium">{{ group.name }}</span>
                <span class="text-muted-foreground text-xs">{{ group.relations.length }} {{ $t('knowledgeBase.text_b75435d31277') }}</span>
              </button>
            </div>
          </div>
          <div v-if="pages > 1" class="flex shrink-0 items-center justify-end gap-3 text-xs">
            <span>{{ page + 1 }} / {{ pages }}</span>
            <Button size="sm" variant="outline" :disabled="page === 0" @click="page--">{{ $t('knowledgeBase.text_b41561d80765') }}</Button>
            <Button size="sm" variant="outline" :disabled="page >= pages - 1" @click="page++">{{ $t('knowledgeBase.text_67a246a344ae') }}</Button>
          </div>
        </div>
        <aside
          v-if="selectedGroup && inlineEvidence"
          ref="evidencePanel"
          tabindex="-1"
          class="focus-visible:ring-ring w-[360px] shrink-0 overflow-hidden rounded-lg border focus-visible:ring-2"
        >
          <RelationEvidence :document-i-d="detail.document.id" :group="selectedGroup" @close="closeEvidence" />
        </aside>
      </div>
      <Sheet v-model:open="evidenceOpen">
        <SheetContent class="kb-ui flex w-full max-w-[440px] flex-col gap-0 p-0 pt-12" @close-auto-focus.prevent="restoreEvidenceFocus">
          <SheetTitle class="sr-only">{{ $t('knowledgeBase.text_6d61c09b06aa') }}</SheetTitle>
          <SheetDescription class="sr-only">{{ $t('knowledgeBase.text_5e9679c8702e') }}</SheetDescription>
          <RelationEvidence v-if="selectedGroup" :document-i-d="detail.document.id" :group="selectedGroup" @close="closeEvidence" />
        </SheetContent>
      </Sheet>
    </template>
    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div v-if="fieldLoading" role="status" class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {{ $t('knowledgeBase.text_e2be465a73f2') }}
      </div>
      <div v-else-if="fieldError" role="alert" class="text-destructive space-y-3 rounded-lg border p-4">
        <p>{{ fieldError }}</p>
        <Button variant="outline" size="sm" @click="loadFieldReferences">{{ $t('knowledgeBase.text_5982c44c18df') }}</Button>
      </div>
      <Empty v-else-if="fieldReferences.length === 0" class="flex-1">
        <EmptyHeader>
          <EmptyTitle>{{ search ? $t('knowledgeBase.text_8fdcd3570d58') : $t('knowledgeBase.text_fc09b747f172') }}</EmptyTitle>
          <EmptyDescription>
            {{ search ? $t('knowledgeBase.text_399ecfdfa91c') : canWrite ? $t('knowledgeBase.text_570392b1346d') : $t('knowledgeBase.text_6119a96b4bdf') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
      <div v-else class="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        <section class="space-y-2" :aria-label="$t('knowledgeBase.text_4f85be607657')">
          <h4 class="text-sm font-semibold">{{ $t('knowledgeBase.text_816a1e3743da') }}{{ filteredOutgoing.length }}）</h4>
          <FieldReferencePanel
            ref="outgoingPanel"
            :busy-i-d="fieldBusyId"
            :can-write="canWrite"
            :document-i-d="detail.document.id"
            :filterable="false"
            :has-more="fieldHasMore"
            :references="filteredOutgoing"
            :empty-text="$t('knowledgeBase.text_4eca5d3572e2')"
            @confirm="confirmFieldReference($event)"
            @edit="openEditFieldReference($event)"
            @mark-reviewed="markFieldReferenceReviewed($event)"
            @reject="rejectFieldReference($event)"
            @remove="removeFieldReference($event)"
            @review="openReviewFieldReference($event)"
          />
        </section>
        <section ref="incomingSection" class="space-y-2" :aria-label="$t('knowledgeBase.text_21eb0b3f171f')" tabindex="-1">
          <h4 class="text-sm font-semibold">
            {{ $t('knowledgeBase.text_0cb97f9225fb') }}{{ filteredIncoming.length }}）
            <span v-if="fieldGroups.incoming.some((item) => item.reviewStatus === 'pending_review')" class="text-destructive">{{
              $t('knowledgeBase.text_840a44abb3de')
            }}</span>
          </h4>
          <FieldReferencePanel
            ref="incomingPanel"
            :busy-i-d="fieldBusyId"
            :can-write="canWrite"
            :document-i-d="detail.document.id"
            :filterable="false"
            :has-more="fieldHasMore"
            :references="filteredIncoming"
            :empty-text="$t('knowledgeBase.text_c441ae4d4941')"
            @confirm="confirmFieldReference($event)"
            @edit="openEditFieldReference($event)"
            @mark-reviewed="markFieldReferenceReviewed($event)"
            @reject="rejectFieldReference($event)"
            @remove="removeFieldReference($event)"
            @review="openReviewFieldReference($event)"
          />
        </section>
      </div>
    </div>

    <FieldReferenceForm
      v-model:open="fieldFormOpen"
      :allow-mark-reviewed="fieldFormState?.mode === 'update' && fieldFormState.side === 'to'"
      :anchor="fieldFormState?.anchor ?? null"
      :can-write="canWrite"
      :knowledge-i-d="detail.document.knowledgeID"
      :mode="fieldFormState?.mode ?? 'update'"
      :reference="fieldFormState?.reference ?? null"
      :side="fieldFormState?.side ?? 'to'"
      :submitting="fieldSubmitting"
      @mark-reviewed="markFieldReviewedFromForm"
      @submit="submitFieldForm"
    />
  </section>
</template>
