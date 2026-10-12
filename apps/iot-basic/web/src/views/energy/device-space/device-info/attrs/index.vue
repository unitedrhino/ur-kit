<!-- 设备属性看板：展示当前属性值，并提供历史属性分析入口。 -->
<script lang="ts" setup>
import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NButton, NCard, NGrid, NGridItem, NSpace } from 'naive-ui';

import { useDeviceInfo } from '../useDeviceInfo';
import PropertiesHistoryModal from './propertiesHistoryModal.vue';

const { deviceInfo, deviceSchema, refreshDeviceInfo } = useDeviceInfo();

const [PropertiesHistoryModalComponent, propertiesHistoryModalApi] = useVbenModal({
  connectedComponent: PropertiesHistoryModal,
  destroyOnClose: true,
});

function parseAffordance(value: unknown) {
  if (typeof value !== 'string' || !value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

const propertiesWithNames = computed(() => {
  return Object.entries(deviceInfo?.value?.withProperties || {}).map(([key, value]: [string, any]) => {
    const schema = deviceSchema?.value?.find((item) => item.identifier === key);
    return {
      affordance: parseAffordance(schema?.affordance),
      identifier: key,
      lastUpdateTime: value?.timestamp,
      name: schema?.name || key,
      value: value?.value,
    };
  });
});

/** handlePropertiesHistory 打开历史属性分析，传入标识符时默认选中该属性。 */
function handlePropertiesHistory(identifier?: string) {
  propertiesHistoryModalApi
    .setData({
      deviceName: deviceInfo?.value?.deviceName || '',
      identifier,
      productID: deviceInfo?.value?.productID || '',
    })
    .open();
}

function onRefresh() {
  refreshDeviceInfo?.();
}
</script>

<template>
  <div class="mt-2 flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col">
        <div class="text-lg font-bold">{{ $t('iotApp.deviceDetail.deviceProps') }}</div>
        <div class="text-muted-foreground mt-1 text-xs">{{ $t('orgIotClient.deviceSpace.propsDesc') }}</div>
      </div>

      <NSpace>
        <NButton size="small" tertiary @click="handlePropertiesHistory()">
          <template #icon>
            <span class="icon-[mdi--history]"></span>
          </template>
          {{ $t('orgIotClient.deviceSpace.historyAnalysis') }}
        </NButton>

        <NButton size="small" tertiary @click="onRefresh">
          <template #icon>
            <span class="icon-[mdi--refresh]"></span>
          </template>
          {{ $t('iotApp.common.refresh') }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="propertiesWithNames.length > 0" class="mt-2">
      <NGrid cols="1 s:2 m:3 l:3 xl:4" :x-gap="16" :y-gap="16" responsive="screen">
        <NGridItem v-for="item in propertiesWithNames" :key="item.identifier">
          <NCard hoverable class="cursor-pointer transition-shadow duration-200 hover:shadow-md" @click="handlePropertiesHistory(item.identifier)">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="min-w-0 truncate text-base font-semibold">
                  {{ item.name }}
                  <span class="text-muted-foreground text-xs">({{ item.identifier }})</span>
                </div>
              </div>
            </template>
            <div class="min-h-[60px] text-sm">
              <div class="mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ $t('orgIotClient.deviceSpace.latestValue', { value: item.value ?? '--' }) }}</div>
              <div class="text-muted-foreground mb-1 text-xs">{{ $t('orgIotClient.deviceSpace.typeValue', { value: item.affordance?.define?.type || '--' }) }}</div>
              <div class="text-muted-foreground text-xs">
                {{ $t('orgIotClient.deviceSpace.updateTimeValue', { value: item.lastUpdateTime ? new Date(Number(item.lastUpdateTime)).toLocaleString() : '--' }) }}
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <NCard v-else class="mt-2 min-h-[280px]">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <span class="icon-[mdi--tune-variant] text-muted-foreground/40 mb-4 text-6xl"></span>
        <h3 class="text-foreground mb-2 text-lg font-semibold">{{ $t('iotApp.deviceDetail.noPropData') }}</h3>
        <p class="text-muted-foreground mb-6 max-w-sm text-sm">{{ $t('orgIotClient.deviceSpace.noPropDataDesc') }}</p>
        <NButton type="primary" size="medium" @click="onRefresh">
          <template #icon>
            <span class="icon-[mdi--refresh]"></span>
          </template>
          {{ $t('iotApp.common.refresh') }}
        </NButton>
      </div>
    </NCard>

    <PropertiesHistoryModalComponent />
  </div>
</template>
