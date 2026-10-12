<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { GlobalThemeJsonType } from '@/settings/chartThemes/index';

import type { PropType } from 'vue';

import { computed, watch } from 'vue';

import { CollapseItem, GlobalSettingPosition, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { axisConfig, legendConfig } from '@/packages/chartConfiguration/echarts/index';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';

import EchartsRendererSetting from './EchartsRendererSetting.vue';

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true,
  },
  inChart: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const { HelpOutlineIcon } = icon.ionicons5;

const chartEditStore = useChartEditStore();
const themeSetting = computed(() => {
  const chartThemeSetting = chartEditStore.getEditCanvasConfig.chartThemeSetting;
  return chartThemeSetting;
});

const title = computed(() => {
  return props.optionData.title;
});

const xAxis = computed(() => {
  return props.optionData.xAxis;
});

const yAxis = computed(() => {
  return props.optionData.yAxis;
});

const legend = computed(() => {
  return props.optionData.legend;
});

const grid = computed(() => {
  return props.optionData.grid;
});

const visualMap = computed(() => {
  return props.optionData.visualMap;
});

// 监听legend color颜色改变type = scroll的颜色
watch(
  () => legend.value && legend.value.textStyle.color,
  (newVal) => {
    if (legend.value && newVal) {
      if (legend.value.pageTextStyle) {
        legend.value.pageTextStyle.color = newVal;
      } else {
        legend.value.pageTextStyle = { color: newVal };
      }
    }
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <CollapseItem :name="editorT('bigscreenEditor.ui.renderer')">
    <SettingItemBox :alone="true">
      <template #name>
        <n-text>{{ editorT('platformManage.msg.scopeGlobalShort') }}</n-text>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="21" :depth="3">
              <HelpOutlineIcon />
            </n-icon>
          </template>
          <n-text>{{ editorT('bigscreenEditor.ui.allEChartsComponentsUseSelectedRendererByDefault') }}</n-text>
        </n-tooltip>
      </template>
      <EchartsRendererSetting v-model="themeSetting.renderer" />
    </SettingItemBox>
    <SettingItemBox :alone="true">
      <template #name>
        <n-text>{{ editorT('orgWidgets.ui.current') }}</n-text>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="21" :depth="3">
              <HelpOutlineIcon />
            </n-icon>
          </template>
          <n-text>{{ editorT('bigscreenEditor.ui.useSpecifiedRendererCurrentComponentOnly') }}</n-text>
        </n-tooltip>
      </template>
      <EchartsRendererSetting v-model="optionData.renderer" include-inherit />
    </SettingItemBox>
  </CollapseItem>
  <CollapseItem v-if="title" :name="editorT('orgManage.approve.colTitle')">
    <template #header>
      <n-switch v-model:value="title.show" size="small" />
    </template>
    <SettingItemBox :name="editorT('orgManage.approve.colTitle')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="title.textStyle.color" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="title.textStyle.fontSize" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('orgPark.ui.subtitle')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="title.subtextStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="title.subtextStyle.fontSize" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="grid" :name="editorT('bigscreenEditor.ui.container')">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.distance')">
      <SettingItem :name="editorT('bigscreenEditor.ui.leftDistance')">
        <n-input v-model:value="grid.left" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.rightDistance')">
        <n-input v-model:value="grid.right" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.topDistance')">
        <n-input v-model:value="grid.top" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.bottomDistance')">
        <n-input v-model:value="grid.bottom" size="small" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="xAxis" :name="editorT('bigscreenEditor.ui.xAxis')">
    <template #header>
      <n-switch v-model:value="xAxis.show" size="small" />
    </template>
    <SettingItemBox :name="editorT('iotApp.schemaForm.unitLabel')">
      <SettingItem :name="editorT('orgManage.agent.name')">
        <n-input v-model:value="xAxis.name" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="xAxis.nameTextStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="xAxis.nameTextStyle.fontSize" :min="12" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.offset')">
        <n-input-number v-model:value="xAxis.nameGap" :min="5" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('iotApp.productPage.tags')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="xAxis.axisLabel.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="xAxis.axisLabel.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="xAxis.axisLabel.fontSize" :min="8" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.offset')">
        <n-input-number v-model:value="xAxis.axisLabel.rotate" :min="-90" :max="90" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.axisLine')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="xAxis.axisLine.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="xAxis.axisLine.lineStyle.color" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.thickness')">
        <n-input-number v-model:value="xAxis.axisLine.lineStyle.width" :min="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('iotApp.devicePage.location')">
        <n-select v-model:value="xAxis.position" size="small" :options="axisConfig.xposition" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.alignZero')">
        <n-space>
          <n-switch v-model:value="xAxis.axisLine.onZero" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.reverseDirection')">
        <n-space>
          <n-switch v-model:value="xAxis.inverse" size="small" />
        </n-space>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.scale')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="xAxis.axisTick.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.length')">
        <n-input-number v-model:value="xAxis.axisTick.length" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.divider')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="xAxis.splitLine.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="xAxis.splitLine.lineStyle.color" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.thickness')">
        <n-input-number v-model:value="xAxis.splitLine.lineStyle.width" :min="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="xAxis.splitLine.lineStyle.type" size="small" :options="axisConfig.splitLint.lineStyle.type" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="yAxis" :name="editorT('bigscreenEditor.ui.yAxis')">
    <template #header>
      <n-switch v-model:value="yAxis.show" size="small" />
    </template>
    <SettingItemBox :name="editorT('iotApp.schemaForm.unitLabel')">
      <SettingItem :name="editorT('orgManage.agent.name')">
        <n-input v-model:value="yAxis.name" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="yAxis.nameTextStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="yAxis.nameTextStyle.fontSize" :min="8" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.offset')">
        <n-input-number v-model:value="yAxis.nameGap" :min="5" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('iotApp.productPage.tags')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="yAxis.axisLabel.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="yAxis.axisLabel.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="yAxis.axisLabel.fontSize" :min="8" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.offset')">
        <n-input-number v-model:value="yAxis.axisLabel.rotate" :min="-90" :max="90" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.axisLine')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="yAxis.axisLine.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="yAxis.axisLine.lineStyle.color" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.thickness')">
        <n-input-number v-model:value="yAxis.axisLine.lineStyle.width" :min="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('iotApp.devicePage.location')">
        <n-select v-model:value="yAxis.position" size="small" :options="axisConfig.yposition" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.alignZero')">
        <n-space>
          <n-switch v-model:value="yAxis.axisLine.onZero" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.reverseDirection')">
        <n-space>
          <n-switch v-model:value="yAxis.inverse" size="small" />
        </n-space>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.scale')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="yAxis.axisTick.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.length')">
        <n-input-number v-model:value="yAxis.axisTick.length" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.divider')">
      <SettingItem :name="editorT('bigscreenEditor.ui.display')">
        <n-space>
          <n-switch v-model:value="yAxis.splitLine.show" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="yAxis.splitLine.lineStyle.color" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.thickness')">
        <n-input-number v-model:value="yAxis.splitLine.lineStyle.width" :min="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.role.type')">
        <n-select v-model:value="yAxis.splitLine.lineStyle.type" size="small" :options="axisConfig.splitLint.lineStyle.type" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="legend" :name="editorT('bigscreenEditor.ui.legend')">
    <template #header>
      <n-switch v-model:value="legend.show" size="small" />
    </template>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.legendText')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" v-model:value="legend.textStyle.color" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="legend.textStyle.fontSize" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.legendPosition')">
      <SettingItem :name="editorT('bigscreenEditor.ui.xAxis2')">
        <n-select v-model:value="legend.x" size="small" :options="legendConfig.lengendX" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.yAxis2')">
        <n-select v-model:value="legend.y" size="small" :options="legendConfig.lengendY" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.legendInformation')">
      <SettingItem :name="editorT('iotApp.deviceDetail.direction')">
        <n-select v-model:value="legend.orient" size="small" :options="legendConfig.orient" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.shape')">
        <n-select v-model:value="legend.icon" size="small" :options="legendConfig.shape" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.legendSize')">
      <SettingItem :name="editorT('bigscreenEditor.ui.width')">
        <n-input-number v-model:value="legend.itemWidth" :min="1" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.height')">
        <n-input-number v-model:value="legend.itemHeight" :min="1" size="small" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="visualMap" :name="editorT('bigscreenEditor.ui.visualMapping')">
    <template #header>
      <n-switch v-model:value="visualMap.show" size="small" />
    </template>

    <SettingItemBox :name="editorT('iotApp.schemaForm.rangeLabel')">
      <SettingItem :name="editorT('orgManage.flow.propMin')">
        <n-input-number v-model:value="visualMap.min" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.propMax')">
        <n-input-number v-model:value="visualMap.max" size="small" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('orgManage.flow.fwColor')">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message0', { index: String(index + 1) })" v-for="(item, index) in visualMap.inRange.color" :key="index">
        <n-color-picker v-model:value="visualMap.inRange.color[index]" size="small" />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.controlBlock')">
      <SettingItem :name="editorT('bigscreenEditor.ui.placementDirection')">
        <n-select v-model:value="visualMap.orient" size="small" :options="axisConfig.visualMap.orient" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="visualMap.itemWidth" :min="5" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.height2')">
        <n-input-number v-model:value="visualMap.itemHeight" :min="5" size="small" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.invert')">
        <n-space>
          <n-switch v-model:value="visualMap.inverse" size="small" />
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.updateComponentsWhileDragging')">
        <n-space>
          <n-switch v-model:value="visualMap.realtime" size="small" />
        </n-space>
      </SettingItem>
    </SettingItemBox>
    <GlobalSettingPosition :target-data="visualMap" />
  </CollapseItem>
</template>
