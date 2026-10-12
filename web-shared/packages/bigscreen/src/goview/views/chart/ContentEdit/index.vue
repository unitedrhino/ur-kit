<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';
import type { MenuOptionsItemType } from '@/views/chart/hooks/useContextMenu.hook.type';

import { computed, onMounted, onUnmounted, provide } from 'vue';

import { MenuEnum } from '@/enums/editPageEnum';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { animationsClass, colorCustomMerge, getBlendModeStyle, getFilterStyle, getTransformStyle } from '@/utils';
import { useContextMenu } from '@/views/chart/hooks/useContextMenu.hook';
import { SCALE_KEY } from '@/views/preview/hooks/useScale.hook';

import { ContentBox } from '../ContentBox/index';
import { useAddKeyboard } from '../hooks/useKeyboard.hook';
import { EditBottom } from './components/EditBottom';
import { EditGroup } from './components/EditGroup';
import { EditRange } from './components/EditRange';
import { EditRule } from './components/EditRule';
import { EditShapeBox } from './components/EditShapeBox';
import { EditTools } from './components/EditTools';
import {
  consumeConnectLineContextMenu,
  contextmenuBoxSelect,
  dragHandle,
  dragleaveHandle,
  dragoverHandle,
  mousedownHandleUnStop,
  pasteExternalImageFiles,
  useMouseHandle,
} from './hooks/useDrag.hook';
import { useLayout } from './hooks/useLayout.hook';
import { useComponentStyle, useSizeStyle } from './hooks/useStyle.hook';

const chartEditStore = useChartEditStore();
const { handleContextMenu } = useContextMenu();

const handleEditContextMenu = (e: MouseEvent, item?: CreateComponentType, options?: typeof optionsHandle) => {
  if (consumeConnectLineContextMenu(e)) {
    return;
  }

  if (chartEditStore.getEditCanvas.isCreate && chartEditStore.getEditCanvas.createComponentConfig?.key === 'ConnectLine') {
    contextmenuBoxSelect(e);
    return;
  }

  handleContextMenu(e, item, options);
};

provide(SCALE_KEY, null);

useLayout(async () => {});

const { mouseenterHandle, mouseleaveHandle, mousedownHandle, mouseClickHandle } = useMouseHandle();

const optionsHandle = (targetList: MenuOptionsItemType[], allList: MenuOptionsItemType[], targetInstance: CreateComponentType) => {
  if (chartEditStore.getTargetChart.selectId.length > 1) {
    return allList.filter((item) => [MenuEnum.DELETE, MenuEnum.GROUP].includes(item.key as MenuEnum));
  }

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

  if (chartEditStore.getIsComponentMode) {
    const componentModeHidden = new Set([
      MenuEnum.BOTTOM,
      MenuEnum.DOWN,
      MenuEnum.HIDE,
      MenuEnum.LOCK,
      MenuEnum.SHOW,
      MenuEnum.TOP,
      MenuEnum.UNLOCK,
      MenuEnum.UP,
    ]);
    return targetList.filter((item) => !statusMenuEnums.includes(item.key as MenuEnum) && !componentModeHidden.has(item.key as MenuEnum));
  }

  return targetList.filter((item) => !statusMenuEnums.includes(item.key as MenuEnum));
};

const themeSetting = computed(() => chartEditStore.getEditCanvasConfig.chartThemeSetting);

const themeColor = computed(() => {
  const colorCustomMergeData: any = colorCustomMerge(chartEditStore.getEditCanvasConfig.chartCustomThemeColorInfo);
  return colorCustomMergeData[chartEditStore.getEditCanvasConfig.chartThemeColor];
});

const rangeStyle = computed(() => {
  const background = chartEditStore.getEditCanvasConfig.background;
  const backgroundImage = chartEditStore.getEditCanvasConfig.backgroundImage;
  const selectColor = chartEditStore.getEditCanvasConfig.selectColor;
  const backgroundColor = background || undefined;

  const computedBackground = selectColor
    ? { background: backgroundColor }
    : { background: `url(${backgroundImage}) no-repeat center center / cover !important` };

  return {
    ...computedBackground,
    width: 'inherit',
    height: 'inherit',
  };
});

const isGroupIsolation = computed(() => chartEditStore.getEditCanvas.isGroupIsolation);
const isExternalImageDragging = computed(() => chartEditStore.getEditCanvas.externalFileDrag);

