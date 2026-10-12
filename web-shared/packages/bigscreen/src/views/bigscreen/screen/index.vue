<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import type { ProjectCoverUpdatedDetail } from '../shared/coverEvents';
import type { ScreenInfo } from './index.api';
import type { UnassignedScreenRecord } from './project-binding';

import { computed, h, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { CoreApi } from '@vben/api';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { ProjectManagerSelector, ProjectSelectModal } from '@vben/saas';
import { subscribeProjectSyncEvent, useProjectStore } from '@vben/stores';

import { NButton, NDatePicker, NDropdown, NEmpty, NInput, NPagination, NSelect, NSpin, NTag, useDialog, useMessage } from 'naive-ui';

import { getErrorMessage } from '../../../shared/error';
import { openNoOpenerWindow } from '../../../shared/window-security';
import { resolveAssetUrl } from '../shared/asset-url';
import {
  BIGSCREEN_COVER_UPDATED_EVENT,
  isProjectCoverUpdatedStorageKey,
  parseProjectCoverUpdatedDetail,
} from '../shared/coverEvents';
import { ProjectDetailApi } from '../shared/detail.api';
import { getImportSummary, parseImportFile, parseZipImport, schemaToStorageContent } from '../shared/export';
import ExportModal from '@app/goview/views/chart/ContentHeader/headerRightBtn/ExportModal/index.vue';
import { syncBigscreenProjectContext } from '../shared/project-context';
import { BIGSCREEN_STANDALONE_IOT_APP_BASE, buildBigscreenRouteUrl, buildStandaloneBigscreenUrl } from '../shared/route-path';
import { screenStatusOptions } from './data';
import { ScreenApi } from './index.api';
import FormDrawer from './modules/form.vue';
import {
  getScreenProjectBindings,
  getUnassignedScreenRecords,
  markScreenUnassigned,
  pruneMissingScreenProjectAssociations,
  removeScreenProjectBinding,
  removeUnassignedScreenRecord,
  setScreenProjectBinding,
} from './project-binding';

import '../shared/manage-theme.css';

type ScreenAssignmentFilter = 'all' | 'assigned' | 'unassigned';

const MAX_SCREEN_FETCH_SIZE = 1000;

const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const projectStore = useProjectStore();

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: FormDrawer,
  // 关闭抽屉时不销毁 FormDrawer，避免嵌套抽屉的 teleport overlay
  // 在销毁过程中被 Vue Transition 中断而残留在 body，导致菜单点击被遮挡。
  // 数据重置由 onOpenChange / setData 负责。
  destroyOnClose: false,
});

const importFileInput = ref<HTMLInputElement | null>(null);

const showExportModal = ref(false);
const exportStorageInfo = ref<any>(null);
const exportIndexImage = ref('');
const exportProjectName = ref('');

const projectScreens = ref<ScreenInfo[]>([]);
const orphanScreens = ref<ScreenInfo[]>([]);
const orphanScreenRecordMap = ref<Record<string, UnassignedScreenRecord>>({});
const total = ref(0);
const page = ref(1);
const pageSize = ref(12);
const loading = ref(false);
const searchName = ref('');
// advancedFiltersOpen 控制大屏项目低频查询条件的展开状态。
const advancedFiltersOpen = ref(false);
const coverErrorMap = ref<Record<string, boolean>>({});
const filterStatus = ref<null | number>(null);
const filterAssignment = ref<ScreenAssignmentFilter>('assigned');
const filterCreatedUserID = ref<null | string>(null);
const filterUpdatedTime = ref<[number, number] | null>(null);
const creatorOptions = ref<Array<{ label: string; value: string }>>([]);
const creatorOptionsLoading = ref(false);

const autoUnpublishHandledScreenIDs = new Set<string>();
let stopProjectSyncSubscription: (() => void) | null = null;

// TASK-040 Phase 1:
// Screen management should stop depending on temporary frontend permission codes.
// For now, keep the entry points visible and let project selection + backend checks
// be the real gate, so initialized admin accounts are not blocked by stale codes.
const canCreateScreen = () => true;
const canUpdateScreen = () => true;
const canDeleteScreen = () => true;
const canViewScreenDetail = () => true;

const canOpenEditor = () => canViewScreenDetail();
const canPreviewScreen = () => canViewScreenDetail();
const canExportScreen = () => canViewScreenDetail();
const canPublishScreen = () => canUpdateScreen();
const canArchiveScreen = () => canUpdateScreen();
const canRebindScreen = () => canUpdateScreen();
const canViewUnassignedScreens = computed(() => canUpdateScreen() || canDeleteScreen());
const hasOrphanScreens = computed(() => orphanScreens.value.length > 0);
const showAssignedSection = computed(() => filterAssignment.value !== 'unassigned');
const showOrphanSection = computed(() => canViewUnassignedScreens.value && filterAssignment.value !== 'assigned' && hasOrphanScreens.value);
const shouldShowProjectEmpty = computed(() => !loading.value && showAssignedSection.value && !!projectStore.currentProjectID && total.value === 0);
const shouldShowOrphanEmpty = computed(
  () => canViewUnassignedScreens.value && !loading.value && filterAssignment.value === 'unassigned' && orphanScreens.value.length === 0,
);
const pagedProjectScreens = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return projectScreens.value.slice(start, start + pageSize.value);
});
const assignmentOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.projectSelect.currentProject'); }, value: 'assigned' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('console.im.requestPending'); }, value: 'unassigned' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.all'); }, value: 'all' },
];
const visibleAssignmentOptions = computed(() =>
  canViewUnassignedScreens.value ? assignmentOptions : assignmentOptions.filter((item) => item.value === 'assigned'),
);
const statusFilterOptions = screenStatusOptions.map(({ label, value }) => ({ label, value }));

