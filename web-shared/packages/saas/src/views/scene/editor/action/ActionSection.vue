<script setup lang="ts">
import { $t } from '@vben/locales';
import { ref } from 'vue';
import { Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';
import { IconifyIcon } from '@vben/icons';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import type { ValidationIssue } from '../types';
import { ACTION_TEMPLATES } from '../types';
import ActionCard from './ActionCard.vue';

const props = defineProps<{
  ctx: SceneDraftContext;
  issues: ValidationIssue[];
}>();

const open = ref(false);

function add(type: string) {
  const tpl = ACTION_TEMPLATES.find((t) => t.type === (type as any));
  if (tpl) props.ctx.addAction(tpl.build());
  open.value = false;
}
</script>

<template>
  <section id="sec-action" class="space-y-2">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span
          class="icon-[mdi--play-circle-outline] text-primary size-4"
        ></span>
        <h2 class="text-sm font-semibold">{{ $t('scene.ui.thenPerformAction') }}</h2>
        <span class="text-muted-foreground text-[11px]">{{ $t('scene.ui.executeInOrder') }}</span>
      </div>
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="border-primary/50 text-primary hover:bg-primary/5 inline-flex h-7 items-center gap-1 rounded border border-dashed px-2.5 text-[11px]"
          >
            <span class="icon-[mdi--plus] size-3.5"></span>
            {{ $t('scene.ui.addAction') }}
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-52 p-1" align="end">
          <button
            v-for="tpl in ACTION_TEMPLATES"
            :key="tpl.type"
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs"
            @click="add(tpl.type)"
          >
            <IconifyIcon :icon="tpl.icon" class="size-3.5" />
            {{ tpl.label }}
          </button>
        </PopoverContent>
      </Popover>
    </header>

    <div
      v-if="!ctx.draft.actions.length"
      class="border-border bg-muted/20 text-muted-foreground rounded border border-dashed px-3 py-3 text-center text-xs"
    >
      {{ $t('scene.ui.atLeastOneActionNeedsToBeAdded') }}
    </div>

    <ActionCard
      v-for="(a, i) in ctx.draft.actions"
      :key="a.uid"
      :model-value="a"
      :index="i"
      :total="ctx.draft.actions.length"
      :issues="issues"
      @change="() => ctx.markDirty()"
      @copy="() => ctx.duplicateAction(i)"
      @delete="() => ctx.removeAt(ctx.draft.actions, i)"
      @move-up="() => ctx.move(ctx.draft.actions, i, -1)"
      @move-down="() => ctx.move(ctx.draft.actions, i, 1)"
    />
  </section>
</template>
