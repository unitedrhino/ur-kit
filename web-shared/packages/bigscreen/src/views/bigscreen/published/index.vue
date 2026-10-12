<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccessStore } from '@vben/stores';

import { mountGoview } from '../../../goview-host/mount';
import { disposeRealtimeHub, initRealtimeHub, realtimeStatus } from '../../../goview/realtime/projectRealtime';
import { restoreAccessTokenFromCookie } from '../../../shared/auth';
import { ScreenApi } from '../screen/index.api';

const route = useRoute();
const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref<null | string>(null);
const isPublishedOnlyMode = () => route.path.includes('/published/') || route.path.includes('/view/');

let mountedInstance: Awaited<ReturnType<typeof mountGoview>> | null = null;

const loadScreen = async () => {
  const accessStore = useAccessStore();
  if (!accessStore.accessToken) {
    const token = restoreAccessTokenFromCookie('Published Screen');
    if (token) accessStore.setAccessToken(token);
  }

  const id = String(route.params.id || '');
  if (!id) {
    error.value = t('bigscreenManagement.ui.invalidDashboardID');
    loading.value = false;
    return;
  }

  try {
    const info = await ScreenApi.detail(id);
    if (!info) {
      throw new Error(t('bigscreenManagement.ui.dashboardDoesNotExist'));
    }
    if (isPublishedOnlyMode() && info.status !== 1) {
      throw new Error(t('bigscreenManagement.ui.dashboardDoesNotExistOrUnpublished'));
    }

    // 按大屏绑定的项目初始化 WS 实时推送中枢（点位数据实时刷新，替代轮询）
    initRealtimeHub(info.projectID);

    loading.value = false;
    await nextTick();

    if (containerRef.value) {
      mountedInstance = await mountGoview(containerRef.value, id, 'preview');
    }
  } catch (error_: any) {
    error.value = error_.message || t('orgIotClient.energyDashboard.loadFailed');
    loading.value = false;
  }
};

onMounted(() => {
  void loadScreen();
});

onBeforeUnmount(() => {
  mountedInstance?.unmount();
  mountedInstance = null;
  disposeRealtimeHub();
});
</script>

<template>
  <div class="published-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('orgManage.common.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>{{ t('bigscreenManagement.ui.cannotAccess') }}</h2>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div ref="containerRef" class="screen-content"></div>
      <!-- WS 实时推送连接状态提示（重连中才显示，避免干扰大屏展示） -->
      <div v-if="realtimeStatus === 'reconnecting'" class="realtime-status">{{ t('bigscreenManagement.ui.reconnectingLiveConnection') }}</div>
    </template>
  </div>
</template>

<style scoped>
.published-container {
  /* 内嵌在应用布局内容区（左侧有菜单栏），占满父容器而非整个视口，否则右侧会被裁掉 */
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0d0d0d;
}

.screen-content {
  width: 100%;
  height: 100%;
}

.realtime-status {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 9999;
  padding: 4px 10px;
  font-size: 12px;
  color: #f5a623;
  background: rgb(0 0 0 / 60%);
  border-radius: 4px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgb(255 255 255 / 20%);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  margin-bottom: 16px;
  font-size: 48px;
}

.error-state h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.error-state p {
  margin: 0;
  color: rgb(255 255 255 / 70%);
}
</style>
