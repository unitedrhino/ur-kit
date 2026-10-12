<script setup lang="ts">
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';
import type { MenuOptionsItemType } from '@/views/chart/hooks/useContextMenu.hook.type';

import type { PropType } from 'vue';

import { computed, ref, watch } from 'vue';

import { MenuEnum, MouseEventButton } from '@/enums/editPageEnum';
import { fetchImages } from '@/packages';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { LayerModeEnum } from '@/store/modules/chartLayoutStore/chartLayoutStore.type';
import { useDesignStore } from '@/store/modules/designStore/designStore';
import { requireErrorImg } from '@/utils';
import { divider, useContextMenu } from '@/views/chart/hooks/useContextMenu.hook';

import { LayersListItem } from '../LayersListItem';
import { LayersStatus } from '../LayersStatus/index';

const props = defineProps({
  componentGroupData: {
    type: Object as PropType<CreateComponentGroupType>,
    required: true,
  },
  layerMode: {
    type: String as PropType<LayerModeEnum>,
    default: LayerModeEnum.THUMBNAIL,
  },
});

const designStore = useDesignStore();
const { FolderIcon, FolderOpenIcon } = icon.ionicons5;

const chartEditStore = useChartEditStore();
const { handleContextMenu, onClickOutSide } = useContextMenu();

const expend = ref(false);
const groupImageInfo = ref('');
const isThumbnailMode = computed(() => props.layerMode === LayerModeEnum.THUMBNAIL);

const getFirstChildImage = async () => {
  const firstChild = props.componentGroupData.groupList.find((item) => item?.chartConfig);
  if (!firstChild) return '';
  return fetchImages(firstChild.chartConfig);
};

const fetchGroupImage = async () => {
  if (!isThumbnailMode.value) {
    groupImageInfo.value = '';
    return;
  }

  const remoteImage = await fetchImages(props.componentGroupData.chartConfig);
  if (remoteImage) {
    groupImageInfo.value = remoteImage;
    return;
  }

  // fetchImages 理论上恒返回字符串，兜底空串避免 undefined 写入缩略图状态
  groupImageInfo.value = (await getFirstChildImage()) ?? '';
};

void fetchGroupImage();
watch(
  () => [props.componentGroupData.chartConfig.image, props.layerMode],
  () => {
    void fetchGroupImage();
  },
);

const themeColor = computed(() => designStore.getAppTheme);
const selectText = computed(() => props.layerMode === LayerModeEnum.TEXT);
const select = computed(() => {
  const id = props.componentGroupData.id;
  return chartEditStore.getTargetChart.selectId.find((e: string) => e === id);
});
const hover = computed(() => props.componentGroupData.id === chartEditStore.getTargetChart.hoverId);
const status = computed(() => props.componentGroupData.status);

