<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed } from 'vue';

import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
} from 'naive-ui';

const props = defineProps<{
  config: string;
}>();

const emit = defineEmits<{
  'update:config': [value: string];
}>();

const scriptTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.esScript'); }, value: 'es' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.mongodbScript'); }, value: 'mongo' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.customScript'); }, value: 'custom' },
];

interface ScriptConfig {
  scriptType: string;
  code: string;
}

const data = computed<ScriptConfig>({
  get() {
    try {
      return JSON.parse(props.config || '{}');
    } catch {
      return { scriptType: 'custom', code: '' };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

function updateField(field: keyof ScriptConfig, value: string) {
  const current = { ...data.value };
  current[field] = value;
  emit('update:config', JSON.stringify(current));
}
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NFormItem :label="t('iotApp.productPage.scriptType')">
      <NSelect
        :value="data.scriptType || 'custom'"
        :options="scriptTypeOptions"
        @update:value="(v: string) => updateField('scriptType', v)"
      />
    </NFormItem>
    <NFormItem :label="t('bigscreenManagement.ui.scriptCode')" label-placement="top">
      <NInput
        :value="data.code"
        type="textarea"
        :rows="12"
        :placeholder="t('bigscreenManagement.ui.enterScriptCode')"
        style="font-family: monospace"
        @update:value="(v: string) => updateField('code', v)"
      />
    </NFormItem>
  </NForm>
</template>
