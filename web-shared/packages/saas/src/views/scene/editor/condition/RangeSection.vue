<script setup lang="ts">
import { $t } from '@vben/locales';
/** 生效 / 无效时段管理 */
import { ref } from 'vue';
import { Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';
import { IconifyIcon } from '@vben/icons';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import type { ValidationIssue } from '../types';
import { RANGE_TEMPLATES } from '../types';
import RangeCard from './RangeCard.vue';

const props = defineProps<{
  ctx: SceneDraftContext;
  issues: ValidationIssue[];
}>();

const openValid = ref(false);
const openInvalid = ref(false);

function add(bucket: 'valid' | 'invalid', type: string) {
  const tpl = RANGE_TEMPLATES.find((t) => t.type === (type as any));
  if (tpl) props.ctx.addRange(bucket, tpl.build());
  if (bucket === 'valid') openValid.value = false;
  else openInvalid.value = false;
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-3">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="icon-[mdi--calendar-check] size-4 text-primary"></span>
          <h3 class="text-sm font-medium">{{ $t('scene.ui.effectivePeriod') }}</h3>
        </div>
        <Popover v-model:open="openValid">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-primary/40 px-2 text-xs text-primary hover:bg-primary/5"
            >
              <span class="icon-[mdi--plus] size-3.5"></span>
              {{ $t('iotApp.area.add') }}
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-1" align="end">
            <button
              v-for="tpl in RANGE_TEMPLATES"
              :key="tpl.type"
              type="button"
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              @click="add('valid', tpl.type)"
            >
              <IconifyIcon :icon="tpl.icon" class="size-4" />
              {{ tpl.label }}
            </button>
          </PopoverContent>
        </Popover>
      </header>
      <div
        v-if="!ctx.draft.validRanges.length"
        class="rounded-md border border-dashed border-border bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground"
      >
        {{ $t('scene.ui.noTimePeriodAddedAnyTimePeriodTakesEffectByDefault') }}
      </div>
      <RangeCard
        v-for="(r, i) in ctx.draft.validRanges"
        :key="r.uid"
        :model-value="r"
        :index="i"
        :total="ctx.draft.validRanges.length"
        @change="() => ctx.markDirty()"
        @copy="() => ctx.duplicateRange('valid', i)"
        @delete="() => ctx.removeAt(ctx.draft.validRanges, i)"
        @move-up="() => ctx.move(ctx.draft.validRanges, i, -1)"
        @move-down="() => ctx.move(ctx.draft.validRanges, i, 1)"
      />
    </div>

    <div class="space-y-3">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="icon-[mdi--calendar-remove] size-4 text-destructive"></span>
          <h3 class="text-sm font-medium">{{ $t('scene.ui.invalidPeriod') }}</h3>
        </div>
        <Popover v-model:open="openInvalid">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-primary/40 px-2 text-xs text-primary hover:bg-primary/5"
            >
              <span class="icon-[mdi--plus] size-3.5"></span>
              {{ $t('iotApp.area.add') }}
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-1" align="end">
            <button
              v-for="tpl in RANGE_TEMPLATES"
              :key="tpl.type"
              type="button"
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              @click="add('invalid', tpl.type)"
            >
              <IconifyIcon :icon="tpl.icon" class="size-4" />
              {{ tpl.label }}
            </button>
          </PopoverContent>
        </Popover>
      </header>
      <div
        v-if="!ctx.draft.invalidRanges.length"
        class="rounded-md border border-dashed border-border bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground"
      >
        {{ $t('scene.ui.noInvalidPeriodAdded') }}
      </div>
      <RangeCard
        v-for="(r, i) in ctx.draft.invalidRanges"
        :key="r.uid"
        :model-value="r"
        :index="i"
        :total="ctx.draft.invalidRanges.length"
        @change="() => ctx.markDirty()"
        @copy="() => ctx.duplicateRange('invalid', i)"
        @delete="() => ctx.removeAt(ctx.draft.invalidRanges, i)"
        @move-up="() => ctx.move(ctx.draft.invalidRanges, i, -1)"
        @move-down="() => ctx.move(ctx.draft.invalidRanges, i, 1)"
      />
    </div>
  </div>
</template>
