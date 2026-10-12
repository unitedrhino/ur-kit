<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <n-empty :description="editorT('bigscreenEditor.ui.helperNothingWasFound')">
    <template #extra>
      <n-button size="small" @click="goHome">{{ editorT('bigscreenEditor.ui.helperBrowseOtherPages') }}</n-button>
    </template>
  </n-empty>
</template>
<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import type { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const goHome = () => {
  router.replace({ path: '/' })
}
</script>
