<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { computed, h, ref } from 'vue';

import { NButton, NDataTable, NInput, NInputNumber, NSelect, NSpace } from 'naive-ui';

interface DynamicParam {
  name: string;
  label: string;
  type: 'boolean' | 'date' | 'number' | 'select' | 'text';
  default: any;
  options?: { label: string; value: any }[];
  required?: boolean;
}

const props = defineProps<{
  value: string;
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const params = ref<DynamicParam[]>([]);

// 解析 JSON 到表格
const parseParams = () => {
  try {
    const parsed = JSON.parse(props.value || '{}');
    params.value = Object.keys(parsed).map((key) => ({
      name: key,
      label: parsed[key].label || key,
      type: parsed[key].type || 'text',
      default: parsed[key].default,
      options: parsed[key].options,
      required: parsed[key].required,
    }));
  } catch {
    params.value = [];
  }
};

// 序列化表格到 JSON
const serializeParams = () => {
  const result: Record<string, any> = {};
  params.value.forEach((param) => {
    result[param.name] = {
      label: param.label,
      type: param.type,
      default: param.default,
      ...(param.options && { options: param.options }),
      ...(param.required && { required: param.required }),
    };
  });
  emit('update:value', JSON.stringify(result, null, 2));
};

// 添加参数
const addParam = () => {
  params.value.push({
    name: `param${params.value.length + 1}`,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.newParameter'); },
    type: 'text',
    default: '',
  });
  serializeParams();
};

// 删除参数
const deleteParam = (index: number) => {
  params.value.splice(index, 1);
  serializeParams();
};

// 更新参数
const updateParam = () => {
  serializeParams();
};

// 初始化
parseParams();

const typeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.text'); }, value: 'text' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.fcNumber'); }, value: 'number' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.fcDate'); }, value: 'date' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.fcSelect'); }, value: 'select' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.boolean'); }, value: 'boolean' },
];

const columns = computed(() => [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.variableName'); },
    key: 'name',
    width: 150,
    render: (row: DynamicParam, index: number) => {
      return h(NInput, {
        value: row.name,
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.variableName'); },
        onUpdateValue: (v: string) => {
          const target = params.value[index];
          if (!target) return; // 行可能已被并发删除，越界时跳过更新
          target.name = v;
          updateParam();
        },
      });
    },
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('platformManage.devops.displayName'); },
    key: 'label',
    width: 150,
    render: (row: DynamicParam, index: number) => {
      return h(NInput, {
        value: row.label,
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('platformManage.devops.displayName'); },
        onUpdateValue: (v: string) => {
          const target = params.value[index];
          if (!target) return; // 行可能已被并发删除，越界时跳过更新
          target.label = v;
          updateParam();
        },
      });
    },
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('iotApp.schemaForm.dataTypeLabel'); },
    key: 'type',
    width: 120,
    render: (row: DynamicParam, index: number) => {
      return h(NSelect, {
        value: row.type,
        options: typeOptions,
        onUpdateValue: (v: string) => {
          const target = params.value[index];
          if (!target) return; // 行可能已被并发删除，越界时跳过更新
          target.type = v as any;
          updateParam();
        },
      });
    },
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.defaultValue'); },
    key: 'default',
    width: 150,
    render: (row: DynamicParam, index: number) => {
      if (row.type === 'number') {
        return h(NInputNumber, {
          value: row.default,
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.defaultValue'); },
          onUpdateValue: (v: number | null) => {
            const target = params.value[index];
            if (!target) return; // 行可能已被并发删除，越界时跳过更新
            target.default = v;
            updateParam();
          },
        });
      }
      return h(NInput, {
        value: row.default,
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.defaultValue'); },
        onUpdateValue: (v: string) => {
          const target = params.value[index];
          if (!target) return; // 行可能已被并发删除，越界时跳过更新
          target.default = v;
          updateParam();
        },
      });
    },
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.common.operation'); },
    key: 'actions',
    width: 80,
    render: (_row: DynamicParam, index: number) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          text: true,
          onClick: () => deleteParam(index),
        },
        { default: () => t('orgManage.common.delete') },
      );
    },
  },
]);
</script>

<template>
  <div class="dynamic-params-builder">
    <NSpace vertical>
      <NButton size="small" @click="addParam">{{ t('bigscreenManagement.ui.addParameter') }}</NButton>
      <NDataTable :columns="columns" :data="params" :max-height="300" size="small" :bordered="false" />
    </NSpace>
  </div>
</template>
