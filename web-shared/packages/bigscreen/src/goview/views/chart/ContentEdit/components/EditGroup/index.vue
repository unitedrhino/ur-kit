<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';
import type { MenuOptionsItemType } from '@/views/chart/hooks/useContextMenu.hook.type';

import type { CSSProperties, PropType } from 'vue';

import { computed } from 'vue';

import { useBorderLoader } from '@/composables/useBorderLoader';
import { MenuEnum } from '@/enums/editPageEnum';
import { useCompositeGroupDataBinding } from '@/hooks/useCompositeGroupDataBinding.hook';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { computeGroupContentScale } from '@/utils/groupScale';
import { animationsClass, colorCustomMerge, getBlendModeStyle, getFilterStyle, getTransformStyle } from '@/utils';
import { divider, useContextMenu } from '@/views/chart/hooks/useContextMenu.hook';

import { EditShapeBox } from '../../components/EditShapeBox';
import { useMouseHandle } from '../../hooks/useDrag.hook';
import { useComponentStyle, useSizeStyle } from '../../hooks/useStyle.hook';

const props = defineProps({
  groupData: {
    type: Object as PropType<CreateComponentGroupType>,
    required: true,
  },
  groupIndex: {
    type: Number,
    required: true,
  },
});

const chartEditStore = useChartEditStore();
const { handleContextMenu } = useContextMenu();

useCompositeGroupDataBinding(props.groupData, useChartEditStore);

// 点击事件
const { mouseenterHandle, mouseleaveHandle, mousedownHandle, mouseClickHandle } = useMouseHandle();

// 当前 Group 是否处于隔离编辑模式
const isCurrentIsolation = computed(() => {
  return chartEditStore.getEditCanvas.isGroupIsolation && chartEditStore.getEditCanvas.activeGroupId === props.groupData.id;
});

const isGroupSelected = computed(() => {
  return chartEditStore.getTargetChart.selectId.includes(props.groupData.id);
});

// 双击进入隔离编辑模式
const handleGroupDblClick = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (props.groupData.status.lock) return;
  chartEditStore.enterGroupIsolation(props.groupData.id);
  chartEditStore.setTargetSelectChart(props.groupData.id);
};

// 退出隔离编辑模式
const exitGroupIsolation = () => {
  chartEditStore.exitGroupIsolation();
};

// 隔离态下子元素点击：选中子元素
const handleChildClick = (e: MouseEvent, item: CreateComponentType) => {
  e.preventDefault();
  e.stopPropagation();
  if (item.status.lock) return;
  chartEditStore.setTargetSelectChart(item.id);
};

// 隔离态下子元素按下：触发拖拽
const handleChildMousedown = (e: MouseEvent, item: CreateComponentType) => {
  e.stopPropagation();
  mousedownHandle(e, item);
};

// 隔离态下点击边框容器：选中 Group 本身，右侧只在隔离态暴露边框定制属性
const handleBorderContainerSelect = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  chartEditStore.setTargetSelectChart(props.groupData.id);
};

const handleIsolationContainerCapture = (e: MouseEvent) => {
  if (!isCurrentIsolation.value) return;

  const target = e.target;
  if (!(target instanceof Element)) return;

  if (target.closest('.shape-point')) return;
  if (target.closest('[data-group-child="true"]')) return;

  handleBorderContainerSelect(e);
};

// 右键
const optionsHandle = (targetList: MenuOptionsItemType[], allList: MenuOptionsItemType[], targetInstance: CreateComponentType) => {
  const filter = (menulist: MenuEnum[]) => {
    return allList.filter((i) => menulist.includes(i.key as MenuEnum));
  };

  if (chartEditStore.getTargetChart.selectId.length > 1) {
    return filter([MenuEnum.GROUP, MenuEnum.DELETE]);
  } else {
    const statusMenuEnums: MenuEnum[] = [];
    if (targetInstance.status.lock) {
      statusMenuEnums.push(MenuEnum.LOCK);
    } else {
      statusMenuEnums.push(MenuEnum.UNLOCK);
    }
    if (targetInstance.status.hide) {
      statusMenuEnums.push(MenuEnum.HIDE);
    } else {
      statusMenuEnums.push(MenuEnum.SHOW);
    }
    const singleMenuEnums = [MenuEnum.UN_GROUP];
    return [...filter(singleMenuEnums), divider(), ...targetList.filter((i) => !statusMenuEnums.includes(i.key as MenuEnum))];
  }
};

const themeColor = computed(() => {
  const colorCustomMergeData = colorCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo);
  return colorCustomMergeData[chartEditStore.getEditCanvasConfig.chartThemeColor];
});

