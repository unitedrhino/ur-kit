<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import type { ProjectCoverUpdatedDetail } from '../shared/coverEvents';
import type { TemplateInfo } from './index.api';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { CoreApi } from '@vben/api';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { useSessionStore } from '@vben/saas';

import { NButton, NDatePicker, NDropdown, NEmpty, NInput, NPagination, NSelect, NSpin, NTag, useDialog, useMessage } from 'naive-ui';

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
import { BIGSCREEN_STANDALONE_IOT_APP_BASE, buildStandaloneBigscreenUrl } from '../shared/route-path';
import { TemplateApi } from './index.api';
import FormDrawer from './modules/form.vue';

import '../shared/manage-theme.css';

const message = useMessage();
const dialog = useDialog();
const sessionStore = useSessionStore();

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: FormDrawer,
  destroyOnClose: true,
});
const importFileInput = ref<HTMLInputElement | null>(null);

const isPlatformTenant = () => sessionStore.tenantCode === 'platform';
const canManageTemplate = () => isPlatformTenant();
const canUpdateTemplate = () => isPlatformTenant();
const canDeleteTemplate = () => isPlatformTenant();
const canEditTemplateDetail = () => isPlatformTenant();

const list = ref<TemplateInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(12);
const loading = ref(false);
const searchName = ref('');
const filterSource = ref<null | string>(null);
const filterStatus = ref<null | number>(null);
const filterCreatedUserID = ref<null | string>(null);
const filterCreatedTime = ref<[number, number] | null>(null);
const filterUpdatedTime = ref<[number, number] | null>(null);
const creatorOptions = ref<Array<{ label: string; value: string }>>([]);
const creatorOptionsLoading = ref(false);
const coverErrorMap = ref<Record<string, boolean>>({});

const showExportModal = ref(false);
const exportStorageInfo = ref<any>(null);
const exportIndexImage = ref('');
const exportProjectName = ref('');

const sourceOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.system'); }, value: 'system' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.custom'); }, value: 'custom' },
];

const statusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.listed'); }, value: 1 },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defDraft'); }, value: 2 },
];

function sortTemplates(items: TemplateInfo[]) {
  return [...items].sort((left, right) => {
    const createdTimeDiff = Number(right.createdTime || 0) - Number(left.createdTime || 0);
    if (createdTimeDiff !== 0) {
      return createdTimeDiff;
    }
    return Number(right.id || 0) - Number(left.id || 0);
  });
}

function getCoverSrc(item: TemplateInfo) {
  if (!item.indexImage) return '';
  const base = resolveAssetUrl(item.indexImage);
  const version = item.updatedTime ? String(item.updatedTime) : '';
  if (!version || base.startsWith('data:') || base.includes('X-Amz-Signature')) return base;
  return `${base}${base.includes('?') ? '&' : '?'}t=${version}`;
}

function getCoverErrorKey(item?: TemplateInfo) {
  return item ? getCoverSrc(item) : '';
}

function hasCoverError(item?: TemplateInfo) {
  const key = getCoverErrorKey(item);
  return !!(key && coverErrorMap.value[key]);
}

function markCoverError(item?: TemplateInfo) {
  const key = getCoverErrorKey(item);
  if (!key) return;
  coverErrorMap.value = {
    ...coverErrorMap.value,
    [key]: true,
  };
}