function copyTextWithFallback(text: string, input?: HTMLInputElement | null) {
  const copyByCommand = () => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  };

  const copyFromInput = () => {
    if (input) {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      if (document.execCommand('copy')) {
        return true;
      }
    }
    return copyByCommand();
  };

  return (async () => {
    const copiedByCommand = copyFromInput();
    if (copiedByCommand) return true;

    if (navigator.clipboard?.writeText) {
      const copied = await navigator.clipboard.writeText(text).then(() => true).catch(() => false);
      if (copied) return true;
    }
    return false;
  })();
}

function sortScreens(screens: ScreenInfo[]) {
  return [...screens].sort((left, right) => {
    const createdTimeDiff = Number(right.createdTime || 0) - Number(left.createdTime || 0);
    if (createdTimeDiff !== 0) {
      return createdTimeDiff;
    }
    return Number(right.id || 0) - Number(left.id || 0);
  });
}

async function loadCreatorOptions() {
  creatorOptionsLoading.value = true;
  try {
    const res = await CoreApi.postApiV1SystemUserInfoGetList({
      page: {
        page: 1,
        size: 500,
      },
    });
    const optionMap = new Map<string, string>();
    (res?.list || []).forEach((item: any) => {
      const value = item?.userID ? String(item.userID) : '';
      if (!value || optionMap.has(value)) return;
      const name = item?.nickName || item?.userName || value;
      const account = item?.userName && item.userName !== name ? ` (${item.userName})` : '';
      optionMap.set(value, `${name}${account}`);
    });
    creatorOptions.value = [...optionMap.entries()].map(([value, label]) => ({ label, value }));
  } catch (error) {
    creatorOptions.value = [];
    message.warning(t('bigscreenManagement.dynamic.failedToLoadCreatorOptions', { error: String(getErrorMessage(error)) }));
  } finally {
    creatorOptionsLoading.value = false;
  }
}

function getListParams() {
  const params: Record<string, any> = {};
  const trimmedName = searchName.value.trim();
  if (trimmedName) params.name = trimmedName;
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterCreatedUserID.value) params.createdUserID = filterCreatedUserID.value;
  if (Array.isArray(filterUpdatedTime.value) && filterUpdatedTime.value.length === 2) {
    const [start, end] = filterUpdatedTime.value;
    if (start || end) {
      params.updatedTime = { start, end };
    }
  }
  return params;
}

function onFilterChange() {
  if (!canViewUnassignedScreens.value && filterAssignment.value !== 'assigned') {
    filterAssignment.value = 'assigned';
  }
  page.value = 1;
}

function onSearch() {
  page.value = 1;
  void loadData();
}

function onResetFilters() {
  searchName.value = '';
  filterStatus.value = null;
  filterAssignment.value = 'assigned';
  filterCreatedUserID.value = null;
  filterUpdatedTime.value = null;
  page.value = 1;
  void loadData();
}

function filterScreensByProject(screens: ScreenInfo[], projectID?: null | string) {
  if (!projectID) return [];
  const bindings = getScreenProjectBindings();
  return screens.filter((item) => {
    if (!item.id) return false;
    if (item.projectID) {
      return String(item.projectID) === projectID;
    }
    return bindings[item.id] === projectID;
  });
}

function getCoverSrc(item: ScreenInfo) {
  if (!item.indexImage) return '';
  const base = resolveAssetUrl(item.indexImage);
  const version = item.updatedTime ? String(item.updatedTime) : '';
  if (!version || base.startsWith('data:') || base.includes('X-Amz-Signature')) return base;
  return `${base}${base.includes('?') ? '&' : '?'}t=${version}`;
}

function getCoverErrorKey(item?: ScreenInfo) {
  return item ? getCoverSrc(item) : '';
}

function hasCoverError(item?: ScreenInfo) {
  const key = getCoverErrorKey(item);
  return !!(key && coverErrorMap.value[key]);
}

function markCoverError(item?: ScreenInfo) {
  const key = getCoverErrorKey(item);
  if (!key) return;
  coverErrorMap.value = {
    ...coverErrorMap.value,
    [key]: true,
  };
}

function getOrphanRecord(screenId?: string) {
  if (!screenId) return undefined;
  return orphanScreenRecordMap.value[screenId];
}

function isOrphanScreen(row: ScreenInfo) {
  return !!row.id && !!orphanScreenRecordMap.value[row.id];
}

function updateScreenCollections(mutator: (item: ScreenInfo) => ScreenInfo) {
  projectScreens.value = projectScreens.value.map((item) => mutator(item));
  orphanScreens.value = orphanScreens.value.map((item) => mutator(item));
}

function setScreenStatusLocally(screenId: string, status: number) {
  updateScreenCollections((item) =>
    item.id === screenId
      ? {
          ...item,
          status,
        }
      : item,
  );
}

function notifyProjectContextSync(result: Awaited<ReturnType<typeof syncBigscreenProjectContext>>) {
  if (result.currentProjectInvalid) {
    const releasedCount = result.releasedScreenIds.length;
    if (releasedCount > 0) {
      message.warning(t('bigscreenManagement.dynamic.projectDeletedReleased', { count: releasedCount }));
    } else {
      message.warning(t('bigscreenManagement.ui.currentProjectWasDeletedSelectAnotherProject'));
    }
    return;
  }

  if (result.releasedScreenIds.length > 0) {
    message.warning(t('bigscreenManagement.dynamic.orphanedDashboards', { count: result.releasedScreenIds.length }));
  }
}

async function syncProjectContext() {
  const result = await syncBigscreenProjectContext(projectStore);
  notifyProjectContextSync(result);
  return result;
}

async function ensureProjectSelectedForAction() {
  await syncProjectContext();
  if (!projectStore.currentProjectID) {
    projectStore.openProjectSelectModal(route.fullPath);
    return false;
  }
  return true;
}

