<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentGroupType } from '@/packages/index.type';

import { computed, ref, toRefs, watch } from 'vue';

import { COMPONENT_CATEGORY_OPTIONS } from '@/constants/component-categories';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useChartLayoutStore } from '@/store/modules/chartLayoutStore/chartLayoutStore';
import { ChartLayoutStoreEnum } from '@/store/modules/chartLayoutStore/chartLayoutStore.type';
import { loadAsyncComponent } from '@/utils';

import { ContentBox } from '../ContentBox/index';
import { TabsEnum } from './index.type';
import { isCustomComponent } from './utils/isCustomComponent';

const { getDetails } = toRefs(useChartLayoutStore());
const { setItem } = useChartLayoutStore();
const chartEditStore = useChartEditStore();

const { ConstructIcon, FlashIcon, DesktopOutlineIcon, LeafIcon, RocketIcon, ChevronBackOutlineIcon, ChevronForwardIcon } = icon.ionicons5;

const ContentEdit = loadAsyncComponent(() => import('../ContentEdit/index.vue'));
const CanvasPage = loadAsyncComponent(() => import('./components/CanvasPage/index.vue'));
const ChartSetting = loadAsyncComponent(() => import('./components/ChartSetting/index.vue'));
const ChartData = loadAsyncComponent(() => import('./components/ChartData/index.vue'));
const ChartEvent = loadAsyncComponent(() => import('./components/ChartEvent/index.vue'));
const ChartAnimation = loadAsyncComponent(() => import('./components/ChartAnimation/index.vue'));
const SimplifiedDataPanel = loadAsyncComponent(() => import('./components/SimplifiedDataPanel/index.vue'));

const collapsed = ref<boolean>(getDetails.value);
const tabsSelect = ref<TabsEnum>(TabsEnum.CHART_SETTING);

// ── 面板宽度可拖拽调整 ──────────────────────────────────────
const SIDER_WIDTH_KEY = 'goview-configurations-sider-width';
const SIDER_MIN = 280;
const SIDER_MAX = 720;

const siderWidth = ref<number>(Number(localStorage.getItem(SIDER_WIDTH_KEY)) || 350);
// 是否处于拖拽调宽中（ref 以便模板 class 响应式更新）
const isDraggingWidth = ref(false);

const applySiderWidth = (w: number) => {
  siderWidth.value = Math.min(SIDER_MAX, Math.max(SIDER_MIN, Math.round(w)));
  localStorage.setItem(SIDER_WIDTH_KEY, String(siderWidth.value));
};

/** 触发条按下：拖动调宽（收起态向左拖自动展开跟手；展开态过度收窄自动折叠）；未拖动的单击保持折叠/展开 */
const onTriggerMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  isDraggingWidth.value = false;
  const startX = e.clientX;
  const startWidth = siderWidth.value;
  let moved = false;
  const onMove = (ev: MouseEvent) => {
    const delta = ev.clientX - startX; // 负值=向左（画布方向）=变宽
    if (!moved && Math.abs(delta) <= 4) return;
    moved = true;
    // 收起状态下向左拖：先展开面板再跟手调宽（否则拖动无响应）
    if (collapsed.value) {
      if (delta >= -4) return;
      expandHandle();
    }
    isDraggingWidth.value = true;
    applySiderWidth(startWidth - delta);
    // 展开状态下持续向右收窄、越过最小宽度 60px 以上 → 视为拖动折叠
    if (!collapsed.value && delta > startWidth - SIDER_MIN + 60) {
      collapsedHandle();
    }
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    isDraggingWidth.value = false;
    if (!moved) toggleCollapsed();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

const collapsedHandle = () => {
  collapsed.value = true;
  setItem(ChartLayoutStoreEnum.DETAILS, true);
};

const expandHandle = () => {
  collapsed.value = false;
  setItem(ChartLayoutStoreEnum.DETAILS, false);
};

const toggleCollapsed = () => {
  if (collapsed.value) {
    expandHandle();
  } else {
    collapsedHandle();
  }
};

const isEnhancedGroup = (target: any) => target?.isGroup;

const selectTarget = computed(() => {
  const selectId = chartEditStore.getTargetChart.selectId;
  // 排除多个
  if (selectId.length !== 1) return undefined;
  const id = selectId[0];

  // 隔离编辑模式：优先从当前 Group 的 groupList 中查找子元素
  const editCanvas = chartEditStore.getEditCanvas;
  if (editCanvas.isGroupIsolation && editCanvas.activeGroupId) {
    const groupIdx = chartEditStore.componentList.findIndex((e) => e.id === editCanvas.activeGroupId);
    if (groupIdx !== -1) {
      const group = chartEditStore.componentList[groupIdx] as CreateComponentGroupType;
      const child = group.groupList?.find((c) => c.id === id);
      if (child) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        tabsSelect.value = TabsEnum.CHART_SETTING;
        return child;
      }
    }
  }

  const target = chartEditStore.componentList[chartEditStore.fetchTargetIndex()];
  if (target?.isGroup) {
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    tabsSelect.value = TabsEnum.CHART_SETTING;
  }
  return target;
});

