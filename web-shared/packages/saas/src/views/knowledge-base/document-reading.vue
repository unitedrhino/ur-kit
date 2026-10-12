<!-- 文件说明：将现有解析产物汇为纵向阅读页，保持源内容、AI 整理和版本证据边界。 -->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '../../locales';
import type { KnowledgeArtifact, KnowledgeDetail, KnowledgeFieldReference, KnowledgeSourceReference } from './data';
import type { KnowledgeFieldReferenceAnchor, KnowledgeFieldReferenceSubmitPayload } from './field-reference';

import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { ArrowUpRight, ChevronDown, ExternalLink } from 'lucide-vue-next';

import { useToast } from '../../hooks/use-toast';
import { buildCitationLocateQuery } from './citation-locate';
import SourceEvidenceContent from './components/source-evidence-content.vue';
import { artifactLocator, referenceEditableSide } from './field-reference';
import FieldReferenceForm from './field-reference-form.vue';
import FieldReferencePanel from './field-reference-panel.vue';
import { Api } from './index.api';
import ParsedContent from './parsed-content.vue';
import { processingStatusLabel, sourceEvidence, stageNeedsNotice } from './processing';
import ProcessingNotice from './processing-notice.vue';
import { getErrorMessage } from './workbench';

/** text 仅为源文件解析正文；sourceURL 是现有鉴权预览地址，不把 AI 描述混入原文。 */
const props = defineProps<{
  canWrite?: boolean;
  detail: KnowledgeDetail;
  error?: string;
  /** 引用定位高亮区间（解析全文码点下标，闭开）；透传给解析正文渲染。 */
  highlight?: { charEnd: number; charStart: number };
  loading?: boolean;
  sourceURL?: string;
  text: string;
}>();
/** retry 重新读取全文；advanced 查看详细状态；changed 让父级同步引用失效统计。均不触发生成。 */
const emit = defineEmits<{ advanced: []; changed: []; retry: [] }>();
const { toast } = useToast();
const router = useRouter();

/** evidenceContent 取当前文档与版本的切片正文；跨文档或历史版本返回 undefined，由调用方降级展示。 */
function evidenceContent(source: KnowledgeSourceReference) {
  return sourceEvidence(props.detail, source)?.content;
}

/** jumpToSource 把来源依据切片送回原文定位：写入 URL 定位参数后由工作台定位链路消费——
 * 文本文档切解析阅读按区间高亮滚动，PDF 留原文件视图交 pdf-locate-viewer；区间缺失退化为仅页码。 */
function jumpToSource(source: KnowledgeSourceReference) {
  const locate = buildCitationLocateQuery({
    charStart: source.charStart,
    charEnd: source.charEnd,
    pageIdx: source.pageIdx,
    content: evidenceContent(source),
  });
  const query = new URLSearchParams({ doc: String(source.documentID) });
  if (locate.cs !== undefined) query.set('cs', String(locate.cs));
  if (locate.ce !== undefined) query.set('ce', String(locate.ce));
  if (locate.pi !== undefined) query.set('pi', String(locate.pi));
  if (locate.q) query.set('q', locate.q);
  void router.push({ query: Object.fromEntries(query) });
}

/** 概要只在主动操作后展开，切换文档由父级 key 重置。 */
const summaryExpanded = ref(false);
const conceptsExpanded = ref(false);
const root = ref<HTMLElement>();
const isImage = computed(() =>
  /\.(?:png|jpe?g|gif|webp|bmp|svg|tiff?|avif|ico|heic|heif|jxl)$/i.test(props.detail.document.path || props.detail.document.name),
);
const media = computed(() => props.detail.multimodalArtifacts ?? []);
const concepts = computed(() => props.detail.concepts ?? []);
const articles = computed(() => props.detail.articles ?? []);
/** 独立图片无 OCR 时由媒体章节独占描述；未提取产物时仍可核对原图。 */
const imageOnly = computed(() => isImage.value && !props.text.trim());
const overviewVisible = computed(() => !!props.detail.summary?.content || concepts.value.length > 0 || stageNeedsNotice(props.detail, 'analysis'));
const mediaVisible = computed(() => imageOnly.value || media.value.length > 0 || stageNeedsNotice(props.detail, 'multimodal'));
/** 当前真实存在的阅读章节，供工具栏菜单复用，不创建空导航项。 */
const sections = computed(() => [
  ...(overviewVisible.value ? [{ id: 'overview', label: $t('knowledgeBase.text_36d6e8122e9d') }] : []),
  ...(!imageOnly.value || props.error || props.loading ? [{ id: 'body', label: $t('knowledgeBase.text_98e3c3818ca7') }] : []),
  ...(mediaVisible.value ? [{ id: 'media', label: $t('knowledgeBase.text_ad55fb79114c') }] : []),
  ...(articles.value.length > 0 ? [{ id: 'articles', label: $t('knowledgeBase.text_bb7101cd2eb5') }] : []),
]);
/** jump 将焦点交给目标章节；不用滚动整页或打开其他面板。 */
function jump(id: string) {
  const section = root.value?.querySelector<HTMLElement>(`[data-section="${id}"]`);
  section?.scrollIntoView({ block: 'start', behavior: 'instant' });
  section?.focus({ preventScroll: true });
}
/** historical 区分缺少版本的老产物与明确不匹配的历史版本。 */
function historical(item: KnowledgeArtifact) {
  return item.sourceVersion
    ? item.sourceVersion === props.detail.sourceVersion
      ? ''
      : $t('knowledgeBase.text_7c6e6e3c3f30')
    : $t('knowledgeBase.text_0b40ad441fd1');
}

