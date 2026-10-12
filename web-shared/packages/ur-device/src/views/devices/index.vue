<script lang="ts" setup>
import { ref, onMounted } from 'vue';

import { Page } from '@vben/common-ui';
import { NCard, NButton, NSpace, NButtonGroup } from 'naive-ui';

import DeviceGrid from './DeviceGrid.vue';
import DeviceCard from './DeviceCard.vue';
import { useDeviceForm } from './form';

import { MdiViewList, MdiViewGrid } from '@vben/icons';

const deviceGridRef = ref();
const deviceCardRef = ref();

// 视图模式：'table' 表格视图，'card' 卡片视图
const viewMode = ref<'table' | 'card'>('table');

// 使用表单配置
const { QueryForm } = useDeviceForm({
  onSubmit: (values) => getData(values),
});

function getData(values: Record<string, any>) {
  if (viewMode.value === 'table') {
    deviceGridRef.value?.updateQueryParams(values);
  } else {
    deviceCardRef.value?.loadCardData(values);
  }
}

onMounted(() => {
  getData({});
});
</script>

<template>
  <Page title="设备" auto-content-height>
    <!-- 视图切换按钮 -->
    <template #extra>
      <NSpace>
        <NButtonGroup>
          <NButton :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'"> <MdiViewList class="size-5" /> 表格视图 </NButton>
          <NButton :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'"> <MdiViewGrid class="size-5" /> 卡片视图 </NButton>
        </NButtonGroup>
      </NSpace>
    </template>

    <NCard>
      <QueryForm />
    </NCard>

    <NCard class="mt-5">
      <!-- 表格视图 -->
      <DeviceGrid v-if="viewMode === 'table'" ref="deviceGridRef" />

      <!-- 卡片视图 -->
      <DeviceCard v-else-if="viewMode === 'card'" ref="deviceCardRef" />
    </NCard>
  </Page>
</template>
