<script lang="ts" setup>
import { computed, ref } from 'vue';

import { VbenButton } from '@vben-core/shadcn-ui';

import type { ClarifyData } from './api';

defineOptions({ name: 'AiToolDevConfirmation' });

const props = defineProps<{
  data: ClarifyData & { toolCallID: string };
}>();

const emit = defineEmits<{
  submit: [feedback: string, toolCallID: string];
}>();

const customInput = ref('');
const selectedOption = ref('');

const hasOptions = computed(() => props.data.options && props.data.options.length >= 2);

function handleConfirm() {
  const feedback = selectedOption.value || customInput.value || '确认';
  emit('submit', feedback, props.data.toolCallID);
}
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <div class="mb-3 font-medium">
      📋 {{ hasOptions ? '方案选择' : '需求确认' }}
    </div>
    <div class="mb-4 whitespace-pre-wrap text-sm text-muted-foreground">
      {{ data.question }}
    </div>

    <!-- 选项列表 -->
    <div v-if="hasOptions" class="mb-4 space-y-2">
      <label
        v-for="option in data.options"
        :key="option"
        class="flex cursor-pointer items-start gap-2 rounded border p-2 hover:bg-muted/50"
      >
        <input
          v-model="selectedOption"
          :value="option"
          class="mt-1"
          name="clarify-option"
          type="radio"
        />
        <span class="text-sm">{{ option }}</span>
      </label>
    </div>

    <!-- 自定义输入 -->
    <div v-if="!hasOptions || data.options.length <= 1" class="mb-4">
      <textarea
        v-model="customInput"
        class="w-full rounded border bg-background px-3 py-2 text-sm"
        placeholder="补充说明..."
        rows="3"
      />
    </div>

    <div class="flex justify-end gap-2">
      <VbenButton
        v-if="!hasOptions"
        size="sm"
        variant="default"
        @click="handleConfirm"
      >
        确认
      </VbenButton>
      <VbenButton
        v-if="hasOptions && !selectedOption"
        size="sm"
        variant="default"
        @click="handleConfirm"
      >
        确认选择
      </VbenButton>
    </div>
  </div>
</template>