watch(getDetails, (newData) => {
  if (newData) {
    collapsedHandle();
  } else {
    expandHandle();
  }
});

// 页面设置
const globalTabList = [
  {
    key: TabsEnum.PAGE_SETTING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.pageConfiguration'); },
    icon: DesktopOutlineIcon,
    render: CanvasPage,
  },
];

const chartsDefaultTabList = [
  {
    key: TabsEnum.CHART_SETTING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.customization'); },
    icon: ConstructIcon,
    render: ChartSetting,
  },
  {
    key: TabsEnum.CHART_ANIMATION,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.animation'); },
    icon: LeafIcon,
    render: ChartAnimation,
  },
];

const chartsTabList = [
  ...chartsDefaultTabList,
  {
    key: TabsEnum.CHART_DATA,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgMall.devices.excelSheet'); },
    icon: FlashIcon,
    render: ChartData,
  },
  {
    key: TabsEnum.CHART_EVENT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.memory.typeEvent'); },
    icon: RocketIcon,
    render: ChartEvent,
  },
];

const groupTabList = [
  {
    key: TabsEnum.CHART_SETTING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.customization'); },
    icon: ConstructIcon,
    render: ChartSetting,
  },
  {
    key: TabsEnum.CHART_ANIMATION,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.animation'); },
    icon: LeafIcon,
    render: ChartAnimation,
  },
  {
    key: TabsEnum.CHART_EVENT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.memory.typeEvent'); },
    icon: RocketIcon,
    render: ChartEvent,
  },
];

// 自定义组件专用 Tab 列表
const customChartsTabList = [
  {
    key: TabsEnum.CHART_SETTING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.customization'); },
    icon: ConstructIcon,
    render: ChartSetting,
  },
  {
    key: TabsEnum.CHART_ANIMATION,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.animation'); },
    icon: LeafIcon,
    render: ChartAnimation,
  },
  {
    key: TabsEnum.CHART_DATA,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgMall.devices.excelSheet'); },
    icon: FlashIcon,
    render: SimplifiedDataPanel,
  },
  {
    key: TabsEnum.CHART_EVENT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.memory.typeEvent'); },
    icon: RocketIcon,
    render: ChartEvent,
  },
];

// 组件编辑模式 Tab 列表（仅定制 + 数据，隐藏动画/事件）
const componentModeTabList = [
  {
    key: TabsEnum.CHART_SETTING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.customization'); },
    icon: ConstructIcon,
    render: ChartSetting,
  },
  {
    key: TabsEnum.CHART_DATA,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgMall.devices.excelSheet'); },
    icon: FlashIcon,
    render: SimplifiedDataPanel,
  },
];

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const componentMeta = computed(() => chartEditStore.getComponentMeta);

// 组件分类选项（复用共享常量）
const categoryOptions = [...COMPONENT_CATEGORY_OPTIONS];

// 六路分发：component-mode / composite-group / group / custom-nodata / custom / isolation-child / basic
const getTabList = (target: any) => {
  // 组件编辑模式：只显示定制 + 数据（使用 SimplifiedDataPanel）
  if (isComponentMode.value) {
    return componentModeTabList;
  }

  if (isEnhancedGroup(target)) return groupTabList;
  if (isCustomComponent(target)) {
    const editMode = target.option?._simplifiedData?.editMode;
    if (editMode === 'none') return chartsDefaultTabList;
    return customChartsTabList;
  }
  // 隔离编辑模式下的普通子图表，数据栏使用 SimplifiedDataPanel
  if (chartEditStore.getEditCanvas.isGroupIsolation) return customChartsTabList;
  // 单值文字/指标组件：直接走 SimplifiedDataPanel，避免继续依赖旧 ChartData 的 IoT 入口
  const simplifiedCommonKeys = ['TextCommon', 'FlipperNumber', 'PieCircle', 'Process', 'WaterPolo', 'Dial', 'Radar'];
  if (simplifiedCommonKeys.includes(target.chartConfig?.key)) return customChartsTabList;
  // 预置组件（chartFrame === 'composite'）：使用 ChartData（含完整 AJAX 配置面板）
  if (target.chartConfig?.chartFrame === 'composite') return chartsTabList;
  // 基础图表 + 表格列表：统一使用 SimplifiedDataPanel
  const basicChartCategories = ['Bars', 'Pies', 'Lines', 'Scatters', 'Tables'];
  if (basicChartCategories.includes(target.chartConfig?.category)) return customChartsTabList;
  return chartsTabList;
};
</script>

