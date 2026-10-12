<script setup lang="ts">
import type { ChartEditStorageType } from './index.type';

import { ref } from 'vue';

import { SavePageEnum } from '@/enums/editPageEnum';
import { StorageEnum } from '@/enums/storageEnum';
import { setSessionStorage } from '@/utils';
import { getTrustedOpener } from '@app/shared/window-security';

import Preview from './index.vue';
import { getSessionStorageInfo } from './utils';

const key = ref(Date.now());

// 数据变更 -> 组件销毁重建
try {
  const listenerArr = [SavePageEnum.JSON, SavePageEnum.CHART_TO_PREVIEW];
  const openerWindow = getTrustedOpener();
  listenerArr.forEach((saveEvent: string) => {
    if (!openerWindow || !openerWindow.addEventListener) return;
    openerWindow.addEventListener(saveEvent, async (e: any) => {
      const localStorageInfo: ChartEditStorageType = (await getSessionStorageInfo()) as unknown as ChartEditStorageType;
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...e.detail, id: localStorageInfo.id }]);
      key.value = Date.now();
    });
  });
} catch (error) {
  console.error('[preview wrapper] 监听父窗口预览同步失败:', error);
}
</script>

<template>
  <Preview :key="key" />
</template>
