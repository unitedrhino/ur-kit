<script setup lang="ts">
/** 文件说明：语义化单选项，状态由所属 RadioGroup 管理。 */
import { RadioGroupIndicator, RadioGroupItem } from 'reka-ui';
/** value 是提交值，disabled 保留不可用选项的说明与焦点顺序。 */
defineProps<{ value: string; disabled?: boolean; id?: string }>();
</script>
<template>
  <RadioGroupItem
    :id="id"
    :value="value"
    :disabled="disabled"
    class="border-input text-primary focus-visible:ring-ring size-4 shrink-0 rounded-full border focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <RadioGroupIndicator class="flex items-center justify-center"><span class="bg-primary size-2 rounded-full" /></RadioGroupIndicator>
  </RadioGroupItem>
</template>