<template>
  <div class="go-configurations-layout">
    <!-- 画布主体区域 -->
    <div class="go-configurations-main">
      <ContentEdit />
    </div>
    <!-- 折叠触发条（拖动调整面板宽度 / 单击折叠展开） -->
    <div class="go-configurations-trigger" @mousedown="onTriggerMouseDown">
      <n-icon size="14">
        <component :is="collapsed ? ChevronBackOutlineIcon : ChevronForwardIcon" />
      </n-icon>
    </div>
    <!-- 右侧配置面板 -->
    <div
      class="go-configurations-sider"
      :class="{ 'is-collapsed': collapsed, 'is-dragging-width': isDraggingWidth }"
      :style="collapsed ? undefined : { width: siderWidth + 'px' }"
    >
      <ContentBox class="go-content-configurations go-boderbox" :show-top="false" :depth="2">
        <!-- 页面配置（组件模式下隐藏，显示组件信息） -->
        <n-tabs v-if="!selectTarget && !isComponentMode" class="tabs-box" size="small" type="segment">
          <n-tab-pane v-for="item in globalTabList" :key="item.key" :name="item.key" size="small" display-directive="show:lazy">
            <template #tab>
              <n-space>
                <span>{{ item.title }}</span>
                <n-icon size="16" class="icon-position">
                  <component :is="item.icon" />
                </n-icon>
              </n-space>
            </template>
            <component :is="item.render" />
          </n-tab-pane>
        </n-tabs>

        <!-- 组件编辑模式下：无选中时显示可编辑组件信息 -->
        <div v-if="!selectTarget && isComponentMode && componentMeta" class="component-info-panel">
          <n-space vertical :size="12" class="p-2">
            <n-h4 prefix="bar" style="margin: 0">{{ editorT('bigscreenEditor.ui.componentInformation') }}</n-h4>
            <n-space vertical :size="10">
              <div class="info-field">
                <span class="info-label">{{ editorT('orgManage.agent.name') }}</span>
                <n-input v-model:value="componentMeta.name" size="small" :placeholder="editorT('bigscreenManagement.ui.definitionComponentName')" />
              </div>
              <div class="info-field">
                <span class="info-label">ID</span>
                <n-text depth="3" style="font-size: 12px">{{ componentMeta.id }}</n-text>
              </div>
              <div class="info-field">
                <span class="info-label">{{ editorT('orgManage.flow.versionLabel') }}</span>
                <n-tag size="small" type="info">{{ componentMeta.version || '-' }}</n-tag>
              </div>
              <div class="info-field">
                <span class="info-label">{{ editorT('orgManage.role.type') }}</span>
                <n-tag size="small" :type="componentMeta.isGroup ? 'warning' : 'success'">
                  {{ componentMeta.isGroup ? editorT('bigscreenEditor.ui.enhancedGroup') : editorT('bigscreenEditor.ui.basicComponents') }}
                </n-tag>
              </div>
              <div class="info-field">
                <span class="info-label">{{ editorT('orgManage.flow.categoryLabel') }}</span>
                <n-select v-model:value="componentMeta.category" :options="categoryOptions" size="small" />
              </div>
            </n-space>
          </n-space>
        </div>

        <!-- 编辑 -->
        <n-tabs v-if="selectTarget" v-model:value="tabsSelect" class="tabs-box" size="small" type="segment">
          <n-tab-pane v-for="item in getTabList(selectTarget)" :key="item.key" :name="item.key" size="small" display-directive="show:lazy">
            <template #tab>
              <n-space>
                <span>{{ item.title }}</span>
                <n-icon size="16" class="icon-position">
                  <component :is="item.icon" />
                </n-icon>
              </n-space>
            </template>
            <component :is="item.render" />
          </n-tab-pane>
        </n-tabs>
      </ContentBox>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include go(configurations-layout) {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.go-configurations-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.go-configurations-trigger {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  cursor: pointer;
  user-select: none;
  border-right: 1px solid;
  border-left: 1px solid;
  opacity: 0.6;
  transition: opacity 0.2s;

  @include fetch-bg-color('background-color2');
  @include fetch-border-color('hover-border-color');

  &:hover {
    opacity: 1;
  }
}

.go-configurations-sider {
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  transition: width 0.2s ease;

  /* 拖拽调宽期间禁用过渡，宽度实时跟手 */
  &.is-dragging-width {
    transition: none;
  }

  &.is-collapsed {
    width: 0 !important;
  }
}

@include go(content-configurations) {
  overflow: hidden;

  .tabs-box {
    padding: 10px;

    .icon-position {
      padding-top: 2px;
    }
  }
}

.component-info-panel {
  padding: 4px 0;

  .info-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .info-label {
    flex-shrink: 0;
    width: 40px;
    font-size: 12px;
    color: var(--n-text-color-3);
    text-align: right;
  }
}
</style>
