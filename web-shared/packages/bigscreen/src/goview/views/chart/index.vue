<script setup lang="ts">
import { computed, onBeforeMount } from 'vue';

import { LayoutHeaderPro } from '@/layout/components/LayoutHeaderPro';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useChartHistoryStore } from '@/store/modules/chartHistoryStore/chartHistoryStore';
import { loadAsyncComponent } from '@/utils';

import { useContextMenu } from './hooks/useContextMenu.hook';

const chartHistoryStoreStore = useChartHistoryStore();
const chartEditStore = useChartEditStore();

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const showCharts = computed(() => true);

// 组件模式下只显示"基础"分类，大屏模式显示全部
const allowedCategories = computed(() => {
  if (!isComponentMode.value) return undefined;
  return ['basic'];
});

// 进入编辑器前清理残留状态，防止切换项目时显示上一个项目的内容
onBeforeMount(() => {
  chartEditStore.componentList = [];
  chartEditStore.setTargetSelectChart(undefined);
  chartHistoryStoreStore.clearBackStack();
  chartHistoryStoreStore.clearForwardStack();
});

// 记录初始化
chartHistoryStoreStore.canvasInit(chartEditStore.getEditCanvas);

const HeaderLeftBtn = loadAsyncComponent(() => import('./ContentHeader/headerLeftBtn/index.vue'));
const HeaderRightBtn = loadAsyncComponent(() => import('./ContentHeader/headerRightBtn/index.vue'));
const HeaderTitle = loadAsyncComponent(() => import('./ContentHeader/headerTitle/index.vue'));
const ContentLayers = loadAsyncComponent(() => import('./ContentLayers/index.vue'));
const ContentCharts = loadAsyncComponent(() => import('./ContentCharts/index.vue'));
const ContentConfigurations = loadAsyncComponent(() => import('./ContentConfigurations/index.vue'));
const ContentLoad = loadAsyncComponent(() => import('./ContentLoad/index.vue'));

// 右键
const { menuOptions, onClickOutSide, mousePosition, handleMenuSelect } = useContextMenu();
</script>

<template>
  <!-- 工作台相关 -->
  <div class="go-chart">
    <!-- 顶部工具栏 -->
    <LayoutHeaderPro>
      <template #left>
        <HeaderLeftBtn />
      </template>
      <template #center>
        <HeaderTitle />
      </template>
      <template #ri-left>
        <HeaderRightBtn />
      </template>
    </LayoutHeaderPro>
    <!-- 主体内容区：左侧组件 + 图层 | 画布 | 右侧配置 -->
    <div class="go-chart-body">
      <ContentCharts v-if="showCharts" :allowed-categories="allowedCategories" />
      <ContentLayers v-if="!isComponentMode" />
      <ContentConfigurations />
    </div>
  </div>
  <!-- 顶部导航栏居中大屏名称（Teleport 到 body，fixed 定位）-->
  <!-- 右键 -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    size="small"
    :x="mousePosition.x"
    :y="mousePosition.y"
    :options="menuOptions"
    :show="chartEditStore.getRightMenuShow"
    :on-clickoutside="onClickOutSide"
    @select="handleMenuSelect"
  />
  <!-- 加载蒙层 -->
  <ContentLoad />
</template>

<style lang="scss" scoped>
@include go('chart') {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  @include background-image('background-image');

  .go-chart-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    /* 确保所有直接子元素（ContentCharts / ContentLayers / ContentConfigurations）
       都有明确高度，防止内部 height:100% 链断裂 */
    > * {
      height: 100%;
    }
  }
}
</style>
