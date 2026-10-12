<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 规则卡片：折叠/展开 + 摘要 + 动作按钮。
 *
 * 传入 summary 作为折叠态展示文本；展开时暴露默认 slot。
 */
import { computed } from 'vue';

const props = defineProps<{
  title?: string;
  summary: string;
  collapsed?: boolean;
  hasError?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'copy'): void;
  (e: 'delete'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
}>();

const borderCls = computed(() =>
  props.hasError ? 'border-destructive/60' : 'border-border/70',
);
</script>

<template>
  <div
    :class="[
      'rounded-md border bg-card transition-colors',
      borderCls,
    ]"
  >
    <header class="flex items-center gap-1.5 px-2 py-1.5">
      <button
        type="button"
        class="flex flex-1 items-center gap-1.5 text-left"
        @click="emit('toggle')"
      >
        <span
          class="icon-[mdi--chevron-right] text-muted-foreground size-3.5 transition-transform"
          :class="{ 'rotate-90': !collapsed }"
        ></span>
        <span v-if="title" class="text-foreground text-xs font-medium">{{
          title
        }}</span>
        <span class="text-muted-foreground truncate text-xs">{{ summary }}</span>
        <span
          v-if="hasError"
          class="icon-[mdi--alert-circle] text-destructive ml-1 size-3.5"
          :title="$t('scene.ui.theCardHasAnError')"
        ></span>
      </button>

      <div class="text-muted-foreground flex items-center gap-0.5">
        <button
          type="button"
          class="hover:bg-accent size-6 rounded disabled:opacity-30"
          :disabled="!canMoveUp"
          :title="$t('orgManage.flow.moveUp')"
          @click.stop="emit('moveUp')"
        >
          <span class="icon-[mdi--arrow-up] size-3.5"></span>
        </button>
        <button
          type="button"
          class="hover:bg-accent size-6 rounded disabled:opacity-30"
          :disabled="!canMoveDown"
          :title="$t('orgManage.flow.moveDown')"
          @click.stop="emit('moveDown')"
        >
          <span class="icon-[mdi--arrow-down] size-3.5"></span>
        </button>
        <button
          type="button"
          class="hover:bg-accent size-6 rounded"
          :title="$t('iotApp.av.copy')"
          @click.stop="emit('copy')"
        >
          <span class="icon-[mdi--content-copy] size-3.5"></span>
        </button>
        <button
          type="button"
          class="text-destructive hover:bg-destructive/10 size-6 rounded"
          :title="$t('orgEnergy.ui.delete')"
          @click.stop="emit('delete')"
        >
          <span class="icon-[mdi--trash-can-outline] size-3.5"></span>
        </button>
      </div>
    </header>
    <div v-if="!collapsed" class="border-border/70 border-t px-3 py-2">
      <slot />
    </div>
  </div>
</template>
