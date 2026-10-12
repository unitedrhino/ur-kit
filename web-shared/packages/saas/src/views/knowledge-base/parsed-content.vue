<!-- 文件说明：区分解析正文与图片 AI 识别结果；只展示当前来源版本，不把模型描述冒充 OCR 原文。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeDetail } from './data';

import { computed, nextTick, ref, watch } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';

import MermaidBlock from './components/mermaid-block.vue';
import { splitMermaidSegments } from './mermaid-segments';
import { processingStatusLabel } from './processing';

/** text 是原始解析正文，detail 提供当前版本的识别产物；error 与 loading 区分请求失败、加载和真实空结果。 */
const props = defineProps<{
  detail: KnowledgeDetail;
  error?: string;
  /** 引用定位高亮区间（全文码点下标，闭开）；提供时正文高亮命中内容并滚动到位。 */
  highlight?: { charEnd: number; charStart: number };
  loading?: boolean;
  text: string;
}>();
/** retry 只重新读取结果，不触发计费的模型处理。 */
const emit = defineEmits<{ retry: [] }>();
/** 仅独立图片使用视觉描述兜底；PDF 等文档仍展示实际解析正文。 */
const isImage = computed(() =>
  /\.(?:png|jpe?g|gif|webp|bmp|svg|tiff?|avif|ico|heic|heif|jxl)$/i.test(props.detail.document.path || props.detail.document.name),
);
/** 当前源版本成功识别的图片，排除历史版本与缺少来源记录的内容。 */
const descriptions = computed(() =>
  isImage.value && props.detail.sourceVersion
    ? (props.detail.multimodalArtifacts ?? []).filter(
        (item) =>
          item.artifactType === 'image' &&
          item.descriptionStatus === 'success' &&
          item.description?.trim() &&
          item.sourceVersion === props.detail.sourceVersion,
      )
    : [],
);
/** 无可用识别时显示实际阶段信息，不能一律提示处理后会出现。 */
const mediaStage = computed(() => props.detail.processingStages?.find((stage) => stage.stage === 'multimodal'));
/** 旧版本阶段不得冒充当前图片的处理状态。 */
const stale = computed(() => !!mediaStage.value?.sourceVersion && mediaStage.value.sourceVersion !== props.detail.sourceVersion);

interface HighlightedTextPart {
  kind: 'plain' | 'mark';
  value: string;
}

interface RenderSegment {
  key: string;
  mermaid?: string;
  parts: HighlightedTextPart[];
}

/** highlightRange 换算高亮区间在指定文本段内的码点范围；不相交返回 undefined。 */
function highlightRange(segmentStart: number, segmentLength: number): { end: number; start: number } | undefined {
  const highlight = props.highlight;
  if (!highlight || highlight.charEnd <= highlight.charStart) return undefined;
  const start = Math.max(highlight.charStart - segmentStart, 0);
  const end = Math.min(highlight.charEnd - segmentStart, segmentLength);
  if (end <= start) return undefined;
  return { end, start };
}

/** splitByHighlight 把段文本按高亮区间拆成 plain/mark 序列；无高亮时整段 plain。 */
function splitByHighlight(value: string, segmentStart: number): HighlightedTextPart[] {
  const chars = Array.from(value);
  const range = highlightRange(segmentStart, chars.length);
  if (!range) return [{ kind: 'plain', value }];
  const parts: HighlightedTextPart[] = [];
  if (range.start > 0) parts.push({ kind: 'plain', value: chars.slice(0, range.start).join('') });
  parts.push({ kind: 'mark', value: chars.slice(range.start, range.end).join('') });
  if (range.end < chars.length) parts.push({ kind: 'plain', value: chars.slice(range.end).join('') });
  return parts;
}

/** 正文按 mermaid 围栏分段并注入高亮拆分；无图表无高亮时与此前渲染一致。 */
const textSegments = computed<RenderSegment[]>(() =>
  splitMermaidSegments(props.text).map((segment, index) =>
    segment.type === 'mermaid'
      ? { key: `m${index}`, mermaid: segment.code, parts: [] }
      : { key: `t${index}`, parts: splitByHighlight(segment.value, segment.start) },
  ),
);

const bodyRef = ref<HTMLElement>();

/** 高亮渲染后滚动到命中位置；文本未就绪时等待下一次变化。 */
watch(
  () => [props.highlight, props.text, props.loading] as const,
  async ([highlight, text], previous) => {
    if (!highlight || props.loading || !text) return;
    await nextTick();
    if (previous?.[1] !== text) await nextTick();
    const target = bodyRef.value?.querySelector('[data-testid="citation-highlight"]');
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  },
  { flush: 'post' },
);
</script>

<template>
  <div class="mx-auto h-full max-w-4xl text-sm leading-7" data-testid="parsed-content">
    <div v-if="loading" role="status" class="text-muted-foreground">{{ $t('knowledgeBase.text_02df89e7e305') }}</div>
    <div v-else-if="error" role="alert" class="text-destructive space-y-3">
      <p>{{ error }}</p>
      <Button variant="outline" size="sm" @click="emit('retry')">{{ $t('knowledgeBase.text_5982c44c18df') }}</Button>
    </div>
    <div v-else-if="text.trim()" ref="bodyRef" class="text-foreground/90 space-y-3" data-testid="parsed-body">
      <template v-for="segment in textSegments" :key="segment.key">
        <MermaidBlock v-if="segment.mermaid !== undefined" :code="segment.mermaid" />
        <div v-else class="whitespace-pre-wrap">
          <template v-for="(part, partIndex) in segment.parts" :key="partIndex">
            <mark v-if="part.kind === 'mark'" class="bg-primary/20 text-foreground rounded-sm px-0.5" data-testid="citation-highlight">{{ part.value }}</mark>
            <template v-else>{{ part.value }}</template>
          </template>
        </div>
      </template>
    </div>
    <section v-else-if="descriptions.length > 0" class="space-y-4">
      <header class="bg-muted/30 rounded-lg border p-4">
        <h3 class="text-foreground font-medium">{{ $t('knowledgeBase.text_f3d28301bcf7') }}</h3>
        <p class="text-muted-foreground mt-1 text-xs leading-5">{{ $t('knowledgeBase.text_d295abdad599') }}</p>
        <p v-if="mediaStage && mediaStage.status !== 'success'" class="text-muted-foreground mt-2 text-xs leading-5">
          {{ processingStatusLabel(mediaStage.status) }}{{ $t('knowledgeBase.text_2284e8c4f17e') }}
        </p>
      </header>
      <p v-for="item in descriptions" :key="item.id" class="text-foreground/90 whitespace-pre-wrap">{{ item.description }}</p>
    </section>
    <Empty v-else class="h-full">
      <EmptyHeader>
        <EmptyTitle>{{ isImage ? $t('knowledgeBase.text_c6bc2633c398') : $t('knowledgeBase.text_f79780fdcb78') }}</EmptyTitle>
        <EmptyDescription>
          {{
            isImage
              ? stale
                ? $t('knowledgeBase.text_0940965f4fac')
                : mediaStage?.message || $t('knowledgeBase.text_36b433a3f7b4')
              : $t('knowledgeBase.text_b4f8e881a05d')
          }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>