async function autoUnpublishOrphanScreens(screens: ScreenInfo[]) {
  const targets = screens.filter((item) => item.id && item.status === 1 && !autoUnpublishHandledScreenIDs.has(item.id));
  if (targets.length === 0) return;

  for (const item of targets) {
    autoUnpublishHandledScreenIDs.add(item.id!);
  }

  const results = await Promise.allSettled(targets.map((item) => ScreenApi.unpublish(item.id!)));
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    const target = targets[index];
    if (!target?.id) return;

    if (result.status === 'fulfilled') {
      successCount += 1;
      setScreenStatusLocally(target.id, 2);
      return;
    }

    failureCount += 1;
    autoUnpublishHandledScreenIDs.delete(target.id);
  });

  if (successCount > 0) {
    message.warning(t('bigscreenManagement.dynamic.publishedConvertedDrafts', { count: successCount }));
  }
  if (failureCount > 0) {
    message.error(t('bigscreenManagement.dynamic.convertDraftFailed', { count: failureCount }));
  }
}

async function loadData() {
  loading.value = true;
  try {
    await syncProjectContext();

    if (!canViewUnassignedScreens.value && filterAssignment.value !== 'assigned') {
      filterAssignment.value = 'assigned';
    }

    const params = getListParams();
    const shouldQueryAssignedOnly = !canViewUnassignedScreens.value || filterAssignment.value === 'assigned';
    if (shouldQueryAssignedOnly) {
      if (!projectStore.currentProjectID) {
        projectScreens.value = [];
        orphanScreens.value = [];
        orphanScreenRecordMap.value = getUnassignedScreenRecords();
        total.value = 0;
        page.value = 1;
        coverErrorMap.value = {};
        return;
      }
      params.projectID = projectStore.currentProjectID;
    } else {
      // 跨项目查询：告诉后端不要按 project-id header 自动注入项目过滤
      params.allProjects = true;
    }

    const res = await ScreenApi.list(1, MAX_SCREEN_FETCH_SIZE, params);
    const allScreens = sortScreens(res.list ?? []);

    pruneMissingScreenProjectAssociations(allScreens.map((item) => item.id).filter((screenId): screenId is string => !!screenId));

    orphanScreenRecordMap.value = getUnassignedScreenRecords();
    const orphanScreenIDSet = new Set(Object.keys(orphanScreenRecordMap.value));

    // 双重检测未归属大屏：
    // 1. localStorage 中已标记的（reconcileScreenProjectAssociations 产物）
    // 2. API 返回的 projectID 不在当前有效项目列表中（兜底，覆盖从未被 localStorage 追踪的大屏）
    const validProjectIDSet = new Set(
      projectStore.projects
        .map((p) => p.projectID)
        .filter((id): id is string => !!id),
    );
    const isOrphanByProjectID = (screen: ScreenInfo): boolean => {
      if (!screen.id) return false;
      // localStorage 中已标记
      if (orphanScreenIDSet.has(screen.id)) return true;
      // projectID 不为 0/空 且不在有效项目列表中
      const pid = screen.projectID;
      if (pid && String(pid) !== '0' && !validProjectIDSet.has(String(pid))) {
        return true;
      }
      return false;
    };

    orphanScreens.value =
      !canViewUnassignedScreens.value || filterAssignment.value === 'assigned'
        ? []
        : allScreens.filter(isOrphanByProjectID);

    // 自动将新发现的未归属大屏同步到 localStorage，以便后续操作（如自动取消发布）使用
    for (const orphan of orphanScreens.value) {
      if (orphan.id && !orphanScreenIDSet.has(orphan.id)) {
        markScreenUnassigned(orphan.id, orphan.projectID || undefined);
      }
    }

    projectScreens.value =
      canViewUnassignedScreens.value && filterAssignment.value === 'unassigned' ? [] : filterScreensByProject(allScreens, projectStore.currentProjectID);
    total.value = projectScreens.value.length;
    page.value = total.value > 0 ? Math.min(page.value, Math.ceil(total.value / pageSize.value)) : 1;
    coverErrorMap.value = {};

    await autoUnpublishOrphanScreens(orphanScreens.value);
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToLoad', { error: String(getErrorMessage(error)) }));
    projectScreens.value = [];
    orphanScreens.value = [];
    orphanScreenRecordMap.value = {};
    total.value = 0;
    page.value = 1;
    coverErrorMap.value = {};
  } finally {
    loading.value = false;
  }
}

function onRefresh() {
  void loadData();
}

function applyProjectCoverUpdate(detail: ProjectCoverUpdatedDetail) {
  if (!detail.projectId || !detail.filePath) return false;

  let updated = false;
  updateScreenCollections((item) => {
    if (item.id !== detail.projectId) return item;
    updated = true;
    return {
      ...item,
      indexImage: detail.filePath,
      updatedTime: detail.updatedAt,
    };
  });

  if (updated) {
    coverErrorMap.value = {};
  }

  return updated;
}

function handleProjectCoverUpdated(detail?: null | ProjectCoverUpdatedDetail) {
  if (!detail?.projectId) return;

  if (applyProjectCoverUpdate(detail)) return;

  const shouldRefresh =
    !!coverErrorMap.value[detail.projectId] ||
    projectScreens.value.some((item) => item.id === detail.projectId) ||
    orphanScreens.value.some((item) => item.id === detail.projectId);
  if (!shouldRefresh) return;

  coverErrorMap.value = {};
  void loadData();
}

function onProjectCoverUpdated(event: Event) {
  const customEvent = event as CustomEvent<ProjectCoverUpdatedDetail>;
  handleProjectCoverUpdated(customEvent.detail);
}

function onProjectCoverUpdatedStorage(event: StorageEvent) {
  if (!isProjectCoverUpdatedStorageKey(event.key)) return;
  const detail = parseProjectCoverUpdatedDetail(event.newValue);
  handleProjectCoverUpdated(detail);
}

