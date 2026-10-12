<!-- 文件说明：文档关系双侧原文证据，同一内容供内联证据栏和窄屏侧栏复用。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { DocumentRelationGroup } from './document-relations';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';

import { chunkOptionLabel } from './document-relations';
import { relationTypeLabel } from './graph';
/** group 仅包含可访问的真实直接关系；documentID 用于保留实际引用方向。 */
defineProps<{ documentID: number; group: DocumentRelationGroup }>();
/** close 关闭证据并由宿主恢复到选中节点的焦点。 */
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <section class="flex h-full min-h-0 min-w-0 flex-col" :aria-label="$t('knowledgeBase.text_89794dae27e6')">
    <header class="shrink-0 space-y-2 border-b p-4">
      <div class="flex items-start justify-between gap-2">
        <h4 class="break-words text-sm font-semibold">
          {{ $t('knowledgeBase.text_e182e21dfd19') }} {{ group.name }} {{ $t('knowledgeBase.text_345c37c58c95') }}
        </h4>
        <Button variant="ghost" size="sm" @click="emit('close')">{{ $t('knowledgeBase.text_ee402c14ea55') }}</Button>
      </div>
      <p class="text-muted-foreground text-xs leading-5">{{ $t('knowledgeBase.text_42b34736356d') }}</p>
    </header>
    <div class="min-h-0 flex-1 space-y-3 overflow-auto p-4">
      <details v-for="(relation, index) in group.relations" :key="relation.id" :open="index === 0" class="rounded-md border p-3">
        <summary class="focus-visible:ring-ring cursor-pointer break-words text-sm leading-6 focus-visible:ring-2">
          <Badge variant="outline" class="mr-2">{{ relationTypeLabel(relation.relationType) }}</Badge>
          {{ relation.evidence || $t('knowledgeBase.text_3c04755628f1') }}
        </summary>
        <p class="text-muted-foreground mt-3 text-xs">
          {{ relation.fromDocumentID === documentID ? $t('knowledgeBase.text_369e7679b04c') : $t('knowledgeBase.text_28f7559842d4') }}
          {{ $t('knowledgeBase.text_97b7ad14874b') }} {{ relation.score.toFixed(2) }}
        </p>
        <article class="mt-4 space-y-2">
          <h5 class="break-words text-sm font-medium">{{ $t('knowledgeBase.text_ba7f711e99ea') }} {{ chunkOptionLabel(relation.sourceArtifact!) }}</h5>
          <p class="whitespace-pre-wrap break-words text-sm leading-7">{{ relation.sourceArtifact?.content || $t('knowledgeBase.text_8558b98cf800') }}</p>
        </article>
        <article class="mt-4 space-y-2 border-t pt-4">
          <h5 class="break-words text-sm font-medium">{{ group.name }} · {{ chunkOptionLabel(relation.targetArtifact!) }}</h5>
          <p class="whitespace-pre-wrap break-words text-sm leading-7">{{ relation.targetArtifact?.content || $t('knowledgeBase.text_8558b98cf800') }}</p>
        </article>
      </details>
    </div>
  </section>
</template>
