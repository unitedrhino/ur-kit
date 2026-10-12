<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { UploadCustomRequestOptions } from 'naive-ui';

import { ref, watch } from 'vue';

import axiosInstance from '@/api/axios';
import { StylesSetting } from '@/components/Pages/ChartItemSetting';
import { FileTypeEnum } from '@/enums/fileTypeEnum';
import { PreviewScaleEnum } from '@/enums/styleEnum';
import { icon } from '@/plugins';
import { swatchesColors } from '@/settings/chartThemes/index';
import { backgroundImageSize } from '@/settings/designSetting';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasConfigEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { loadAsyncComponent } from '@/utils';

const { ColorPaletteIcon } = icon.ionicons5;
const { ScaleIcon, FitToScreenIcon, FitToHeightIcon, FitToWidthIcon } = icon.carbon;

const chartEditStore = useChartEditStore();
const canvasConfig = chartEditStore.getEditCanvasConfig;

/**
 * 从 OSS 绝对 URL 提取相对路径。
 * 已是相对路径或 data: URL 则原样返回。
 *
 * http://<server-host>:7777/oss/temporary/.../bg.png → /oss/temporary/.../bg.png
 * /oss/temporary/.../bg.png → /oss/temporary/.../bg.png
 * https://images.unsplash.com/photo-123.jpg → https://images.unsplash.com/photo-123.jpg
 */
function extractOssRelativePath(url: string): string {
  if (!url || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);
    // 仅转换 OSS 路径（/oss/ 前缀），防止误杀外部 URL
    if (u.pathname.startsWith('/oss/')) {
      return u.pathname + u.search + u.hash;
    }
    return url;
  } catch {
    return url;
  }
}
const editCanvas = chartEditStore.getEditCanvas;

const uploadFileListRef = ref();
const switchSelectColorLoading = ref(false);
const selectColorValue = ref(0);

const ChartThemeColor = loadAsyncComponent(() => import('./components/ChartThemeColor/index.vue'));

// 默认应用类型
const selectColorOptions = [
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.applyColor'); },
    value: 0,
  },
  {
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.applyBackground'); },
    value: 1,
  },
];

const globalTabList = [
  {
    key: 'ChartTheme',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.defaultTheme'); },
    icon: ColorPaletteIcon,
    render: ChartThemeColor,
  },
];

const previewTypeList = [
  {
    key: PreviewScaleEnum.FIT,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.fitAutomatically'); },
    icon: ScaleIcon,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.preserveAspectRatioPageMayHaveEmptyMargins'); },
  },
  {
    key: PreviewScaleEnum.SCROLL_Y,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.yAxisScrolling'); },
    icon: FitToWidthIcon,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.fillXAxisAndScrollYAxisAutomatically'); },
  },
  {
    key: PreviewScaleEnum.SCROLL_X,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.xAxisScrolling'); },
    icon: FitToHeightIcon,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.fillYAxisAndScrollXAxisAutomatically'); },
  },
  {
    key: PreviewScaleEnum.FULL,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.fill'); },
    icon: FitToScreenIcon,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return editorT('bigscreenEditor.ui.stretchCanvasFillEntireView'); },
  },
];

watch(
  () => canvasConfig.selectColor,
  (newValue) => {
    selectColorValue.value = newValue ? 0 : 1;
  },
  {
    immediate: true,
  },
);

// 画布尺寸规则
const validator = (x: number) => x > 50;

// 修改尺寸
const changeSizeHandle = () => {
  chartEditStore.computedScale();
};

// 上传图片前置处理
// @ts-ignore
const beforeUploadHandle = async ({ file }) => {
  uploadFileListRef.value = [];
  const type = file.file.type;
  const size = file.file.size;

  if (size > 1024 * 1024 * backgroundImageSize) {
    window.$message.warning(editorT('bigscreenEditor.dynamic.message10', { size: String(backgroundImageSize) }));
    return false;
  }
  if (type !== FileTypeEnum.PNG && type !== FileTypeEnum.JPEG && type !== FileTypeEnum.GIF) {
    window.$message.warning(editorT('bigscreenEditor.ui.unsupportedFileFormatPleaseUploadAgain'));
    return false;
  }
  return true;
};