onMounted(() => {
  void loadData();
  void loadCreatorOptions();
  window.addEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.addEventListener('storage', onProjectCoverUpdatedStorage);
  stopProjectSyncSubscription = subscribeProjectSyncEvent(() => {
    void loadData();
  });
});

onActivated(() => {
  void loadData();
});

watch(
  () => projectStore.currentProjectID,
  (currentProjectID, previousProjectID) => {
    if (currentProjectID === previousProjectID) return;
    page.value = 1;
    void loadData();
  },
);

onBeforeUnmount(() => {
  window.removeEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.removeEventListener('storage', onProjectCoverUpdatedStorage);
  stopProjectSyncSubscription?.();
  // 页面卸载时强制关闭抽屉与项目选择弹窗，防止 radix dialog / sheet
  // 的 teleport overlay 在组件意外卸载时残留，导致其他菜单无法点击。
  drawerApi.close?.();
  projectStore.closeProjectSelectModal();
});

async function onCreate() {
  if (!canCreateScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionCreateDashboards'));
    return;
  }
  if (!(await ensureProjectSelectedForAction())) return;
  drawerApi.setData({}).open();
}

function onEdit(row: ScreenInfo) {
  if (!canUpdateScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionEditDashboards'));
    return;
  }
  drawerApi.setData(row).open();
}

function onOpenEditor(row: ScreenInfo) {
  if (!row.id) return;
  if (!canOpenEditor()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionOpenEditor'));
    return;
  }
  if (isOrphanScreen(row)) {
    message.warning(t('bigscreenManagement.ui.originalProjectWasDeletedBindNewProjectBefore'));
    return;
  }
  openNoOpenerWindow(
    buildStandaloneBigscreenUrl(
      `/editor/${row.id}`,
      {
        editorName: row.name || undefined,
      },
      { appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE },
    ),
  );
}

function onPreview(row: ScreenInfo) {
  if (!row.id) return;
  if (!canPreviewScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionPreviewDashboards'));
    return;
  }
  openNoOpenerWindow(
    buildStandaloneBigscreenUrl(
      `/editor/${row.id}`,
      {
        mode: 'preview',
      },
      { appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE },
    ),
  );
}

async function onPublish(row: ScreenInfo) {
  if (!row.id) return;
  if (!canPublishScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionPublish'));
    return;
  }
  if (isOrphanScreen(row)) {
    message.warning(t('bigscreenManagement.ui.rebindProjectBeforePublishingThisDashboard'));
    return;
  }

  if (row.status === 1) {
    dialog.warning({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.unpublish'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return t('bigscreenManagement.ui.unpublishingDisablesPublicLinkContinue'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.common.confirm'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
      onPositiveClick: async () => {
        try {
          await ScreenApi.unpublish(row.id!);
          message.success(t('bigscreenManagement.ui.unpublished'));
          onRefresh();
        } catch (error) {
          message.error(t('bigscreenManagement.dynamic.actionFailed', { error: String(getErrorMessage(error)) }));
        }
      },
    });
    return;
  }

  dialog.info({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.publishDashboard'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return t('bigscreenManagement.ui.publishingCreatesPublicLinkThatAnyoneCanUse'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('bigscreenManagement.ui.confirmPublication'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        await ScreenApi.publish(row.id!);
        const publishUrl = buildBigscreenRouteUrl('/', `/view/${row.id}`, undefined, {
          appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE,
        });
        let nativeInputEl: HTMLInputElement | null = null;
        dialog.success({
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.publishSuccess'); },
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.common.close'); },
          content: () =>
            h('div', [
              h('p', { style: 'margin:0 0 8px' }, t('bigscreenManagement.ui.publicLink')),
              h('div', { style: 'display:flex;gap:8px' }, [
                h(NInput, {
                  ref: (inst: any) => {
                    nativeInputEl = inst?.inputElRef ?? null;
                  },
                  value: publishUrl,
                  readonly: true,
                  size: 'small',
                  onClick: (event: MouseEvent) => (event.target as HTMLInputElement).select(),
                }),
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'primary',
                    onClick: async () => {
                      const copied = await copyTextWithFallback(publishUrl, nativeInputEl);
                      if (copied) {
                        message.success(t('bigscreenManagement.ui.linkCopied'));
                        return;
                      }
                      message.info(t('bigscreenManagement.ui.automaticCopyingFailedSelectLinkAndPressCtrl'));
                    },
                  },
                  { default: () => t('orgManage.flow.copy') },
                ),
              ]),
            ]),
        });
        onRefresh();
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.failedToPublish', { error: String(getErrorMessage(error)) }));
      }
    },
  });
}

async function onArchive(row: ScreenInfo) {
  if (!row.id) return;
  if (!canArchiveScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionArchive'));
    return;
  }
  try {
    await ScreenApi.update({ id: row.id, status: 2 });
    message.success(t('orgManage.memory.statusArchived'));
    onRefresh();
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToArchive', { error: String(getErrorMessage(error)) }));
  }
}

async function onCopy(row: ScreenInfo) {
  if (!canCreateScreen() || !canViewScreenDetail()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionDuplicateDashboards'));
    return;
  }
  if (!(await ensureProjectSelectedForAction())) return;
  try {
    const detail = row.id ? await ProjectDetailApi.getContent(row.id) : null;
    const created = await ScreenApi.create({
      projectID: projectStore.currentProjectID!,
      name: t('bigscreenManagement.dynamic.duplicateName', { name: row.name || t('bigscreenRoutes.manage') }),
      desc: row.desc,
      indexImage: row.indexImage,
      status: 2,
    });
    const newId = (created as any)?.id;
    if (!newId) throw new Error(t('bigscreenManagement.ui.failedCreateDashboard'));
    if (detail?.content) {
      await ProjectDetailApi.updateContent(String(newId), detail.content);
    }
    setScreenProjectBinding(String(newId), projectStore.currentProjectID!);
    message.success(t('iotApp.productPage.copySuccess'));
    page.value = 1;
    onRefresh();
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToDuplicate', { error: String(getErrorMessage(error)) }));
  }
}

