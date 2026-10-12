<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { SelectCreateDataType } from './index.type';

import { computed } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { ChartFrameEnum } from '@/packages/index.type';
import { loadAsyncComponent } from '@/utils';

import { useTargetData } from '../hooks/useTargetData.hook';

const ChartDataStatic = loadAsyncComponent(() => import('./components/ChartDataStatic/index.vue'));
const ChartDataAjax = loadAsyncComponent(() => import('./components/ChartDataAjax/index.vue'));
const ChartDataPond = loadAsyncComponent(() => import('./components/ChartDataPond/index.vue'));
const ChartDataIoTDevice = loadAsyncComponent(() => import('./components/ChartDataIoTDevice/index.vue'));
// 3D 模型 / 内嵌页面组件的定制数据面板：左节点树 / 右节点绑定表单（替代通用请求方式）
// （EmbedPage 复用 GlTFModel 的 NodeBindingPanel：锚点快照与 nodeBindings 结构一致）
const GlTFNodeBindingPanel = loadAsyncComponent(() => import('@/packages/components/Decorates/Three/GlTFModel/NodeBindingPanel.vue'));

const { targetData } = useTargetData();

// 3D 模型 / 内嵌页面组件：数据链路自治（option.nodeBindings），不使用通用请求方式
const isGlTFModel = computed(() => targetData.value?.chartConfig?.key === 'GlTFModel' || targetData.value?.chartConfig?.key === 'EmbedPage');

// 选项
const selectOptions: SelectCreateDataType[] = [
  {
    /** 当前语言的请求方式标签，值保持稳定。 */ get label() { return editorT('bigscreenEditor.ui.staticData'); },
    value: RequestDataTypeEnum.STATIC,
  },
  {
    /** 当前语言的请求方式标签，值保持稳定。 */ get label() { return editorT('bigscreenEditor.ui.dynamicRequest'); },
    value: RequestDataTypeEnum.AJAX,
  },
  {
    /** 当前语言的请求方式标签，值保持稳定。 */ get label() { return editorT('bigscreenEditor.ui.sharedAPI'); },
    value: RequestDataTypeEnum.Pond,
  },
];

// 无数据源
const isNotData = computed(() => {
  const frame = targetData.value.chartConfig?.chartFrame;
  // 复合组件（COMPOSITE）的 dataset 存于 option.chartOption.dataset，顶层无 dataset，
  // 但仍支持数据请求，单独豁免此判断
  if (frame === ChartFrameEnum.COMPOSITE) return false;
  return frame === ChartFrameEnum.STATIC || targetData.value?.option?.dataset === undefined;
});

// 过滤选项：根据组件类型限制可选的请求方式
const filteredOptions = computed(() => {
  const key = targetData.value?.chartConfig?.key;
  // BorderDeviceStatus / BorderRunningTimer 组件只支持静态数据和 AJAX 模式
  if (key === 'BorderDeviceStatus' || key === 'BorderRunningTimer') {
    return selectOptions.filter((opt) => opt.value === RequestDataTypeEnum.STATIC || opt.value === RequestDataTypeEnum.AJAX);
  }
  return selectOptions;
});
</script>

<template>
  <div class="go-chart-configurations-data" v-if="targetData">
    <!-- 3D 模型 / 内嵌页面组件：定制数据面板（左节点树 / 右节点绑定） -->
    <GlTFNodeBindingPanel v-if="isGlTFModel" :option-data="targetData.option" />
    <!-- 普通组件：显示常规数据源配置 -->
    <template v-else>
      <SettingItemBox :name="editorT('platformManage.devops.requestMethod')" :alone="true">
        <n-select v-model:value="targetData.request.requestDataType" :disabled="isNotData" :options="filteredOptions" />
      </SettingItemBox>
      <!-- 静态 -->
      <ChartDataStatic v-if="targetData.request.requestDataType === RequestDataTypeEnum.STATIC" />
      <!-- BorderRunningTimer 数据源配置（平台/设备切换） -->
      <VCBorderRunningTimerDataConfig
        v-if="targetData.chartConfig?.key === 'BorderRunningTimer' && targetData.request.requestDataType === RequestDataTypeEnum.AJAX"
        :option-data="targetData.option"
      />
      <!-- 动态 -->
      <ChartDataAjax v-if="targetData.request.requestDataType === RequestDataTypeEnum.AJAX" />
      <!-- 数据池 -->
      <ChartDataPond v-if="targetData.request.requestDataType === RequestDataTypeEnum.Pond" />
      <ChartDataIoTDevice v-if="targetData.request.requestDataType === RequestDataTypeEnum.IoTDevice" />
    </template>
  </div>
</template>