const themeSetting = computed(() => {
  const chartThemeSetting = chartEditStore.getEditCanvasConfig.chartThemeSetting;
  return chartThemeSetting;
});

// ========== 边框容器（可选装饰） ==========

const isBorderContainer = computed(() => {
  return props.groupData.option?.containerType === 'border';
});

// Border04 自带 SVG 标题渲染
const isBorder04 = computed(() => props.groupData.option?.borderKey === 'Border04');

// 边框加载
const borderKeyRef = computed(() => props.groupData.option?.borderKey || 'Border01');
const groupOptionRef = computed(() => props.groupData.option);
const { borderComponent, computeTitleConfig, computeTitleStyle } = useBorderLoader(borderKeyRef, groupOptionRef);

const fakeBorderConfig = computed(() => {
  if (!isBorderContainer.value) return null;
  return {
    attr: props.groupData.attr,
    option: props.groupData.option?.borderOption || {},
  };
});

const titleConfig = computed(() => {
  if (!isBorderContainer.value) return null;
  return computeTitleConfig();
});

// 标题样式：titleConfig 缺失时返回空对象（等价无样式），保持 vue StyleValue 类型合法
const titleStyle = computed((): CSSProperties => {
  if (!titleConfig.value) return {};
  return computeTitleStyle(titleConfig.value) as CSSProperties;
});

// 标题占据高度
const titleHeight = computed(() => {
  if (isBorder04.value) return props.groupData.option?.borderOption?.borderTitleHeight || 52;
  if (!titleConfig.value?.show) return 0;
  return titleConfig.value.fontSize + 10;
});

// 内容区内边距
const padding = computed(() => props.groupData.option?.padding || 0);

const designW = computed(() => props.groupData.option?.designWidth || props.groupData.attr.w);
const designH = computed(() => props.groupData.option?.designHeight || props.groupData.attr.h);

const contentScale = computed(() => computeGroupContentScale({
  containerWidth: props.groupData.attr?.w || 0,
  containerHeight: props.groupData.attr?.h || 0,
  designWidth: designW.value,
  designHeight: designH.value,
  padding: padding.value,
  titleHeight: titleHeight.value,
}));

const showTitle = computed(() => {
  if (isBorder04.value) return false;
  return isBorderContainer.value && titleConfig.value?.show && titleConfig.value?.text;
});

// 空状态占位层：边框容器无子组件且非预览态时显示
const showEmptyPlaceholder = computed(() => {
  if (!isBorderContainer.value) return false;
  if (props.groupData.groupList.length > 0) return false;
  const editCanvas = chartEditStore.getEditCanvas;
  if ((editCanvas as any).isPreview || (editCanvas as any).editCanvasShowType === 'preview') return false;
  return true;
});

const placeholderStyle = computed(() => {
  const pad = padding.value;
  const titleH = titleHeight.value;
  const { w, h } = props.groupData.attr || { w: 400, h: 300 };
  return {
    position: 'absolute' as const,
    left: `${pad}px`,
    top: `${titleH + pad}px`,
    width: `${w - pad * 2}px`,
    height: `${h - pad * 2 - titleH}px`,
    zIndex: 3,
  };
});
const borderHitAreas = computed(() => {
  if (!isCurrentIsolation.value || !isBorderContainer.value) return [];
  if (isGroupSelected.value) return [];

  const pad = padding.value;
  const titleH = titleHeight.value;
  const { w, h } = props.groupData.attr || { w: 0, h: 0 };
  const sideHitSize = Math.max(pad, 12);
  const horizontalHitSize = Math.max(pad, 12);
  const topHitHeight = Math.max(titleH + pad, 12);

  return [
    {
      key: 'top',
      style: {
        position: 'absolute' as const,
        left: '0px',
        top: '0px',
        width: `${w}px`,
        height: `${topHitHeight}px`,
        zIndex: 20,
      },
    },
    {
      key: 'left',
      style: {
        position: 'absolute' as const,
        left: '0px',
        top: `${topHitHeight}px`,
        width: `${sideHitSize}px`,
        height: `${Math.max(h - topHitHeight - horizontalHitSize, 0)}px`,
        zIndex: 20,
      },
    },
    {
      key: 'right',
      style: {
        position: 'absolute' as const,
        right: '0px',
        top: `${topHitHeight}px`,
        width: `${sideHitSize}px`,
        height: `${Math.max(h - topHitHeight - horizontalHitSize, 0)}px`,
        zIndex: 20,
      },
    },
    {
      key: 'bottom',
      style: {
        position: 'absolute' as const,
        left: '0px',
        bottom: '0px',
        width: `${w}px`,
        height: `${horizontalHitSize}px`,
        zIndex: 20,
      },
    },
  ];
});
</script>

