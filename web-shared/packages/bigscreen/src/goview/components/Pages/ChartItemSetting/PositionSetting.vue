<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentGroupType, PickCreateComponentType } from '@/packages/index.type';
import type { EditCanvasConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import type { PropType } from 'vue';

import { computed } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { icon } from '@/plugins/index';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getGroupContentBounds } from '@/utils/groupBounds';
import { renderIcon } from '@/utils';

const props = defineProps({
  canvasConfig: {
    type: Object as PropType<EditCanvasConfigType>,
    required: true,
  },
  chartAttr: {
    type: Object as PropType<PickCreateComponentType<'attr'>>,
    required: true,
  },
  chartId: {
    type: String,
    required: true,
  },
});

const chartEditStore = useChartEditStore();

const {
  AlignHorizontalLeftIcon,
  AlignVerticalCenterIcon,
  AlignVerticalTopIcon,
  AlignHorizontalCenterIcon,
  AlignHorizontalRightIcon,
  AlignVerticalBottomIcon,
} = icon.carbon;

// as const 固定为只读元组，已知索引访问不再产生 undefined
const positionList = [
  {
    key: 'AlignHorizontalLeftIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.left'); },
    icon: renderIcon(AlignHorizontalLeftIcon),
  },
  {
    key: 'AlignVerticalCenterIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.centerVertically'); },
    icon: renderIcon(AlignVerticalCenterIcon),
  },
  {
    key: 'AlignHorizontalRightIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.right'); },
    icon: renderIcon(AlignHorizontalRightIcon),
  },
  {
    key: 'AlignVerticalTopIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.top'); },
    icon: renderIcon(AlignVerticalTopIcon),
  },
  {
    key: 'AlignHorizontalCenterIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.centerHorizontally'); },
    icon: renderIcon(AlignHorizontalCenterIcon),
  },
  {
    key: 'AlignVerticalBottomIcon',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get lable() { return editorT('bigscreenEditor.ui.bottom'); },
    icon: renderIcon(AlignVerticalBottomIcon),
  },
] as const;

const positionBounds = computed(() => {
  const editCanvas = chartEditStore.getEditCanvas;
  const fallback = {
    height: props.canvasConfig.height,
    width: props.canvasConfig.width,
  };

  if (!editCanvas.isGroupIsolation || !editCanvas.activeGroupId || editCanvas.activeGroupId === props.chartId) {
    return fallback;
  }

  const activeGroup = chartEditStore.getComponentList.find((item) => item.isGroup && item.id === editCanvas.activeGroupId);
  if (!activeGroup?.isGroup) return fallback;

  const isChildOfActiveGroup = activeGroup.groupList?.some((item) => item.id === props.chartId);
  if (!isChildOfActiveGroup) return fallback;

  // 上方 isGroup 守卫已确认是分组组件；断言仅收窄 union 类型，与仓库其他处用法一致
  return getGroupContentBounds(activeGroup as CreateComponentGroupType);
});

const maxX = computed(() => Math.max(positionBounds.value.width - props.chartAttr.w, 0));
const maxY = computed(() => Math.max(positionBounds.value.height - props.chartAttr.h, 0));

const clampX = (value: number) => Math.min(Math.max(value, 0), maxX.value);
const clampY = (value: number) => Math.min(Math.max(value, 0), maxY.value);

const xValue = computed({
  get: () => props.chartAttr.x,
  set: (value: null | number) => {
    props.chartAttr.x = clampX(Number(value) || 0);
  },
});

const yValue = computed({
  get: () => props.chartAttr.y,
  set: (value: null | number) => {
    props.chartAttr.y = clampY(Number(value) || 0);
  },
});

const positonHandle = (key: string) => {
  switch (key) {
    case positionList[0].key: {
      xValue.value = 0;
      break;
    }
    case positionList[1].key: {
      yValue.value = (positionBounds.value.height - props.chartAttr.h) / 2;
      break;
    }
    case positionList[2].key: {
      xValue.value = positionBounds.value.width - props.chartAttr.w;
      break;
    }
    case positionList[3].key: {
      yValue.value = 0;
      break;
    }
    case positionList[4].key: {
      xValue.value = (positionBounds.value.width - props.chartAttr.w) / 2;
      break;
    }
    case positionList[5].key: {
      yValue.value = positionBounds.value.height - props.chartAttr.h;
      break;
    }
  }
};
</script>

<template>
  <n-divider style="margin: 10px 0" />
  <n-space :size="8" justify="space-between" style="margin-top: 10px">
    <n-button secondary v-for="item in positionList" :key="item.key" @click="positonHandle(item.key)">
      <template #icon>
        <component :is="item.icon" />
      </template>
    </n-button>
  </n-space>
  <SettingItemBox :name="editorT('iotApp.devicePage.location')">
    <n-input-number v-model:value="yValue" :min="0" :max="maxY" size="small" placeholder="px">
      <template #prefix>
        <n-text depth="3">{{ editorT('iotApp.av.ptzUp') }}</n-text>
      </template>
    </n-input-number>
    <n-input-number v-model:value="xValue" :min="0" :max="maxX" size="small" placeholder="px">
      <template #prefix>
        <n-text depth="3">{{ editorT('iotApp.av.ptzLeft') }}</n-text>
      </template>
    </n-input-number>
  </SettingItemBox>
</template>
