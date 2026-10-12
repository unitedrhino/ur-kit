<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, ref } from 'vue';
import { NAlert, NButton, NModal, NRadioButton, NRadioGroup, NSpace, NTabPane, NTabs } from 'naive-ui';

import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useMessage } from 'naive-ui';

import { buildExportSchema, exportAsJson, exportAsPng, exportAsZip, processBgImage } from '@app/views/bigscreen/shared/export';
import { compressImage, urlToBase64 } from '@app/views/bigscreen/shared/image-utils';

const props = defineProps<{
  show: boolean;
  /** 列表卡片模式：外部传入画布数据（不传则从 chartEditStore 获取） */
  storageInfo?: {
    editCanvasConfig: Record<string, any>;
    requestGlobalConfig: Record<string, any>;
    componentList: any[];
  };
  /** 封面图（URL 或 base64），导出时自动转 base64 */
  indexImage?: string;
  /** 导出文件名 */
  projectName?: string;
}>();
const emit = defineEmits<{ 'update:show': [val: boolean] }>();

const chartEditStore = useChartEditStore();
const message = useMessage();

const bgImageMode = ref<'url' | 'base64'>('url');
const exporting = ref(false);
const zipExporting = ref(false);
const pngExporting = ref(false);
const isInEditor = computed(() => !!document.querySelector('.go-edit-range'));

function handleClose() {
  emit('update:show', false);
}

async function handleExportJson() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    // 优先使用 props，否则从 chartEditStore 获取
    const info = props.storageInfo || chartEditStore.getStorageInfo();

    // 处理 indexImage：仅 base64 模式才转换，url 模式保留原始值
    let resolvedIndexImage = props.indexImage;
    if (bgImageMode.value === 'base64' && resolvedIndexImage) {
      if (!resolvedIndexImage.startsWith('data:')) {
        // URL → base64 → 强制压缩兜底
        try {
          const raw = await urlToBase64(resolvedIndexImage);
          resolvedIndexImage = await compressImage(raw, 300, 0.4);
        } catch {
          console.warn('[ExportModal] 封面图 Base64 转换失败，跳过');
          resolvedIndexImage = undefined;
        }
      } else {
        // 已经是 base64，走压缩兜底（防止历史未压缩数据）
        try {
          resolvedIndexImage = await compressImage(resolvedIndexImage, 300, 0.4);
        } catch {
          // 压缩失败就用原始 base64
        }
      }
    }

    const schema = buildExportSchema(info, {
      bgImageMode: bgImageMode.value,
      indexImage: resolvedIndexImage,
    });
    const processed = await processBgImage(schema, bgImageMode.value);
    exportAsJson(processed, props.projectName);
    message.success(editorT('bigscreenEditor.ui.jsonExportedSuccessfully'));
    handleClose();
  } catch (err: any) {
    message.error(editorT('bigscreenEditor.dynamic.message75', { error: String(err?.message || editorT('orgManage.systemConfig.unknownError')) }));
  } finally {
    exporting.value = false;
  }
}

async function handleExportZip() {
  if (zipExporting.value) return;
  zipExporting.value = true;
  try {
    const info = props.storageInfo || chartEditStore.getStorageInfo();
    let resolvedIndexImage = props.indexImage;
    if (resolvedIndexImage && !resolvedIndexImage.startsWith('data:')) {
      try {
        const raw = await urlToBase64(resolvedIndexImage);
        resolvedIndexImage = await compressImage(raw, 800, 0.85);
      } catch {
        resolvedIndexImage = undefined;
      }
    }
    const schema = buildExportSchema(info, {
      bgImageMode: 'base64',
      indexImage: resolvedIndexImage,
    });
    const result = await exportAsZip(schema, props.projectName);
    if (result.success) {
      message.success(editorT('bigscreenEditor.ui.zipExportedSuccessfullyIncludingAssets'));
      handleClose();
    } else {
      message.error(result.error || editorT('knowledgeBase.text_637f7490a5e2'));
    }
  } catch (err: any) {
    message.error(editorT('bigscreenEditor.dynamic.message75', { error: String(err?.message || editorT('orgManage.systemConfig.unknownError')) }));
  } finally {
    zipExporting.value = false;
  }
}

