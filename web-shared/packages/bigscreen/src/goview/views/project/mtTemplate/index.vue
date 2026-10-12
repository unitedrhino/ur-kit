<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div class="go-project-my-template">
    <n-space vertical>
      <n-image
        object-fit="contain"
        height="300"
        preview-disabled
        :src="requireErrorImg()"
     ></n-image>
      <n-h3>{{ editorT('bigscreenEditor.ui.helperNoItemsYet') }}</n-h3>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { requireErrorImg } from '@/utils'
</script>

<style lang="scss" scoped>
@include go('project-my-template') {
  margin-top: 100px;
  @extend .go-flex-center;
}
</style>