/** 字段级引用按条目懒加载：仅展开或发起操作时查询，浏览不触发请求。 */
const refsArtifactID = ref<null | number>(null);
const artifactReferences = ref<KnowledgeFieldReference[]>([]);
const referencesLoading = ref(false);
const referencesError = ref('');
const referencesHasMore = ref(false);
const referencesDirection = ref<'all' | 'incoming' | 'outgoing'>('all');
const referencesBusyId = ref(0);
let referencesRequest = 0;
const referenceFormOpen = ref(false);
const referenceFormState = ref<null | {
  anchor: KnowledgeFieldReferenceAnchor | null;
  mode: 'create' | 'update';
  reference: KnowledgeFieldReference | null;
  side: 'from' | 'to';
}>(null);
const referenceSubmitting = ref(false);
/** 表单关闭后焦点回到触发按钮；条目级默认回到「引用」展开按钮。 */
let referenceFormTrigger: HTMLElement | null = null;

/** supportsReferences 仅表格与公式条目提供引用入口，与后端定位 kind 的能力范围一致。 */
function supportsReferences(item: KnowledgeArtifact) {
  return item.artifactType === 'equation' || item.artifactType === 'table';
}

const referencesArtifact = computed(() => media.value.find((item) => item.id === refsArtifactID.value));
/** inboundCount 统计「谁引用了我」：对端定位落在当前条目上的引用数，列表加载后可用。 */
const inboundCount = computed(() => {
  const artifactID = refsArtifactID.value;
  if (!artifactID) return 0;
  return artifactReferences.value.filter((item) => item.to?.artifactID === artifactID && item.to?.documentID === props.detail.document.id).length;
});

/** loadArtifactReferences 按条目查询引用（artifactID 匹配任一侧），过期响应直接丢弃。 */
async function loadArtifactReferences(artifact: KnowledgeArtifact) {
  const knowledgeID = props.detail.document.knowledgeID;
  if (!knowledgeID) return;
  const current = ++referencesRequest;
  referencesLoading.value = true;
  referencesError.value = '';
  try {
    const result = await Api.getFieldReferences({ artifactID: artifact.id, knowledgeID, size: 300 });
    if (current !== referencesRequest) return;
    artifactReferences.value = result.references ?? [];
    referencesHasMore.value = result.hasMore ?? false;
  } catch {
    if (current === referencesRequest) referencesError.value = $t('knowledgeBase.text_49a556308315');
  } finally {
    if (current === referencesRequest) referencesLoading.value = false;
  }
}

/** toggleReferences 展开或收起条目引用块；首次展开才发起查询。 */
function toggleReferences(artifact: KnowledgeArtifact, event: Event) {
  referenceFormTrigger = event.currentTarget as HTMLElement;
  if (refsArtifactID.value === artifact.id) {
    refsArtifactID.value = null;
    referencesDirection.value = 'all';
    return;
  }
  refsArtifactID.value = artifact.id;
  referencesDirection.value = 'all';
  artifactReferences.value = [];
  referencesHasMore.value = false;
  referencesError.value = '';
  void loadArtifactReferences(artifact);
}

/** showInboundReferences 打开「谁引用了我」视图，只看引用本文的位置。 */
function showInboundReferences(artifact: KnowledgeArtifact, event: Event) {
  if (refsArtifactID.value !== artifact.id) toggleReferences(artifact, event);
  referencesDirection.value = 'incoming';
}

