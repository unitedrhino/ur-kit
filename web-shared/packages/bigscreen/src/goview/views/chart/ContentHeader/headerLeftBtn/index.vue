<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { Ref } from 'vue';

import { computed, onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';
import { useRoute } from 'vue-router';

import { StorageEnum } from '@/enums/storageEnum';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useChartHistoryStore } from '@/store/modules/chartHistoryStore/chartHistoryStore';
import { HistoryStackEnum } from '@/store/modules/chartHistoryStore/chartHistoryStore.type';
import { useChartLayoutStore } from '@/store/modules/chartLayoutStore/chartLayoutStore';
import { ChartLayoutStoreEnum } from '@/store/modules/chartLayoutStore/chartLayoutStore.type';
import { getEditorFetchHeaders, renderIcon, setSessionStorage } from '@/utils';
import { flushAllPendingCoverJobs, hasPendingCoverJobs, scheduleProjectCover } from '@app/views/bigscreen/shared/coverCapture';
import { SaveOutline as SaveOutlineIcon } from '@vicons/ionicons5';
import { useMessage } from 'naive-ui';

const { LayersIcon, BarChartIcon, PrismIcon, ArrowBackIcon, ArrowForwardIcon } = icon.ionicons5;
const { setItem } = useChartLayoutStore();
const { getLayers, getCharts, getDetails } = toRefs(useChartLayoutStore());
const chartEditStore = useChartEditStore();
const chartHistoryStore = useChartHistoryStore();
const route = useRoute();
const message = useMessage();
const COMPONENT_EDITOR_CLOSE_EVENT = 'bigscreen:component-editor-close';

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const saving = ref(false);
const saveIcon = renderIcon(SaveOutlineIcon);

const saveHandle = async () => {
  if (isComponentMode.value) return;

  const { id } = route.params;
  // params 数组形态取首个值；空值由下方 projectId 判断统一兜底提示
  // route.params 为索引签名类型（noUncheckedIndexedAccess 下含 undefined），显式收窄数组形态
  const projectId = typeof id === 'string' ? id : (Array.isArray(id) ? (id[0] ?? '') : '');
  if (!projectId) {
    message.error(editorT('bigscreenEditor.ui.projectIDMissing'));
    return;
  }
  saving.value = true;
  try {
    const storageInfo = chartEditStore.getStorageInfo();
    const res = await fetch('/api/v1/view/project/detail/update', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        id: Number(projectId),
        content: JSON.stringify(storageInfo),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.code && data.code !== 200) {
      throw new Error(data.msg || editorT('orgManage.orgSettings.saveFailed'));
    }
    setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ ...storageInfo, id: String(projectId) }]);

    // 立即生成封面（跳过防抖），确保用户关闭页面前封面已落库
    try {
      await scheduleProjectCover(projectId, storageInfo, { skipDebounce: true });
    } catch {
      // 封面失败不影响数据保存
    }

    message.success(editorT('orgManage.orgSettings.saveSuccess'));
  } catch (error: any) {
    message.error(editorT('bigscreenEditor.dynamic.message74', { error: String(error.message || editorT('orgManage.systemConfig.unknownError')) }));
  } finally {
    saving.value = false;
  }
};

const onKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    void saveHandle();
  }
};

const navigateToComponentList = () => {
  window.dispatchEvent(new CustomEvent(COMPONENT_EDITOR_CLOSE_EVENT));
};

const handleBackToLibrary = () => {
  const isDirty = chartHistoryStore.getBackStack.length > 1;
  if (isDirty) {
    window.$dialog?.warning({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.unsavedChangesWarning'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return editorT('bigscreenEditor.ui.youHaveUnsavedChangesLeaveThisPage'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return editorT('bigscreenEditor.ui.leaveWithoutSaving'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return editorT('orgManage.common.cancel'); },
      onPositiveClick: () => {
        navigateToComponentList();
      },
    });
  } else {
    navigateToComponentList();
  }
};

let popstateHandler: ((event: PopStateEvent) => void) | null = null;

// 关闭页面前提示用户等待封面生成完成
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (hasPendingCoverJobs()) {
    flushAllPendingCoverJobs().catch(() => {});
    e.preventDefault();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('beforeunload', beforeUnloadHandler);

  if (isComponentMode.value) {
    popstateHandler = () => {
      navigateToComponentList();
    };
    window.addEventListener('popstate', popstateHandler);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  if (popstateHandler) {
    window.removeEventListener('popstate', popstateHandler);
    popstateHandler = null;
  }
});

