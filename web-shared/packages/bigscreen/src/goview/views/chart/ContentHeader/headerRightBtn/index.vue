<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { post } from '@/api/http';
import { captureComponentSnapshot } from '@/packages/custom/captureSnapshot';
import {
  desensitizeComponent,
  desensitizeGroupComponent,
  generateCustomComponentTemplate,
  generateGroupComponentTemplate,
} from '@/packages/custom/encapsulate';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getEditorFetchHeaders, goDialog, renderIcon } from '@/utils';
import { openNoOpenerWindow } from '@app/shared/window-security';
import { SaveOutline as SaveOutlineIcon } from '@vicons/ionicons5';
import { useMessage } from 'naive-ui';

import { syncData } from '../../ContentEdit/components/EditTools/hooks/useSyncUpdate.hook';
import { useSync } from '../../hooks/useSync.hook';
import { getImportSummary, parseImportFile } from '@app/views/bigscreen/shared/export';
import ExportModal from './ExportModal/index.vue';

const { AnalyticsIcon, BrowsersOutlineIcon, DownloadOutlineIcon, SendIcon, ShareIcon } = icon.ionicons5;

const chartEditStore = useChartEditStore();
const message = useMessage();
const route = useRoute();

// ========== 编辑器实时同步到预览页（localStorage + storage event） ==========
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const syncToPreview = () => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const { id } = route.params;
    const syncId = typeof id === 'string' ? id : id?.[0];
    if (!syncId) return;
    try {
      const data = chartEditStore.getStorageInfo();
      localStorage.setItem(`GO_REALTIME_SYNC_${syncId}`, JSON.stringify(data));
    } catch { /* ignore quota */ }
  }, 500);
};

watch(
  () => chartEditStore.componentList.length,
  () => syncToPreview(),
);

onUnmounted(() => {
  if (syncTimer) clearTimeout(syncTimer);
});
const { updateComponent } = useSync();

function getOuterEditorSearch() {
  const directSearch = window.location.search.replace(/^\?/, '');
  if (directSearch) {
    return new URLSearchParams(directSearch);
  }

  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex !== -1 && queryIndex < hash.length - 1) {
    return new URLSearchParams(hash.slice(queryIndex + 1));
  }

  return new URLSearchParams();
}

const outerEditorSearch = getOuterEditorSearch();

const publishing = ref(false);
const savingToLib = ref(false);
const showExportModal = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);
const exportIndexImage = ref('');
const fetchingExportMeta = ref(false);

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const isTemplateEditor = computed(() => outerEditorSearch.get('editorKind') === 'template');
const componentMeta = computed(() => chartEditStore.getComponentMeta);

function getAppBasePath() {
  const rawBase = (import.meta.env.VITE_BASE || import.meta.env.BASE_URL || '/').trim();
  if (rawBase === './' || rawBase === '/') {
    const pathname = window.location.pathname || '/';
    const dirPath = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '/');
    return dirPath.startsWith('/') ? dirPath : `/${dirPath}`;
  }
  const normalizedBase = rawBase;
  const withLeadingSlash = normalizedBase.startsWith('/') ? normalizedBase : `/${normalizedBase}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function buildAppRouteUrl(path: string) {
  const routePath = path.startsWith('/') ? path : `/${path}`;
  if (import.meta.env.VITE_ROUTER_HISTORY === 'hash') {
    const basePath = getAppBasePath();
    return `${window.location.origin}${basePath}#${routePath}`;
  }
  return `${window.location.origin}${routePath}`;
}

function copyTextWithFallback(text: string) {
  return (async () => {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* fall through */ }
    }
    // 降级：execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  })();
}

const previewHandle = async () => {
  const { id } = route.params;
  // params 数组形态取首个值；id 缺失时用空串兜底，仅影响异常路径的缓存 key
  // route.params 为索引签名类型（noUncheckedIndexedAccess 下含 undefined），显式收窄数组形态
  const previewId = typeof id === 'string' ? id : (Array.isArray(id) ? (id[0] ?? '') : '');

  // 直接读取 store 最新状态（syncData 会弹出确认框，是 JSON 编辑页专用）
  const storageInfo = chartEditStore.getStorageInfo();
  try {
    localStorage.setItem(`GO_PREVIEW_DATA_${previewId}`, JSON.stringify({ ...storageInfo, _previewTimestamp: Date.now() }));
  } catch {
    // ignore
  }

  // 预览前同步保存到后端，确保 F5 刷新不丢失最新组件数据
  try {
    const res = await fetch('/api/v1/view/project/detail/update', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: Number(previewId), content: JSON.stringify(storageInfo) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.code && data.code !== 200) throw new Error(data.msg || editorT('orgManage.orgSettings.saveFailed'));
  } catch {
    // 保存失败不阻塞预览
  }

  const previewUrl = buildAppRouteUrl(`/preview/${encodeURIComponent(previewId)}`);
  openNoOpenerWindow(previewUrl);
};

