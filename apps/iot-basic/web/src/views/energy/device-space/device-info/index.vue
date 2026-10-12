<!-- org-iot-client 设备属性看板页：只承载设备详情中的 attrs 看板能力。 -->
<script lang="ts" setup>
import type { ThingsApi } from '@vben/api';

import { computed, defineAsyncComponent, markRaw, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';

import { $t } from '@vben/locales';

import { Page } from '@vben/common-ui';
import { BackTitle, SaasAvatar } from '@vben/saas';

import { Badge, Button, Card, CardContent, VbenSpinner } from '@vben-core/shadcn-ui';

import { DeviceInfoApi } from './index.api';

const route = useRoute();
const AttrsDashboard = markRaw(defineAsyncComponent(() => import('./attrs/index.vue')));

/** firstRouteParam 统一处理 vue-router 可能返回数组的路由参数。 */
function firstRouteParam(value: unknown) {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

const deviceName = computed(() => firstRouteParam(route.params.deviceName));
const productID = computed(() => firstRouteParam(route.params.productID));

const deviceInfo = ref<null | ThingsApi.DeviceInfo>(null);
const deviceInfoLoading = ref(false);
const deviceInfoError = ref<Error | null>(null);

const deviceSchema = ref<null | ThingsApi.DeviceSchema[]>(null);
const deviceSchemaLoading = ref(false);
const deviceSchemaError = ref<Error | null>(null);

provide('deviceInfo', deviceInfo);
provide('deviceInfoLoading', deviceInfoLoading);
provide('deviceInfoError', deviceInfoError);
provide('refreshDeviceInfo', fetchDeviceInfo);

provide('deviceSchema', deviceSchema);
provide('deviceSchemaLoading', deviceSchemaLoading);
provide('deviceSchemaError', deviceSchemaError);
provide('refreshDeviceSchema', fetchDeviceInfo);

const statusInfo = computed(() => {
  const status = Number(deviceInfo.value?.status);
  if (status === 2) return { class: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600', label: $t('orgIotClient.deviceStatus.online') };
  if (status === 3) return { class: 'border-muted bg-muted text-muted-foreground', label: $t('orgIotClient.deviceStatus.offline') };
  if (status === 1) return { class: 'border-amber-500/20 bg-amber-500/15 text-amber-600', label: $t('orgIotClient.deviceStatus.inactive') };
  if (status === 4) return { class: 'border-destructive/20 bg-destructive/15 text-destructive', label: $t('orgIotClient.deviceStatus.fault') };
  return { class: 'border-muted bg-muted text-muted-foreground', label: $t('orgIotClient.deviceSpace.unknown') };
});

const deviceTypeInfo = computed(() => {
  const type = Number(deviceInfo.value?.deviceType);
  const typeMap: Record<number, { class: string; label: string }> = {
    1: { class: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600', label: $t('iotApp.productPage.deviceTypeDirect') },
    2: { class: 'border-amber-500/20 bg-amber-500/15 text-amber-600', label: $t('iotApp.productPage.deviceTypeGateway') },
    3: { class: 'border-sky-500/20 bg-sky-500/15 text-sky-600', label: $t('iotApp.productPage.deviceTypeSub') },
    4: { class: 'border-violet-500/20 bg-violet-500/15 text-violet-600', label: $t('iotApp.deviceDetail.monitorDevice') },
  };
  return typeMap[type] || { class: 'border-muted bg-muted text-muted-foreground', label: $t('iotApp.deviceDetail.typeUnknown') };
});

/** fetchDeviceInfo 同步读取设备详情与物模型，供看板和历史分析共享。 */
async function fetchDeviceInfo() {
  if (!deviceName.value || !productID.value) return;

  try {
    deviceInfoLoading.value = true;
    deviceSchemaLoading.value = true;
    deviceInfoError.value = null;
    deviceSchemaError.value = null;

    const [info, schemaResponse] = await Promise.all([
      DeviceInfoApi.getDeviceInfoWithProperties(deviceName.value, productID.value),
      DeviceInfoApi.getDeviceSchemas(deviceName.value, productID.value),
    ]);
    deviceInfo.value = info;
    deviceSchema.value = schemaResponse?.list ?? [];
  } catch (error) {
    deviceInfoError.value = error as Error;
    deviceSchemaError.value = error as Error;
  } finally {
    deviceInfoLoading.value = false;
    deviceSchemaLoading.value = false;
  }
}

onMounted(fetchDeviceInfo);
</script>

<template>
  <Page>
    <Card>
      <CardContent class="p-6">
        <BackTitle title="">
          <div v-if="deviceInfo" class="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <SaasAvatar :avatar="deviceInfo.productImg" :name="deviceInfo.productName || deviceInfo.deviceName" :size="40" class="shrink-0 rounded-lg" />
              <div class="flex min-w-0 flex-col gap-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="truncate text-base font-semibold leading-none">{{ deviceInfo.deviceAlias || deviceInfo.deviceName || $t('iotApp.deviceDetail.unnamedDevice') }}</span>
                  <Badge variant="outline" :class="statusInfo.class">{{ statusInfo.label }}</Badge>
                  <Badge v-if="deviceInfo.deviceType" variant="outline" :class="deviceTypeInfo.class">{{ deviceTypeInfo.label }}</Badge>
                </div>
                <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-none">
                  <span>{{ $t('orgIotClient.deviceSpace.deviceIdValue', { value: deviceInfo.deviceName || '--' }) }}</span>
                  <span>{{ $t('orgIotClient.deviceSpace.productWithValue', { name: deviceInfo.productName || '--', id: deviceInfo.productID || '--' }) }}</span>
                  <span v-if="deviceInfo.projectID">{{ $t('orgIotClient.deviceSpace.projectIdValue', { value: deviceInfo.projectID }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </BackTitle>

        <div v-if="deviceInfoLoading" class="mt-4 flex min-h-[320px] flex-col items-center justify-center py-12">
          <VbenSpinner />
          <p class="text-muted-foreground mt-4 text-sm">{{ $t('orgIotClient.deviceSpace.loadingBoard') }}</p>
        </div>

        <div v-else-if="deviceInfoError" class="border-destructive/30 bg-destructive/5 mt-4 rounded-lg border p-4">
          <div class="text-destructive flex items-center gap-2">
            <span class="icon-[mdi--alert-circle-outline] size-5"></span>
            <span class="font-medium">{{ $t('orgIotClient.deviceSpace.loadBoardFailed') }}</span>
          </div>
          <p class="text-muted-foreground mt-2 text-sm">{{ deviceInfoError.message }}</p>
          <Button variant="outline" size="sm" class="mt-3" @click="fetchDeviceInfo">
            <span class="icon-[mdi--refresh] mr-1"></span>
            {{ $t('iotApp.cardDetail.retry') }}
          </Button>
        </div>

        <div v-else-if="deviceInfo" class="mt-6 min-h-[600px]">
          <AttrsDashboard />
        </div>
      </CardContent>
    </Card>
  </Page>
</template>