// 应用颜色
const selectColorValueHandle = (value: number) => {
  canvasConfig.selectColor = value == 0;
};

// 清除背景
const clearImage = () => {
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.BACKGROUND_IMAGE, undefined);
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.SELECT_COLOR, true);
};

// 启用/关闭 颜色（强制更新）
const switchSelectColorHandle = () => {
  switchSelectColorLoading.value = true;
  setTimeout(() => {
    switchSelectColorLoading.value = false;
  });
};

// 清除颜色
const clearColor = () => {
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.BACKGROUND, undefined);
  if (canvasConfig.backgroundImage) {
    chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.SELECT_COLOR, false);
  }
  switchSelectColorHandle();
};

// 自定义上传操作
const customRequest = async (options: UploadCustomRequestOptions) => {
  const { file } = options;
  if (!file.file) {
    window.$message.error(editorT('bigscreenEditor.ui.failedAddImagePleaseTryAgainLater'));
    return;
  }
  const formData = new FormData();
  formData.append('file', file.file);
  try {
    const res = await axiosInstance.post('/api/v1/system/common/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = (res as any)?.data?.fileUri;
    if (url) {
      // 提取 OSS 相对路径（如 /oss/temporary/...），避免存储绝对 URL 导致跨域 CORS
      const imageUrl = extractOssRelativePath(url);
      chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.BACKGROUND_IMAGE, imageUrl);
      chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.SELECT_COLOR, false);
    } else {
      window.$message.error(editorT('bigscreenEditor.ui.uploadReturnedNoURLPleaseTryAgain'));
    }
  } catch {
    window.$message.error(editorT('bigscreenEditor.ui.uploadFailedPleaseTryAgainLater'));
  }
};

// 选择适配方式
const selectPreviewType = (key: PreviewScaleEnum) => {
  chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.PREVIEW_SCALE_TYPE, key);
};
</script>

