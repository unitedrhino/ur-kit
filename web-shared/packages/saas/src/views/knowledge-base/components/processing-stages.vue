<!-- 文件说明：文档处理分阶段时间线，作为文档详情一级区块展示 4 阶段状态；失败阶段一键重试直达，错误原因以错误色突出。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { KnowledgeDetail } from '../data';

import { computed } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { RefreshCw } from 'lucide-vue-next';

import { getProcessingStage, processingStageNames, processingStatusLabel } from '../processing';

const props = withDefaults(defineProps<Props>(), {
  canRetry: false,
  retrying: false,
});

/** 重试请求上抛壳层确认后提交；阶段状态解析复用 processing.ts 单一实现。 */
const emit = defineEmits<{
  /** 重新处理指定阶段。 */
  retry: [stage: string];
}>();

interface Props {
  /** 是否允许阶段重试（跟随知识库可写权限）。 */
  canRetry?: boolean;
  /** 当前文档详情，阶段状态与版本来源。 */
  detail: KnowledgeDetail;
  /** 重试提交进行中，控制按钮状态。 */
  retrying?: boolean;
}

/** 存在异常、处理中或版本漂移时时间线需要突出提示。 */
const stages = computed(() => Object.keys(processingStageNames).map((stage) => getProcessingStage(props.detail, stage)));
const taskActive = computed(() => ['pending', 'processing'].includes(props.detail.lastCompileTask?.status || ''));
/** 阶段视觉状态：失败/部分完成用错误色，进行中用主色，其余弱化。 */
function stageClass(status?: string) {
  if (['failed', 'partial'].includes(status || '')) return 'text-destructive';
  if (status === 'processing' || status === 'pending') return 'text-primary';
  return 'text-muted-foreground';
}
/** 阶段圆点颜色：与文字同色系，成功弱化为边框色避免整行全绿喧宾夺主。 */
function stageDotClass(status?: string) {
  if (['failed', 'partial'].includes(status || '')) return 'bg-destructive';
  if (status === 'processing') return 'bg-primary animate-pulse';
  if (status === 'success') return 'bg-success/60';
  return 'bg-muted-foreground/40';
}

/** failedStages 可重试的异常阶段（content 阶段由全量重试覆盖，不单提供入口）。 */
const failedStages = computed(() => stages.value.filter((stage) => ['blocked', 'failed', 'partial'].includes(stage.status || '') && stage.stage !== 'content'));
</script>
<template>
  <div class="border-border bg-muted/20 shrink-0 border-b px-4 py-2">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span class="text-muted-foreground text-xs font-medium">{{ $t('knowledgeBase.text_caab1bc4bae1') }}</span>
      <template v-for="(stage, index) in stages" :key="stage.stage">
        <span v-if="index > 0" class="text-muted-foreground/40 text-xs">·</span>
        <span class="flex items-center gap-1.5 text-xs" :class="stageClass(stage.status)">
          <span class="size-1.5 rounded-full" :class="stageDotClass(stage.status)"></span>
          {{ processingStageNames[stage.stage] }}
          <span class="text-muted-foreground">{{
            stage.sourceVersion && stage.sourceVersion !== detail.sourceVersion ? $t('knowledgeBase.text_c25bd31a28b4') : processingStatusLabel(stage.status)
          }}</span>
          <Button
            v-if="canRetry && failedStages.some((item) => item.stage === stage.stage)"
            variant="ghost"
            size="icon"
            class="kb-control size-5"
            :aria-label="$t('knowledgeBase.text_a7b906b0dd53', { arg0: processingStageNames[stage.stage] })"
            :disabled="retrying || taskActive"
            @click="emit('retry', stage.stage)"
          >
            <RefreshCw class="size-3" />
          </Button>
        </span>
      </template>
      <Badge v-if="taskActive" variant="outline" class="text-muted-foreground shrink-0">{{ $t('knowledgeBase.text_8e5dbad1d12b') }}</Badge>
    </div>
    <!-- 失败原因错误文案突出：异常阶段的说明单独成行展示，不再藏进弹窗。 -->
    <template v-for="stage in stages" :key="`${stage.stage}-message`">
      <p v-if="['failed', 'partial', 'blocked'].includes(stage.status || '')" class="text-destructive mt-1.5 break-all text-xs">
        {{ processingStageNames[stage.stage] }}：{{ stage.message || $t('knowledgeBase.text_763284f0fbc6') }}
      </p>
    </template>
    <p v-if="!taskActive && detail.lastError && failedStages.length === 0" class="text-destructive mt-1.5 break-all text-xs">
      {{ detail.lastError }}
    </p>
  </div>
</template>
