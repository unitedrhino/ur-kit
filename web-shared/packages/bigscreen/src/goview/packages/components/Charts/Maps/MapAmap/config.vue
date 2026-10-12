<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentBasic')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentLanguageType')" :alone="true">
      <setting-item>
        <n-select size="small" v-model:value="optionData.mapOptions.lang" :options="langOptions" />
      </setting-item>
    </setting-item-box>
    <setting-item-box name="Key" :alone="true">
      <setting-item :name="editorT('bigscreenEditor.ui.componentUseYourOwnAMapApplicationKey')">
        <n-input v-model:value="optionData.mapOptions.amapKey" size="small"></n-input>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentCustomMapStyleID')" :alone="true">
      <setting-item>
        <n-input size="small" v-model:value="optionData.mapOptions.amapStyleKeyCustom" />
      </setting-item>
    </setting-item-box>
  </collapse-item>
  <collapse-item :name="editorT('bigscreenManagement.ui.definitionMaps')" :expanded="true">
    <setting-item-box :name="editorT('orgManage.memory.entityTopic')">
      <setting-item>
        <n-select size="small" v-model:value="optionData.mapOptions.amapStyleKey" :options="themeOptions" />
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentVisibleElements')" :alone="true">
      <n-checkbox-group v-model:value="optionData.mapOptions.features">
        <n-space item-style="display: flex;">
          <n-checkbox :value="item.value" :label="item.label" v-for="(item, index) in featuresOptions" :key="index" />
        </n-space>
      </n-checkbox-group>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentTextAnnotation')" :alone="true">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.mapOptions.showLabel" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentVisible') }}</n-text>
        </n-space>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('iotApp.devicePage.location')">
      <setting-item :name="editorT('iotApp.deviceDetail.longitude')">
        <n-input-number v-model:value="optionData.mapOptions.amapLon" :show-button="false" size="small">
          <template #suffix>°</template>
        </n-input-number>
      </setting-item>
      <setting-item :name="editorT('iotApp.deviceDetail.latitude')">
        <n-input-number v-model:value="optionData.mapOptions.amapLat" :show-button="false" size="small">
          <template #suffix>°</template>
        </n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentInitialZoom')">
        <n-input-number v-model:value="optionData.mapOptions.amapZindex" :min="0" size="small"></n-input-number>
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('orgPark.ui.mode')" :alone="true">
      <setting-item>
        <n-radio-group v-model:value="optionData.mapOptions.viewMode" name="radiogroup">
          <n-space>
            <n-radio v-for="song in viewModeOptions" :key="song.value" :value="song.value">
              {{ song.label }}
            </n-radio>
          </n-space>
        </n-radio-group>
      </setting-item>
    </setting-item-box>
    <template v-if="optionData.mapOptions.viewMode === '3D'">
      <setting-item-box>
        <setting-item :name="editorT('bigscreenEditor.ui.componentSkyColor')">
          <n-color-picker size="small" :modes="['hex']" v-model:value="optionData.mapOptions.skyColor"></n-color-picker>
        </setting-item>
        <setting-item :name="editorT('bigscreenEditor.ui.componentPitchAngle')">
          <n-input-number v-model:value="optionData.mapOptions.pitch" :min="0" :max="83" size="small"></n-input-number>
        </setting-item>
      </setting-item-box>
    </template>
  </collapse-item>
  <collapse-item :name="editorT('bigscreenEditor.ui.componentMarker')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentStyle')">
      <setting-item :name="editorT('orgManage.role.type')">
        <n-select size="small" v-model:value="optionData.mapOptions.mapMarkerType" :options="MarkerOptions" />
      </setting-item>
      <setting-item :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker v-model:value="optionData.mapOptions.marker.fillColor" size="small"></n-color-picker>
      </setting-item>
    </setting-item-box>
  </collapse-item>
  <collapse-item :name="editorT('bigscreenEditor.ui.layers')" :expanded="true">
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentSatelliteLayer')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.mapOptions.satelliteTileLayer.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentVisible') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentStackingOrder')">
        <n-input-number
          v-model:value="optionData.mapOptions.satelliteTileLayer.zIndex"
          :min="0"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.opacity')">
        <n-input-number
          v-model:value="optionData.mapOptions.satelliteTileLayer.opacity"
          :min="0"
          :max="1"
          step="0.1"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentZoomLevelRange')">
        <n-slider v-model:value="optionData.mapOptions.satelliteTileLayer.zooms" range :step="1" :max="18" :min="3" />
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentRoadNetworkLayer')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.mapOptions.roadNetTileLayer.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentVisible') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentStackingOrder')">
        <n-input-number
          v-model:value="optionData.mapOptions.roadNetTileLayer.zIndex"
          :min="0"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.opacity')">
        <n-input-number
          v-model:value="optionData.mapOptions.roadNetTileLayer.opacity"
          :min="0"
          :max="1"
          step="0.1"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentZoomLevelRange')">
        <n-slider v-model:value="optionData.mapOptions.roadNetTileLayer.zooms" range :step="1" :max="18" :min="3" />
      </setting-item>
    </setting-item-box>
    <setting-item-box :name="editorT('bigscreenEditor.ui.componentLiveTraffic')">
      <setting-item>
        <n-space>
          <n-switch v-model:value="optionData.mapOptions.trafficTileLayer.show" size="small" />
          <n-text>{{ editorT('bigscreenEditor.ui.componentVisible') }}</n-text>
        </n-space>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentStackingOrder')">
        <n-input-number
          v-model:value="optionData.mapOptions.trafficTileLayer.zIndex"
          :min="0"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.opacity')">
        <n-input-number
          v-model:value="optionData.mapOptions.trafficTileLayer.opacity"
          :min="0"
          :max="1"
          step="0.1"
          size="small"
        ></n-input-number>
      </setting-item>
      <setting-item :name="editorT('bigscreenEditor.ui.componentZoomLevelRange')">
        <n-slider v-model:value="optionData.mapOptions.trafficTileLayer.zooms" range :step="1" :max="18" :min="3" />
      </setting-item>
    </setting-item-box>
  </collapse-item>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { PropType } from 'vue'