const handlePasteImage = async (event: ClipboardEvent) => {
  if (chartEditStore.getRecordChart !== undefined) {
    event.preventDefault();
    chartEditStore.setParse();
    return;
  }

  const clipboardFiles = [...(event.clipboardData?.items ?? [])]
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file);

  if (clipboardFiles.length === 0) return;

  event.preventDefault();
  try {
    await pasteExternalImageFiles(clipboardFiles);
  } catch (error) {
    window.$message.warning((error as Error)?.message || editorT('bigscreenEditor.ui.imageUploadFailedPleaseTryAgainLater'));
  }
};

const handleExitIsolation = () => {
  const groupId = chartEditStore.getEditCanvas.activeGroupId;
  chartEditStore.exitGroupIsolation();
  if (groupId) chartEditStore.setTargetSelectChart(groupId);
};

onMounted(() => {
  useAddKeyboard();
  document.addEventListener('paste', handlePasteImage);
});

onUnmounted(() => {
  document.removeEventListener('paste', handlePasteImage);
});
</script>

<template>
  <ContentBox
    id="go-chart-edit-layout"
    :flex="true"
    :show-top="false"
    :show-bottom="true"
    :depth="1"
    :x-scroll="true"
    :disabled-scroll="true"
    @mousedown="mousedownHandleUnStop"
    @drop="dragHandle"
    @dragover="dragoverHandle"
    @dragenter="dragoverHandle"
    @dragleave="dragleaveHandle"
  >
    <EditRule>
      <div id="go-chart-edit-content" @contextmenu="handleEditContextMenu">
        <EditRange>
          <div
            :style="{
              ...getFilterStyle(chartEditStore.getEditCanvasConfig),
              ...rangeStyle,
            }"
          >
            <div v-if="isExternalImageDragging" class="external-image-drop-mask">
              <div class="external-image-drop-hint">{{ editorT('bigscreenEditor.ui.dropUploadImage') }}</div>
            </div>
            <div v-for="(item, index) in chartEditStore.getComponentList" :key="item.id">
              <EditGroup v-if="item.isGroup" :group-data="item as CreateComponentGroupType" :group-index="index" />

              <EditShapeBox
                v-else
                :data-id="item.id"
                :index="index"
                :style="{
                  ...useComponentStyle(item.attr, index),
                  ...(getBlendModeStyle(item.styles) as any),
                }"
                :item="item"
                @click="mouseClickHandle($event, item)"
                @mousedown="mousedownHandle($event, item)"
                @mouseenter="mouseenterHandle($event, item)"
                @mouseleave="mouseleaveHandle($event, item)"
                @contextmenu="handleEditContextMenu($event, item, optionsHandle)"
              >
                <component
                  class="edit-content-chart"
                  :class="[animationsClass(item.styles.animations), { 'edit-content-chart-connect-line': item.chartConfig.key === 'ConnectLine' }]"
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
            </div>

            <div v-if="isGroupIsolation" class="group-isolation-mask" @click.stop="handleExitIsolation" @mousedown.stop @contextmenu.stop.prevent></div>
          </div>
        </EditRange>
      </div>
    </EditRule>

    <template #aside>
      <EditTools />
    </template>

    <template #bottom>
      <EditBottom />
    </template>
  </ContentBox>
</template>

<style lang="scss" scoped>
@include goId('chart-edit-layout') {
  position: relative;
  width: 100%;
  overflow: hidden;
  @extend .go-point-bg;
  @include background-image('background-point');

  @include goId('chart-edit-content') {
    overflow: hidden;
    @extend .go-transition;
    @include fetch-theme('box-shadow');

    .edit-content-chart {
      position: absolute;
      overflow: hidden;
    }

    .edit-content-chart-connect-line {
      overflow: visible;
      pointer-events: auto;
    }
  }
}

.group-isolation-mask {
  position: absolute;
  inset: 0;
  z-index: 999;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.4);
}

.external-image-drop-mask {
  position: absolute;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgb(59 130 246 / 10%);
  border: 2px dashed rgb(59 130 246 / 70%);
}

.external-image-drop-hint {
  padding: 14px 22px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  background: rgb(15 23 42 / 82%);
  border: 1px solid rgb(59 130 246 / 55%);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgb(15 23 42 / 30%);
}
</style>
