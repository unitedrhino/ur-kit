<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div>
    <CollapseItem :name="editorT('bigscreenEditor.ui.componentGraph')" :expanded="true">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentStyle')">
        <setting-item :name="editorT('bigscreenEditor.ui.componentLayout')">
          <n-select v-model:value="graphConfig.layout" :options="GraphLayout" size="small" />
        </setting-item>
      </SettingItemBox>
      <SettingItemBox :name="editorT('iotApp.productPage.tags')">
        <setting-item :name="editorT('bigscreenEditor.ui.display')">
          <n-select v-model:value="graphConfig.label.show" :options="LabelSwitch" size="small" />
        </setting-item>
        <setting-item :name="editorT('iotApp.devicePage.location')">
          <n-select v-model:value="graphConfig.label.position" :options="LabelPosition" size="small" />
        </setting-item>
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentLine')">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentArc')">
          <!-- 需要输入两位的小数才会变化 -->
          <n-input-number
            v-model:value="graphConfig.lineStyle.curveness"
            :min="0"
            :step="0.01"
            :placeholder="editorT('bigscreenEditor.ui.componentCurvature')"
            size="small"
          ></n-input-number>
        </SettingItem>
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.legend')">
        <SettingItem :name="editorT('orgManage.flow.fwColor')">
          <n-color-picker
            size="small"
            :modes="['hex']"
            v-model:value="optionData.legend.textStyle.color"
          ></n-color-picker>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenManagement.ui.text')">
          <n-input-number
            v-model:value="optionData.legend.textStyle.fontSize"
            :min="0"
            :step="1"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentTextSize')"
          >
          </n-input-number>
        </SettingItem>
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.componentForceDirectedLayout')" v-if="graphConfig.force && graphConfig.layout == 'force'">
        <SettingItem :name="editorT('bigscreenEditor.ui.componentRepulsionFactor')" v-if="graphConfig.force.repulsion">
          <n-input-number
            v-model:value="graphConfig.force.repulsion"
            :min="0"
            :step="1"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentRepulsionFactorSize')"
          >
          </n-input-number>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentAttractionFactor')" v-if="graphConfig.force.gravity">
          <n-input-number
            v-model:value="graphConfig.force.gravity"
            :min="0"
            :step="0.1"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentAttractionFactor')"
          >
          </n-input-number>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentNodeDistance')">
          <n-input-number
            v-model:value="graphConfig.force.edgeLength"
            :min="0"
            :step="1"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentNodeDistance')"
          >
          </n-input-number>
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentLoopAnimation')">
          <n-select v-model:value="graphConfig.force.layoutAnimation" :options="LayoutAnimation" size="small" />
        </SettingItem>
        <SettingItem :name="editorT('bigscreenEditor.ui.componentNodeSpeed')">
          <n-input-number
            v-model:value="graphConfig.force.friction"
            :min="0"
            :step="0.1"
            size="small"
            :placeholder="editorT('bigscreenEditor.ui.componentNodeSpeed')"
          >
          </n-input-number>
        </SettingItem>
      </SettingItemBox>
    </CollapseItem>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed } from 'vue'
import { CollapseItem, SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { defaultSeries, option, GraphLayout, LabelSwitch, LabelPosition, LayoutAnimation } from './config'
import cloneDeep from 'lodash/cloneDeep'
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index'

const props = defineProps({
  optionData: {
    type: Object as PropType<typeof option & GlobalThemeJsonType>,
    required: true
  }
})

// series[0] 为关系图唯一 series；异常数据缺失时回退默认配置，保证设置面板可渲染（正常数据不会命中）
const graphConfig = computed(() => {
  return props.optionData.series[0] ?? cloneDeep(defaultSeries)
})
</script>