interface ItemType<T> {
  icon: any;
  key: T;
  select: boolean | Ref<boolean>;
  title: string;
}

const btnList = reactive<ItemType<ChartLayoutStoreEnum>[]>([
  {
    key: ChartLayoutStoreEnum.CHARTS,
    select: getCharts,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.chartComponents'); },
    icon: renderIcon(BarChartIcon),
  },
  {
    key: ChartLayoutStoreEnum.LAYERS,
    select: getLayers,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.layerControls'); },
    icon: renderIcon(LayersIcon),
  },
  {
    key: ChartLayoutStoreEnum.DETAILS,
    select: getDetails,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.detailSettings'); },
    icon: renderIcon(PrismIcon),
  },
]);

const filteredBtnList = computed(() => {
  if (isComponentMode.value) {
    return btnList.filter((item) => item.key !== ChartLayoutStoreEnum.CHARTS);
  }
  return btnList;
});

const isBackStack = computed(() => chartHistoryStore.getBackStack.length > 1);
const isForwardStack = computed(() => chartHistoryStore.getForwardStack.length > 0);

const historyList = reactive<ItemType<HistoryStackEnum>[]>([
  {
    key: HistoryStackEnum.BACK_STACK,
    select: isBackStack,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.back'); },
    icon: renderIcon(ArrowBackIcon),
  },
  {
    key: HistoryStackEnum.FORWARD_STACK,
    select: isForwardStack,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.forward'); },
    icon: renderIcon(ArrowForwardIcon),
  },
]);

const styleHandle = (item: ItemType<ChartLayoutStoreEnum>) => {
  if (item.key === ChartLayoutStoreEnum.DETAILS) {
    return item.select ? '' : 'primary';
  }
  return item.select ? 'primary' : '';
};

const clickHandle = (item: ItemType<ChartLayoutStoreEnum>) => {
  setItem(item.key, !item.select);
};

const clickHistoryHandle = (item: ItemType<HistoryStackEnum>) => {
  switch (item.key) {
    case HistoryStackEnum.BACK_STACK: {
      chartEditStore.setBack();
      break;
    }
    case HistoryStackEnum.FORWARD_STACK: {
      chartEditStore.setForward();
      break;
    }
  }
};
</script>

<template>
  <n-space class="header-left-btn" :wrap="false" :size="25">
    <n-space :wrap="false">
      <template v-if="isComponentMode">
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-button size="small" ghost type="warning" @click="handleBackToLibrary">
              <template #icon>
                <span class="icon-[mdi--arrow-left] size-4"></span>
              </template>
              <span>{{ editorT('bigscreenEditor.ui.returnComponentManagement') }}</span>
            </n-button>
          </template>
          <span>{{ editorT('bigscreenEditor.ui.returnComponentManagementList') }}</span>
        </n-tooltip>
        <n-divider vertical />
      </template>

      <template v-for="item in filteredBtnList" :key="item.key">
        <n-tooltip placement="bottom" trigger="hover">
          <template #trigger>
            <n-button size="small" ghost :type="styleHandle(item)" :focusable="false" @click="clickHandle(item)">
              <component :is="item.icon" />
            </n-button>
          </template>
          <span>{{ item.title }}</span>
        </n-tooltip>
      </template>

      <n-divider vertical />

      <n-tooltip v-for="item in historyList" :key="item.key" placement="bottom" trigger="hover">
        <template #trigger>
          <n-button size="small" ghost type="primary" :disabled="!item.select" @click="clickHistoryHandle(item)">
            <component :is="item.icon" />
          </n-button>
        </template>
        <span>{{ item.title }}</span>
      </n-tooltip>

      <n-divider vertical />

      <n-tooltip v-if="!isComponentMode" placement="bottom" trigger="hover">
        <template #trigger>
          <n-button size="small" type="primary" :loading="saving" @click="saveHandle">
            <template #icon>
              <component :is="saveIcon" />
            </template>
            <span>{{ editorT('orgManage.common.save') }}</span>
          </n-button>
        </template>
        <span>{{ editorT('bigscreenEditor.ui.saveServerCtrlS') }}</span>
      </n-tooltip>
    </n-space>
  </n-space>
</template>

<style lang="scss" scoped>
.header-left-btn {
  margin-left: -37px;
}
</style>

<style>
.is-capturing .shape-point,
.is-capturing .shape-modal {
  display: none !important;
}
</style>
