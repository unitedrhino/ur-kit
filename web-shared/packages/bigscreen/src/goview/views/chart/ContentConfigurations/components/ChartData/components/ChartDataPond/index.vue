<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, onBeforeUnmount, ref, toRaw, toRefs, watchEffect } from 'vue';

import { customizeHttp } from '@/api/http';
import { SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { icon } from '@/plugins';
import { useDesignStore } from '@/store/modules/designStore/designStore';
import { sandboxExecute } from '@/utils/sandboxExecute';

import { useTargetData } from '../../../hooks/useTargetData.hook';
import { ChartDataMatchingAndShow } from '../ChartDataMatchingAndShow';
import { ChartDataPondControl } from './components/ChartDataPondControl';

const designStore = useDesignStore();
const { HelpOutlineIcon, FlashIcon, PulseIcon, FishIcon } = icon.ionicons5;
const { targetData, chartEditStore } = useTargetData();

const {
  requestDataPond,
  requestInterval: GlobalRequestInterval,
  requestIntervalUnit: GlobalRequestIntervalUnit,
} = toRefs(chartEditStore.getRequestGlobalConfig);

const loading = ref(false);
const controlModel = ref(false);
const showMatching = ref(false);

let firstFocus = 0;
let lastFilter: any;

// 所选数据池
const pondData = computed(() => {
  const selectId = targetData.value.request.requestDataPondId;
  if (!selectId) return undefined;
  const datum = requestDataPond.value.find((item) => {
    return selectId === item.dataPondId;
  });
  return datum;
});

// 颜色
const themeColor = computed(() => {
  return designStore.getAppTheme;
});

// 请求配置 model
const controlModelHandle = () => {
  controlModel.value = true;
};

// 发送请求
const sendHandle = async () => {
  if (!targetData.value?.request) {
    window.$message.warning(editorT('bigscreenEditor.ui.selectSharedAPI'));
    return;
  }
  loading.value = true;
  try {
    const res = await customizeHttp(toRaw(targetData.value.request), toRaw(chartEditStore.getRequestGlobalConfig));
    loading.value = false;
    if (res) {
      if (!res?.data && !targetData.value.filter) {
        window.$message.warning(editorT('bigscreenEditor.ui.dataDoesNotMatchDefaultFormatConfigureFilter'));
        showMatching.value = true;
        return;
      }
      targetData.value.option.dataset = await sandboxExecute(res?.data, res, targetData.value.filter);
      showMatching.value = true;
      return;
    }
    window.$message.warning(editorT('bigscreenEditor.ui.noResponseReceivedCheckAPI'));
  } catch (error) {
    console.error(error);
    loading.value = false;
    window.$message.warning(editorT('bigscreenEditor.ui.invalidDataCheckParameters'));
  }
};

watchEffect(() => {
  const filter = targetData.value?.filter;
  if (lastFilter !== filter && firstFocus) {
    lastFilter = filter;
    sendHandle();
  }
  firstFocus++;
});

onBeforeUnmount(() => {
  lastFilter = null;
});
</script>

<template>
  <!-- 选中内容 -->
  <div class="go-chart-data-pond">
    <n-card class="n-card-shallow">
      <SettingItemBox :name="editorT('bigscreenEditor.ui.requestName')" :alone="true">
        <n-input size="small" :placeholder="pondData?.dataPondName || editorT('bigscreenEditor.ui.noneAvailable')" :disabled="true">
          <template #prefix>
            <n-icon :component="FishIcon" />
          </template>
        </n-input>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.apiURL')" :alone="true">
        <n-input size="small" :placeholder="pondData?.dataPondRequestConfig.requestUrl || editorT('bigscreenEditor.ui.noneAvailable')" :disabled="true">
          <template #prefix>
            <n-icon :component="FlashIcon" />
          </template>
        </n-input>
      </SettingItemBox>

      <div class="edit-text" @click="controlModelHandle">
        <div class="go-absolute-center">
          <n-button type="primary" secondary>{{ editorT('bigscreenEditor.ui.editConfiguration') }}</n-button>
        </div>
      </div>
    </n-card>
  </div>

  <SettingItemBox :alone="true">
    <template #name>
      {{ editorT('iotApp.cardRoute.mockOperator') }}
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-icon size="21" :depth="3">
            <HelpOutlineIcon />
          </n-icon>
        </template>
        {{ editorT('bigscreenEditor.ui.assignDatasetFieldByDefault') }}
      </n-tooltip>
    </template>
    <n-button type="primary" ghost @click="sendHandle">
      <template #icon>
        <n-icon>
          <FlashIcon />
        </n-icon>
      </template>
      {{ editorT('bigscreenEditor.ui.sendRequest') }}
    </n-button>
  </SettingItemBox>

  <!-- 底部数据展示 -->
  <ChartDataMatchingAndShow :show="showMatching && !loading" :ajax="true" />

  <!-- 骨架图 -->
  <go-skeleton :load="loading" :repeat="3" />

  <!-- 编辑 / 新增弹窗 -->
  <ChartDataPondControl v-model:model-show="controlModel" @send-handle="sendHandle" />
</template>

<style scoped lang="scss">
@include go('chart-data-pond') {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  .n-card-shallow {
    &.n-card {
      @extend .go-background-filter;

      @include deep() {
        .n-card__content {
          padding: 10px;
        }
      }
    }

    .edit-text {
      @extend .go-background-filter;

      position: absolute;
      top: 0;
      left: 0;
      width: 325px;
      height: 136px;
      cursor: pointer;
      opacity: 0;
      backdrop-filter: blur(2px) !important;
      transition: all 0.3s;
    }

    &:hover {
      border-color: v-bind('themeColor');

      .edit-text {
        opacity: 1;
      }
    }
  }
}
</style>