const importHandle = () => {
  importInputRef.value?.click();
};

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  const result = await parseImportFile(file);
  if (!result.valid || !result.schema) {
    message.error(editorT('bigscreenEditor.dynamic.message77', { error: String(result.error) }));
    return;
  }

  const summary = getImportSummary(result.schema);
  goDialog({
    message: editorT('bigscreenEditor.dynamic.message78', { name: String(summary.name), count: String(summary.componentCount) }),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('orgManage.formDesigner.confirmImport'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
    onPositiveCallback: async () => {
      try {
        await updateComponent(
          {
            componentList: result.schema!.componentList,
            editCanvasConfig: result.schema!.editCanvasConfig,
            requestGlobalConfig: result.schema!.requestGlobalConfig,
          } as any,
          true,
          true,
        );
        message.success(editorT('orgManage.formDesigner.importSuccess'));
      } catch (error: any) {
        message.error(error?.message || editorT('iotApp.categoryPage.importFailed'));
      }
    },
  });
}

const sendHandle = async () => {
  const { id } = route.params;
  // params 数组形态取首个值；空值由下方 projectId 判断统一兜底提示
  // route.params 为索引签名类型（noUncheckedIndexedAccess 下含 undefined），显式收窄数组形态
  const projectId = typeof id === 'string' ? id : (Array.isArray(id) ? (id[0] ?? '') : '');

  if (!projectId) {
    message.error(editorT('bigscreenEditor.ui.projectIDMissing'));
    return;
  }

  // 检测是否已发布：publishedContent 非空 = 曾经发布过
  let isPublished = false;
  try {
    const infoRes = await post('/api/v1/view/project/detail/get-one', { id: String(projectId) });
    isPublished = !!(infoRes?.data?.publishedContent);
  } catch {
    // get-one 失败时默认当作未发布
  }

  goDialog({
    message: isPublished
      ? editorT('bigscreenEditor.ui.overwriteSourceViewThisCannotBeUndone')
      : editorT('bigscreenEditor.ui.publishingCreatesPublicLinkThatAnyoneCanOpen'),
    positiveText: isPublished ? editorT('bigscreenEditor.ui.confirmOverwrite') : editorT('bigscreenManagement.ui.confirmPublication'),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
    onPositiveCallback: async () => {
      if (publishing.value) return;
      publishing.value = true;

      try {
        // 发布前保存当前画布内容到后端
        const storageInfo = chartEditStore.getStorageInfo();
        await fetch('/api/v1/view/project/detail/update', {
          method: 'POST',
          headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id: Number(projectId), content: JSON.stringify(storageInfo) }),
        });

        const res = await fetch('/api/v1/view/project/update', {
          method: 'POST',
          headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id: projectId, status: 1 }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.msg || data.message || editorT('orgManage.flow.publishFailed'));
        }

        const publishUrl = data.publishUrl || buildAppRouteUrl(`/view/${encodeURIComponent(projectId)}`);
        goDialog({
          message: editorT('bigscreenEditor.dynamic.message79', { url: String(publishUrl) }),
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('orgWidgets.ui.copyLink'); },
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.close'); },
          onPositiveCallback: async () => {
            const copied = await copyTextWithFallback(publishUrl);
            if (copied) {
              message.success(editorT('bigscreenManagement.ui.linkCopied'));
              return;
            }
            message.info(editorT('bigscreenManagement.ui.automaticCopyingFailedSelectLinkAndPressCtrl'));
          },
        });
      } catch (error: any) {
        message.error(error.message || editorT('orgManage.flow.publishFailed'));
      } finally {
        publishing.value = false;
      }
    },
  });
};

type HeaderButton = {
  event: () => Promise<void> | void;
  icon: ReturnType<typeof renderIcon>;
  key: string;
  loading?: typeof savingToLib;
  title: string;
  type?: 'default' | 'primary';
};

const projectButtons = computed<HeaderButton[]>(() => {
  const buttons: HeaderButton[] = [
    {
      key: 'sync',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.syncContent'); },
      type: 'primary',
      icon: renderIcon(AnalyticsIcon),
      event: syncData,
    },
    {
      key: 'preview',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.flow.previewLabel'); },
      icon: renderIcon(BrowsersOutlineIcon),
      event: previewHandle,
    },
    {
      key: 'import',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.formDesigner.import'); },
      icon: renderIcon(ShareIcon),
      event: importHandle,
    },
    {
      key: 'export',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.formDesigner.export'); },
      icon: renderIcon(DownloadOutlineIcon),
      event: openExportModal,
    },
    {
      key: 'publish',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.flow.publish'); },
      icon: renderIcon(SendIcon),
      event: sendHandle,
    },
  ];

  if (chartEditStore.getEditCanvas.isCodeEdit) return buttons;
  return buttons.filter((button) => {
    if (button.key === 'sync') return false;
    if (isTemplateEditor.value && button.key === 'publish') return false;
    return true;
  });
});

