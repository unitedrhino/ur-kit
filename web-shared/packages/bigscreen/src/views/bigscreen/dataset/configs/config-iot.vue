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

const timeRangeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.lastHour'); }, value: '1h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.last6Hours'); }, value: '6h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.last24Hours'); }, value: '24h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.last7Days'); }, value: '7d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.last30Days'); }, value: '30d' },
];

interface IotConfig {
  deviceId: string;
  productId: string;
  property: string;
  timeRange: string;
}

const data = computed<IotConfig>({
  get() {
    try {
      return JSON.parse(props.config || '{}');
    } catch {
      return { deviceId: '', productId: '', property: '', timeRange: '24h' };
    }
  },
  set(val) {
    emit('update:config', JSON.stringify(val));
  },
});

function updateField(field: keyof IotConfig, value: string) {
  const current = { ...data.value };
  current[field] = value;
  emit('update:config', JSON.stringify(current));
}
</script>

<template>
  <NForm label-placement="left" label-width="100">
    <div class="grid grid-cols-2 gap-x-6">
      <NFormItem :label="t('iotApp.ota.colDeviceId')">
        <NInput
          :value="data.deviceId"
          :placeholder="t('bigscreenManagement.ui.enterDeviceID')"
          @update:value="(v: string) => updateField('deviceId', v)"
        />
      </NFormItem>
      <NFormItem :label="t('orgMall.devices.productId')">
        <NInput
          :value="data.productId"
          :placeholder="t('bigscreenManagement.ui.enterProductID')"
          @update:value="(v: string) => updateField('productId', v)"
        />
      </NFormItem>
    </div>
    <div class="grid grid-cols-2 gap-x-6">
      <NFormItem :label="t('iotApp.productPage.attrIdentifier')">
        <NInput
          :value="data.property"
          :placeholder="t('bigscreenManagement.ui.eGTemperature')"
          @update:value="(v: string) => updateField('property', v)"
        />
      </NFormItem>
      <NFormItem :label="t('iotApp.deviceDetail.timeRange')">
        <NSelect
          :value="data.timeRange || '24h'"
          :options="timeRangeOptions"
          @update:value="(v: string) => updateField('timeRange', v)"
        />
      </NFormItem>
    </div>
  </NForm>
</template>