function applyProjectCoverUpdate(detail: ProjectCoverUpdatedDetail) {
  if (!detail.projectId || !detail.filePath) return false;

  let updated = false;
  list.value = list.value.map((item) => {
    if (String(item.id || '') !== String(detail.projectId)) return item;
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
  if (!list.value.some((item) => String(item.id || '') === String(detail.projectId))) return;
  void loadData();
}

function onProjectCoverUpdated(event: Event) {
  const customEvent = event as CustomEvent<{ filePath?: string; projectId: string; updatedAt: number }>;
  handleProjectCoverUpdated(customEvent.detail);
}

function onProjectCoverUpdatedStorage(event: StorageEvent) {
  if (!isProjectCoverUpdatedStorageKey(event.key)) return;
  const detail = parseProjectCoverUpdatedDetail(event.newValue);
  handleProjectCoverUpdated(detail);
}

function getSourceTag(source?: string) {
  return source === 'system' ? { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('platformManage.ai.scopeCommon'); }, type: 'info' as const } : { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.custom'); }, type: 'default' as const };
}

function getStatusTag(status?: number) {
  return status === 1 ? { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.listed'); }, type: 'success' as const } : { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defDraft'); }, type: 'warning' as const };
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
    message.warning(t('bigscreenManagement.dynamic.failedToLoadCreatorOptions', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    creatorOptionsLoading.value = false;
  }
}

function getListParams() {
  const params: Record<string, any> = {};
  const trimmedName = searchName.value.trim();
  if (trimmedName) params.name = trimmedName;
  if (filterSource.value) params.source = filterSource.value;
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterCreatedUserID.value) params.createdUserID = filterCreatedUserID.value;
  if (Array.isArray(filterCreatedTime.value) && filterCreatedTime.value.length === 2) {
    const [start, end] = filterCreatedTime.value;
    if (start || end) {
      params.createdTime = { start, end };
    }
  }
  if (Array.isArray(filterUpdatedTime.value) && filterUpdatedTime.value.length === 2) {
    const [start, end] = filterUpdatedTime.value;
    if (start || end) {
      params.updatedTime = { start, end };
    }
  }
  return params;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await TemplateApi.list(page.value, pageSize.value, getListParams());
    list.value = sortTemplates(res.list ?? []);
    total.value = res.total ?? 0;
    coverErrorMap.value = {};
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
  void loadCreatorOptions();
  window.addEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.addEventListener('storage', onProjectCoverUpdatedStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.removeEventListener('storage', onProjectCoverUpdatedStorage);
});

function onRefresh() {
  void loadData();
}

function onSearch() {
  page.value = 1;
  void loadData();
}

function onFilterChange() {
  page.value = 1;
}

function onResetFilters() {
  searchName.value = '';
  filterSource.value = null;
  filterStatus.value = null;
  filterCreatedUserID.value = null;
  filterCreatedTime.value = null;
  filterUpdatedTime.value = null;
  page.value = 1;
  void loadData();
}

function onCreateTemplate() {
  if (!canManageTemplate()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionCreateTemplates'));
    return;
  }
  drawerApi.setData({}).open();
}

function onImportTemplate() {
  if (!canManageTemplate()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionImportTemplates'));
    return;
  }
  importFileInput.value?.click();
}

function onEditTemplate(row: TemplateInfo) {
  if (!canUpdateTemplate()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionEditTemplates'));
    return;
  }
  drawerApi.setData(row).open();
}

function onOpenEditor(row: TemplateInfo) {
  if (!row.id) return;
  if (!canEditTemplateDetail()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionAccessTemplateEditor'));
    return;
  }
  openNoOpenerWindow(
    buildStandaloneBigscreenUrl(
      `/editor/${row.id}`,
      {
        editorKind: 'template',
        editorName: row.name || undefined,
      },
      { appBase: BIGSCREEN_STANDALONE_IOT_APP_BASE },
    ),
  );
}

async function onToggleStatus(row: TemplateInfo) {
  if (!row.id) return;
  if (!canUpdateTemplate()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionListOrUnlist'));
    return;
  }

  const nextStatus = row.status === 1 ? 2 : 1;
  const isPublishing = nextStatus === 1;

  dialog.warning({
    title: isPublishing ? t('bigscreenManagement.ui.listTemplate') : t('bigscreenManagement.ui.unlistTemplate'),
    content: isPublishing ? t('bigscreenManagement.ui.afterListingThisTemplateWillAppearEditorTemplate') : t('bigscreenManagement.ui.afterUnlistingBusinessUsersCanNoLongerApply'),
    positiveText: isPublishing ? t('bigscreenManagement.ui.confirmListing') : t('bigscreenManagement.ui.confirmUnlisting'),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        await TemplateApi.update({
          id: row.id,
          status: nextStatus,
        });
        message.success(isPublishing ? t('bigscreenManagement.ui.listed') : t('platformManage.news.takenDown'));
        onRefresh();
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.actionFailed', { action: isPublishing ? t('orgMall.goods.onShelf') : t('orgMall.goods.offShelf'), error: (error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError') }));
      }
    },
  });
}

