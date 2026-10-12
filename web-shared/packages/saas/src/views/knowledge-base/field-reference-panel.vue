<!-- 文件说明：字段级引用行渲染与操作面板，解析阅读条目级与文档关联文档级共用；只负责展示与动作上报，数据获取与提交由宿主视图完成。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeFieldReference } from './data';

import { computed, nextTick, ref } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { ChevronDown } from 'lucide-vue-next';

import {
  fieldReferenceReviewLabel,
  fieldReferenceReviewVariant,
  fieldReferenceSourceLabel,
  fieldReferenceStatusLabel,
  fieldReferenceStatusVariant,
} from './data';
import { fieldLocatorSummary, referenceParamNames } from './field-reference';

/** 引用列表及宿主上下文；direction 仅在 filterable 时参与受控过滤。 */
const props = withDefaults(
  defineProps<{
    /** 可写权限：只读用户可见引用与失效标记，无确认/编辑/删除按钮。 */
    canWrite?: boolean;
    /** 正在执行动作的引用 id，该行按钮进入禁用态。 */
    busyID?: number;
    documentID: number;
    /** 宿主加载失败文案；非空时展示错误与重试。 */
    error?: string;
    /** 达到返回上限时提示部分结果。 */
    hasMore?: boolean;
    /** 受控方向过滤：all 查看全部，incoming 只看引用本文的记录。 */
    direction?: 'incoming' | 'outgoing' | 'all';
    /** 是否展示方向过滤切换（条目级视图用；文档关联视图已分组，无需切换）。 */
    filterable?: boolean;
    emptyText?: string;
    loading?: boolean;
    references: KnowledgeFieldReference[];
  }>(),
  {
    busyID: 0,
    canWrite: false,
    direction: 'all',
    emptyText: $t('knowledgeBase.text_fc09b747f172'),
    error: '',
    filterable: false,
    hasMore: false,
    loading: false,
  },
);

/** 动作均上报宿主执行；宿主负责调用接口、刷新列表并同步失效统计。 */
const emit = defineEmits<{
  confirm: [reference: KnowledgeFieldReference];
  edit: [reference: KnowledgeFieldReference];
  markReviewed: [reference: KnowledgeFieldReference];
  reject: [reference: KnowledgeFieldReference];
  remove: [reference: KnowledgeFieldReference];
  retry: [];
  review: [reference: KnowledgeFieldReference];
  'update:direction': [direction: 'incoming' | 'outgoing' | 'all'];
}>();

/** 面板实例标识：展开区块与行按钮的 DOM id 需要成对且页面唯一。 */
const uid = Math.random().toString(36).slice(2, 8);
const root = ref<HTMLElement>();
/** 同一时刻只展开一条，保持阅读动线；切换文档由宿主 key 重置。 */
const expandedID = ref<number | null>(null);

const directions = computed(() => ({
  incoming: props.references.filter((reference) => reference.to?.documentID === props.documentID).length,
  outgoing: props.references.filter((reference) => reference.from?.documentID === props.documentID).length,
}));
const visibleReferences = computed(() => {
  if (!props.filterable || props.direction === 'all') return props.references;
  return props.references.filter((reference) =>
    props.direction === 'incoming' ? reference.to?.documentID === props.documentID : reference.from?.documentID === props.documentID,
  );
});

/** directionLine 输出相对当前文档的方向短语，帮助区分「我引用别人」与「别人引用我」。 */
function directionLine(reference: KnowledgeFieldReference): string {
  if (reference.from?.documentID === props.documentID && reference.to?.documentID !== props.documentID) {
    return $t('knowledgeBase.text_aff176f2df6d', { arg0: reference.toDocumentName || $t('knowledgeBase.text_1dc374c12036') });
  }
  if (reference.to?.documentID === props.documentID && reference.from?.documentID !== props.documentID) {
    return $t('knowledgeBase.text_11e1a8e3c172', { arg0: reference.fromDocumentName || $t('knowledgeBase.text_1dc374c12036') });
  }
  return $t('knowledgeBase.text_a19d1b388637');
}

