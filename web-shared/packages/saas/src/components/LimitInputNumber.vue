<script setup lang="ts">
import { computed } from 'vue';

import { NButton, NInputNumber } from 'naive-ui';

/**
 * 带"无限"切换按钮的数值输入组件
 * vben form 通过 baseModelPropName: 'value' 绑定，组件接收 value prop 并 emit update:value
 */
const props = withDefaults(
  defineProps<{
    value?: number;
    disabled?: boolean;
    min?: number;
    max?: number;
    placeholder?: string;
    unlimitedText?: string;
  }>(),
  {
    value: undefined,
    unlimitedText: '无限',
    min: -1,
    placeholder: '请输入',
  },
);

const emit = defineEmits<{
  'update:value': [value: number];
}>();

const isUnlimited = computed(() => props.value === -1);

function toggleUnlimited() {
  if (isUnlimited.value) {
    emit('update:value', 0);
  } else {
    emit('update:value', -1);
  }
}

function onInputUpdate(val: number | null) {
  emit('update:value', val ?? -1);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <NInputNumber
      :value="isUnlimited ? undefined : value"
      :disabled="disabled || isUnlimited"
      :min="min"
      :max="max"
      :placeholder="isUnlimited ? unlimitedText : placeholder"
      class="flex-1"
      @update:value="onInputUpdate"
    />
    <NButton size="small" :type="isUnlimited ? 'primary' : 'default'" @click="toggleUnlimited">
      {{ unlimitedText }}
    </NButton>
  </div>
</template>
