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

const jsonData = computed({
  get() {
    try {
      const parsed = JSON.parse(props.config || '{}');
      return parsed.data || '';
    } catch {
      return '';
    }
  },
  set(val: string) {
    emit('update:config', JSON.stringify({ data: val }));
  },
});
</script>

<template>
  <NFormItem :label="t('platformManage.aiModel.jsonData')" label-placement="top">
    <NInput
      v-model:value="jsonData"
      type="textarea"
      :rows="12"
      placeholder='[{"name": "示例", "value": 100}]'
    />
  </NFormItem>
</template>
