<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- Echarts 全局设置 -->
  <global-setting :optionData="optionData"></global-setting>
  <CollapseItem :name="editorT('bigscreenManagement.ui.definitionMaps')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentMapArea')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentChinaByDefault')">
        <n-select
          size="small"
          v-model:value="mapRegion.adcode"
          :options="mapRegionOptions"
          value-field="adcode"
          label-field="name"
        />
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAreaColor')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentColorAt0')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].itemStyle.areaColor.colorStops[0].color"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentColorAt100')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].itemStyle.areaColor.colorStops[1].color"
        ></n-color-picker>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentShadow')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].itemStyle.shadowColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBlurAmount')">
        <n-input-number
          v-model:value="seriesList[1].itemStyle.shadowBlur"
          :min="0"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheBlurAmount')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentHorizontalOffset')">
        <n-input-number
          v-model:value="seriesList[1].itemStyle.shadowOffsetX"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheHorizontalOffset')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentVerticalOffset')">
        <n-input-number
          v-model:value="seriesList[1].itemStyle.shadowOffsetY"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheVerticalOffset')"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentGeographicName')">
      <SettingItem :name="editorT('orgManage.menuManage.shown')">
        <n-space>
          <n-switch v-model:value="seriesList[1].label.show" size="small"></n-switch>
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontColor2')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="seriesList[1].label.color"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number
          v-model:value="seriesList[1].label.fontSize"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheFontSize')"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentFocusOnMouseHover')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentDisabledVisibleInPreview')">
        <n-space>
          <n-switch v-model:value="seriesList[1].emphasis.disabled" size="small"></n-switch>
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].emphasis.itemStyle.areaColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number
          v-model:value="seriesList[1].emphasis.label.fontSize"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheFontSize')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentShadow')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].emphasis.itemStyle.shadowColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentBorderSize')">
        <n-input-number
          v-model:value="seriesList[1].emphasis.itemStyle.borderWidth"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheBorderSize')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTextColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].emphasis.label.color"
        ></n-color-picker>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentHoverPopup')">
      <SettingItem :name="editorT('orgManage.menuManage.shown')">
        <n-space>
          <n-switch v-model:value="seriesList[1].tooltip.show" size="small"></n-switch>
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number
          v-model:value="seriesList[1].tooltip.textStyle.fontSize"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheFontSize')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontColor2')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].tooltip.textStyle.color"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.backgroundColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].tooltip.backgroundColor"
        ></n-color-picker>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentAreaBorder')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[1].itemStyle.borderColor"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentWidth')">
        <n-input-number
          v-model:value="seriesList[1].itemStyle.borderWidth"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheBorderSize')"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('orgManage.opLog.actionOther')" v-if="mapRegion.adcode === 'china'">
      <SettingItem>
        <n-checkbox v-model:checked="mapRegion.showHainanIsLands" size="small">{{ editorT('bigscreenEditor.ui.componentShowSouthChinaSeaIslands') }}</n-checkbox>
      </SettingItem>
      <SettingItem v-if="seriesList[2]">
        <n-checkbox v-model:checked="mapRegion.enter" size="small">{{ editorT('bigscreenEditor.ui.componentOpenChildLevel') }}</n-checkbox>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentReturnIcon')" v-if="mapRegion.enter">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="mapRegion.backColor"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number
          v-model:value="mapRegion.backSize"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheFontSize')"
        ></n-input-number>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
  <CollapseItem :name="editorT('bigscreenEditor.ui.componentMarker')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="seriesList[0].symbolSize" size="small" :min="0"></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="seriesList[0].itemStyle.color"></n-color-picker>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenManagement.ui.text')">
      <SettingItem :name="editorT('orgManage.menuManage.shown')">
        <n-space>
          <n-switch v-model:value="seriesList[0].label.show" size="small"></n-switch>
        </n-space>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontSize')">
        <n-input-number v-model:value="seriesList[0].label.fontSize" size="small" :min="0"></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentFontColor2')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="seriesList[0].label.color"></n-color-picker>
      </SettingItem>
    </SettingItemBox>

    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentRipple')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRippleSize')">
        <n-input-number
          v-model:value="seriesList[0].rippleEffect.scale"
          :min="1"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.componentEnterTheRippleSize')"
        ></n-input-number>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRippleColor')">
        <n-color-picker size="small" :modes="['hex']" v-model:value="seriesList[0].rippleEffect.color"></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentRippleDrawingMode')">
        <n-select size="small" v-model:value="seriesList[0].rippleEffect.brushType" :options="rippleEffectOptions" />
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>

  <CollapseItem v-if="seriesList[2]" :name="editorT('bigscreenEditor.ui.componentRoute')" :expanded="true">
    <SettingItemBox :name="editorT('bigscreenEditor.ui.componentArrow')">
      <SettingItem :name="editorT('bigscreenEditor.ui.componentSpeed')">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-input-number v-model:value="seriesList[2].effect.period" size="small" :min="0"></n-input-number>
          </template>
          {{ editorT('bigscreenEditor.ui.componentLowerValuesMeanHigherSpeed') }}
        </n-tooltip>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.componentTrail')">
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-input-number
              v-model:value="seriesList[2].effect.trailLength"
              size="small"
              :min="0"
              :max="1"
            ></n-input-number>
          </template>
          {{ editorT('bigscreenEditor.ui.componentEffectTrailLength01HigherValuesProduce') }}
        </n-tooltip>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.size')">
        <n-input-number v-model:value="seriesList[2].effect.symbolSize" size="small" :min="0"></n-input-number>
      </SettingItem>
    </SettingItemBox>
    <SettingItemBox :name="editorT('orgManage.agent.tabConfig')">
      <SettingItem :name="editorT('orgManage.flow.fwColor')">
        <n-color-picker
          size="small"
          :modes="['hex']"
          v-model:value="seriesList[2].lineStyle.normal.color"
        ></n-color-picker>
      </SettingItem>
      <SettingItem :name="editorT('bigscreenEditor.ui.width2')">
        <n-input-number v-model:value="seriesList[2].lineStyle.normal.width" size="small" :min="1"></n-input-number>
      </SettingItem>
    </SettingItemBox>
  </CollapseItem>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'
import { GlobalSetting } from '@/components/Pages/ChartItemSetting'
import { ref } from 'vue'
import mapChinaJson from './mapGeojson/china.json'

const mapRegionOptions = ref([
  {
    adcode: 'china',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.componentChina'); }
  }
])

const rippleEffectOptions = ref([
  {
    value: 'fill',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSolid'); }
  },
  {
    value: 'stroke',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentHollow'); }
  }
])

const props = defineProps({
  optionData: {
    type: Object as PropType<GlobalThemeJsonType>,
    required: true
  }
})

const initMapRegionOptions = () => {
  mapChinaJson.features.forEach((element: any) => {
    if (element.properties.name) {
      mapRegionOptions.value.push({ ...element.properties })
    }
  })
}
initMapRegionOptions()

const seriesList = computed(() => {
  return props.optionData.series
})

const mapRegion = computed(() => {
  return props.optionData.mapRegion
})
</script>
