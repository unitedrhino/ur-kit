<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PickCreateComponentType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { ref } from 'vue';

import logoImg from '@/assets/logo.png';
import { CollapseItem, SettingItem, SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { BlendModeEnumList } from '@/packages/index.type';
import { icon } from '@/plugins';

const props = defineProps({
  isGroup: {
    type: Boolean,
    required: false,
  },
  isCanvas: {
    type: Boolean,
    default: false,
  },
  chartStyles: {
    type: Object as PropType<Omit<PickCreateComponentType<'styles'>, 'animations'>>,
    required: true,
  },
});

const { HelpOutlineIcon } = icon.ionicons5;

// 百分比格式化 person
const sliderFormatTooltip = (v: string) => {
  return `${(Number.parseFloat(v) * 100).toFixed(0)}%`;
};

// 角度格式化
const degFormatTooltip = (v: string) => {
  return `${v}deg`;
};

// 预设滤镜
interface presetImageData {
  index: number;
  src: string;
  hueRotate: number;
}

const presetImageList = ref([] as presetImageData[]);
for (let i = 1; i <= 12; i++) {
  presetImageList.value.push({
    index: i,
    src: logoImg,
    hueRotate: i * 30,
  });
}
</script>

<template>
  <div v-show="isGroup">
    <n-divider n-divider style="margin: 10px 0" />
    <n-tag type="warning"> {{ editorT('bigscreenEditor.ui.ungroup') }} {{ isCanvas ? editorT('bigscreenEditor.ui.filters') : editorT('bigscreenEditor.ui.filtersTransforms') }} {{ editorT('bigscreenEditor.ui.willAlsoDisappear') }}</n-tag>
  </div>

  <CollapseItem :name="isCanvas ? editorT('bigscreenEditor.ui.filters') : editorT('bigscreenEditor.ui.filtersTransforms')">
    <template #header>
      <n-switch v-model:value="chartStyles.filterShow" size="small" />
    </template>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.hue')" :alone="true">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message3', { value: String(chartStyles.hueRotate) })">
        <!-- 透明度 -->
        <n-slider v-model:value="chartStyles.hueRotate" :step="3" :min="0" :max="360" :format-tooltip="degFormatTooltip" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.saturation')" :alone="true">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message4', { value: String((parseFloat(String(chartStyles.saturate)) * 100).toFixed(0)) })">
        <!-- 透明度 -->
        <n-slider v-model:value="chartStyles.saturate" :step="0.1" :min="0" :max="2" :format-tooltip="sliderFormatTooltip" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.contrast')" :alone="true">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message5', { value: String((parseFloat(String(chartStyles.contrast)) * 100).toFixed(0)) })">
        <!-- 透明度 -->
        <n-slider v-model:value="chartStyles.contrast" :step="0.1" :min="0" :max="2" :format-tooltip="sliderFormatTooltip" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.brightness')" :alone="true">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message6', { value: String((parseFloat(String(chartStyles.brightness)) * 100).toFixed(0)) })">
        <!-- 透明度 -->
        <n-slider v-model:value="chartStyles.brightness" :step="0.1" :min="0" :max="2" :format-tooltip="sliderFormatTooltip" />
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.opacity')" :alone="true">
      <SettingItem :name="editorT('bigscreenEditor.dynamic.message7', { value: String((parseFloat(String(chartStyles.opacity)) * 100).toFixed(0)) })">
        <!-- 透明度 -->
        <n-slider v-model:value="chartStyles.opacity" :step="0.1" :min="0" :max="1" :format-tooltip="sliderFormatTooltip" />
      </SettingItem>
    </SettingItemBox>

    <!--  预设滤镜  -->
    <div v-if="presetImageList.length > 0" class="preset-filter">
      <n-image
        class="preset-img"
        width="46"
        preview-disabled
        object-fit="scale-down"
        v-for="(item, index) in presetImageList"
        :key="index"
        :class="{ 'active-preset': item.hueRotate === chartStyles.hueRotate }"
        :style="{ filter: `hue-rotate(${item.hueRotate}deg)` }"
        :src="item.src"
        @click="() => (chartStyles.hueRotate = item.hueRotate)"
      />
    </div>

    <!-- 混合模式 -->
    <SettingItemBox v-if="!isCanvas" :alone="true">
      <template #name>
        <n-text>{{ editorT('bigscreenEditor.ui.mixed') }}</n-text>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-icon size="21" :depth="3">
              <HelpOutlineIcon />
            </n-icon>
          </template>
          <n-text>{{ editorT('bigscreenEditor.ui.videoComponentsNeedingTransparentBackgroundScreenBlendingGenerally') }}</n-text>
        </n-tooltip>
      </template>
      <SettingItem>
        <n-select v-model:value="chartStyles.blendMode" size="small" filterable :options="BlendModeEnumList" />
      </SettingItem>
    </SettingItemBox>

    <!-- 变换 -->
    <SettingItemBox v-if="!isCanvas" :name="editorT('bigscreenEditor.ui.rotation')">
      <SettingItem :name="editorT('bigscreenEditor.ui.zAxisPlaneRotation')">
        <!-- 透明度 -->
        <n-input-number v-model:value="chartStyles.rotateZ" :min="0" :max="360" size="small" :placeholder="editorT('bigscreenEditor.ui.angle')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.xAxisRotation')">
        <!-- 透明度 -->
        <n-input-number v-model:value="chartStyles.rotateX" :min="0" :max="360" size="small" :placeholder="editorT('bigscreenEditor.ui.angle')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.yAxisRotation')">
        <!-- 透明度 -->
        <n-input-number v-model:value="chartStyles.rotateY" :min="0" :max="360" size="small" :placeholder="editorT('bigscreenEditor.ui.angle')" />
      </SettingItem>
    </SettingItemBox>

    <!-- 倾斜 -->
    <SettingItemBox v-if="!isCanvas" :name="editorT('bigscreenEditor.ui.skew')">
      <SettingItem :name="editorT('bigscreenEditor.ui.xAxisSkew')">
        <n-input-number v-model:value="chartStyles.skewX" :min="0" :max="360" size="small" :placeholder="editorT('bigscreenEditor.ui.angle')" />
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.yAxisSkew')">
        <n-input-number v-model:value="chartStyles.skewY" :min="0" :max="360" size="small" :placeholder="editorT('bigscreenEditor.ui.angle')" />
      </SettingItem>
    </SettingItemBox>

    <!-- 提示 -->
    <n-tag type="warning"> {{ editorT('bigscreenEditor.ui.ifDashboardLooksBlurryPreviewTryDisablingFilters') }} </n-tag>
  </CollapseItem>
</template>

<style lang="scss" scoped>
// 预设滤镜
.preset-filter {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 20px 0 10px;

  .preset-img {
    padding: 2px;
    margin-bottom: 10px;
    cursor: pointer;
    border-radius: 6px;
    transition: 0.2s all;

    &:hover {
      box-shadow: 0 0 0 2px #66a9c9;
    }
  }

  .active-preset {
    box-shadow: 0 0 0 2px #66a9c9;
  }
}
</style>
