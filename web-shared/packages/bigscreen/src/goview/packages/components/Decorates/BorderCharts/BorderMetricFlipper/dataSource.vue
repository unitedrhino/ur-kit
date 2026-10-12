<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue';

import { computed, onMounted, ref } from 'vue';

import { getUserAreaTree } from '@/api/thingsDevice';
import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting';

const props = defineProps({
  optionData: {
    type: Object as PropType<any>,
    required: true,
  },
});

const aggCfg = computed(() => props.optionData.aggDataSource);

const loadingAreas = ref(false);
const areaOptions = ref<{ label: string; value: string }[]>([]);

const intervalUnitOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitDay'); }, value: 'd' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitHour'); }, value: 'h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitMinute'); }, value: 'm' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.monthSuffix'); }, value: 'n' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.weekSuffix'); }, value: 'w' },
];

const timeRangeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPastDay'); }, value: '1d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenManagement.ui.last7Days'); }, value: '7d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenManagement.ui.last30Days'); }, value: '30d' },
];

const loadAreas = async () => {
  loadingAreas.value = true;
  try {
    const res: any = await getUserAreaTree();
    const list = res?.list ?? res?.data?.list ?? [];
    const flat: { label: string; value: string }[] = [];
    const walk = (items: any[]) => {
      for (const item of items) {
        flat.push({ label: item.areaName || item.areaID, value: String(item.areaID) });
        if (Array.isArray(item.children)) walk(item.children);
      }
    };
    walk(Array.isArray(list) ? list : []);
    areaOptions.value = flat;
  } catch (error) {
    console.warn('[BorderMetricFlipper] 加载区域列表失败:', error);
  } finally {
    loadingAreas.value = false;
  }
};

onMounted(() => {
  loadAreas();
});
</script>

<template>
  <!-- 聚合数据源配置 -->
  <CollapseItem :name="editorT('bigscreenManagement.ui.dataSource')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAggregationAPI')">
      <SettingItem>
        <n-space>
          <n-switch v-model:value="aggCfg.enabled" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentEnableBuiltInDataSource') }}</n-text>
        </n-space>
      </SettingItem>
      <template v-if="aggCfg.enabled">
        <SettingItem :name="editorT('iot.category.categoryId')">
          <n-input-number v-model:value="aggCfg.productCategoryID" size="small" :min="0" :placeholder="editorT('bigscreenEditor.ui.componentEG7ElectricityMeter')" />
        </SettingItem>
        <SettingItem :name="editorT('iotApp.productPage.productId')">
          <n-input v-model:value="aggCfg.productID" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEG66TakesPriorityOverCategory')" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentAreaIDs')">
          <n-select v-model:value="aggCfg.areaIDs" :options="areaOptions" :loading="loadingAreas" size="small" :placeholder="editorT('orgIotClient.console.selectAreaTitle')" multiple filterable />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentPropertyDataID')">
          <n-input v-model:value="aggCfg.dataID" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEGPs')" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.aggregationInterval')">
          <n-input-group>
            <n-input-number v-model:value="aggCfg.interval" size="small" :min="1" :max="365" style="width: 50%" />
            <n-select v-model:value="aggCfg.intervalUnit" size="small" :options="intervalUnitOptions" style="width: 50%" />
          </n-input-group>
        </SettingItem>
        <SettingItem :name="editorT('iotApp.deviceDetail.timeRange')">
          <n-select v-model:value="aggCfg.timeRange" size="small" :options="timeRangeOptions" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentPollingIntervalSeconds')">
          <n-input-number v-model:value="aggCfg.pollingInterval" size="small" :min="10" :max="3600" />
        </SettingItem>
      </template>
    </SettingItemBox>
  </CollapseItem>
</template>
