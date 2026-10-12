<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <!-- 组件配置 -->
  <n-divider class="go-my-3" title-placement="left"></n-divider>
  <setting-item-box
    :itemRightStyle="{
      gridTemplateColumns: '6fr 2fr',
    }"
    style="padding-right: 25px"
  >
    <template #name>
      {{ editorT('iotApp.devicePage.address') }}
      <n-tooltip trigger="hover" v-if="isDev()">
        <template #trigger>
          <n-icon size="21" :depth="3">
            <help-outline-icon></help-outline-icon>
          </n-icon>
        </template>
        <ul class="go-pl-0">
          {{ editorT('bigscreenEditor.ui.developmentUsesMockDataEnterValue') }}
          <li v-for="item in apiList" :key="item.value">
            <n-text type="info"> {{ item.value }} </n-text>
          </li>
        </ul>
      </n-tooltip>
    </template>
    <setting-item :name="editorT('bigscreenEditor.ui.requestMethodURL')">
      <n-input-group>
        <n-select class="select-type-options" v-model:value="requestHttpType" :options="selectTypeOptions" />
        <n-input v-model:value.trim="requestUrl" :min="1" :placeholder="editorT('bigscreenEditor.ui.enterURLWithoutBaseURL')">
          <template #prefix>
            <n-text>{{ requestOriginUrl }}</n-text>
            <n-divider vertical />
          </template>
        </n-input>
      </n-input-group>
      <!-- 组件url -->
    </setting-item>
    <setting-item :name="editorT('bigscreenEditor.ui.updateInterval0InitializesOnlyOnce')">
      <n-input-group>
        <n-input-number v-model:value.trim="requestInterval" class="select-time-number" min="0" :show-button="false" :placeholder="editorT('bigscreenEditor.ui.useGlobalDataByDefault')">
        </n-input-number>
        <!-- 单位 -->
        <n-select class="select-time-options" v-model:value="requestIntervalUnit" :options="selectTimeOptions" />
      </n-input-group>
    </setting-item>
  </setting-item-box>
  <setting-item-box :name="editorT('bigscreenEditor.ui.selectionMode')" class="go-mt-0">
    <request-header :targetDataRequest="targetDataRequest"></request-header>
  </setting-item-box>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, toRefs } from 'vue';
import { SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting';
import { useTargetData } from '@/views/chart/ContentConfigurations/components/hooks/useTargetData.hook';
import { selectTypeOptions, selectTimeOptions } from '@/views/chart/ContentConfigurations/components/ChartData/index.type';
import type { RequestConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';
import { RequestHeader } from '../RequestHeader';
import { isDev } from '@/utils';
import { icon } from '@/plugins';
import {
  graphUrl,
  chartDataUrl,
  chartSingleDataUrl,
  rankListUrl,
  scrollBoardUrl,
  numberFloatUrl,
  numberIntUrl,
  textUrl,
  imageUrl,
  radarUrl,
  heatMapUrl,
  scatterBasicUrl,
  mapUrl,
  capsuleUrl,
  wordCloudUrl,
  treemapUrl,
  threeEarth01Url,
  sankeyUrl,
  vchartBarDataUrl,
} from '@/api/mock';

const props = defineProps({
  targetDataRequest: Object as PropType<RequestConfigType>,
});

const { HelpOutlineIcon } = icon.ionicons5;
const { chartEditStore } = useTargetData();
const { requestOriginUrl } = toRefs(chartEditStore.getRequestGlobalConfig);
const { requestInterval, requestIntervalUnit, requestHttpType, requestUrl } = toRefs(props.targetDataRequest as RequestConfigType);

const apiList = [
  {
    value: editorT('bigscreenEditor.dynamic.message21', { url: String(chartDataUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message22', { url: String(chartSingleDataUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message23', { url: String(textUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message24', { url: String(numberIntUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message25', { url: String(numberFloatUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message26', { url: String(imageUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message27', { url: String(rankListUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message28', { url: String(scrollBoardUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message29', { url: String(radarUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message30', { url: String(heatMapUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message31', { url: String(scatterBasicUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message32', { url: String(mapUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message33', { url: String(capsuleUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message34', { url: String(wordCloudUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message35', { url: String(treemapUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message36', { url: String(threeEarth01Url) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message37', { url: String(sankeyUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message38', { url: String(graphUrl) }),
  },
  {
    value: editorT('bigscreenEditor.dynamic.message39', { url: String(vchartBarDataUrl) }),
  },
];
</script>

<style lang="scss" scoped>
.select-time-number {
  width: 100%;
}
.select-time-options {
  width: 100px;
}
.select-type-options {
  width: 120px;
}
</style>
