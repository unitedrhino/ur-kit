<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('orgManage.memory.pathCol')" :expanded="true">
      <setting-item v-for="(item, index) in optionData.dataset" :key="index">
        <n-input-group>
          <n-input v-model:value="optionData.dataset[index]" size="small" :placeholder="editorT('bigscreenEditor.ui.componentEnterTheImageURL')"></n-input>
          <n-button ghost @click="optionData.dataset.splice(index, 1)"> - </n-button>
        </n-input-group>
      </setting-item>
      <setting-item>
        <n-button size="small" @click="optionData.dataset.push('')"> {{ editorT('bigscreenEditor.ui.componentAdd') }}</n-button>
      </setting-item>
  </collapse-item>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentCarouselProperties')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentPlayer')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.autoplay" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentAutoplay') }}</n-text>
        </n-space>
      </setting-item>
      <!-- 开启自动播放时，设置间隔时间 -->
      <setting-item :name="editorT('orgManage.cloneGroup.intervalLabel')">
        <n-input-number v-model:value="optionData.interval" size="small" placeholder="">
          <template #suffix> {{ editorT('bigscreenEditor.ui.componentMilliseconds') }} </template>
        </n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentCarouselDirection')">
        <n-select v-model:value="optionData.direction" :options="directions" :placeholder="editorT('bigscreenEditor.ui.componentSelectDirection')" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentTransitionEffect')">
        <n-select v-model:value="optionData.effect" :options="effects" :placeholder="editorT('bigscreenEditor.ui.componentEffect')" />
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentItemsPerPage')">
        <n-input-number v-model:value="optionData.slidesPerview" size="small" placeholder=""></n-input-number>
      </setting-item>
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.centeredSlides" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentCenterDisplay') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentImageStyle')">
        <n-select v-model:value="optionData.fit" :options="fitList" :placeholder="editorT('bigscreenEditor.ui.componentStyle')" />
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentIndicator')">
      <setting-item :name="editorT('bigscreenEditor.ui.componentStyle')">
        <n-select v-model:value="optionData.dotType" :options="dotTypes" :placeholder="editorT('bigscreenEditor.ui.componentSelectStyle')" />
      </setting-item>
      <setting-item :name="editorT('iotApp.devicePage.location')">
        <n-select v-model:value="optionData.dotPlacement" :options="dotPlacements" :placeholder="editorT('bigscreenEditor.ui.componentSelectPosition')" />
      </setting-item>
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.showDots" size="small" />
          <n-text>{{ editorT('orgManage.menuManage.shown') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.showArrow" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentArrow') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.draggable" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentDragToSwitch') }}</n-text>
        </n-space>
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

// 字典
const dotTypes = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('system.menu.badgeType.dot'); },
    value: 'dot'
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentLine2'); },
    value: 'line'
  }
]
const directions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHorizontal'); },
    value: 'horizontal'
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentVertical'); },
    value: 'vertical'
  }
]
const effects = [
  {
    label: 'slide',
    value: 'slide'
  },
  {
    label: 'fade',
    value: 'fade'
  },
  {
    label: 'card',
    value: 'card'
  },
  {
    label: 'custom',
    value: 'custom'
  }
]
const dotPlacements = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentTopEdge'); },
    value: 'top'
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBottomEdge'); },
    value: 'bottom'
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentLeftEdge'); },
    value: 'left'
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentRightEdge'); },
    value: 'right'
  }
]

// 适应类型
const fitList = [
  {
    value: 'fill',
    label: 'fill'
  },
  {
    value: 'contain',
    label: 'contain'
  },
  {
    value: 'cover',
    label: 'cover'
  },
  {
    value: 'scale-down',
    label: 'scale-down'
  },
  {
    value: 'none',
    label: 'none'
  }
]
</script>