/** otherLocator 取对端定位摘要：当前文档在 from 侧时展示 to 侧，反之展示 from 侧。 */
function otherLocator(reference: KnowledgeFieldReference): string {
  const locator = reference.from?.documentID === props.documentID ? reference.to?.locator : reference.from?.locator;
  return fieldLocatorSummary(locator);
}

/** toggle 展开或收起一条引用的双侧证据。 */
function toggle(reference: KnowledgeFieldReference) {
  expandedID.value = expandedID.value === reference.id ? null : (reference.id ?? null);
}

/** evidenceID 返回展开区块的 DOM id，供 aria-controls 关联。 */
function evidenceID(reference: KnowledgeFieldReference): string {
  return `field-ref-evidence-${uid}-${reference.id}`;
}

/** 定位侧快照的字段行，空字段不展示。 */
function locatorRows(reference: KnowledgeFieldReference, side: 'from' | 'to'): Array<{ label: string; value: string }> {
  const endpoint = side === 'from' ? reference.from : reference.to;
  const locator = endpoint?.locator;
  if (!locator) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, value?: string | number) => {
    if (value !== undefined && value !== null && String(value).trim()) rows.push({ label, value: String(value) });
  };
  push($t('knowledgeBase.text_e4e46c7235d1'), locator.kind);
  push('Sheet', locator.sheet);
  push($t('knowledgeBase.text_56e82238101c'), locator.cell);
  push($t('knowledgeBase.text_3f27035af46b'), locator.formula);
  push('LaTeX', locator.latex);
  push($t('knowledgeBase.text_e616408aa69f'), locator.headingPath);
  if (typeof locator.pageIdx === 'number' && locator.pageIdx >= 0) push($t('knowledgeBase.text_7b0930e205bc'), locator.pageIdx + 1);
  if (typeof locator.charStart === 'number' && typeof locator.charEnd === 'number')
    push($t('knowledgeBase.text_f86624ba2404'), `${locator.charStart} - ${locator.charEnd}`);
  push($t('knowledgeBase.text_749d76524267'), (locator.paramNames ?? []).join('、'));
  push($t('knowledgeBase.text_9bdf420c088b'), locator.app);
  push($t('knowledgeBase.text_dc110cf5a086'), locator.refType);
  push($t('knowledgeBase.text_fe6e6b2d13c2'), locator.paramKey);
  push($t('knowledgeBase.text_8b0db6787147'), locator.currentValue);
  push($t('knowledgeBase.text_2394e390c8c1'), endpoint?.sourceVersion);
  return rows;
}

/** revealPending 展开第一条失效引用并滚动聚焦，供「查看失效」入口定位。 */
async function revealPending(): Promise<void> {
  const pending = visibleReferences.value.find((reference) => reference.reviewStatus === 'pending_review');
  if (!pending) return;
  expandedID.value = pending.id ?? null;
  await nextTick();
  const row = root.value?.querySelector<HTMLElement>(`[data-ref-row="${pending.id}"]`);
  row?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  row?.focus({ preventScroll: true });
}

defineExpose({ revealPending });
</script>

