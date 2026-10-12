<!-- 文件说明：聊天回答的知识库证据呈现，引用 chip 悬浮弹卡预览切片原文，点击跳转知识库工作台。 -->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import type { KnowledgeCitation } from './api';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@unitedrhino/saas-ui/ui/popover';
import { BookOpen, ExternalLink } from 'lucide-vue-next';

import { buildCitationLocateQuery } from '../../views/knowledge-base/citation-locate';
import { relationTypeLabel } from '../../views/knowledge-base/graph';

interface Props {
  /** 直接命中证据切片，来自知识检索主链路。 */
  citations?: KnowledgeCitation[];
  /** 关联补充证据切片，来自切片关系扩展。 */
  expandedCitations?: KnowledgeCitation[];
}

defineOptions({ name: 'AiEvidenceCitations' });
const props = defineProps<Props>();

/** 弹卡内容摘要上限：切片原文可能很长，弹卡只承担预览，完整内容在工作台查看。 */
const SNIPPET_MAX_LENGTH = 600;

/** 悬浮打开的 chip 序号，-1 表示全部关闭；hover 离开即收起，不占用点击。 */
const hoverIndex = ref(-1);

interface EvidenceItem {
  citation: KnowledgeCitation;
  /** 展示序号，从 1 开始，对应证据来源顺序。 */
  index: number;
}

/** 合并直接命中与关联补充证据，直接命中在前；空列表整体不渲染。 */
const evidenceItems = computed<EvidenceItem[]>(() => {
  const direct = (props.citations ?? []).map((citation) => ({ citation, source: 'direct' as const }));
  const expanded = (props.expandedCitations ?? []).map((citation) => ({ citation, source: 'related' as const }));
  return [...direct, ...expanded].map((item, index) => ({
    citation: { ...item.citation, sourceType: item.citation.sourceType || item.source },
    index: index + 1,
  }));
});

/** 弹卡预览文本优先取完整切片内容，缺失时退回检索摘要。 */
function evidenceText(item: EvidenceItem) {
  const text = item.citation.content || item.citation.snippet || '';
  return text.length > SNIPPET_MAX_LENGTH ? `${text.slice(0, SNIPPET_MAX_LENGTH)}…` : text;
}

/** 来源类型转用户可读文案，与知识库检索面板口径一致。 */
function sourceTypeLabel(sourceType?: string) {
  switch (sourceType) {
    case 'adjacent':
    case 'related': {
      return $t('aiChat.ui.relatedSupplement');
    }
    case 'direct': {
      return $t('aiChat.ui.directHit');
    }
    default: {
      return $t('aiChat.ui.knowledgeBase');
    }
  }
}

/** 关联补充切片的关系分文本；旧载荷缺 relationScore 时回退检索分（扩展命中的 score 即关系综合分）。 */
function relationScoreText(citation: KnowledgeCitation) {
  const score = citation.relationScore ?? citation.score;
  return score === undefined ? '' : score.toFixed(2);
}

const router = useRouter();

/** 查找当前应用注册的知识库工作台路由，不同应用路径不同，按路由表发现避免硬编码。 */
const workbenchPathTemplate = computed(() => {
  const record = router.getRoutes().find((route) => route.path.includes('knowledge-base') && route.path.includes(':id'));
  return record?.path ?? '';
});

