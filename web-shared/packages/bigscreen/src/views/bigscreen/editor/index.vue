<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { useNotification } from 'naive-ui';

import { mountGoview } from '../../../goview-host/mount';
import { useChartHistoryStore } from '../../../goview/store/modules/chartHistoryStore/chartHistoryStore';
import { buildBigscreenPath } from '../shared/route-path';
import { syncStandaloneContext } from '../shared/standalone-context';

import '../shared/manage-theme.css';

const route = useRoute();
const router = useRouter();
const notification = useNotification();
const containerRef = ref<HTMLElement | null>(null);
const COMPONENT_EDITOR_CLOSE_EVENT = 'bigscreen:component-editor-close';
let mountedInstance: Awaited<ReturnType<typeof mountGoview>> | null = null;
let unmounted = false;
const getRouteName = () => String(route.name || '');

const resolveId = () => {
  if (route.path.includes('/component-editor/')) {
    return String(route.query.componentId || '');
  }
  return String(route.params.id || '');
};
const resolveMode = () => {
  if (route.path.includes('/component-editor/')) return 'component';
  if (route.path.includes('/preview/') || route.path.includes('/published/') || route.query.mode === 'preview') return 'preview';
  return 'edit';
};

const isEmbeddedComponentEditor = () => route.path.includes('/component-editor/');

// 追踪当前挂载的 key（mode_id），跨模式切换时强制 unmount 再 remount
let currentMountedKey = '';

// 防止并发挂载（watch immediate + onMounted 可能同时触发）
let mountingPromise: null | Promise<void> = null;

function syncStandaloneEditorContext() {
  syncStandaloneContext();
}

function onWindowFocus() {
  syncStandaloneEditorContext();
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    syncStandaloneEditorContext();
  }
}

function onStorage(event: StorageEvent) {
  if (!event.key || !event.key.endsWith('-preferences')) return;
  syncStandaloneEditorContext();
}

const ensureMounted = async () => {
  if (mountingPromise) return; // 正在挂载中，跳过
  unmounted = false;
  const id = resolveId();
  const mode = resolveMode();
  const container = containerRef.value;
  if (!id || !container) return;

  const newKey = `${mode}_${id}`;

  mountingPromise = (async () => {
    try {
      // 模式或 ID 变化时，先销毁旧实例，确保彻底隔离
      if (mountedInstance && currentMountedKey && currentMountedKey !== newKey) {
        // Pinia store 跨 unmount 存活（共享宿主 pinia 实例），
        // 需在销毁前显式清理 history，否则切换后 Ctrl+Z 会撤销出上一个编辑器的操作
        const chartHistoryStore = useChartHistoryStore();
        chartHistoryStore.clearBackStack();
        chartHistoryStore.clearForwardStack();

        mountedInstance.unmount();
        mountedInstance = null;
        currentMountedKey = '';
      }

      if (mountedInstance) {
        await mountedInstance.navigateTo(id, mode);
      } else {
        mountedInstance = await mountGoview(container, id, mode);
        currentMountedKey = newKey;
      }
    } catch (error: any) {
      const msg = String(error?.msg || error?.message || t('bigscreenManagement.ui.failedLoadDashboard'));
      notification.error({
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgIotClient.energyDashboard.loadFailed'); },
        content: msg,
        duration: 4000,
      });
      if (!getRouteName().endsWith('Screen')) {
        const fallbackPath = isEmbeddedComponentEditor() ? '/component' : '/screen';
        void router.replace(buildBigscreenPath(route.path, fallbackPath));
      }
    } finally {
      mountingPromise = null;
    }
  })();
  await mountingPromise;
};

function unmountGoview() {
  if (unmounted) return;
  unmounted = true;
  mountedInstance?.unmount();
  mountedInstance = null;
}

function onComponentEditorClose() {
  if (!isEmbeddedComponentEditor()) return;
  void router.replace(buildBigscreenPath(route.path, '/component'));
}

watch(
  () => [route.params.id, route.query.mode, route.name, route.query.componentId],
  () => {
    void ensureMounted();
  },
  { immediate: true },
);

onMounted(() => {
  syncStandaloneEditorContext();
  void ensureMounted();
  window.addEventListener(COMPONENT_EDITOR_CLOSE_EVENT, onComponentEditorClose);
  window.addEventListener('focus', onWindowFocus);
  window.addEventListener('storage', onStorage);
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (route.query.from === 'template') {
    notification.info({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.inheritedDataSourceSettings'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return t('bigscreenManagement.ui.dataSourceSettingsWereInheritedFromTemplateChange'); },
      duration: 6000,
    });
  }
});

onBeforeRouteLeave(() => {
  unmountGoview();
});

onBeforeUnmount(() => {
  window.removeEventListener(COMPONENT_EDITOR_CLOSE_EVENT, onComponentEditorClose);
  window.removeEventListener('focus', onWindowFocus);
  window.removeEventListener('storage', onStorage);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  unmountGoview();
});
</script>

<template>
  <div
    class="bigscreen-editor-shell"
    :class="[isEmbeddedComponentEditor() ? 'h-full min-h-0 w-full overflow-hidden' : 'h-screen w-screen overflow-hidden']"
    :style="{ background: 'var(--bigscreen-editor-shell-bg)' }"
  >
    <div ref="containerRef" class="h-full w-full"></div>
  </div>
</template>
