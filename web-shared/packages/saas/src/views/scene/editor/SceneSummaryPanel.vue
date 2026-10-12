<script setup lang="ts">
import { $t } from '@vben/locales';
/** 右侧摘要面板：人话描述 + 校验问题 */
import { computed } from 'vue';
import type { SceneDraft, ValidationIssue } from './types';
import { describeSceneDraft } from './composables/useSceneSummary';

const props = defineProps<{
  draft: SceneDraft;
  issues: ValidationIssue[];
}>();

const lines = computed(() => describeSceneDraft(props.draft));
const errors = computed(() => props.issues.filter((i) => i.level === 'error'));
const warnings = computed(() => props.issues.filter((i) => i.level === 'warn'));
</script>

<template>
  <aside
    class="sticky top-4 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 text-sm"
  >
    <section>
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span class="icon-[mdi--eye-outline] size-4 text-primary"></span>
        {{ $t('scene.ui.rulePreview') }}
      </h3>
      <div class="space-y-1 font-mono text-xs leading-relaxed text-muted-foreground">
        <div v-for="(l, i) in lines" :key="i">{{ l }}</div>
      </div>
    </section>

    <section v-if="errors.length">
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
        <span class="icon-[mdi--alert-circle] size-4"></span>
        {{ $t('scene.ui.errorCount', { count: errors.length }) }}
      </h3>
      <ul class="space-y-1 text-xs text-destructive">
        <li v-for="(e, i) in errors" :key="i">· {{ e.message }}</li>
      </ul>
    </section>

    <section v-if="warnings.length">
      <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
        <span class="icon-[mdi--alert-outline] size-4"></span>
        {{ $t('scene.ui.promptCount', { count: warnings.length }) }}
      </h3>
      <ul class="space-y-1 text-xs text-amber-600">
        <li v-for="(w, i) in warnings" :key="i">· {{ w.message }}</li>
      </ul>
    </section>
  </aside>
</template>
