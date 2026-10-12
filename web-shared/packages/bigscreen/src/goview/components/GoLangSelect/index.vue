<!-- 文件说明：编辑器快捷语言入口使用后台统一的个人语言偏好。 -->
<script lang="ts" setup>
import { savePersonalLanguage } from '@vben/saas/locales';
import { $t as editorT } from '@vben/saas/locales';

import { langList } from '@/i18n/index';
import { icon } from '@/plugins';

const { LanguageIcon } = icon.ionicons5;
const options = langList;

/** 保存统一个人语言偏好，让编辑器与后台同步且保留当前画布。 */
const handleSelect = async (key: string) => {
  try {
    await savePersonalLanguage(key);
  } catch (error) {
    window.$message.error(error instanceof Error ? error.message : editorT('orgManage.systemConfig.unknownError'));
  }
};
</script>

<template>
  <n-dropdown trigger="hover" @select="handleSelect" :show-arrow="true" :options="options">
    <n-button quaternary>
      <n-icon size="20" :depth="1">
        <LanguageIcon />
      </n-icon>
    </n-button>
  </n-dropdown>
</template>
