<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script lang="ts" setup>
import { $t as editorT } from '@vben/saas/locales';

import { icon } from '@/plugins';
import { useDesignStore } from '@/store/modules/designStore/designStore';
import { setHtmlTheme } from '@/utils';

const { MoonIcon, SunnyIcon } = icon.ionicons5;
const designStore = useDesignStore();

// 改变样式
const changeTheme = () => {
  designStore.changeTheme();
  setHtmlTheme();
};
</script>

<template>
  <n-button quaternary @click="changeTheme" :title="editorT('orgManage.memory.entityTopic')">
    <n-icon size="20" :depth="1">
      <MoonIcon v-if="designStore.darkTheme" />
      <SunnyIcon v-else />
    </n-icon>
  </n-button>
</template>