async function onDelete(row: TemplateInfo) {
  if (!row.id) return;
  if (!canDeleteTemplate()) {
    message.warning(t('bigscreenManagement.ui.youDoNotHavePermissionDeleteTemplates'));
    return;
  }
  dialog.warning({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.deleteTemplate'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return t('bigscreenManagement.ui.deletingThisTemplateDoesNotAffectDashboardsAlready'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.memory.deleteConfirmTitle'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        await TemplateApi.delete(String(row.id));
        message.success(t('orgManage.common.deleteSuccess'));
        onRefresh();
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
      }
    },
  });
}

function getDropdownOptions(row: TemplateInfo) {
  const options: { label: string; key: string; disabled?: boolean }[] = [];

  if (canUpdateTemplate()) {
    options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.clone.editInfo'); }, key: 'edit' });
  }
  if (canEditTemplateDetail()) {
    options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.openEditor'); }, key: 'editor' });
  }
  if (canUpdateTemplate()) {
    options.push({ label: row.status === 1 ? t('orgMall.goods.offShelf') : t('orgMall.goods.onShelf'), key: 'toggle-status' });
  }

  options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.formDesigner.export'); }, key: 'export' });

  if (canDeleteTemplate()) {
    options.push({ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.delete'); }, key: 'delete' });
  }

  return options;
}

function onDropdownSelect(key: string, row: TemplateInfo) {
  const actions: Record<string, (template: TemplateInfo) => void> = {
    delete: onDelete,
    edit: onEditTemplate,
    editor: onOpenEditor,
    'toggle-status': onToggleStatus,
    export: onExportTemplate,
  };
  actions[key]?.(row);
}

async function onExportTemplate(row: TemplateInfo) {
  if (!row.id) return;
  const msgReactive = message.loading(t('bigscreenManagement.ui.parsingTemplateConfiguration'), { duration: 0 });
  try {
    const detail = await ProjectDetailApi.getContent(String(row.id));
    if (!detail?.content) {
      message.warning(t('bigscreenManagement.ui.thisTemplateHasNoContent'));
      return;
    }
    exportStorageInfo.value = JSON.parse(detail.content);
    exportIndexImage.value = row.indexImage || '';
    exportProjectName.value = row.name || '';
    showExportModal.value = true;
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToLoadTemplateContent', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  } finally {
    msgReactive.destroy();
  }
}

/** 检查模板名称是否重复，若重复则追加序号（如 "模板 (1)"），返回最终名称和是否重名 */
async function resolveTemplateName(rawName: string): Promise<{ name: string; duplicated: boolean }> {
  const { list } = await TemplateApi.list(1, 100, { name: rawName, type: 'template' });
  const existingNames = new Set((list || []).map((t) => t.name));
  if (!existingNames.has(rawName)) return { name: rawName, duplicated: false };

  let index = 1;
  let candidate = `${rawName} (${index})`;
  while (existingNames.has(candidate)) {
    index += 1;
    candidate = `${rawName} (${index})`;
  }
  return { name: candidate, duplicated: true };
}

async function handleImportTemplateFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  const isZip = file.name.endsWith('.zip');

  if (isZip) {
    const zipResult = await parseZipImport(file);
    if (zipResult.error || !zipResult.schema) {
      message.error(zipResult.error || t('bigscreenManagement.ui.failedParseZIP'));
      return;
    }
    const schema = zipResult.schema;
    const summary = getImportSummary(schema);
    const { name: resolvedName, duplicated } = await resolveTemplateName(summary.name);
    const duplicateHint = duplicated ? t('bigscreenManagement.dynamic.templateRenameHint', { name: summary.name, resolvedName }) : '';
    dialog.info({
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.importTemplateAssets'); },
      content: t('bigscreenManagement.dynamic.importZipTemplate', { name: summary.name, duplicate: duplicateHint, count: summary.componentCount, warning: zipResult.assetErrors ? t('bigscreenManagement.dynamic.assetUploadWarning') : '' }),
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.formDesigner.confirmImport'); },
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
      onPositiveClick: async () => {
        try {
          const importedIndexImage = schema.meta?.indexImage || '';
          const created = await TemplateApi.create({
            name: resolvedName,
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return t('bigscreenManagement.ui.createFromZIPImport'); },
            status: 2,
            indexImage: importedIndexImage,
          });
          const newId = (created as any)?.id;
          if (!newId) throw new Error(t('bigscreenManagement.ui.failedCreateTemplate'));
          const content = schemaToStorageContent(schema);
          await ProjectDetailApi.updateContent(String(newId), content);
          message.success(t('bigscreenManagement.ui.templateImported'));
          page.value = 1;
          onRefresh();
          return true;
        } catch (error) {
          message.error(t('bigscreenManagement.dynamic.failedToImportTemplate', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
          return false;
        }
      },
    });
    return;
  }

  const result = await parseImportFile(file);
  if (!result.valid || !result.schema) {
    message.error(t('bigscreenManagement.dynamic.fileValidationFailed', { error: String(result.error) }));
    return;
  }

  const summary = getImportSummary(result.schema);
  const { name: resolvedName, duplicated } = await resolveTemplateName(summary.name);
  const duplicateHint = duplicated ? t('bigscreenManagement.dynamic.templateRenameHint', { name: summary.name, resolvedName }) : '';
  dialog.info({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.importTemplate'); },
    content: t('bigscreenManagement.dynamic.importTemplate', { name: summary.name, duplicate: duplicateHint, count: summary.componentCount }),
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.formDesigner.confirmImport'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        const importedIndexImage = result.schema?.meta?.indexImage || '';

        const created = await TemplateApi.create({
          name: resolvedName,
          /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get desc() { return t('bigscreenManagement.ui.createFromImport'); },
          status: 2,
          indexImage: importedIndexImage,
        });
        const newId = (created as any)?.id;
        if (!newId) throw new Error(t('bigscreenManagement.ui.failedCreateTemplate'));

        const content = schemaToStorageContent(result.schema!);
        await ProjectDetailApi.updateContent(String(newId), content);

        message.success(t('bigscreenManagement.ui.templateImported'));
        page.value = 1;
        onRefresh();
        return true;
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.failedToImportTemplate', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
        return false;
      }
    },
  });
}
</script>