<template>
  <div ref="root" class="min-w-0 space-y-2" :aria-label="$t('knowledgeBase.text_05a93abf3a41')">
    <div
      v-if="filterable && directions.outgoing > 0 && directions.incoming > 0"
      class="flex flex-wrap items-center gap-1"
      role="group"
      :aria-label="$t('knowledgeBase.text_ece59932ab14')"
    >
      <Button
        v-for="option in [
          { label: $t('knowledgeBase.text_73a2643fab60', { arg0: references.length }), value: 'all' },
          { label: $t('knowledgeBase.text_0f7139540ae2', { arg0: directions.outgoing }), value: 'outgoing' },
          { label: $t('knowledgeBase.text_c0d9611a6946', { arg0: directions.incoming }), value: 'incoming' },
        ]"
        :key="option.value"
        size="sm"
        :variant="direction === option.value ? 'secondary' : 'ghost'"
        class="h-7"
        :aria-pressed="direction === option.value"
        @click="emit('update:direction', option.value as 'incoming' | 'outgoing' | 'all')"
      >
        {{ option.label }}
      </Button>
    </div>

    <div v-if="loading" role="status" class="text-muted-foreground py-2 text-sm">{{ $t('knowledgeBase.text_36992c5d06a6') }}</div>
    <div v-else-if="error" role="alert" class="text-destructive border-destructive/40 space-y-2 rounded-md border p-3 text-sm">
      <p>{{ error }}</p>
      <Button variant="outline" size="sm" @click="emit('retry')">{{ $t('knowledgeBase.text_5982c44c18df') }}</Button>
    </div>
    <Empty v-else-if="visibleReferences.length === 0">
      <EmptyHeader>
        <EmptyTitle>{{ emptyText }}</EmptyTitle>
        <EmptyDescription v-if="canWrite">{{ $t('knowledgeBase.text_458558a169f7') }}</EmptyDescription>
        <EmptyDescription v-else>{{ $t('knowledgeBase.text_6119a96b4bdf') }}</EmptyDescription>
      </EmptyHeader>
    </Empty>
    <template v-else>
      <p v-if="hasMore" role="status" class="text-muted-foreground text-xs">{{ $t('knowledgeBase.text_07bca2f23578') }}</p>
      <ul class="space-y-2">
        <li
          v-for="reference in visibleReferences"
          :key="reference.id"
          class="rounded-md border"
          :class="reference.reviewStatus === 'pending_review' ? 'border-destructive/40 bg-destructive/5' : ''"
        >
          <div class="flex items-start gap-1">
            <button
              type="button"
              class="focus-visible:ring-ring min-w-0 flex-1 cursor-pointer p-3 text-left focus-visible:outline-none focus-visible:ring-2"
              :aria-expanded="expandedID === reference.id"
              :aria-controls="evidenceID(reference)"
              :aria-label="$t('knowledgeBase.text_16d10252b848', { arg0: directionLine(reference) })"
              :data-ref-row="reference.id"
              @click="toggle(reference)"
            >
              <span class="flex flex-wrap items-center gap-1.5">
                <Badge :variant="fieldReferenceStatusVariant(reference.status)">{{ fieldReferenceStatusLabel(reference.status) }}</Badge>
                <Badge v-if="reference.reviewStatus === 'pending_review'" :variant="fieldReferenceReviewVariant(reference.reviewStatus)">
                  ⚠ {{ fieldReferenceReviewLabel(reference.reviewStatus) }}
                </Badge>
                <Badge variant="outline">{{ fieldReferenceSourceLabel(reference.source) }}</Badge>
              </span>
              <span class="mt-1.5 block break-words text-sm font-medium">{{ directionLine(reference) }}</span>
              <span class="text-muted-foreground mt-0.5 block break-words text-xs">
                <template v-if="referenceParamNames(reference).length"
                  >{{ $t('knowledgeBase.referenceParameters', { names: referenceParamNames(reference).join('、') }) }} ·
                </template>
                {{ otherLocator(reference) || $t('knowledgeBase.text_1d81c56eb01a') }}
              </span>
            </button>
            <ChevronDown
              class="text-muted-foreground mr-2 mt-4 size-4 shrink-0 transition-transform"
              :class="expandedID === reference.id ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </div>
          <div v-show="expandedID === reference.id" :id="evidenceID(reference)" class="text-muted-foreground space-y-3 border-t px-3 py-3 text-xs">
            <p v-if="reference.evidence" class="text-foreground whitespace-pre-wrap break-words leading-6">
              {{ $t('knowledgeBase.text_01cb320795db') }}{{ reference.evidence }}
            </p>
            <p class="text-xs">{{ $t('knowledgeBase.text_0c81377b3485') }} {{ (reference.score ?? 0).toFixed(2) }}</p>
            <article>
              <h6 class="text-foreground break-words text-sm font-medium">
                {{ $t('knowledgeBase.text_97fe9a80d871') }} {{ reference.fromDocumentName || $t('knowledgeBase.text_1dc374c12036') }}
              </h6>
              <p class="mt-0.5 break-words">
                {{ $t('knowledgeBase.text_a1ff9b854e1c') }}{{ fieldLocatorSummary(reference.from?.locator) || $t('knowledgeBase.text_f1b46a8c5d6c') }}
              </p>
              <dl v-if="locatorRows(reference, 'from').length" class="mt-1 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                <div v-for="row in locatorRows(reference, 'from')" :key="row.label" class="contents">
                  <dt class="sr-only">{{ row.label }}</dt>
                  <dd class="break-all">{{ row.label }}：{{ row.value }}</dd>
                </div>
              </dl>
            </article>
            <article class="border-t pt-2">
              <h6 class="text-foreground break-words text-sm font-medium">
                {{ $t('knowledgeBase.text_9d3039fdb352') }} {{ reference.toDocumentName || $t('knowledgeBase.text_1dc374c12036') }}
              </h6>
              <p class="mt-0.5 break-words">
                {{ $t('knowledgeBase.text_a1ff9b854e1c') }}{{ fieldLocatorSummary(reference.to?.locator) || $t('knowledgeBase.text_f1b46a8c5d6c') }}
              </p>
              <dl v-if="locatorRows(reference, 'to').length" class="mt-1 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                <div v-for="row in locatorRows(reference, 'to')" :key="row.label" class="contents">
                  <dt class="sr-only">{{ row.label }}</dt>
                  <dd class="break-all">{{ row.label }}：{{ row.value }}</dd>
                </div>
              </dl>
            </article>
          </div>
          <div v-if="canWrite" class="flex flex-wrap items-center gap-2 border-t px-3 py-2">
            <template v-if="reference.status === 'candidate'">
              <Button size="sm" :disabled="busyID === reference.id" :aria-busy="busyID === reference.id" @click="emit('confirm', reference)">
                {{ $t('knowledgeBase.text_b56d9ac6c5a0') }}
              </Button>
              <Button size="sm" variant="outline" :disabled="busyID === reference.id" :aria-busy="busyID === reference.id" @click="emit('reject', reference)">
                {{ $t('knowledgeBase.text_03e210a66d07') }}
              </Button>
            </template>
            <template v-if="reference.reviewStatus === 'pending_review'">
              <Button
                size="sm"
                :disabled="busyID === reference.id"
                :aria-busy="busyID === reference.id"
                :aria-label="$t('knowledgeBase.text_f2bc9820bbb7', { arg0: directionLine(reference) })"
                @click="emit('review', reference)"
              >
                {{ $t('knowledgeBase.text_c0970e0d52bc') }}
              </Button>
              <Button
                size="sm"
                variant="outline"
                :disabled="busyID === reference.id"
                :aria-busy="busyID === reference.id"
                @click="emit('markReviewed', reference)"
              >
                {{ $t('knowledgeBase.text_4399175f025d') }}
              </Button>
            </template>
            <Button
              size="sm"
              variant="ghost"
              :disabled="busyID === reference.id"
              :aria-label="$t('knowledgeBase.text_dccdadbc8457', { arg0: directionLine(reference) })"
              @click="emit('edit', reference)"
            >
              {{ $t('knowledgeBase.text_a7f814c0a40d') }}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              class="text-destructive hover:text-destructive"
              :disabled="busyID === reference.id"
              :aria-busy="busyID === reference.id"
              :aria-label="$t('knowledgeBase.text_af6fe054b053', { arg0: directionLine(reference) })"
              @click="emit('remove', reference)"
            >
              {{ $t('knowledgeBase.text_3755f56f2f83') }}
            </Button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