async function onDelete(row: ScreenInfo) {
  if (!row.id) return;
  if (!canDeleteScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionDelete'));
    return;
  }
  if (row.status !== 2) {
    message.warning(t('bigscreenManagement.ui.onlyDraftsCanBeDeleted'));
    return;
  }
  try {
    await ScreenApi.delete(row.id);
    removeScreenProjectBinding(row.id);
    removeUnassignedScreenRecord(row.id);
    message.success(t('orgManage.common.deleteSuccess'));
    onRefresh();
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(getErrorMessage(error)) }));
  }
}

async function onRebindProject(row: ScreenInfo) {
  if (!row.id) return;
  if (!canRebindScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionRebindProjects'));
    return;
  }

  try {
    await syncProjectContext();
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToLoadProjects', { error: String(getErrorMessage(error)) }));
    return;
  }

  const options = projectStore.projectOptions;
  if (options.length === 0) {
    projectStore.openProjectSelectModal(route.fullPath);
    message.warning(t('bigscreenManagement.ui.noAvailableProjectsCreateProjectFirst'));
    return;
  }

  const selectedProjectID = ref<string>(projectStore.currentProjectID || String(options[0]?.value || ''));

  dialog.create({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.rebindProject'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('console.im.confirmBind'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    content: () =>
      h('div', { style: 'display:flex;flex-direction:column;gap:12px;' }, [
        h(
          'p',
          { style: 'margin:0;color:var(--n-text-color-2);line-height:1.6;' },
          t('bigscreenManagement.ui.originalProjectWasDeletedSelectNewProjectAfter'),
        ),
        h(NSelect, {
          value: selectedProjectID.value,
          options,
          filterable: true,
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('iotApp.devicePage.selectProject'); },
          onUpdateValue: (value: string) => {
            selectedProjectID.value = value;
          },
        }),
      ]),
    onPositiveClick: async () => {
      const targetProjectID = selectedProjectID.value;
      if (!targetProjectID) {
        message.warning(t('iotApp.devicePage.selectTargetProject'));
        return false;
      }

      try {
        if (row.status === 1) {
          await ScreenApi.unpublish(row.id!);
          setScreenStatusLocally(row.id!, 2);
        }
        await ScreenApi.update({
          id: row.id,
          projectID: targetProjectID,
          status: 2,
        });
        setScreenProjectBinding(row.id!, targetProjectID);
        projectStore.setCurrentProjectID(targetProjectID);
        message.success(t('bigscreenManagement.ui.boundTargetProject'));
        page.value = 1;
        onRefresh();
        return true;
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.failedToBind', { error: String(getErrorMessage(error)) }));
        return false;
      }
    },
  });
}

function onImport() {
  if (!canCreateScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionImportDashboards'));
    return;
  }
  void ensureProjectSelectedForAction().then((ok) => {
    if (ok) {
      importFileInput.value?.click();
    }
  });
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  /** 检查大屏名称重复并自动追加序号 */
  async function resolveScreenName(rawName: string): Promise<{ name: string; duplicated: boolean }> {
    const { list } = await ScreenApi.list(1, 100, { name: rawName, type: 'screen' });
    const existingNames = new Set((list || []).map((s) => s.name));
    if (!existingNames.has(rawName)) return { name: rawName, duplicated: false };
    let index = 1;
    let candidate = `${rawName} (${index})`;
    while (existingNames.has(candidate)) { index += 1; candidate = `${rawName} (${index})`; }
    return { name: candidate, duplicated: true };
  }

  const isZip = file.name.endsWith('.zip');

  if (isZip) {
    const zipResult = await parseZipImport(file);
    if (zipResult.error || !zipResult.schema) {
      message.error(zipResult.error || t('bigscreenManagement.ui.failedParseZIP'));
      return;
    }
    // 直接用 ZIP 解析后的 schema（素材已上传并替换路径）
    const schema = zipResult.schema;
    const summary = getImportSummary(schema);
    const { name: resolvedName, duplicated } = await resolveScreenName(summary.name);
    const duplicateHint = duplicated ? t('bigscreenManagement.dynamic.dashboardRenameHint', { name: summary.name, resolvedName }) : '';
    dialog.info({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.importDashboardAssets'); },
      content: t('bigscreenManagement.dynamic.importZipDashboard', { name: summary.name, duplicate: duplicateHint, count: summary.componentCount, warning: zipResult.assetErrors ? t('bigscreenManagement.dynamic.assetUploadWarning') : '' }),
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.formDesigner.confirmImport'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
      onPositiveClick: async () => {
        try {
          if (!(await ensureProjectSelectedForAction())) return false;
          const importedIndexImage = schema.meta?.indexImage || '';
          const created = await ScreenApi.create({
            projectID: projectStore.currentProjectID!,
            name: resolvedName,
            type: 'screen',
            indexImage: importedIndexImage || undefined,
          });
          if (!created?.id) {
            message.error(t('bigscreenManagement.ui.failedCreateDashboard'));
            return false;
          }
          const contentStr = schemaToStorageContent(schema);
          await ProjectDetailApi.updateContent(created.id, contentStr);
          message.success(t('orgManage.formDesigner.importSuccess'));
          dialog.destroyAll();
          await loadData();
          return true;
        } catch (err: any) {
          message.error(t('bigscreenManagement.dynamic.importFailed', { error: String(err?.message || t('orgManage.systemConfig.unknownError')) }));
          return false;
        }
      },
      onNegativeClick: () => { dialog.destroyAll(); },
    });
    return;
  }

  const result = await parseImportFile(file);
  if (!result.valid || !result.schema) {
    message.error(t('bigscreenManagement.dynamic.fileValidationFailed', { error: String(result.error) }));
    return;
  }

  const summary = getImportSummary(result.schema);
  const { name: resolvedName, duplicated } = await resolveScreenName(summary.name);
  const duplicateHint = duplicated ? t('bigscreenManagement.dynamic.dashboardRenameHint', { name: summary.name, resolvedName }) : '';
  dialog.info({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.importDashboard'); },
    content: t('bigscreenManagement.dynamic.importDashboard', { name: summary.name, duplicate: duplicateHint, count: summary.componentCount }),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.formDesigner.confirmImport'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        if (!(await ensureProjectSelectedForAction())) return false;

        // 从导出的 schema 中恢复封面图（base64 data URL）
        const importedIndexImage = result.schema?.meta?.indexImage || '';

        const created = await ScreenApi.create({
          projectID: projectStore.currentProjectID!,
          name: resolvedName,
          status: 2,
          indexImage: importedIndexImage,
        });
        const newId = (created as any)?.id;
        if (!newId) throw new Error(t('bigscreenManagement.ui.failedCreateDashboard'));

        setScreenProjectBinding(String(newId), projectStore.currentProjectID!);

        const content = schemaToStorageContent(result.schema!);
        await ProjectDetailApi.updateContent(String(newId), content);

        message.success(t('bigscreenManagement.ui.importedOpeningEditorNewWindow'));
        const editorUrl = buildStandaloneBigscreenUrl(`/editor/${newId}`);
        openNoOpenerWindow(editorUrl);
        return true;
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.importFailed', { error: String(getErrorMessage(error)) }));
        return false;
      }
    },
  });
}

