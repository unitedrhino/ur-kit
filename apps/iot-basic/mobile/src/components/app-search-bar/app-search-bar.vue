<template>
<view class="app-search-bar">
  <view class="app-search-bar__inner">
    <app-icon class="app-search-bar__icon" name="tabler:search" :size="18" color="var(--text-placeholder)" />
    <input
      class="app-search-bar__input"
      :placeholder="placeholder"
      v-model="innerValue"
      :confirm-type="'search'"
      @confirm="onConfirm"
    />
  </view>
</view>
</template>

<script setup lang="ts">
import AppIcon from '../app-icon/app-icon.vue';
import { computed } from 'vue';
interface Props {
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
  (e: 'confirm', value: string): void;
}>();

/** 内部输入框的可写代理：v-model 写回 modelValue，同时保留原 input 事件兼容外部监听 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (v) => {
    emit('update:modelValue', v);
    emit('input', v);
  },
});

function onConfirm(e: any) {
  emit('confirm', (e && e.detail && e.detail.value) || '');
}
</script>

<style lang="scss" scoped>
.app-search-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 8px 16px 4px;
  background: var(--page-bg);
}

.app-search-bar__inner {
  flex: 1;
  display: flex;
  align-items: center;
  height: 36px;
  background: var(--card-bg);
  border-radius: var(--radius-full, 9999px);
  padding: 0 12px;
}

.app-search-bar__icon {
  margin-right: 6px;
  flex-shrink: 0;
}

.app-search-bar__input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 36px;
  line-height: 36px;
  padding: 0;
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}
</style>
