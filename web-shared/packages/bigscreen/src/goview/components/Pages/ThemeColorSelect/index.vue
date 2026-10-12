<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-button quaternary @click="modelShow = true" :title="editorT('orgManage.flow.fwColor')">
    <n-icon size="20" :depth="1">
      <color-wand-icon></color-wand-icon>
    </n-icon>
  </n-button>
  <n-modal v-model:show="modelShow">
    <div class="go-system-color-setting">
      <n-space justify="space-between">
        <n-h3 class="title">{{ editorT('bigscreenEditor.ui.selectThemeColor') }}</n-h3>
        <n-icon size="20" class="go-cursor-pointer" @click="modelShow = false">
          <close-icon></close-icon>
        </n-icon>
      </n-space>
      <n-divider></n-divider>
      <div class="model-content" ref="contentLeftRef">
        <div class="content-left" v-if="modelShow">
          <color-list :designColor="designColorSplit" @colorSelectHandle="colorSelectHandle"></color-list>
        </div>
        <div class="content-right">
          <div class="color-name-detail">
            <n-text v-if="appThemeDetail" class="color-name">{{ appThemeDetail.name }}</n-text>
            <n-text v-else class="color-name">{{ editorT('bigscreenEditor.ui.traditionalChineseColors') }}</n-text>
            <n-text v-if="appThemeDetail" class="color-name-Pinyin">{{ appThemeDetail.pinyin.toUpperCase() }}</n-text>
            <div v-if="appThemeDetail" class="select-color" :style="{ backgroundColor: designStore.appTheme }"></div>
          </div>
          <img :src="themeColorLogo" />
        </div>
      </div>
      <div class="model-footer">
        {{ editorT('bigscreenEditor.ui.traditionalChineseColorPaletteSource') }}
        <n-a href="http://zhongguose.com" target="_blank">http://zhongguose.com</n-a>
      </div>
    </div>
  </n-modal>
</template>

<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { ref, computed, watch, toRefs } from 'vue';
import { useDesignStore } from '@/store/modules/designStore/designStore';
import type { AppThemeColorType } from '@/store/modules/designStore/designStore.type';
import { icon } from '@/plugins';
import themeColorLogo from '@/assets/images/exception/theme-color.png';
import { loadAsyncComponent } from '@/utils';
import { useScroll } from '@vueuse/core';
import designColor from '@/settings/designColor.json';

const ColorList = loadAsyncComponent(() => import('./components/ColorList.vue'));
const { ColorWandIcon, CloseIcon } = icon.ionicons5;

let splitNumber = 50;

const designStore = useDesignStore();
const modelShow = ref(false);
const contentLeftRef = ref<HTMLElement | null>(null);
const designColorSplit = ref(designColor.slice(0, splitNumber));

const { arrivedState } = useScroll(contentLeftRef, {
  offset: { bottom: 200 },
});
const { bottom } = toRefs(arrivedState);

const appThemeDetail = computed(() => {
  return designStore.getAppThemeDetail;
});

const colorSelectHandle = (color: AppThemeColorType) => {
  designStore.setAppColor(color);
};

watch(
  () => bottom.value,
  (newData: boolean) => {
    if (newData) {
      splitNumber = splitNumber + 50;
      designColorSplit.value = designColor.slice(0, splitNumber);
    }
  },
);

watch(
  () => modelShow.value,
  (modelShow: boolean) => {
    if (!modelShow) {
      splitNumber = 50;
    }
  },
);
</script>

<style lang="scss" scoped>
$height: 85vh;

@include go('system-color-setting') {
  @extend .go-background-filter;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 90%;
  min-width: 1000px;
  height: $height;
  padding: 20px 25px;
  overflow: hidden;
  border-radius: 15px;

  @include hover-border-color('background-color5');

  .title {
    margin: 0;
  }

  .model-content {
    flex: 1;
    height: calc(#{$height} - 40px - 48px - 36px);
    overflow: auto;

    /* 右侧 */
    .content-right {
      position: absolute;
      top: 0;
      right: 50px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      width: 300px;
      height: 100%;

      .color-name-detail {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 40px;

        .go-flex-items-center {
          flex-direction: column;
        }

        .select-color {
          width: 100px;
          height: 20px;
          margin-top: 20px;
          background-image: url('@/assets/images/exception/texture.png');
          border-radius: 3px;
        }

        .color-name {
          display: block;
          width: 110px;
          margin: 0 auto;
          font-family: serif;
          font-size: 80px;
          color: #fff;
          text-align: center;
          background-repeat: no-repeat;
          background-position: center top;
        }

        .color-name-Pinyin {
          font-family: Georgia;
          font-size: 16px;
          text-align: center;
        }
      }
    }
  }

  .model-footer {
    z-index: 1;
    text-align: end;
  }
}
</style>