const headerButtons = computed<HeaderButton[]>(() => {
  if (isComponentMode.value) {
    return [
      {
        key: 'save-to-lib',
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.saveLibrary'); },
        type: 'primary',
        icon: renderIcon(SaveOutlineIcon),
        event: saveToLibrary,
        loading: savingToLib,
      },
    ];
  }
  return projectButtons.value;
});

async function openExportModal() {
  if (fetchingExportMeta.value) return;
  const { id } = route.params;
  // params 数组形态取首个值；空值由下方 projectId 判断统一守卫
  // route.params 为索引签名类型（noUncheckedIndexedAccess 下含 undefined），显式收窄数组形态
  const projectId = typeof id === 'string' ? id : (Array.isArray(id) ? (id[0] ?? '') : '');

  if (projectId) {
    fetchingExportMeta.value = true;
    try {
      const res = await fetch(`/api/v1/view/project/detail?id=${projectId}`, {
        headers: getEditorFetchHeaders(),
      });
      const data = await res.json();
      exportIndexImage.value = data?.indexImage || '';
    } catch {
      exportIndexImage.value = '';
    } finally {
      fetchingExportMeta.value = false;
    }
  }

  showExportModal.value = true;
}

async function saveToLibrary() {
  const meta = componentMeta.value;
  if (!meta) {
    message.error(editorT('bigscreenEditor.ui.componentInformationMissing'));
    return;
  }

  if (savingToLib.value) return;
  savingToLib.value = true;

  try {
    const componentList = chartEditStore.getComponentList;
    if (componentList.length === 0) {
      message.error(editorT('bigscreenEditor.ui.canvasEmptyAndCannotBeSaved'));
      return;
    }

    const first = componentList[0];
    // 上方已校验画布非空，first 必然存在；此处守卫仅为类型收窄
    if (!first) return;
    const template = first.isGroup
      ? generateGroupComponentTemplate(desensitizeGroupComponent(first as any), { name: meta.name, thumbnail: '' })
      : generateCustomComponentTemplate(desensitizeComponent(first as any), { name: meta.name, thumbnail: '' });

    let coverPath = '';
    try {
      const snapshot = await captureComponentSnapshot(first.id);
      if (snapshot) {
        template.thumbnail = snapshot;
        const blob = await fetch(snapshot).then((response) => response.blob());
        const form = new FormData();
        form.append('file', blob, `comp_${meta.id}_${Date.now()}.jpg`);

        const uploadRes = await fetch('/api/v1/system/common/upload-file', {
          method: 'POST',
          headers: getEditorFetchHeaders(),
          body: form,
        });
        const uploadData = await uploadRes.json();
        coverPath = uploadData?.data?.filePath || uploadData?.filePath || '';
      }
    } catch (error) {
      console.warn('[saveToLibrary] 缩略图上传异常', error);
    }

    const updatePayload: Record<string, any> = {
      id: meta.id,
      content: JSON.stringify(template),
    };
    if (coverPath) {
      updatePayload.cover = coverPath;
    }

    const res = await post('/api/v1/view/component/design', updatePayload);
    const data = res?.data ?? res;
    if (data?.code && data.code !== 200) {
      throw new Error(data.msg || editorT('orgManage.orgSettings.saveFailed'));
    }

    message.success(editorT('bigscreenEditor.ui.savedComponentLibrary'));

    const { useChartHistoryStore } = await import('@/store/modules/chartHistoryStore/chartHistoryStore');
    const chartHistoryStore = useChartHistoryStore();
    chartHistoryStore.clearBackStack();
    chartHistoryStore.clearForwardStack();
  } catch (error: any) {
    message.error(error.message || editorT('orgManage.orgSettings.saveFailed'));
  } finally {
    savingToLib.value = false;
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (!isComponentMode.value) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    void saveToLibrary();
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <n-space class="go-mt-0" :wrap="false">
    <n-button v-for="item in headerButtons" :key="item.key" :type="item.type" :loading="item.loading?.value" ghost @click="item.event">
      <template #icon>
        <component :is="item.icon" />
      </template>
      <span>{{ item.title }}</span>
    </n-button>
    <input ref="importInputRef" type="file" accept=".json,.goview.json" style="display: none" @change="handleImportFile" />
    <ExportModal v-model:show="showExportModal" :index-image="exportIndexImage" />
  </n-space>
</template>

<style lang="scss" scoped>
.align-center {
  margin-top: -4px;
}
</style>
