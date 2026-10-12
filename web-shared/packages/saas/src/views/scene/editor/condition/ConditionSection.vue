<script setup lang="ts">
import { $t } from '@vben/locales';
/** WHEN 条件区块：逻辑选择(and/or) + 卡片列表 + 生效/无效时段 */
import { ref } from 'vue';
import { Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';
import { IconifyIcon } from '@vben/icons';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import type { ValidationIssue } from '../types';
import { CONDITION_TEMPLATES } from '../types';
import ConditionCard from './ConditionCard.vue';
import RangeSection from './RangeSection.vue';

const props = defineProps<{
  ctx: SceneDraftContext;
  issues: ValidationIssue[];
  /** 是否在此 Section 内部渲染生效/无效时段。默认 true，向后兼容。 */
  showRanges?: boolean;
}>();

const open = ref(false);

function add(type: string) {
  const tpl = CONDITION_TEMPLATES.find((t) => t.columnType === (type as any));
  if (tpl) {
    if (!props.ctx.draft.conditionLogic) props.ctx.setConditionLogic('and');
    props.ctx.addCondition(tpl.build());
  }
  open.value = false;
}

function onLogicChange(v: string) {
  props.ctx.setConditionLogic(v as any);
}
</script>

<template>
  <section id="sec-condition" class="space-y-3">
    <div class="space-y-2">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="icon-[mdi--filter-outline] text-primary size-4"></span>
          <h2 class="text-sm font-semibold">{{ $t('scene.ui.whenExecutionConditionsOptional') }}</h2>
        </div>
        <div class="flex items-center gap-1.5">
          <div
            v-if="ctx.draft.conditions.length"
            class="border-border inline-flex overflow-hidden rounded border text-[11px]"
          >
            <button
              type="button"
              :class="[
                'px-2.5 py-1',
                ctx.draft.conditionLogic === 'and'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent',
              ]"
              @click="onLogicChange('and')"
            >
              {{ $t('scene.ui.satisfyAll') }}
            </button>
            <button
              type="button"
              :class="[
                'px-2.5 py-1',
                ctx.draft.conditionLogic === 'or'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent',
              ]"
              @click="onLogicChange('or')"
            >
              {{ $t('scene.ui.satisfyAny') }}
            </button>
          </div>
          <Popover v-model:open="open">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="border-primary/50 text-primary hover:bg-primary/5 inline-flex h-7 items-center gap-1 rounded border border-dashed px-2.5 text-[11px]"
              >
                <span class="icon-[mdi--plus] size-3.5"></span>
                {{ $t('scene.ui.addConditions') }}
              </button>
            </PopoverTrigger>
            <PopoverContent class="w-52 p-1" align="end">
              <button
                v-for="tpl in CONDITION_TEMPLATES"
                :key="tpl.columnType"
                type="button"
                class="hover:bg-accent flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs"
                @click="add(tpl.columnType)"
              >
                <IconifyIcon :icon="tpl.icon" class="size-3.5" />
                {{ tpl.label }}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div
        v-if="!ctx.draft.conditions.length"
        class="border-border bg-muted/20 text-muted-foreground rounded border border-dashed px-3 py-3 text-center text-xs"
      >
        {{ $t('scene.ui.noConditionSetAllTriggersWillBeExecuted') }}
      </div>

      <ConditionCard
        v-for="(c, i) in ctx.draft.conditions"
        :key="c.uid"
        :model-value="c"
        :index="i"
        :total="ctx.draft.conditions.length"
        :issues="issues"
        @change="() => ctx.markDirty()"
        @copy="() => ctx.duplicateCondition(i)"
        @delete="() => ctx.removeAt(ctx.draft.conditions, i)"
        @move-up="() => ctx.move(ctx.draft.conditions, i, -1)"
        @move-down="() => ctx.move(ctx.draft.conditions, i, 1)"
      />
    </div>

    <RangeSection v-if="showRanges !== false" :ctx="ctx" :issues="issues" />
  </section>
</template>
