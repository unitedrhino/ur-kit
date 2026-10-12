<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

const props = defineProps<{
  loadingPreview: boolean;
  previewPanelVisible: boolean;
  previewResult: string;
}>();

const emit = defineEmits<{
  (e: 'preview'): void;
  (e: 'update:previewPanelVisible', value: boolean): void;
}>();
</script>

<template>
  <n-space align="center" :size="8">
    <n-button size="small" type="primary" ghost :loading="props.loadingPreview" @click="emit('preview')">{{ editorT('bigscreenManagement.ui.previewData') }}</n-button>
    <n-switch
      :value="props.previewPanelVisible"
      size="small"
      @update:value="(value: boolean) => emit('update:previewPanelVisible', value)"
    />
  </n-space>

  <n-card v-if="props.previewPanelVisible" size="small" style="max-height: 200px; overflow: auto; margin-bottom: 16px">
    <n-code v-if="props.previewResult" :code="props.previewResult" language="json" />
    <n-text v-else depth="3" style="font-size: 12px">{{ editorT('bigscreenEditor.ui.previewPanelOpenClickPreviewDataRefreshResults') }}</n-text>
  </n-card>
</template>