async function onExport(row: ScreenInfo) {
  if (!row.id) return;
  if (!canExportScreen()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionExport'));
    return;
  }
  const msgReactive = message.loading(t('bigscreenManagement.ui.parsingDashboardConfiguration'), { duration: 0 });
  try {
    const detail = await ProjectDetailApi.getContent(row.id);
    if (!detail?.content) {
      message.warning(t('bigscreenManagement.ui.thisDashboardHasNoContent'));
      return;
    }
    exportStorageInfo.value = JSON.parse(detail.content);
    exportIndexImage.value = row.indexImage || '';
    exportProjectName.value = row.name || '';
    showExportModal.value = true;
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToLoadDashboardContent', { error: String(getErrorMessage(error)) }));
  } finally {
    msgReactive.destroy();
  }
}

function getStatusTag(status?: number) {
  if (status === 1) return { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defPublished'); }, type: 'success' as const };
  if (status === 3) return { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.session.archive'); }, type: 'default' as const };
  return { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defDraft'); }, type: 'warning' as const };
}

function getAssignedDropdownOptions(row: ScreenInfo) {
  const options: { label: string; key: string; disabled?: boolean }[] = [];
  if (canUpdateScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.clone.editInfo'); }, key: 'edit' });
  if (canOpenEditor()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.openEditor'); }, key: 'editor' });
  if (canPreviewScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.previewLabel'); }, key: 'preview' });
  if (canPublishScreen()) options.push({ label: row.status === 1 ? t('bigscreenManagement.ui.unpublish') : t('orgManage.flow.publish'), key: 'publish' });
  if (canCreateScreen() && canViewScreenDetail()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.copy'); }, key: 'copy' });
  if (canExportScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.formDesigner.export'); }, key: 'export' });
  if (canArchiveScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.session.archive'); }, key: 'archive' });
  if (canDeleteScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.delete'); }, key: 'delete' });
  return options;
}

function getOrphanDropdownOptions(row: ScreenInfo) {
  const options: { label: string; key: string; disabled?: boolean }[] = [];
  if (canRebindScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.rebindProject'); }, key: 'rebind' });
  if (canUpdateScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.clone.editInfo'); }, key: 'edit' });
  if (canOpenEditor()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.openEditor'); }, key: 'editor' });
  if (canPreviewScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.previewLabel'); }, key: 'preview' });
  if (canExportScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.formDesigner.export'); }, key: 'export' });
  if (canDeleteScreen()) options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.delete'); }, key: 'delete', disabled: row.status !== 2 });
  return options;
}

function onDropdownSelect(key: string, row: ScreenInfo) {
  const actions: Record<string, (screen: ScreenInfo) => void> = {
    archive: onArchive,
    copy: onCopy,
    delete: onDelete,
    edit: onEdit,
    editor: onOpenEditor,
    export: onExport,
    preview: onPreview,
    publish: onPublish,
    rebind: onRebindProject,
  };
  actions[key]?.(row);
}
</script>

<template>
  <Page title="" auto-content-height>
    <ProjectSelectModal />
    <Drawer @success="onRefresh" />
    <ExportModal
      v-model:show="showExportModal"
      :storage-info="exportStorageInfo"
      :index-image="exportIndexImage"
      :project-name="exportProjectName"
    />
    <div class="bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary" data-testid="bigscreen-filter-primary">
          <ProjectManagerSelector variant="filter" />
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" :placeholder="t('orgIotClient.energyDashboard.searchScreenPlaceholder')" clearable />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
            <NButton
              data-testid="bigscreen-filter-toggle"
              :aria-label="advancedFiltersOpen ? t('iotApp.alarmNotify.collapseFilters') : t('iotApp.alarmNotify.expandFilters')"
              :title="advancedFiltersOpen ? t('iotApp.alarmNotify.collapseFilters') : t('iotApp.alarmNotify.expandFilters')"
              @click="advancedFiltersOpen = !advancedFiltersOpen"
            >
              <span v-if="advancedFiltersOpen" class="icon-[mdi--minus] size-5"></span>
              <span v-else class="icon-[mdi--plus] size-5"></span>
            </NButton>
          </div>
        </div>
        <div v-if="advancedFiltersOpen" class="page-filter-row page-filter-row--secondary">
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.publicationStatus') }}</span>
            <NSelect
              v-model:value="filterStatus"
              clearable
              :options="statusFilterOptions"
              :placeholder="t('orgManage.common.phSelect')"
              @update:value="onFilterChange"
            />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.projectOwnershipStatus') }}</span>
            <NSelect
              v-model:value="filterAssignment"
              :options="visibleAssignmentOptions"
              :placeholder="t('orgManage.common.phSelect')"
              @update:value="onFilterChange"
            />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.createdBy') }}</span>
            <NSelect
              v-model:value="filterCreatedUserID"
              clearable
              filterable
              :loading="creatorOptionsLoading"
              :options="creatorOptions"
              :placeholder="t('orgManage.common.phSelect')"
              @update:value="onFilterChange"
            />
          </div>
          <div class="page-filter-item page-filter-item--daterange">
            <span class="page-filter-label">{{ t('orgManage.flow.updatedAtLabel') }}</span>
            <NDatePicker v-model:value="filterUpdatedTime" clearable type="daterange" @update:value="onFilterChange" />
          </div>
        </div>
      </div>
      <div class="screen-page">
        <div class="toolbar">
          <div class="toolbar-left">
            <NButton type="primary" ghost @click="onCreate">
              <span class="icon-[mdi--plus] size-5"></span>
              {{ t('bigscreenManagement.ui.createDashboard') }}
            </NButton>
            <NButton ghost @click="onImport">
              <span class="icon-[mdi--import] size-5"></span>
              {{ t('bigscreenManagement.ui.importDashboard') }}
            </NButton>
            <input ref="importFileInput" type="file" accept=".json,.goview.json,.zip,.goview.zip" style="display: none" @change="handleImportFile" />
          </div>
        </div>
        <NSpin :show="loading" class="min-h-0 flex-1">
          <div class="content-sections">
            <div v-if="showAssignedSection && pagedProjectScreens.length > 0" class="card-grid">
              <div v-for="item in pagedProjectScreens" :key="item.id" class="screen-card" @dblclick="onOpenEditor(item)">
                <div class="card-cover">
                  <img v-if="item.indexImage && !hasCoverError(item)" :src="getCoverSrc(item)" alt="cover" @error="markCoverError(item)" />
                  <div v-else class="cover-placeholder">
                    <span class="icon-[mdi--monitor-dashboard] size-10 opacity-30"></span>
                  </div>
                  <div class="cover-actions">
                    <NButton v-if="canPreviewScreen()" circle quaternary size="small" @click.stop="onPreview(item)">
                      <span class="icon-[mdi--eye-outline] size-5"></span>
                    </NButton>
                    <NButton v-if="canOpenEditor()" circle quaternary size="small" @click.stop="onOpenEditor(item)">
                      <span class="icon-[mdi--pencil-outline] size-5"></span>
                    </NButton>
                  </div>
                </div>
                <div class="card-footer">
                  <div class="card-title" :title="item.name">
                    {{ item.name || '-' }}
                  </div>
                  <div class="card-meta">
                    <div class="card-tags">
                      <NTag :type="getStatusTag(item.status).type" size="small" round>
                        {{ getStatusTag(item.status).label }}
                      </NTag>
                      <NTag v-if="item.resolution" type="default" size="small" round>
                        {{ item.resolution }}
                      </NTag>
                    </div>
                    <NDropdown
                      v-if="getAssignedDropdownOptions(item).length > 0"
                      trigger="click"
                      :options="getAssignedDropdownOptions(item)"
                      @select="(key: string) => onDropdownSelect(key, item)"
                    >
                      <NButton text size="small">
                        <span class="icon-[mdi--dots-vertical] size-5"></span>
                      </NButton>
                    </NDropdown>
                  </div>
                </div>
              </div>
            </div>

            <template v-if="showAssignedSection">
              <NEmpty v-if="shouldShowProjectEmpty" :description="t('bigscreenManagement.ui.noDashboardsThisProject')" />

              <NEmpty v-else-if="!loading && pagedProjectScreens.length === 0" :description="t('iotApp.reportPage.noProjectSelected')">
                <template #extra>
                  <NButton @click="projectStore.openProjectSelectModal(route.fullPath)">{{ t('iotApp.deviceDetail.selectProjectTitle') }}</NButton>
                </template>
              </NEmpty>
            </template>

            <NEmpty v-if="shouldShowOrphanEmpty" :description="t('bigscreenManagement.ui.noDashboardsAwaitingReassignment')" />

            <div v-if="!loading && showOrphanSection" class="pending-section">
              <div class="section-header">
                <div class="section-copy">
                  <div class="section-title">{{ t('bigscreenManagement.ui.dashboardsAwaitingReassignment') }}</div>
                  <div class="section-desc">{{ t('bigscreenManagement.ui.originalProjectsWereDeletedSoTheseDashboardsWere') }}</div>
                </div>
                <NTag type="warning" round>{{ orphanScreens.length }} {{ t('bigscreenManagement.ui.pending') }}</NTag>
              </div>

              <div class="card-grid">
                <div v-for="item in orphanScreens" :key="item.id" class="screen-card is-pending" @dblclick="onOpenEditor(item)">
                  <div class="card-cover">
                    <img v-if="item.indexImage && !hasCoverError(item)" :src="getCoverSrc(item)" alt="cover" @error="markCoverError(item)" />
                    <div v-else class="cover-placeholder">
                      <span class="icon-[mdi--monitor-dashboard] size-10 opacity-30"></span>
                    </div>
                    <div class="cover-actions">
                      <NButton v-if="canPreviewScreen()" circle quaternary size="small" @click.stop="onPreview(item)">
                        <span class="icon-[mdi--eye-outline] size-5"></span>
                      </NButton>
                      <NButton v-if="canOpenEditor()" circle quaternary size="small" @click.stop="onOpenEditor(item)">
                        <span class="icon-[mdi--pencil-outline] size-5"></span>
                      </NButton>
                    </div>
                  </div>
                  <div class="card-footer">
                    <div class="card-title" :title="item.name">
                      {{ item.name || '-' }}
                    </div>
                    <div class="card-subtitle">
                      {{ t('bigscreenManagement.ui.originalProjectDeleted') }}
                      <span v-if="getOrphanRecord(item.id)?.previousProjectID"> {{ t('bigscreenManagement.ui.originalProjectID') }}{{ getOrphanRecord(item.id)?.previousProjectID }} </span>
                    </div>
                    <div class="card-meta">
                      <div class="card-tags">
                        <NTag type="warning" size="small" round>{{ t('bigscreenManagement.ui.awaitingReassignment') }}</NTag>
                        <NTag :type="getStatusTag(item.status).type" size="small" round>
                          {{ getStatusTag(item.status).label }}
                        </NTag>
                        <NTag v-if="item.resolution" type="default" size="small" round>
                          {{ item.resolution }}
                        </NTag>
                      </div>
                      <div class="card-actions-right">
                        <NButton v-if="canRebindScreen()" text type="primary" size="small" @click.stop="onRebindProject(item)">{{ t('orgEnergy.ui.rebind') }}</NButton>
                        <NDropdown
                          v-if="getOrphanDropdownOptions(item).length > 0"
                          trigger="click"
                          :options="getOrphanDropdownOptions(item)"
                          @select="(key: string) => onDropdownSelect(key, item)"
                        >
                          <NButton text size="small">
                            <span class="icon-[mdi--dots-vertical] size-5"></span>
                          </NButton>
                        </NDropdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NSpin>

        <div v-if="total > 0" class="pagination">
          <NPagination
            :page="page"
            :page-size="pageSize"
            :item-count="total"
            :page-sizes="[12, 24, 48]"
            show-size-picker
            @update:page="
              (p: number) => {
                page = p;
              }
            "
            @update:page-size="
              (s: number) => {
                pageSize = s;
                page = 1;
              }
            "
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.page-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
  justify-content: flex-start;
  padding: var(--bigscreen-content-padding-y) var(--bigscreen-content-padding-x);
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-panel-border);
  border-radius: var(--bigscreen-radius);
  box-shadow: var(--bigscreen-panel-shadow);
}
.page-filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.page-filter-item :deep(.n-base-selection),
.page-filter-item :deep(.n-input),
.page-filter-item :deep(.n-date-picker) {
  width: 100%;
}
.page-filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px 24px;
  align-items: center;
}
.page-filter-row--primary {
  justify-content: flex-start;
  overflow-x: auto;
}
.page-filter-row--secondary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(360px, 1.35fr);
  margin-top: 14px;
  gap: 16px 24px;
  align-items: center;
}
.page-filter-item--search {
  flex: 1 1 auto;
  min-width: 0;
}
.page-filter-item--daterange {
  flex: 1.3 1 0;
  min-width: 0;
}
.page-filter-label {
  flex: 0 0 72px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--n-text-color);
  white-space: nowrap;
}
.page-filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 0 0 auto;
}
.screen-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: var(--bigscreen-content-padding-y) var(--bigscreen-content-padding-x) 16px;
  background: var(--bigscreen-section-bg);
  border: 1px solid var(--bigscreen-section-border);
  border-radius: var(--bigscreen-radius);
  box-shadow: var(--bigscreen-section-shadow);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 2px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.content-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
  padding-top: 2px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 340px));
  gap: 16px;
}

.screen-card {
  overflow: hidden;
  cursor: pointer;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-card-border);
  border-radius: var(--bigscreen-radius);
  transition: box-shadow 0.2s;
}

.screen-card:hover {
  box-shadow: var(--bigscreen-card-hover-shadow);
}


.card-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bigscreen-cover-bg);
}

.cover-actions {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  color: var(--bigscreen-overlay-text);
  background: var(--bigscreen-overlay-bg);
  opacity: 0;
  transition: opacity 0.2s;
}

.screen-card:hover .cover-actions {
  opacity: 1;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--bigscreen-placeholder-text);
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--bigscreen-footer-bg);
}

.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.card-subtitle {
  color: var(--bigscreen-muted-text);
  font-size: 12px;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-tags,
.card-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pending-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--bigscreen-pending-bg);
  border: 1px solid var(--bigscreen-pending-border);
  border-radius: var(--bigscreen-radius);
}

.section-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
}

.section-desc {
  color: var(--bigscreen-pending-text);
  font-size: 13px;
  line-height: 1.6;
}

.pagination {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
}

@media (max-width: 1400px) {
  .page-filter-panel {
    align-items: stretch;
  }

  .page-filter-row {
    flex-wrap: wrap;
    gap: 12px 16px;
  }

  .page-filter-row--primary {
    flex-wrap: nowrap;
  }

  .page-filter-row--secondary {
    display: flex;
  }

  .page-filter-item--search,
  .page-filter-item--daterange,
  .page-filter-row--secondary .page-filter-item {
    min-width: 320px;
    flex: 1 1 320px;
  }

  .page-filter-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .page-filter-row--primary .page-filter-actions {
    width: auto;
  }
}

@media (max-width: 768px) {
  .page-filter-item,
  .page-filter-item--search,
  .page-filter-item--daterange {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .toolbar {
    flex-wrap: wrap;
  }

  .page-filter-label {
    flex-basis: 64px;
  }
}
</style>
