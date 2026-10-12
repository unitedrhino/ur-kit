<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import { VbenButton } from '@vben-core/shadcn-ui';

defineOptions({ name: 'AiToolDevInput' });

const props = defineProps<{
  disabled?: boolean;
  modelValue?: string;
}>();

const emit = defineEmits<{
  send: [text: string];
  'update:modelValue': [value: string];
}>();

const inputRef = ref<HTMLTextAreaElement>();

const inputText = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val),
});

const chips = [
  { label: '补充输入参数', suffix: '\n\n输入参数：\n- ' },
  { label: '补充输出格式', suffix: '\n\n输出格式：\n' },
  { label: '补充使用场景', suffix: '\n\n使用场景：\n' },
];

function handleSend() {
  if (props.disabled) return;
  const text = inputText.value.trim();
  if (!text) return;
  emit('send', text);
  emit('update:modelValue', '');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

/** 按内容自动增高 textarea（上限约 8 行），超出后组件内部滚动，避免长文本溢出不可见 */
function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
}

function appendSuffix(suffix: string) {
  const newText = inputText.value + suffix;
  emit('update:modelValue', newText);
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto';
      inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 192)}px`;
      inputRef.value.focus();
    }
  });
}
</script>

<template>
  <div class="border-t p-3" data-testid="ai-tool-dev-input">
    <div class="mb-2 flex flex-wrap gap-2">
      <button
        v-for="chip in chips"
        :key="chip.label"
        type="button"
        class="text-muted-foreground bg-background hover:bg-muted/50 rounded border px-2 py-1 text-xs disabled:opacity-50"
        :disabled="props.disabled"
        @click="appendSuffix(chip.suffix)"
      >
        {{ chip.label }}
      </button>
    </div>
    <div class="flex items-end gap-2">
      <textarea
        ref="inputRef"
        v-model="inputText"
        :disabled="props.disabled"
        class="bg-background max-h-32 min-h-[40px] flex-1 resize-none rounded border px-3 py-2 text-sm disabled:opacity-50"
        data-testid="ai-tool-dev-input-textarea"
        placeholder="描述你的工具需求，或要求修改已有工具..."
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
      />
      <VbenButton :disabled="!inputText.trim() || props.disabled" size="sm" @click="handleSend"> 发送 </VbenButton>
    </div>
  </div>
</template>
