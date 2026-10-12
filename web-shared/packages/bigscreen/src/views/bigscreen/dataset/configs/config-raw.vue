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
  datasources?: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  'update:config': [value: string];
}>();

interface RawConfig {
  sourceId: string;
  tableName: string;
  columns: string;
}

const data = computed<RawConfig>({
  get() {
    try {
      return JSON.parse(props.config || '{}');
    } catch {
      return { sourceId: '', tableName: '', columns: '' };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

function updateField(field: keyof RawConfig, value: string) {
  const current = { ...data.value };
  current[field] = value;
  emit('update:config', JSON.stringify(current));
}
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
    <div class="grid grid-cols-2 gap-x-6">
      <NFormItem :label="t('platformManage.devops.tableName')">
        <NInput
          :value="data.tableName"
          :placeholder="t('bigscreenManagement.ui.tableName')"
          @update:value="(v: string) => updateField('tableName', v)"
        />
      </NFormItem>
      <NFormItem :label="t('bigscreenManagement.ui.queryColumns')">
        <NInput
          :value="data.columns"
          :placeholder="t('bigscreenManagement.ui.leaveBlankAllColumnsSeparateMultipleColumnsCommas')"
          @update:value="(v: string) => updateField('columns', v)"
        />
      </NFormItem>
    </div>
  </NForm>
</template>
