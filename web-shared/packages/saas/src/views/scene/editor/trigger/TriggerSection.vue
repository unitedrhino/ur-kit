<script setup lang="ts">
import { $t } from '@vben/locales';
/** IF 触发器区块：标题 + 添加按钮 + 卡片列表 */
import { ref } from 'vue';
import { Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';
import { IconifyIcon } from '@vben/icons';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import type { ValidationIssue } from '../types';
import { TRIGGER_TEMPLATES } from '../types';
import TriggerCard from './TriggerCard.vue';

const props = defineProps<{
  ctx: SceneDraftContext;
  issues: ValidationIssue[];
}>();

const open = ref(false);

function add(type: string) {
  const tpl = TRIGGER_TEMPLATES.find((t) => t.type === (type as any));
  if (tpl) props.ctx.addTrigger(tpl.build());
  open.value = false;
}
</script>

<template>
  <section id="sec-trigger" class="space-y-2">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="icon-[mdi--lightning-bolt] text-primary size-4"></span>
        <h2 class="text-sm font-semibold">{{ $t('scene.ui.ifTriggerCondition') }}</h2>
        <span class="text-muted-foreground text-[11px]">{{ $t('scene.ui.startWhenAnyTriggerIsMet') }}</span>
      </div>
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="border-primary/50 text-primary hover:bg-primary/5 inline-flex h-7 items-center gap-1 rounded border border-dashed px-2.5 text-[11px]"
          >
            <span class="icon-[mdi--plus] size-3.5"></span>
            {{ $t('scene.ui.addTrigger') }}
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-52 p-1" align="end">
          <button
            v-for="tpl in TRIGGER_TEMPLATES"
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
      v-if="!ctx.draft.triggers.length"
      class="border-border bg-muted/20 text-muted-foreground rounded border border-dashed px-3 py-3 text-center text-xs"
    >
      {{ $t('scene.ui.clickAddTriggerInTheUpperRightCornerToCreateTheFirst') }}
    </div>

    <TriggerCard
      v-for="(t, i) in ctx.draft.triggers"
      :key="t.uid"
      :model-value="t"
      :index="i"
      :total="ctx.draft.triggers.length"
      :issues="issues"
      @change="() => ctx.markDirty()"
      @copy="() => ctx.duplicateTrigger(i)"
      @delete="() => ctx.removeAt(ctx.draft.triggers, i)"
      @move-up="() => ctx.move(ctx.draft.triggers, i, -1)"
      @move-down="() => ctx.move(ctx.draft.triggers, i, 1)"
    />
  </section>
</template>