/** 打开证据对应的文档详情，携带切片定位参数供工作台滚动高亮；找不到工作台路由时不提供跳转入口。 */
function openDocument(item: EvidenceItem) {
  hoverIndex.value = -1;
  if (!workbenchPathTemplate.value) return;
  const knowledgeID = item.citation.knowledgeID || 0;
  const path = workbenchPathTemplate.value.replace(':id', String(knowledgeID));
  if (!item.citation.documentID) {
    window.open(router.resolve(path).href, '_blank', 'noopener,noreferrer');
    return;
  }
  const query = new URLSearchParams({ doc: String(item.citation.documentID) });
  const locate = buildCitationLocateQuery(item.citation);
  if (locate.chunk !== undefined) query.set('chunk', String(locate.chunk));
  if (locate.cs !== undefined) query.set('cs', String(locate.cs));
  if (locate.ce !== undefined) query.set('ce', String(locate.ce));
  if (locate.pi !== undefined) query.set('pi', String(locate.pi));
  if (locate.q) query.set('q', locate.q);
  window.open(router.resolve(`${path}?${query.toString()}`).href, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div v-if="evidenceItems.length > 0" class="space-y-1.5" data-testid="ai-evidence-citations">
    <div class="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
      <BookOpen class="size-3.5 shrink-0" />
      <span>{{ $t('aiChat.ui.knowledgeBaseEvidence') }} {{ evidenceItems.length }} {{ $t('aiChat.ui.bar') }}</span>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <Popover
        v-for="item in evidenceItems"
        :key="`${item.index}-${item.citation.documentID ?? 0}-${item.citation.chunkIndex ?? 0}`"
        :open="hoverIndex === item.index"
        @update:open="
          (open: boolean) => {
            if (!open) hoverIndex = -1;
          }
        "
      >
        <PopoverTrigger as-child>
          <button
            type="button"
            class="border-border bg-muted/50 hover:bg-muted hover:border-border focus-visible:ring-ring max-w-56 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
            :aria-label="$t('aiChat.ui.evidenceLabel', { index: item.index, name: item.citation.documentName || $t('aiChat.ui.knowledgeBaseSlice') })"
            data-testid="ai-evidence-chip"
            @mouseenter="hoverIndex = item.index"
            @mouseleave="hoverIndex = -1"
            @focus="hoverIndex = item.index"
            @blur="hoverIndex = -1"
            @click="openDocument(item)"
          >
            <span
              class="text-primary bg-[var(--primary)]/10 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
              aria-hidden="true"
            >
              {{ item.index }}
            </span>
            <span class="truncate">{{ item.citation.documentName || $t('aiChat.ui.knowledgeBaseSlice') }}</span>
            <span v-if="item.citation.sourceType === 'direct'" class="text-primary shrink-0 text-[10px]">{{ $t('aiChat.ui.hit') }}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" class="w-80 p-3" :avoid-collisions="true" @mouseenter="hoverIndex = item.index" @mouseleave="hoverIndex = -1">
          <div class="mb-1.5 flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="truncate text-xs font-semibold" :title="item.citation.documentName">
                {{ item.citation.documentName || $t('aiChat.ui.knowledgeBaseSlice') }}
              </div>
              <div v-if="item.citation.path" class="text-muted-foreground mt-0.5 truncate text-[11px]" :title="item.citation.path">
                {{ item.citation.path }}
              </div>
            </div>
            <Badge variant="secondary" class="shrink-0 text-[10px]">{{ sourceTypeLabel(item.citation.sourceType) }}</Badge>
          </div>
          <div class="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
            <span v-if="item.citation.chunkIndex !== undefined">{{ $t('aiChat.ui.slice') }}{{ item.citation.chunkIndex }}</span>
            <span v-if="item.citation.score !== undefined">{{ $t('aiChat.ui.relevance') }} {{ item.citation.score.toFixed(2) }}</span>
          </div>
          <div
            v-if="item.citation.sourceType !== 'direct' && (item.citation.relationEvidence || item.citation.relationType)"
            class="border-border bg-muted/40 mb-1.5 rounded-md p-2 text-[11px] leading-5"
            data-testid="ai-evidence-relation"
          >
            <div class="text-muted-foreground">
              关联依据：<span class="text-foreground">{{ item.citation.relationEvidence || '—' }}</span>
            </div>
            <div class="text-muted-foreground mt-0.5">
              类型 {{ relationTypeLabel(item.citation.relationType || '') }}<template v-if="relationScoreText(item.citation)"> · 关系分 {{ relationScoreText(item.citation) }}</template>
            </div>
          </div>
          <p class="text-foreground max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
            {{ evidenceText(item) }}
          </p>
          <div v-if="workbenchPathTemplate" class="border-border mt-2 border-t pt-2">
            <Button variant="ghost" size="sm" class="text-muted-foreground h-7 px-2 text-xs" @click="openDocument(item)">
              <ExternalLink class="mr-1 size-3" />
              {{ $t('aiChat.ui.openDocument') }}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