/** runReferenceMutation 统一执行确认/拒绝/复核/删除，成功后刷新列表并同步父级统计。 */
async function runReferenceMutation(artifact: KnowledgeArtifact, referenceID: number, action: () => Promise<unknown>, successTitle: string) {
  if (referencesBusyId.value) return;
  referencesBusyId.value = referenceID;
  try {
    await action();
    toast({ title: successTitle, type: 'success' });
    await loadArtifactReferences(artifact);
    emit('changed');
  } catch (error) {
    notifyRequestError(error, () => getErrorMessage(error, $t('knowledgeBase.text_51d3cb57e67e')), (text) => toast({ type: 'error', title: text }));
  } finally {
    referencesBusyId.value = 0;
  }
}

function confirmReference(artifact: KnowledgeArtifact, reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runReferenceMutation(artifact, reference.id, () => Api.reviewFieldReference(reference.id!, 'confirm'), $t('knowledgeBase.text_ea9d163144cd'));
}
function rejectReference(artifact: KnowledgeArtifact, reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runReferenceMutation(artifact, reference.id, () => Api.reviewFieldReference(reference.id!, 'reject'), $t('knowledgeBase.text_1590868f1692'));
}
function markReferenceReviewed(artifact: KnowledgeArtifact, reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runReferenceMutation(artifact, reference.id, () => Api.reviewFieldReference(reference.id!, 'markReviewed'), $t('knowledgeBase.text_07ca7a5eaf74'));
}
function removeReference(artifact: KnowledgeArtifact, reference: KnowledgeFieldReference) {
  if (!reference.id) return;
  void runReferenceMutation(artifact, reference.id, () => Api.deleteFieldReference(reference.id!), $t('knowledgeBase.text_dac3de635cfd'));
}

/** openCreateReferenceForm 以当前条目为引用方发起新引用，定位从解析产物预填。 */
function openCreateReferenceForm(artifact: KnowledgeArtifact, event: Event) {
  referenceFormTrigger = (event.currentTarget as HTMLElement) || referenceFormTrigger;
  referenceFormState.value = {
    anchor: { artifactID: artifact.id, documentID: props.detail.document.id, locator: artifactLocator(artifact) },
    mode: 'create',
    reference: null,
    side: 'from',
  };
  referenceFormOpen.value = true;
}

/** openEditReferenceForm 编辑属于本文的一侧，避免触碰对端文档的快照。 */
function openEditReferenceForm(reference: KnowledgeFieldReference) {
  referenceFormTrigger = (document.activeElement as HTMLElement | null) ?? referenceFormTrigger;
  const side = referenceEditableSide(reference, props.detail.document.id);
  referenceFormState.value = { anchor: reference[side] ?? null, mode: 'update', reference, side };
  referenceFormOpen.value = true;
}

/** openReviewReferenceForm 重新指定：自动重锚定失败后重挂 to 侧到新位置。 */
function openReviewReferenceForm(reference: KnowledgeFieldReference) {
  referenceFormTrigger = (document.activeElement as HTMLElement | null) ?? referenceFormTrigger;
  referenceFormState.value = { anchor: reference.to ?? null, mode: 'update', reference, side: 'to' };
  referenceFormOpen.value = true;
}

/** submitReferenceForm 提交新增或单侧更新，成功后关闭表单并刷新当前条目。 */
async function submitReferenceForm(payload: KnowledgeFieldReferenceSubmitPayload) {
  if (referenceSubmitting.value) return;
  referenceSubmitting.value = true;
  try {
    if (payload.kind === 'create') await Api.createFieldReference({ knowledgeID: props.detail.document.knowledgeID, ...payload.data });
    else await Api.updateFieldReference(payload.data);
    toast({ title: payload.kind === 'create' ? $t('knowledgeBase.text_82685d5cf463') : $t('knowledgeBase.text_7fe47451c992'), type: 'success' });
    referenceFormOpen.value = false;
    if (referencesArtifact.value) await loadArtifactReferences(referencesArtifact.value);
    emit('changed');
  } catch (error) {
    notifyRequestError(error, () => getErrorMessage(error, $t('knowledgeBase.text_18b4e26f241c')), (text) => toast({ type: 'error', title: text }));
  } finally {
    referenceSubmitting.value = false;
  }
}