<template>
  <div class="go-canvas-setting">
    <n-form inline :label-width="45" size="small" label-placement="left">
      <n-form-item :label="editorT('bigscreenEditor.ui.width2')">
        <!-- 尺寸选择 -->
        <n-input-number
          size="small"
          v-model:value="canvasConfig.width"
          :disabled="editCanvas.lockScale"
          :validator="validator"
          @update:value="changeSizeHandle"
        />
      </n-form-item>
      <n-form-item :label="editorT('bigscreenEditor.ui.height2')">
        <n-input-number
          size="small"
          v-model:value="canvasConfig.height"
          :disabled="editCanvas.lockScale"
          :validator="validator"
          @update:value="changeSizeHandle"
        />
      </n-form-item>
    </n-form>

    <div class="upload-box">
      <n-upload v-model:file-list="uploadFileListRef" :show-file-list="false" :custom-request="customRequest" :on-before-upload="beforeUploadHandle">
        <n-upload-dragger>
          <img v-if="canvasConfig.backgroundImage" class="upload-show" :src="canvasConfig.backgroundImage" :alt="editorT('bigscreenEditor.ui.background')" />
          <div class="upload-img" v-show="!canvasConfig.backgroundImage">
            <img src="@/assets/images/canvas/noImage.png" />
            <n-text class="upload-desc" depth="3"> {{ editorT('bigscreenEditor.ui.backgroundImageMustBeSmallerThan') }} {{ backgroundImageSize }}{{ editorT('bigscreenEditor.ui.mbPNGJPGGIFFormat') }} </n-text>
          </div>
        </n-upload-dragger>
      </n-upload>
    </div>
    <n-space vertical :size="12">
      <n-space>
        <n-text>{{ editorT('bigscreenEditor.ui.backgroundColor') }}</n-text>
        <div class="picker-height">
          <n-color-picker
            v-if="!switchSelectColorLoading"
            size="small"
            style="width: 250px"
            v-model:value="canvasConfig.background"
            :show-preview="true"
            :swatches="swatchesColors"
          />
        </div>
      </n-space>
      <n-space>
        <n-text>{{ editorT('iot.application.type') }}</n-text>
        <n-select
          size="small"
          style="width: 250px"
          v-model:value="selectColorValue"
          :disabled="!canvasConfig.backgroundImage"
          :options="selectColorOptions"
          @update:value="selectColorValueHandle"
        />
      </n-space>
      <n-space>
        <n-text>{{ editorT('bigscreenEditor.ui.backgroundControls') }}</n-text>
        <n-button class="clear-btn" size="small" :disabled="!canvasConfig.backgroundImage" @click="clearImage"> {{ editorT('bigscreenEditor.ui.clearBackground') }} </n-button>
        <n-button class="clear-btn" size="small" :disabled="!canvasConfig.background" @click="clearColor"> {{ editorT('bigscreenEditor.ui.clearColor') }} </n-button>
      </n-space>
      <n-space>
        <n-text>{{ editorT('bigscreenEditor.ui.scalingMode') }}</n-text>
        <n-button-group style="display: flex; width: 250px">
          <n-button
            v-for="item in previewTypeList"
            :key="item.key"
            :type="canvasConfig.previewScaleType === item.key ? 'primary' : 'tertiary'"
            ghost
            size="small"
            @click="selectPreviewType(item.key)"
            style="flex: 1"
          >
            <n-tooltip :show-arrow="false" trigger="hover">
              <template #trigger>
                <n-icon class="select-preview-icon" size="18">
                  <component :is="item.icon" />
                </n-icon>
              </template>
              {{ item.desc }}
            </n-tooltip>
          </n-button>
        </n-button-group>
      </n-space>
    </n-space>

    <!-- 滤镜 -->
    <StylesSetting :is-canvas="true" :chart-styles="canvasConfig" />
    <n-divider style="margin: 10px 0" />

    <!-- 主题选择和全局配置 -->
    <n-tabs class="tabs-box" size="small" type="segment">
      <n-tab-pane v-for="item in globalTabList" :key="item.key" :name="item.key" size="small" display-directive="show:lazy">
        <template #tab>
          <n-space>
            <span>{{ item.title }}</span>
            <n-icon size="16" class="icon-position">
              <component :is="item.icon" />
            </n-icon>
          </n-space>
        </template>
        <component :is="item.render" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style lang="scss" scoped>
$uploadWidth: 326px;
$uploadHeight: 193px;

@include go(canvas-setting) {
  padding-top: 20px;

  .upload-box {
    margin-bottom: 20px;
    cursor: pointer;

    @include deep() {
      .n-upload-dragger {
        width: $uploadWidth;
        padding: 5px;
        background-color: rgb(0 0 0 / 0%);
      }
    }

    .upload-show {
      width: -webkit-fill-available;
      height: $uploadHeight;
      border-radius: 5px;
    }

    .upload-img {
      display: flex;
      flex-direction: column;
      align-items: center;

      img {
        height: 150px;
      }

      .upload-desc {
        padding: 10px 0;
      }
    }
  }

  .icon-position {
    padding-top: 2px;
  }

  .picker-height {
    min-height: 35px;
  }

  .clear-btn {
    padding-right: 2.25em;
    padding-left: 2.25em;
  }

  .select-preview-icon {
    //padding-right: 0.68em;
    //padding-left: 0.68em;
  }

  /** 
  @include deep() {
    .n-button-group .n-button {
      --n-icon-margin: 0;
    }
    .n-button-group .n-button__icon {
      margin: 0 !important;
    }
  }
  */
  .tabs-box {
    margin-top: 20px;
  }
}
</style>
