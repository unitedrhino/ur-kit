<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed } from 'vue';

import { NAlert, NButton, NDataTable, NDrawer, NDrawerContent } from 'naive-ui';

interface FieldSchema {
  fieldName: string;
  fieldType: string;
}

interface Props {
  show: boolean;
  loading?: boolean;
  error?: string;
  errorDetails?: string;
  rows?: Record<string, any>[];
  fields?: string[];
  to?: false | HTMLElement | string;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'saveSchema', schema: FieldSchema[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  errorDetails: '',
  rows: () => [],
  fields: () => [],
  to: undefined,
});

const emit = defineEmits<Emits>();

const drawerVisible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
});

// 推断字段类型
function inferFieldType(value: any): string {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'object') return 'object';
  return 'string';
}

// 生成 Schema
const fieldSchema = computed<FieldSchema[]>(() => {
  if (!props.rows || props.rows.length === 0) return [];
  const firstRow = props.rows[0];
  // rows 非空时 firstRow 理论上必存在，此守卫仅为满足严格索引类型收窄
  if (!firstRow) return [];
  return Object.keys(firstRow).map((key) => ({
    fieldName: key,
    fieldType: inferFieldType(firstRow[key]),
  }));
});

// 表格列
const columns = computed(() => {
  return props.fields.map((f) => ({ title: f, key: f }));
});

// 保存字段结构
function handleSaveSchema() {
  emit('saveSchema', fieldSchema.value);
  drawerVisible.value = false;
}
</script>

<template>
  <NDrawer v-model:show="drawerVisible" placement="bottom" height="60vh" :style="{ maxHeight: 'calc(100vh - 100px)' }" :to="to === false ? undefined : to">
    <!-- 成功状态 -->
    <NDrawerContent v-if="!error" :title="t('bigscreenManagement.ui.dataPreviewResult')">
      <div class="mb-4 flex justify-end">
        <NButton type="primary" size="small" @click="handleSaveSchema"> {{ t('bigscreenManagement.ui.saveFieldSchema') }} </NButton>
      </div>

      <div class="space-y-4">
        <!-- 字段结构 Schema -->
        <div v-if="fieldSchema.length > 0">
          <div class="mb-2 text-sm font-medium">{{ t('bigscreenManagement.ui.fieldSchema') }}</div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="field in fieldSchema"
              :key="field.fieldName"
              class="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-sm text-gray-200"
            >
              <span>{{ field.fieldName }}</span>
              <span class="mx-1 text-gray-500">:</span>
              <span class="text-blue-400">{{ field.fieldType }}</span>
            </div>
          </div>
        </div>

        <!-- 性能保护提示 -->
        <NAlert type="info" :bordered="false"> {{ t('bigscreenManagement.ui.performanceProtectionEnabledOnlyFirst20SampledRecords') }} </NAlert>

        <!-- 数据明细表格 -->
        <div>
          <div class="mb-2 text-sm font-medium">{{ t('bigscreenManagement.ui.dataDetails') }}</div>
          <NDataTable :columns="columns" :data="rows" :max-height="300" :scroll-x="columns.length * 150" striped size="small" />
          <div class="mt-2 text-xs text-gray-400">{{ t('knowledgeBase.text_3b6ef811b85a') }} {{ rows.length }} {{ t('bigscreenManagement.ui.records') }}{{ columns.length }} {{ t('bigscreenManagement.ui.fields') }}</div>
        </div>
      </div>
    </NDrawerContent>

    <!-- 错误状态 -->
    <NDrawerContent v-else :title="t('bigscreenManagement.ui.executionFailed')">
      <div class="space-y-4">
        <NAlert type="error" :title="t('bigscreenManagement.ui.failedExecuteDatasetPreview')"> {{ t('bigscreenManagement.ui.checkEndpointSQLSyntaxParameterFormatAndDatabase') }} </NAlert>

        <!-- 终端风格错误日志 -->
        <div class="max-h-64 overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-gray-100">
          <pre class="whitespace-pre-wrap">{{ errorDetails || error }}</pre>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