<template>
  <div class="go-edit-group-box">
    <!-- 隔离模式遮罩层 -->
    <div v-if="isCurrentIsolation" class="isolation-overlay" :style="{ zIndex: 9998 }" @click="exitGroupIsolation" @contextmenu.stop.prevent></div>
    <EditShapeBox
      :key="groupData.id"
      :data-id="groupData.id"
      :index="groupIndex"
      :item="groupData"
      :hidden-point="false"
      :is-group-isolation="isCurrentIsolation"
      :class="animationsClass(groupData.styles.animations)"
      :style="{
        ...useComponentStyle(groupData.attr, groupIndex),
        ...(isCurrentIsolation ? { zIndex: 9999 } : {}),
        ...useSizeStyle(groupData.attr),
        ...getFilterStyle(groupData.styles),
        ...getTransformStyle(groupData.styles),
        ...(getBlendModeStyle(groupData.styles) as any),
      }"
      @click="isCurrentIsolation ? handleBorderContainerSelect($event) : mouseClickHandle($event, groupData)"
      @click.capture="handleIsolationContainerCapture($event)"
      @dblclick="handleGroupDblClick($event)"
      @mousedown="isCurrentIsolation ? undefined : mousedownHandle($event, groupData)"
      @mousedown.capture="handleIsolationContainerCapture($event)"
      @mouseenter="mouseenterHandle($event, groupData)"
      @mouseleave="mouseleaveHandle($event, groupData)"
      @contextmenu="handleContextMenu($event, groupData, optionsHandle)"
    >
      <!-- 边框层：边框容器模式下渲染（可选装饰） -->
      <component
        v-if="isBorderContainer && borderComponent && fakeBorderConfig"
        :is="borderComponent"
        :chart-config="fakeBorderConfig"
        style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
      />
      <div
        v-for="area in borderHitAreas"
        :key="area.key"
        class="border-hit-area"
        :style="area.style"
        @click="handleBorderContainerSelect($event)"
        @mousedown="handleBorderContainerSelect($event)"
      ></div>
      <!-- 标题层（边框容器模式下可选）；附加 titleConfig 守卫收窄空值，showTitle 已保证正常路径恒真 -->
      <div v-if="showTitle && titleConfig" class="border-title-layer" :style="titleStyle">
        {{ titleConfig.text }}
      </div>
      <!-- 内容区：等比缩放 -->
      <div
        :style="{
          position: 'absolute',
          left: `${contentScale.left}px`,
          top: `${contentScale.top}px`,
          width: `${designW}px`,
          height: `${designH}px`,
          transform: `scale(${contentScale.scaleX}, ${contentScale.scaleY})`,
          transformOrigin: 'left top',
          zIndex: 3,
        }"
      >
        <!-- 子组件（隔离态下可独立选中和拖拽） -->
        <EditShapeBox
          v-for="item in groupData.groupList"
          :key="item.id"
          data-group-child="true"
          :data-id="item.id"
          :index="groupIndex"
          :item="item"
          :hidden-point="!isCurrentIsolation"
          :style="{
            ...useComponentStyle(item.attr, groupIndex),
          }"
          @click="isCurrentIsolation ? handleChildClick($event, item) : undefined"
          @mousedown="isCurrentIsolation ? handleChildMousedown($event, item) : undefined"
        >
          <component
            class="edit-content-chart"
            :class="animationsClass(item.styles.animations)"
            :is="item.chartConfig.chartKey"
            :chart-config="item"
            :theme-setting="themeSetting"
            :theme-color="themeColor"
            :style="{
              ...useSizeStyle(item.attr),
              ...getFilterStyle(item.styles),
              ...getTransformStyle(item.styles),
            }"
          />
        </EditShapeBox>
        <!-- 空状态占位层：边框容器无子组件时显示（仅编辑态） -->
        <div v-if="showEmptyPlaceholder" class="empty-placeholder" :style="placeholderStyle">
          <span class="empty-placeholder-text">{{ editorT('bigscreenEditor.ui.doubleClickEditDragComponentsFromLeft') }}</span>
        </div>
      </div>
    </EditShapeBox>
  </div>
</template>

<style lang="scss" scoped>
.isolation-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  cursor: pointer;
}
.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  pointer-events: none;
}
.empty-placeholder-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  user-select: none;
}

.border-hit-area {
  pointer-events: auto;
}

</style>
