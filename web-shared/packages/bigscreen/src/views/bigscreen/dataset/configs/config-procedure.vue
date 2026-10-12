<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed } from 'vue';

import {
  NButton,
  NDynamicInput,
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

interface ProcedureParam {
  name: string;
  value: string;
}

interface ProcedureConfig {
  sourceId: string;
  procedureName: string;
  params: ProcedureParam[];
}

const data = computed<ProcedureConfig>({
  get() {
    try {
      const parsed = JSON.parse(props.config || '{}');
      return {
        sourceId: parsed.sourceId || '',
        procedureName: parsed.procedureName || '',
        params: Array.isArray(parsed.params) ? parsed.params : [],
      };
    } catch {
      return { sourceId: '', procedureName: '', params: [] };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

function updateField(field: 'procedureName' | 'sourceId', value: string) {
  emit('update:config', JSON.stringify({ ...data.value, [field]: value }));
}

function updateParams(params: ProcedureParam[]) {
  emit('update:config', JSON.stringify({ ...data.value, params }));
}

function onCreate() {
  return { name: '', value: '' };
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
    <NFormItem :label="t('bigscreenManagement.ui.storedProcedureName')">
      <NInput
        :value="data.procedureName"
        placeholder="CALL procedure_name"
        @update:value="(v: string) => updateField('procedureName', v)"
      />
    </NFormItem>
    <NFormItem :label="t('bigscreenManagement.ui.parameters')">
      <NDynamicInput
        :value="data.params"
        :on-create="onCreate"
        @update:value="(params) => updateParams(params as ProcedureParam[])"
      >
        <template #default="{ value: item }">
          <div class="flex w-full gap-2">
            <NInput
              v-model:value="item.name"
              :placeholder="t('knowledgeBase.text_ecb6c72b4c56')"
              class="flex-1"
            />
            <NInput
              v-model:value="item.value"
              :placeholder="t('scene.ui.parameterValue')"
              class="flex-1"
            />
          </div>
        </template>
      </NDynamicInput>
    </NFormItem>
  </NForm>
</template>