<template>
  <Page title="" auto-content-height>
    <Drawer @success="onRefresh" />
    <ExportModal
      v-model:show="showExportModal"
      :storage-info="exportStorageInfo"
      :index-image="exportIndexImage"
      :project-name="exportProjectName"
    />

    <div class="tpl-page bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" :placeholder="t('platformManage.notify.searchTemplateName')" clearable />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
          </div>
        </div>
        <div class="page-filter-row page-filter-row--secondary">
          <div v-if="isPlatformTenant()" class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.pointLog.source') }}</span>
            <NSelect v-model:value="filterSource" clearable :options="sourceOptions" :placeholder="t('orgManage.common.phSelect')" @update:value="onFilterChange" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.common.status') }}</span>
            <NSelect v-model:value="filterStatus" clearable :options="statusOptions" :placeholder="t('orgManage.common.phSelect')" @update:value="onFilterChange" />
          </div>
          <div v-if="isPlatformTenant()" class="page-filter-item">
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
            <span class="page-filter-label">{{ t('orgManage.clone.createTime') }}</span>
            <NDatePicker v-model:value="filterCreatedTime" clearable type="daterange" @update:value="onFilterChange" />
          </div>
          <div class="page-filter-item page-filter-item--daterange">
            <span class="page-filter-label">{{ t('orgManage.flow.updatedAtLabel') }}</span>
            <NDatePicker v-model:value="filterUpdatedTime" clearable type="daterange" @update:value="onFilterChange" />
          </div>
        </div>
      </div>

      <div class="template-page">
        <div class="toolbar">
          <div class="toolbar-left">
            <NButton v-if="canManageTemplate()" type="primary" ghost @click="onCreateTemplate">
              <span class="icon-[mdi--plus] size-5"></span>
              {{ t('bigscreenManagement.ui.createTemplate') }}
            </NButton>
            <NButton v-if="canManageTemplate()" ghost @click="onImportTemplate">
              <span class="icon-[mdi--import] size-5"></span>
              {{ t('bigscreenManagement.ui.importTemplate') }}
            </NButton>
            <input ref="importFileInput" type="file" accept=".json,.goview.json,.zip,.goview.zip" style="display: none" @change="handleImportTemplateFile" />
          </div>
        </div>

        <NSpin :show="loading" class="min-h-0 flex-1">
          <div v-if="list.length > 0" class="card-grid">
            <div v-for="item in list" :key="item.id" class="tpl-card">
              <div class="card-cover">
                <img v-if="item.indexImage && !hasCoverError(item)" :src="getCoverSrc(item)" alt="cover" @error="markCoverError(item)" />
                <div v-else class="cover-placeholder">
                  <span class="icon-[mdi--view-dashboard-outline] size-10 opacity-30"></span>
                </div>
                <div class="cover-actions">
                  <NButton v-if="canEditTemplateDetail()" circle quaternary size="small" @click="onOpenEditor(item)">
                    <span class="icon-[mdi--pencil-outline] size-5"></span>
                  </NButton>
                </div>
              </div>
              <div class="card-footer">
                <div class="card-title" :title="item.name">{{ item.name || '-' }}</div>
                <div class="card-subtitle" :title="item.desc">{{ item.desc || t('bigscreenManagement.ui.noDescription') }}</div>
                <div class="card-meta">
                  <div class="card-tags">
                    <NTag :type="getStatusTag(item.status).type" size="small" round>
                      {{ getStatusTag(item.status).label }}
                    </NTag>
                    <NTag :type="getSourceTag(item.source).type" size="small" round>
                      {{ getSourceTag(item.source).label }}
                    </NTag>
                    <NTag v-if="item.resolution" size="small" round type="default">
                      {{ item.resolution }}
                    </NTag>
                  </div>
                  <NDropdown
                    v-if="getDropdownOptions(item).length > 0"
                    trigger="click"
                    :options="getDropdownOptions(item)"
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
          <NEmpty v-else-if="!loading" :description="t('bigscreenManagement.ui.noTemplates')" />
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
                loadData();
              }
            "
            @update:page-size="
              (s: number) => {
                pageSize = s;
                page = 1;
                loadData();
              }
            "
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.tpl-page {
  display: flex;
  flex-direction: column;
  gap: var(--bigscreen-section-gap);
  height: 100%;
  overflow: hidden;
}

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

