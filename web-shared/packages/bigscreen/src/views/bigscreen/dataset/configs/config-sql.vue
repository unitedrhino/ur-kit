<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed, ref, watch } from 'vue';

import {
  NAlert,
  NForm,
  NFormItem,
  NInput,
  NSelect,
} from 'naive-ui';

const props = defineProps<{
  config: string;
  datasources?: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  'update:config': [value: string];
}>();

interface SqlConfig {
  sourceId: string;
  query: string;
}

// SQL 只读校验警告（与后端 isReadOnlyQuery 保持同步）
const sqlWarning = ref('');
const SQL_READONLY_PATTERN = /^\s*(SELECT|WITH\s|EXPLAIN\s)/i;

function validateSqlReadOnly(query: string) {
  if (!query || !query.trim()) {
    sqlWarning.value = '';
    return;
  }
  // 去除 SQL 注释后判断前缀
  const cleaned = query.replace(/\/\*.*?\*\//g, ' ').replace(/--.*$/gm, ' ').trim();
  if (!SQL_READONLY_PATTERN.test(cleaned)) {
    sqlWarning.value = t('bigscreenManagement.ui.nonSELECTQueryWasDetectedAndServerWill');
  } else {
    sqlWarning.value = '';
  }
}

const data = computed<SqlConfig>({
  get() {
    try {
      return JSON.parse(props.config || '{}');
    } catch {
      return { sourceId: '', query: '' };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

function updateField(field: keyof SqlConfig, value: string) {
  const current = { ...data.value };
  current[field] = value;
  emit('update:config', JSON.stringify(current));
}

// 监听 SQL 变化实时校验
watch(
  () => data.value.query,
  (val) => validateSqlReadOnly(val),
  { immediate: true },
);
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <NFormItem :label="t('bigscreenManagement.ui.dataSource')">
      <NSelect
        :value="data.sourceId || undefined"
        :options="datasources"
        clearable
        :placeholder="t('bigscreenManagement.ui.selectDataSource')"
        @update:value="(v: string) => updateField('sourceId', v)"
      />
    </NFormItem>
    <NFormItem :label="t('bigscreenManagement.ui.sqlStatement')">
      <NInput
        :value="data.query"
        type="textarea"
        :rows="8"
        placeholder="SELECT * FROM table_name WHERE ..."
        @update:value="(v: string) => updateField('query', v)"
      />
    </NFormItem>
    <NAlert v-if="sqlWarning" type="warning" :bordered="false" class="mb-2" style="margin-top: -8px;">
      {{ sqlWarning }}
    </NAlert>
  </NForm>
</template>
