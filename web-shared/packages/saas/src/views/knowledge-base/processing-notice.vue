<!-- 文件说明：阅读章节就近提示异常和历史版本，详细日志与重试仅在高级信息中出现。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeDetail } from './data';

import { computed } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';

import { getProcessingStage, processingStatusLabel, stageNeedsNotice } from './processing';
/** detail 是现有阶段记录；stage 指向正文、分析、多模态或独立关系阶段。 */
const props = defineProps<{ detail: KnowledgeDetail; stage: string }>();
/** details 打开高级处理状态，不提交模型请求。 */
const emit = defineEmits<{ details: [] }>();
/** 当前阶段与来源版本单独判断，不能用文档总状态替代。 */
const current = computed(() => getProcessingStage(props.detail, props.stage));
const stale = computed(() => !!current.value.sourceVersion && current.value.sourceVersion !== props.detail.sourceVersion);
</script>
<template>
  <div v-if="stageNeedsNotice(detail, stage)" role="status" class="bg-muted/30 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs">
    <span class="flex-1">
      {{ stale ? $t('knowledgeBase.text_1bf685f45a8f') : processingStatusLabel(current.status) }}
      <span v-if="['failed', 'partial', 'blocked'].includes(current.status || '')">{{ $t('knowledgeBase.text_5d24deebe242') }}</span>
    </span>
    <Button variant="ghost" size="sm" class="kb-control h-8" @click="emit('details')">{{ $t('knowledgeBase.text_faea8c1db9cc') }}</Button>
  </div>
</template>