.page-filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px 24px;
  align-items: center;
}

.page-filter-row--primary {
  justify-content: flex-start;
}

.page-filter-row--secondary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(360px, 1.35fr) minmax(360px, 1.35fr);
  margin-top: 14px;
  gap: 16px 24px;
  align-items: center;
}

.page-filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.page-filter-item--search {
  flex: 1 1 auto;
  min-width: 0;
}

.page-filter-item--daterange {
  min-width: 0;
}

.page-filter-item :deep(.n-base-selection),
.page-filter-item :deep(.n-input),
.page-filter-item :deep(.n-date-picker) {
  width: 100%;
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

.template-page {
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

.card-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fill, minmax(300px, 340px));
  gap: 16px;
  overflow-y: auto;
}

.tpl-card {
  overflow: hidden;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-card-border);
  border-radius: var(--bigscreen-radius);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

.tpl-card:hover {
  border-color: rgb(59 130 246 / 40%);
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

.tpl-card:hover .cover-actions {
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
  gap: 8px;
  padding: 12px;
  background: var(--bigscreen-footer-bg);
}

.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.card-subtitle {
  min-height: 20px;
  overflow: hidden;
  color: var(--bigscreen-muted-text);
  font-size: 12px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
}

@media (max-width: 1400px) {
  .page-filter-panel {
    align-items: stretch;
  }

  .page-filter-row {
    flex-wrap: wrap;
    gap: 12px 16px;
  }

  .page-filter-row--secondary {
    display: flex;
  }

  .page-filter-item--search,
  .page-filter-row--secondary .page-filter-item {
    min-width: 320px;
    flex: 1 1 320px;
  }

  .page-filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page-filter-item,
  .page-filter-item--search {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .toolbar {
    flex-wrap: wrap;
  }
}
</style>