/** markReferenceReviewedFromForm 处理重挂表单里的「标记无影响」快捷动作。 */
async function markReferenceReviewedFromForm(reference: KnowledgeFieldReference) {
  if (!reference.id || referenceSubmitting.value) return;
  referenceSubmitting.value = true;
  try {
    await Api.reviewFieldReference(reference.id, 'markReviewed');
    toast({ title: $t('knowledgeBase.text_07ca7a5eaf74'), type: 'success' });
    referenceFormOpen.value = false;
    if (referencesArtifact.value) await loadArtifactReferences(referencesArtifact.value);
    emit('changed');
  } catch (error) {
    notifyRequestError(error, () => getErrorMessage(error, $t('knowledgeBase.text_51d3cb57e67e')), (text) => toast({ type: 'error', title: text }));
  } finally {
    referenceSubmitting.value = false;
  }
}

/** 表单关闭后把焦点还给触发按钮，保持键盘动线。 */
watch(referenceFormOpen, (open) => {
  if (open) return;
  const trigger = referenceFormTrigger;
  referenceFormTrigger = null;
  void nextTick(() => trigger?.focus({ preventScroll: true }));
});

defineExpose({ sections, jump });
</script>
<template>
  <div ref="root" class="bg-background h-full overflow-y-auto overflow-x-hidden" :aria-label="$t('knowledgeBase.text_aaf049401cbb')">
    <div class="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      <section
        v-if="overviewVisible"
        data-section="overview"
        tabindex="-1"
        class="focus-visible:ring-ring scroll-mt-4 space-y-4 focus-visible:outline-none focus-visible:ring-2"
      >
        <h3 class="text-base font-semibold">
          {{ $t('knowledgeBase.text_36d6e8122e9d') }} <Badge variant="secondary" class="ml-2">{{ $t('knowledgeBase.text_4af3f859ed29') }}</Badge>
        </h3>
        <ProcessingNotice :detail="detail" stage="analysis" @details="emit('advanced')" />
        <template v-if="detail.summary?.content">
          <p v-if="historical(detail.summary)" class="text-muted-foreground text-xs">{{ historical(detail.summary) }}</p>
          <p class="whitespace-pre-wrap break-words text-sm leading-7" :class="{ 'line-clamp-6': !summaryExpanded }">{{ detail.summary.content }}</p>
          <Button variant="ghost" size="sm" :aria-expanded="summaryExpanded" @click="summaryExpanded = !summaryExpanded">
            {{ summaryExpanded ? $t('knowledgeBase.text_15454b033c07') : $t('knowledgeBase.text_d40dd5726228') }}
          </Button>
        </template>
        <div v-if="concepts.length > 0" class="flex flex-wrap items-start gap-2">
          <Badge
            v-for="concept in conceptsExpanded ? concepts : concepts.slice(0, 6)"
            :key="concept.id"
            variant="secondary"
            class="max-w-full whitespace-normal break-words"
            :title="historical(concept)"
          >
            {{ concept.title }}
          </Badge>
          <Button v-if="concepts.length > 6" variant="ghost" size="sm" :aria-expanded="conceptsExpanded" @click="conceptsExpanded = !conceptsExpanded">
            {{ conceptsExpanded ? $t('knowledgeBase.text_7ddaf9ed28a5') : $t('knowledgeBase.text_cd7c1c812508', { arg0: concepts.length }) }}
          </Button>
        </div>
      </section>
      <section
        v-if="!imageOnly || error || loading"
        data-section="body"
        tabindex="-1"
        class="focus-visible:ring-ring scroll-mt-4 space-y-4 focus-visible:outline-none focus-visible:ring-2"
      >
        <h3 class="text-base font-semibold">
          {{ $t('knowledgeBase.text_98e3c3818ca7') }} <Badge variant="outline" class="ml-2">{{ $t('knowledgeBase.text_a01655385de1') }}</Badge>
        </h3>
        <ProcessingNotice :detail="detail" stage="content" @details="emit('advanced')" />
        <ParsedContent :detail="detail" :highlight="highlight" :text="text" :error="error" :loading="loading" @retry="emit('retry')" />
      </section>
      <section
        v-if="mediaVisible"
        data-section="media"
        tabindex="-1"
        class="focus-visible:ring-ring scroll-mt-4 space-y-4 focus-visible:outline-none focus-visible:ring-2"
      >
        <h3 class="text-base font-semibold">{{ imageOnly ? $t('knowledgeBase.text_e8a24a39367d') : $t('knowledgeBase.text_ad55fb79114c') }}</h3>
        <ProcessingNotice :detail="detail" stage="multimodal" @details="emit('advanced')" />
        <p v-if="imageOnly" class="text-muted-foreground text-xs leading-6">{{ $t('knowledgeBase.text_8db60c7ffeae') }}</p>
        <img
          v-if="imageOnly && !media.some((item) => item.mediaURI) && sourceURL"
          :src="sourceURL"
          :alt="detail.document.name"
          class="bg-muted/20 max-h-96 w-full rounded-md object-contain"
        />
        <article v-for="artifact in media" :key="artifact.id" class="space-y-3 border-b pb-6 last:border-0">
          <div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <h4 class="min-w-0 flex-1 break-words text-sm font-medium">{{ artifact.caption || artifact.title || artifact.artifactType }}</h4>
            <Button
              v-if="supportsReferences(artifact)"
              variant="outline"
              size="sm"
              class="kb-control h-7 shrink-0"
              :aria-expanded="refsArtifactID === artifact.id"
              :aria-controls="`artifact-references-${artifact.id}`"
              :aria-label="$t('knowledgeBase.text_928c127594a7', { arg0: artifact.caption || artifact.title || artifact.artifactType })"
              @click="toggleReferences(artifact, $event)"
            >
              {{ $t('knowledgeBase.text_23c0e102a0ae') }}
              <Badge v-if="refsArtifactID === artifact.id && !referencesLoading" variant="secondary" class="px-1.5">
                {{ artifactReferences.length }}
              </Badge>
              <ChevronDown class="size-3.5 transition-transform" :class="refsArtifactID === artifact.id ? 'rotate-180' : ''" aria-hidden="true" />
            </Button>
          </div>
          <p v-if="historical(artifact)" class="text-muted-foreground text-xs">{{ historical(artifact) }}</p>
          <img
            v-if="artifact.mediaURI && (artifact.mimeType?.startsWith('image/') || artifact.artifactType === 'image')"
            :src="artifact.mediaURI"
            :alt="artifact.caption || $t('knowledgeBase.text_dfc4df237092')"
            class="bg-muted/20 max-h-96 w-full rounded-md object-contain"
          />
          <p v-else-if="artifact.artifactType === 'image' && !imageOnly" class="text-muted-foreground text-sm">{{ $t('knowledgeBase.text_1f6e1b8f27d6') }}</p>
          <div v-if="artifact.content" class="space-y-2">
            <Badge variant="outline">{{ $t('knowledgeBase.text_a01655385de1') }}</Badge>
            <pre class="overflow-auto whitespace-pre-wrap break-words text-sm leading-6">{{ artifact.content }}</pre>
          </div>
          <div class="bg-muted/20 space-y-2 rounded-md p-4">
            <div class="flex flex-wrap gap-2 text-sm font-medium">
              {{ $t('knowledgeBase.text_1790bb27c53f') }} <Badge variant="outline">{{ processingStatusLabel(artifact.descriptionStatus) }}</Badge>
            </div>
            <p class="whitespace-pre-wrap break-words text-sm leading-7">{{ artifact.description || $t('knowledgeBase.text_7c0ccc13e9e0') }}</p>
            <p v-if="artifact.description && artifact.descriptionStatus !== 'success'" class="text-muted-foreground text-xs">
              {{ $t('knowledgeBase.text_93d2f26f1bcd') }}
            </p>
          </div>
          <div
            v-if="refsArtifactID === artifact.id"
            :id="`artifact-references-${artifact.id}`"
            class="space-y-3 border-t pt-3"
            :aria-label="$t('knowledgeBase.text_bcfb2acf61a9')"
          >
            <FieldReferencePanel
              v-model:direction="referencesDirection"
              :busy-i-d="referencesBusyId"
              :can-write="canWrite"
              :document-i-d="detail.document.id"
              :error="referencesError"
              :filterable="true"
              :has-more="referencesHasMore"
              :loading="referencesLoading"
              :references="artifactReferences"
              :empty-text="$t('knowledgeBase.text_593d2646a92a')"
              @confirm="confirmReference(artifact, $event)"
              @edit="openEditReferenceForm($event)"
              @mark-reviewed="markReferenceReviewed(artifact, $event)"
              @reject="rejectReference(artifact, $event)"
              @remove="removeReference(artifact, $event)"
              @retry="loadArtifactReferences(artifact)"
              @review="openReviewReferenceForm($event)"
            />
            <div class="flex flex-wrap items-center gap-2">
              <Button v-if="canWrite" variant="outline" size="sm" class="kb-control" @click="openCreateReferenceForm(artifact, $event)">
                <ExternalLink class="size-3.5" aria-hidden="true" /> {{ $t('knowledgeBase.text_ea571f53750f') }}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="kb-control"
                :aria-pressed="referencesDirection === 'incoming'"
                @click="showInboundReferences(artifact, $event)"
              >
                {{ $t('knowledgeBase.text_aabfb6046e9e') }}{{ inboundCount > 0 ? `（${inboundCount}）` : '' }}
              </Button>
            </div>
          </div>
        </article>
        <p v-if="imageOnly && media.length === 0" class="text-muted-foreground text-sm">{{ $t('knowledgeBase.text_7c0ccc13e9e0') }}</p>
      </section>
      <section
        v-if="articles.length > 0"
        data-section="articles"
        tabindex="-1"
        class="focus-visible:ring-ring scroll-mt-4 space-y-4 focus-visible:outline-none focus-visible:ring-2"
      >
        <h3 class="text-base font-semibold">
          {{ $t('knowledgeBase.text_bb7101cd2eb5') }} <Badge variant="secondary" class="ml-2">{{ $t('knowledgeBase.text_988efd873540') }}</Badge>
        </h3>
        <details v-for="article in articles" :key="article.id" class="border-b pb-4">
          <summary class="focus-visible:ring-ring cursor-pointer break-words text-sm font-medium leading-7 focus-visible:ring-2">
            {{ article.title || $t('knowledgeBase.text_6e58f0c8dc2a') }}
          </summary>
          <p v-if="historical(article)" class="text-muted-foreground mt-3 text-xs">{{ historical(article) }}</p>
          <p class="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{{ article.content }}</p>
          <details class="bg-muted/20 mt-4 rounded-md p-4 text-sm">
            <summary class="focus-visible:ring-ring cursor-pointer focus-visible:ring-2">
              {{ $t('knowledgeBase.text_69ff18109ed8') }}{{ article.sources?.length || 0 }}）
            </summary>
            <p class="text-muted-foreground mt-3 text-xs">{{ $t('knowledgeBase.text_d31acb81870e') }}</p>
            <p v-if="!article.sources?.length" class="text-muted-foreground mt-3">{{ $t('knowledgeBase.text_de553a3996c2') }}</p>
            <div v-for="source in article.sources" :key="`${source.documentID}:${source.artifactID}`" class="mt-4 space-y-2 border-t pt-3">
              <button
                type="button"
                class="text-primary focus-visible:ring-ring inline-flex max-w-full items-center gap-1 break-words rounded-sm text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2"
                :aria-label="$t('knowledgeBase.sourceJumpAriaLabel', {
                  target: source.headingPath || detail.document.name,
                  page: (source.pageIdx ?? 0) + 1,
                })"
                @click="jumpToSource(source)"
              >
                {{ source.headingPath || detail.document.name }} {{ $t('knowledgeBase.text_39a26997f3e2') }} {{ (source.pageIdx ?? 0) + 1 }}
                {{ $t('knowledgeBase.text_73422182ab45') }}
                <ArrowUpRight class="size-3.5 shrink-0" aria-hidden="true" />
              </button>
              <SourceEvidenceContent v-if="evidenceContent(source)" :content="evidenceContent(source) || ''" />
              <p v-else class="text-muted-foreground whitespace-pre-wrap break-words leading-7">{{ $t('knowledgeBase.text_f38ee94dc20f') }}</p>
            </div>
          </details>
        </details>
      </section>
      <Empty v-if="sections.length === 0">
        <EmptyHeader>
          <EmptyTitle>{{ $t('knowledgeBase.text_c794fbf6b3b7') }}</EmptyTitle>
          <EmptyDescription>{{ $t('knowledgeBase.text_423b950ac256') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <FieldReferenceForm
      v-model:open="referenceFormOpen"
      :allow-mark-reviewed="referenceFormState?.mode === 'update' && referenceFormState.side === 'to'"
      :anchor="referenceFormState?.anchor ?? null"
      :can-write="canWrite"
      :knowledge-i-d="detail.document.knowledgeID"
      :mode="referenceFormState?.mode ?? 'create'"
      :reference="referenceFormState?.reference ?? null"
      :side="referenceFormState?.side ?? 'from'"
      :submitting="referenceSubmitting"
      @mark-reviewed="markReferenceReviewedFromForm"
      @submit="submitReferenceForm"
    />
  </div>
</template>
