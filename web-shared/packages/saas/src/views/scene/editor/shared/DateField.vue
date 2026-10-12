<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 日期选择 —— shadcn 风格 Popover + 月历。
 * 数据格式保持 YYYY-MM-DD 字符串（与旧协议一致）。
 */
import { computed, ref } from 'vue';
import { preferences } from '@vben/preferences';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from 'date-fns';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@vben-core/shadcn-ui';

const props = defineProps<{
  modelValue?: number | string;
  placeholder?: string;
  disabled?: boolean;
  widthClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | undefined): void;
}>();

function toDate(v?: number | string): Date | null {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return parse(v, 'yyyy-MM-dd', new Date());
  }
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

const open = ref(false);
const selected = computed(() => toDate(props.modelValue));
const viewDate = ref<Date>(selected.value || startOfToday());

const displayText = computed(() =>
  selected.value ? format(selected.value, 'yyyy-MM-dd') : '',
);

/** weekdays 根据当前语言生成周一到周日的日历列标题。 */
const weekdays = computed(() => Array.from({ length: 7 }, (_, index) =>
  new Intl.DateTimeFormat(preferences.app.locale, { weekday: 'narrow' }).format(new Date(2024, 0, index + 1)),
));
/** monthHeader 只格式化显示文案，不改变表单提交的日期值。 */
const monthHeader = computed(() => new Intl.DateTimeFormat(preferences.app.locale, { year: 'numeric', month: 'long' }).format(viewDate.value));

const days = computed(() => {
  const start = startOfWeek(startOfMonth(viewDate.value), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(viewDate.value), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
});

function pick(d: Date) {
  emit('update:modelValue', format(d, 'yyyy-MM-dd'));
  open.value = false;
}

function clear(e: Event) {
  e.stopPropagation();
  emit('update:modelValue', undefined);
}

function prevMonth() {
  viewDate.value = subMonths(viewDate.value, 1);
}
function nextMonth() {
  viewDate.value = addMonths(viewDate.value, 1);
}
function today() {
  const t = startOfToday();
  viewDate.value = t;
  pick(t);
}
function clearAndClose() {
  emit('update:modelValue', undefined);
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :class="[
          'group flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          widthClass || 'w-full',
        ]"
      >
        <span v-if="displayText" class="truncate text-foreground">{{
          displayText
        }}</span>
        <span v-else class="text-muted-foreground">{{
          placeholder || $t('scene.ui.selectDate')
        }}</span>
        <span class="flex items-center gap-1 text-muted-foreground">
          <span
            v-if="displayText"
            class="icon-[mdi--close-circle] size-4 opacity-0 transition group-hover:opacity-100 hover:text-foreground"
            @click="clear"
          ></span>
          <span class="icon-[mdi--calendar-outline] size-4"></span>
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-[280px] p-3" align="start">
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded hover:bg-accent"
          @click="prevMonth"
        >
          <span class="icon-[mdi--chevron-left] size-4"></span>
        </button>
        <div class="text-sm font-medium">
          {{ monthHeader }}
        </div>
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded hover:bg-accent"
          @click="nextMonth"
        >
          <span class="icon-[mdi--chevron-right] size-4"></span>
        </button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-0.5">
        <div
          v-for="(w, index) in weekdays"
          :key="index"
          class="flex h-7 items-center justify-center text-xs text-muted-foreground"
        >
          {{ w }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-0.5">
        <button
          v-for="d in days"
          :key="d.toISOString()"
          type="button"
          :class="[
            'flex size-8 items-center justify-center rounded text-xs',
            isSameMonth(d, viewDate)
              ? 'text-foreground'
              : 'text-muted-foreground/50',
            selected && isSameDay(d, selected)
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'hover:bg-accent',
          ]"
          @click="pick(d)"
        >
          {{ d.getDate() }}
        </button>
      </div>

      <div
        class="mt-2 flex items-center justify-between border-t pt-2 text-xs"
      >
        <button
          type="button"
          class="rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          @click="today"
        >
          {{ $t('orgEnergy.ui.today') }}
        </button>
        <button
          type="button"
          class="rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          @click="clearAndClose"
        >
          {{ $t('scene.ui.clear') }}
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
