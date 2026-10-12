<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { onMounted } from 'vue';

import { loadLibraryPhotos } from '@/packages/components/Photos/Library';

import { ContentBox } from '../ContentBox/index';
import { ChartsOptionContent } from './components/ChartsOptionContent';
import { ChartsSearch } from './components/ChartsSearch';
import { CustomComponentContent } from './components/CustomComponentContent';
import ScreenTemplateContent from './components/ScreenTemplateContent/index.vue';
import { useAsideHook } from './hooks/useAside.hook';

const props = defineProps<{
  allowedCategories?: string[];
}>();

const {
  getCharts,
  BarChartIcon,
  themeColor,
  activePanel,
  onPanelChange,
  clickItemHandle,
  menuOptions,
  basicMenuOptions,
  templateMenuOption,
  templateActiveMenu,
  clickTemplateItemHandle,
  currentSelectOptions,
  currentActiveMenu,
} = useAsideHook(props.allowedCategories);

onMounted(() => {
  loadLibraryPhotos();
});
</script>

<template>
  <ContentBox class="go-content-charts" :class="{ scoped: !getCharts }" :title="editorT('iotApp.menu.componentLabel')" :depth="1" :back-icon="false" :disabled-scroll="true">
    <template #icon>
      <n-icon size="14" :depth="2">
        <BarChartIcon />
      </n-icon>
    </template>

    <template #top-right>
      <ChartsSearch v-show="getCharts" :menu-options="menuOptions" />
    </template>
    <aside>
      <div class="menu-width-box">
        <div class="menu-width">
          <n-collapse accordion :expanded-names="activePanel" @update:expanded-names="onPanelChange">
            <n-collapse-item v-if="!allowedCategories || allowedCategories.includes('basic')" name="basic" :title="editorT('iotApp.dataFlow.scopeCommon')">
              <div
                v-for="item in basicMenuOptions"
                :key="item.key"
                class="collapse-menu-item"
                :class="{ active: currentActiveMenu === item.key }"
                @click="clickItemHandle(item.key, item)"
              >
                <component :is="item.icon" />
                <span class="item-label">{{ item.label }}</span>
              </div>
            </n-collapse-item>
            <n-collapse-item v-if="!allowedCategories || allowedCategories.includes('templates')" name="templates" :title="editorT('console.appCard.tagTemplate')">
              <div
                v-if="templateMenuOption"
                class="collapse-menu-item"
                :class="{ active: templateActiveMenu === templateMenuOption.key }"
                @click="clickTemplateItemHandle(templateMenuOption.key, templateMenuOption)"
              >
                <component :is="templateMenuOption.icon" />
                <span class="item-label">{{ templateMenuOption.label }}</span>
              </div>
            </n-collapse-item>
            <n-collapse-item v-if="!allowedCategories || allowedCategories.includes('custom')" name="custom" :title="editorT('iotApp.productPage.custom')">
              <div class="collapse-menu-item active">
                <n-icon size="18"><BarChartIcon /></n-icon>
                <span class="item-label">{{ editorT('orgManage.common.all') }}</span>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
        <div class="menu-component-box">
          <transition name="fade-content" mode="out-in">
            <CustomComponentContent
              v-if="activePanel === 'basic' && currentActiveMenu === 'Presets'"
              key="preset-content"
              mode="preset"
            />
            <ScreenTemplateContent v-else-if="activePanel === 'templates'" key="template-content" />
            <div v-else-if="activePanel !== 'custom'" :key="currentActiveMenu" class="content-wrapper">
              <go-skeleton v-if="!currentSelectOptions" :load="!currentSelectOptions" round text :repeat="2" style="width: 90%" />
              <ChartsOptionContent v-else :select-options="currentSelectOptions" :key="currentActiveMenu" />
            </div>
            <CustomComponentContent v-else key="custom-content" mode="custom" />
          </transition>
        </div>
      </div>
    </aside>
  </ContentBox>
</template>

<style lang="scss" scoped>
$width: 330px;
$widthScoped: 78px;
$topHeight: 40px;

@include go(content-charts) {
  width: $width;

  @include deep() {
    .menu-width {
      .n-collapse {
        border: none;

        .n-collapse-item {
          margin: 0;
          border: none;

          .n-collapse-item__header {
            padding: 8px 6px;
            font-size: 12px;
            color: rgb(255 255 255 / 65%);
            background: transparent;
            border: none;

            &:hover {
              color: rgb(255 255 255 / 85%);
            }
          }

          .n-collapse-item__content-wrapper {
            .n-collapse-item__content-inner {
              padding: 0;
            }
          }
        }
      }
    }
  }

  &.scoped,
  .menu-width {
    width: $widthScoped;
  }

  .menu-width {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  aside {
    height: 100%;
  }

  .menu-width-box {
    display: flex;
    height: 100%;

    .menu-width {
      flex-shrink: 0;
      @include fetch-bg-color('background-color2');
    }

    .menu-component-box {
      flex-shrink: 0;
      width: $width - $widthScoped;
      height: 100%;
      overflow: hidden;
    }
  }

  .collapse-menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgb(255 255 255 / 6%);
    }

    &.active {
      position: relative;
      color: v-bind('themeColor');

      &::after {
        position: absolute;
        top: 0;
        left: 2px;
        width: 3px;
        height: 100%;
        content: '';
        background-color: v-bind('themeColor');
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
      }
    }

    .item-label {
      margin-top: 2px;
      font-size: 12px;
    }
  }

  .content-wrapper {
    height: 100%;
  }

  .fade-content-enter-active,
  .fade-content-leave-active {
    transition: opacity 0.15s ease;
  }

  .fade-content-enter-from,
  .fade-content-leave-to {
    opacity: 0;
  }
}
</style>