const optionsHandle = (targetList: MenuOptionsItemType[], allList: MenuOptionsItemType[], targetInstance: CreateComponentType) => {
  const filter = (menulist: MenuEnum[]) => allList.filter((i) => menulist.includes(i.key as MenuEnum));

  if (chartEditStore.getTargetChart.selectId.length > 1) {
    return filter([MenuEnum.GROUP]);
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
  return [...filter([MenuEnum.UN_GROUP]), divider(), ...targetList.filter((i) => !statusMenuEnums.includes(i.key as MenuEnum))];
};

const clickHandle = (e: MouseEvent) => {
  if (window.$KeyboardActive?.ctrl) return;
  expend.value = !expend.value;
  mousedownHandle(e, props.componentGroupData);
};

const groupMousedownHandle = (e: MouseEvent) => {
  onClickOutSide();
  const id = props.componentGroupData.id;
  if (e.buttons === MouseEventButton.LEFT && window.$KeyboardActive?.ctrl) {
    if (chartEditStore.targetChart.selectId.includes(id)) {
      const exList = chartEditStore.targetChart.selectId.filter((item) => item !== id);
      chartEditStore.setTargetSelectChart(exList);
    } else {
      chartEditStore.setTargetSelectChart(id, true);
    }
    return;
  }
  chartEditStore.setTargetSelectChart(id);
};

const mousedownHandle = (e: MouseEvent, _componentInstance: CreateComponentGroupType | CreateComponentType, id?: string) => {
  e.preventDefault();
  e.stopPropagation();

  onClickOutSide();
  chartEditStore.setTargetSelectChart(id);
};

const mouseenterHandle = (componentInstance: CreateComponentGroupType | CreateComponentType) => {
  chartEditStore.setTargetHoverChart(componentInstance.id);
};

const mouseleaveHandle = (_componentInstance: CreateComponentGroupType | CreateComponentType) => {
  chartEditStore.setTargetHoverChart(undefined);
};
</script>

<template>
  <div class="go-content-layers-group-list-item">
    <div
      class="root-item-content"
      :class="{ hover, select, 'list-mini': selectText }"
      @click="clickHandle($event)"
      @mousedown="groupMousedownHandle($event)"
      @mouseenter="mouseenterHandle(componentGroupData)"
      @mouseleave="mouseleaveHandle(componentGroupData)"
      @contextmenu="handleContextMenu($event, componentGroupData, optionsHandle)"
    >
      <div class="go-flex-items-center item-content">
        <n-image v-if="groupImageInfo" class="list-img" object-fit="contain" preview-disabled :src="groupImageInfo" :fallback-src="requireErrorImg()" />
        <n-icon v-else size="20" class="go-ml-1" style="flex-shrink: 0">
          <template v-if="expend">
            <FolderOpenIcon />
          </template>
          <template v-else>
            <FolderIcon />
          </template>
        </n-icon>
        <n-ellipsis class="layer-name">
          {{ componentGroupData.chartConfig.title }}
        </n-ellipsis>
        <LayersStatus :is-group="false" :hover="hover" :status="status" />
      </div>
      <div :class="{ 'select-modal': select }"></div>
    </div>
    <n-collapse-transition :show="expend">
      <LayersListItem
        v-for="element in componentGroupData.groupList"
        :key="element.id"
        :component-data="element"
        :layer-mode="layerMode"
        :is-group="true"
        @mousedown="mousedownHandle($event, element, componentGroupData.id)"
        @mouseenter="mouseenterHandle(element)"
        @mouseleave="mouseleaveHandle(element)"
        @contextmenu="handleContextMenu($event, componentGroupData, optionsHandle)"
      />
    </n-collapse-transition>
  </div>
</template>

<style lang="scss" scoped>
$centerHeight: 52px;
$centerMiniHeight: 28px;
$textSize: 10px;

@include go(content-layers-group-list-item) {
  @extend .go-transition-quick;

  position: relative;
  width: 90%;
  margin: 10px 5%;
  margin-bottom: 5px;

  @include deep() {
    .go-content-layers-list-item {
      width: 95% !important;
      margin-right: 0 !important;
    }
  }

  &:hover {
    @include deep() {
      .icon-item {
        opacity: 1;
      }
    }
  }

  .root-item-content {
    height: $centerHeight;
    cursor: pointer;
    border: 1px solid rgb(0 0 0 / 0%);
    border-radius: 5px;

    &.hover,
    &:hover {
      @include fetch-bg-color('background-color4');
    }

    /* 选中 */
    &.select {
      /* 需要设置最高级，覆盖 hover 的颜色 */
      background-color: rgb(0 0 0 / 0%);
      border: 1px solid v-bind('themeColor');

      .list-img {
        border: 1px solid v-bind('themeColor') !important;
      }
    }

    &.list-mini {
      height: $centerMiniHeight;

      .item-content {
        height: calc(#{$centerMiniHeight} - 10px) !important;
      }

      .select-modal {
        height: calc(#{$centerMiniHeight} + 2px) !important;
      }
    }
  }

  .select-modal,
  .item-content {
    position: absolute;
    top: 0;
    left: 0;
  }

  .item-content {
    z-index: 1;
    justify-content: start !important;
    width: calc(100% - 10px);
    height: calc(#{$centerHeight} - 10px);
    padding: 6px 5px;
    overflow: hidden;
  }

  .select-modal {
    width: 100%;
    height: calc(#{$centerHeight} + 2px);
    background-color: v-bind('themeColor');
    opacity: 0.3;
  }

  .list-img {
    flex-shrink: 0;
    width: 44px;
    height: 36px;
    padding: 2px;
    overflow: hidden;
    border: none !important;
    border-radius: 5px;
    object-fit: contain;

    @include hover-border-color('hover-border-color');
  }

  .layer-name {
    flex: 1;
    min-width: 0;
    padding-left: 6px;
    margin-right: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: $textSize;
    white-space: nowrap;
  }

  .list-status-icon {
    margin-left: 3px;
  }
}
</style>
