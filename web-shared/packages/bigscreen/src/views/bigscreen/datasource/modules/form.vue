<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script lang="ts" setup>
import { useLocalizedForm as useVbenForm } from '../../shared/manage-i18n';

import { $t as t } from '@vben/saas/locales';

import type { DataSourceInfo } from '../index.api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { message} from '@vben/saas';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useFormSchema } from '../data';
import { DataSourceApi } from '../index.api';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<DataSourceInfo>();
const testing = ref(false);
const testResult = ref<null | { message: string; success: boolean }>(null);
const currentType = ref<string>('');

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

// 根据数据源类型决定是否显示测试连接按钮
const showTestButton = computed(() => {
  return currentType.value !== 'mock' && currentType.value !== 'http';
});

const [Form, formApi] = useVbenForm(() => ({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema().map((field) => {
    if (field.fieldName === 'type') {
      return {
        ...field,
        componentProps: {
          ...field.componentProps,
          onChange: (value: string) => {
            currentType.value = value || '';
          },
        },
      };
    }
    return field;
  }),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
}));

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const info = drawerApi.getData<DataSourceInfo>();
      if (info && info.id) {
        loadDetail(info.id);
      } else {
        formData.value = undefined;
        formApi.resetForm();
      }
    }
  },
});

async function loadDetail(id: string) {
  try {
    const info = await DataSourceApi.detail(id);
    formData.value = info;
    formApi.setValues({
      name: info.name,
      type: info.type,
      desc: info.desc,
      config: {
        url: info.config?.url || '',
        mockData: info.config?.mockData || '',
        host: info.config?.host || '',
        port: info.config?.port || 3306,
        database: info.config?.database || '',
        username: info.config?.username || '',
        password: info.config?.password || '',
        charset: info.config?.charset || 'utf8mb4',
      },
    });
  } catch {
    message.error(t('bigscreenManagement.ui.failedLoadDataSourceDetails'));
  }
}

async function onTestConnection() {
  try {
    await formApi.validate();
  } catch {
    message.warning(t('bigscreenManagement.ui.completeConfigurationFirst'));
    return;
  }

  testing.value = true;
  testResult.value = null;
  try {
    let res;
    if (formData.value?.id) {
      // 已保存的数据源，使用 ID 测试
      res = await DataSourceApi.test(formData.value.id);
    } else {
      // 未保存的数据源，使用配置测试
      const values = await formApi.getValues<Record<string, any>>();
      res = await DataSourceApi.testConnection(values.type, values.config || {});
    }
    testResult.value = {
      success: res.success,
      message: res.success ? res.duration ? t('bigscreenManagement.dynamic.connectionDuration', { duration: res.duration }) : t('orgPark.ui.connected') : res.message || t('bigscreenManagement.ui.connectionFailed'),
    };
    if (res.success) {
      message.success(testResult.value.message);
    } else {
      message.warning(testResult.value.message);
    }
  } catch (error) {
    const errorMsg = (error as any).msg || (error as any).message || t('bigscreenManagement.ui.testFailed');
    testResult.value = { success: false, message: errorMsg };
    message.error(errorMsg);
  } finally {
    testing.value = false;
  }
}

// 敏感字段占位符：与后端 maskSensitiveConfig 保持一致
const MASKED_VALUE = '***';

/**
 * 清理配置中的脱敏占位符：编辑模式下用户未修改密码等敏感字段时，
 * 将值设为 MASKED_VALUE，由后端 mergeMaskedConfig 保留原始值
 */
function buildPayloadConfig(config: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...config };
  // 对于 mysql/postgres 类型，密码字段为 *** 表示未修改，保留占位符让后端处理
  // 后端 mergeMaskedConfig 会用数据库原始值替换 ***
  return result;
}

async function onSubmit() {
  try {
    await formApi.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  const values = await formApi.getValues<Record<string, any>>();

  const config = buildPayloadConfig(values.config || {});

  const payload: DataSourceInfo = {
    id: formData.value?.id,
    name: values.name,
    type: values.type,
    desc: values.desc,
    config,
  };

  try {
    if (formData.value?.id) {
      await DataSourceApi.update(payload);
      message.success(t('orgManage.common.updateSuccess'));
    } else {
      const res = await DataSourceApi.create(payload);
      formData.value = { ...payload, id: res.id };
      message.success(t('orgManage.common.createSuccess'));
    }
    drawerApi.close();
    emit('success');
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToSubmit', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    drawerApi.unlock();
  }
}

const getDrawerTitle = computed(() => (formData.value?.id ? t('platformManage.devops.editDatasource') : t('bigscreenManagement.ui.createDataSource')));
</script>

<template>
  <Drawer class="w-full max-w-[820px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
    <div v-if="showTestButton" class="mx-4 mt-4 flex items-center gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        :disabled="testing"
        @click="onTestConnection"
      >
        <span v-if="testing" class="icon-[mdi--loading] size-4 animate-spin"></span>
        <span v-else class="icon-[mdi--connection] size-4"></span>
        {{ testing ? t('bigscreenManagement.ui.testing') : t('bigscreenManagement.ui.testConnection') }}
      </button>
      <div v-if="testResult" class="flex items-center gap-2 text-sm">
        <span v-if="testResult.success" class="icon-[mdi--check-circle] size-5 text-green-600"></span>
        <span v-else class="icon-[mdi--alert-circle] size-5 text-red-600"></span>
        <span :class="testResult.success ? 'text-green-700' : 'text-red-700'">
          {{ testResult.message }}
        </span>
      </div>
    </div>
  </Drawer>
</template>