import { option, MarkerEnum, ThemeEnum, LangEnum, ViewModeEnum, ShowHideEnum, FeaturesEnum } from './config'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'

defineProps({
  optionData: {
    type: Object as PropType<typeof option>,
    required: true
  }
})

const themeOptions = [
  {
    value: ThemeEnum.NORMAL,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.standard'); }
  },
  {
    value: ThemeEnum.DARK,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPhantomBlack'); }
  },
  {
    value: ThemeEnum.LIGHT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentMoonlightSilver'); }
  },
  {
    value: ThemeEnum.WHITES_MOKE,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDistantMountainGray'); }
  },
  {
    value: ThemeEnum.FRESH,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentGrassCyan'); }
  },
  {
    value: ThemeEnum.GREY,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentElegantGray'); }
  },
  {
    value: ThemeEnum.GRAFFITI,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentDoodle'); }
  },
  {
    value: ThemeEnum.MACARON,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentMacarons'); }
  },
  {
    value: ThemeEnum.BLUE,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentIndigoBlue'); }
  },
  {
    value: ThemeEnum.DARKBLUE,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentPolarNightBlue'); }
  },
  {
    value: ThemeEnum.WINE,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBrownPurple'); }
  }
]

const langOptions = [
  {
    value: LangEnum.ZH_CN,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSimplifiedChinese'); }
  },
  {
    value: LangEnum.EN,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentEnglish'); }
  },
  {
    value: LangEnum.ZH_EN,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentChineseAndEnglish'); }
  }
]

const viewModeOptions = [
  {
    value: ViewModeEnum.PLANE,
    label: '2D'
  },
  {
    value: ViewModeEnum.STEREOSCOPIC,
    label: '3D'
  }
]

const featuresOptions = [
  {
    value: FeaturesEnum.BG,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAreaPolygon'); }
  },
  {
    value: FeaturesEnum.POINT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentAnnotation'); }
  },
  {
    value: FeaturesEnum.ROAD,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentRoads'); }
  },
  {
    value: FeaturesEnum.BUILDING,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentBuildings'); }
  }
]

const MarkerOptions = [
  {
    value: MarkerEnum.CIRCLE_MARKER,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentCircleMarker'); }
  },
  {
    value: MarkerEnum.MARKER,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentLocationMarker'); }
  },
  {
    value: MarkerEnum.NONE,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHideMarkers'); }
  }
]
</script>