async function handleExportPng() {
  if (pngExporting.value) return;
  pngExporting.value = true;
  try {
    const result = await exportAsPng();
    if (result.success) {
      message.success(editorT('bigscreenEditor.ui.pngExportedSuccessfully'));
      handleClose();
    } else {
      message.error(editorT('bigscreenEditor.dynamic.message76', { error: String(result.error) }));
    }
  } catch (err: any) {
    message.error(editorT('bigscreenEditor.dynamic.message75', { error: String(err?.message || editorT('orgManage.systemConfig.unknownError')) }));
  } finally {
    pngExporting.value = false;
  }
}
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :title="editorT('bigscreenEditor.ui.exportDashboard')"
    style="width: 480px"
    :mask-closable="true"
    @update:show="(val: boolean) => emit('update:show', val)"
  >
    <NTabs type="line" animated>
      <NTabPane name="json" :tab="editorT('bigscreenEditor.ui.exportJSON')">
        <NSpace vertical :size="16">
          <div>
            <p style="margin: 0 0 8px; font-size: 13px; color: var(--n-text-color-2)">
              {{ editorT('bigscreenEditor.ui.backgroundImageHandling') }}
            </p>
            <NRadioGroup v-model:value="bgImageMode">
              <NRadioButton value="url">
                {{ editorT('bigscreenEditor.ui.keepURLsOnly') }}
              </NRadioButton>
              <NRadioButton value="base64">
                {{ editorT('bigscreenEditor.ui.embedBase64') }}
              </NRadioButton>
            </NRadioGroup>
            <p style="margin: 8px 0 0; font-size: 12px; color: var(--n-text-color-3)">
              {{ editorT('bigscreenEditor.ui.urlModePreservesImageURLsAndProducesSmaller') }}<br />
              {{ editorT('bigscreenEditor.ui.base64ModeEmbedsOriginalCoverAndCompressesComponent') }}
            </p>
          </div>
          <NButton type="primary" block :loading="exporting" @click="handleExportJson">
            {{ editorT('bigscreenEditor.ui.exportJSON2') }}
          </NButton>
        </NSpace>
      </NTabPane>

      <NTabPane name="png" :tab="editorT('bigscreenEditor.ui.pngScreenshot')">
        <NSpace vertical :size="16">
          <NAlert v-if="!isInEditor" type="warning" :show-icon="true">
            {{ editorT('bigscreenEditor.ui.pngScreenshotsAreOnlyAvailableDashboardEditor') }}
          </NAlert>
          <NAlert v-else type="warning" :show-icon="true">
            {{ editorT('bigscreenEditor.ui.crossOriginResourcesSuchAsAMapAndECharts') }}
          </NAlert>
          <NButton v-if="isInEditor" type="primary" block :loading="pngExporting" @click="handleExportPng">
            {{ editorT('bigscreenEditor.ui.exportPNG') }}
          </NButton>
        </NSpace>
      </NTabPane>

      <NTabPane name="zip" :tab="editorT('bigscreenEditor.ui.zipPackageIncludingAssets')">
        <NSpace vertical :size="16">
          <NAlert type="info" :show-icon="true">
            {{ editorT('bigscreenEditor.ui.packageJSONAndImageAssetsAsGoviewZip') }}
          </NAlert>
          <NButton type="primary" block :loading="zipExporting" @click="handleExportZip">
            {{ editorT('bigscreenEditor.ui.exportZIP') }}
          </NButton>
        </NSpace>
      </NTabPane>
    </NTabs>
  </NModal>
</template>
