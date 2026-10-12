<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 可搜索远程实体选择器。基于 Popover + Input 做一个轻量 combobox。
 * 主要给设备名称选择（按 productID + 关键词远程搜索）使用。
 */
import { computed, ref, watch } from 'vue';
import { Input, Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';

interface Option {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue?: string | number;
  displayValue?: string;
  options: Option[];
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  widthClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | undefined): void;
  (e: 'search', kw: string): void;
  (e: 'open'): void;
}>();

const open = ref(false);
const keyword = ref('');

const selectedLabel = computed(() => {
  if (props.displayValue) return props.displayValue;
  const hit = props.options.find((o) => String(o.value) === String(props.modelValue));
  return hit?.label || '';
});

watch(keyword, (v) => emit('search', v));

function pick(o: Option) {
  emit('update:modelValue', o.value);
  open.value = false;
}

function clear() {
  emit('update:modelValue', undefined);
}

watch(open, (v) => {
  if (v) emit('open');
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :class="[
          'flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          widthClass || 'w-full',
        ]"
      >
        <span v-if="selectedLabel" class="truncate text-foreground">{{ selectedLabel }}</span>
        <span v-else class="text-muted-foreground">{{ placeholder || $t('iotApp.av.pleaseSelect') }}</span>
        <span class="flex items-center gap-1">
          <span
            v-if="modelValue !== undefined && modelValue !== ''"
            class="icon-[mdi--close-circle] size-4 text-muted-foreground hover:text-foreground"
            @click.stop="clear"
          ></span>
          <span class="icon-[mdi--chevron-down] size-4 text-muted-foreground"></span>
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-72 p-2" align="start">
      <Input v-model="keyword" :placeholder="$t('orgEnergy.overview.search')" class="mb-2 h-8" />
      <div class="max-h-60 overflow-y-auto">
        <div v-if="loading" class="py-4 text-center text-xs text-muted-foreground">
          {{ $t('iotApp.av.loadingShort') }}
        </div>
        <div
          v-else-if="!options.length"
          class="py-4 text-center text-xs text-muted-foreground"
        >
          {{ $t('scene.ui.noData') }}
        </div>
        <button
          v-for="o in options"
          :key="String(o.value)"
          type="button"
          class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
          :class="{
            'bg-accent/60 font-medium':
              String(o.value) === String(modelValue),
          }"
          @click="pick(o)"
        >
          <span class="truncate">{{ o.label }}</span>
          <span
            v-if="String(o.value) === String(modelValue)"
            class="icon-[mdi--check] size-4 text-primary"
          ></span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
