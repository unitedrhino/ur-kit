<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed } from 'vue';

import {
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTag,
} from 'naive-ui';

const props = defineProps<{
  config: string;
  sourceId?: string;
  datasources?: { label: string; url: string; value: string }[];
}>();

const emit = defineEmits<{
  'update:config': [value: string];
  'update:sourceId': [value: string | undefined];
}>();

interface HttpConfig {
  url: string;
  method: string;
  headers: string;
  body: string;
  contentType: string;
}

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

const contentTypeOptions = [
  { label: 'application/json', value: 'application/json' },
  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
  { label: 'multipart/form-data', value: 'multipart/form-data' },
];

const data = computed<HttpConfig>({
  get() {
    try {
      return JSON.parse(props.config || '{}');
    } catch {
      return { url: '', method: 'GET', headers: '', body: '', contentType: 'application/json' };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

// 当前选中数据源的 baseUrl
const baseUrl = computed(() => {
  if (!props.sourceId || !props.datasources) return '';
  const ds = props.datasources.find((d) => d.value === props.sourceId);
  return ds?.url || '';
});

function updateField(field: keyof HttpConfig, value: string) {
  const current = { ...data.value };
  current[field] = value;
  emit('update:config', JSON.stringify(current));
}

function onSourceChange(value: string | undefined) {
  emit('update:sourceId', value);
}
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NFormItem :label="t('bigscreenManagement.ui.bindDataSource')" required>
      <NSelect
        :value="sourceId"
        :options="datasources"
        clearable
        :placeholder="t('bigscreenManagement.ui.selectDataSourceRequired')"
        @update:value="onSourceChange"
      />
    </NFormItem>
    <NFormItem v-if="baseUrl" :label="t('bigscreenManagement.ui.baseURL')">
      <div class="flex items-center gap-2">
        <NTag type="info" size="small">{{ baseUrl }}</NTag>
        <span class="text-xs text-gray-400">{{ t('bigscreenManagement.ui.enterRelativePathBelowItWillBeAppended') }}</span>
      </div>
    </NFormItem>
    <NFormItem :label="t('bigscreenManagement.ui.requestPath')">
      <NInput
        :value="data.url"
        :placeholder="baseUrl ? '/api/v1/things/device/msg/...' : t('bigscreenManagement.ui.bindDataSourceBeforeEnteringRelativePath')"
        @update:value="(v: string) => updateField('url', v)"
      />
    </NFormItem>
    <div class="grid grid-cols-2 gap-x-6">
      <NFormItem :label="t('bigscreenManagement.ui.requestMethod')">
        <NSelect
          :value="data.method || 'GET'"
          :options="methodOptions"
          @update:value="(v: string) => updateField('method', v)"
        />
      </NFormItem>
      <NFormItem label="Content-Type">
        <NSelect
          :value="data.contentType || 'application/json'"
          :options="contentTypeOptions"
          @update:value="(v: string) => updateField('contentType', v)"
        />
      </NFormItem>
    </div>
    <NFormItem :label="t('bigscreenManagement.ui.requestHeaders')">
      <NInput
        :value="data.headers"
        type="textarea"
        :rows="3"
        placeholder='{"Authorization": "Bearer xxx"}'
        @update:value="(v: string) => updateField('headers', v)"
      />
    </NFormItem>
    <NFormItem :label="t('bigscreenManagement.ui.requestBody')">
      <NInput
        :value="data.body"
        type="textarea"
        :rows="4"
        :placeholder="t('bigscreenManagement.ui.postRequestBody')"
        @update:value="(v: string) => updateField('body', v)"
      />
    </NFormItem>
  </NForm>
</template>
