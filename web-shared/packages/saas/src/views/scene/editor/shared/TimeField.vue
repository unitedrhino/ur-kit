<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 时间选择 —— shadcn 风格 Popover + 时:分 NumberField 步进。
 * 存储为毫秒时间戳（今日 + 选择的时:分），与旧 ProTime 保持一致。
 */
import { computed, ref, watch } from 'vue';

import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@vben-core/shadcn-ui';

const props = defineProps<{
  modelValue?: number;
  placeholder?: string;
  disabled?: boolean;
  widthClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | undefined): void;
}>();

const open = ref(false);
const hour = ref(0);
const minute = ref(0);

function syncFrom(v?: number) {
  if (!v) {
    hour.value = 0;
    minute.value = 0;
    return;
  }
  const d = new Date(v);
  hour.value = d.getHours();
  minute.value = d.getMinutes();
}
syncFrom(props.modelValue);
watch(
  () => props.modelValue,
  (v) => syncFrom(v),
);

const displayText = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) return '';
  const d = new Date(props.modelValue);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});

function commit() {
  const d = new Date();
  d.setHours(hour.value || 0, minute.value || 0, 0, 0);
  emit('update:modelValue', d.getTime());
}

function clear(e: Event) {
  e.stopPropagation();
  emit('update:modelValue', undefined);
}

function confirm() {
  commit();
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
          placeholder || $t('scene.ui.selectTime')
        }}</span>
        <span class="flex items-center gap-1 text-muted-foreground">
          <span
            v-if="displayText"
            class="icon-[mdi--close-circle] size-4 opacity-0 transition group-hover:opacity-100 hover:text-foreground"
            @click="clear"
          ></span>
          <span class="icon-[mdi--clock-outline] size-4"></span>
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-[240px] p-3" align="start">
      <div class="flex items-center gap-2">
        <NumberField
          v-model="hour"
          :min="0"
          :max="23"
          :step="1"
          class="flex-1"
          @update:model-value="commit"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput class="text-center" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        <span class="font-bold text-muted-foreground">:</span>
        <NumberField
          v-model="minute"
          :min="0"
          :max="59"
          :step="1"
          class="flex-1"
          @update:model-value="commit"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput class="text-center" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
      <div class="mt-2 flex items-center justify-between border-t pt-2 text-xs">
        <span class="text-muted-foreground">{{ $t('scene.ui.hourMinute') }}</span>
        <button
          type="button"
          class="rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90"
          @click="confirm"
        >
          {{ $t('iotApp.devicePage.confirm') }}
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
