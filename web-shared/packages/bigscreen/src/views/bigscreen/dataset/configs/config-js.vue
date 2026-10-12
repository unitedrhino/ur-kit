<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed } from 'vue';

import { NFormItem, NInput } from 'naive-ui';

const props = defineProps<{
  config: string;
}>();

const emit = defineEmits<{
  'update:config': [value: string];
}>();

const code = computed({
  get() {
    try {
      const parsed = JSON.parse(props.config || '{}');
      return parsed.code || '';
    } catch {
      return '';
    }
  },
  set(val: string) {
    emit('update:config', JSON.stringify({ code: val }));
  },
});
</script>

<template>
  <NFormItem :label="t('bigscreenManagement.ui.javascriptCode')" label-placement="top">
    <NInput
      v-model:value="code"
      type="textarea"
      :rows="12"
      placeholder="// 返回数组格式数据
return [
  { name: '示例', value: 100 },
  { name: '示例2', value: 200 },
];"
      style="font-family: monospace"
    />
  </NFormItem>
</template>
