<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="go-edit-shortcut">
    <shortcut-key-modal v-model:modelShow="modelShow"></shortcut-key-modal>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-button
          class="scale-btn"
          secondary
          size="small"
          @click="modelShow = true"
        >
          <n-icon size="21" :depth="3">
            <dicom-overlay-icon></dicom-overlay-icon>
          </n-icon>
        </n-button>
      </template>
      <span>{{ editorT('bigscreenEditor.ui.keyboardShortcuts') }}</span>
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { ref } from 'vue'
import { icon } from '@/plugins'
import ShortcutKeyModal from './ShortcutKeyModal.vue'

const { DicomOverlayIcon } = icon.carbon
const modelShow = ref<boolean>(false)
</script>

<style lang="scss" scoped>
@include go('edit-shortcut') {
  .scale-btn {
    margin: 0 10px 0 0;
    .btn-text {
      font-size: 12px;
      margin-right: 3px;
    }
  }
}
</style>
