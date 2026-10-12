<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import type { ComponentCoverUpdatedDetail } from './coverEvents';
import type { ComponentInfo } from './index.api';

import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { Page, useVbenDrawer } from '@vben/common-ui';

import { NButton, NDatePicker, NDropdown, NEmpty, NInput, NPagination, NSelect, NSpin, NTag, useMessage } from 'naive-ui';

import { resolveAssetUrl } from '../shared/asset-url';
import { buildBigscreenPath } from '../shared/route-path';
import {
  BIGSCREEN_COMPONENT_COVER_UPDATED_EVENT,
  isComponentCoverUpdatedStorageKey,
  parseComponentCoverUpdatedDetail,
} from './coverEvents';
import { ComponentApi } from './index.api';
import FormDrawer from './modules/form.vue';

import '../shared/manage-theme.css';

const message = useMessage();
const route = useRoute();
const router = useRouter();

function ossUrl(path?: string) {
  return resolveAssetUrl(path);
}

const currentGroupId = ref<null | string>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: FormDrawer,
  destroyOnClose: true,
});

const list = ref<ComponentInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(12);
const loading = ref(false);
const searchName = ref('');
const filterStatus = ref<null | number>(null);
const filterCreatedUserID = ref<null | string>(null);
const filterCreatedTime = ref<[number, number] | null>(null);
const filterUpdatedTime = ref<[number, number] | null>(null);
const creatorOptions = ref<Array<{ label: string; value: string }>>([]);
const creatorOptionsLoading = ref(false);

const statusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.up'); }, value: 1 },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.down'); }, value: 2 },
];

function sortComponents(items: ComponentInfo[]) {
  return [...items].sort((left, right) => {
    const createdTimeDiff = Number(right.createdTime || 0) - Number(left.createdTime || 0);
    if (createdTimeDiff !== 0) {
      return createdTimeDiff;
    }
    return Number(right.id || 0) - Number(left.id || 0);
  });
}

function getListParams() {
  const params: Record<string, any> = {};
  const trimmedName = searchName.value.trim();
  if (trimmedName) params.name = trimmedName;
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
  if (currentGroupId.value) params.groupId = currentGroupId.value;
  return params;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await ComponentApi.list(page.value, pageSize.value, getListParams());
    list.value = sortComponents(res.list ?? []);
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
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

function handleComponentCoverUpdated(detail?: ComponentCoverUpdatedDetail | null) {
  if (!detail?.componentId) return;
  if (!list.value.some((item) => item.id === detail.componentId)) return;
  void loadData();
}

function onComponentCoverUpdated(event: Event) {
  const customEvent = event as CustomEvent<ComponentCoverUpdatedDetail>;
  handleComponentCoverUpdated(customEvent.detail);
}

function onComponentCoverUpdatedStorage(event: StorageEvent) {
  if (!isComponentCoverUpdatedStorageKey(event.key)) return;
  const detail = parseComponentCoverUpdatedDetail(event.newValue);
  handleComponentCoverUpdated(detail);
}

onMounted(() => {
  void loadData();
  void loadCreatorOptions();
  window.addEventListener(BIGSCREEN_COMPONENT_COVER_UPDATED_EVENT, onComponentCoverUpdated);
  window.addEventListener('storage', onComponentCoverUpdatedStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener(BIGSCREEN_COMPONENT_COVER_UPDATED_EVENT, onComponentCoverUpdated);
  window.removeEventListener('storage', onComponentCoverUpdatedStorage);
});

function onSearch() {
  page.value = 1;
  void loadData();
}

function onResetFilters() {
  searchName.value = '';
  filterStatus.value = null;
  filterCreatedUserID.value = null;
  filterCreatedTime.value = null;
  filterUpdatedTime.value = null;
  currentGroupId.value = null;
  page.value = 1;
  void loadData();
}

function onRefresh() {
  void loadData();
}

function onCreate() {
  drawerApi.setData({}).open();
}

function onEdit(row: ComponentInfo) {
  drawerApi.setData(row).open();
}

async function onDelete(row: ComponentInfo) {
  if (!row.id) return;
  try {
    await ComponentApi.delete(row.id);
    message.success(t('orgManage.common.deleteSuccess'));
    onRefresh();
  } catch (error: any) {
    message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(error.msg || error.message || t('orgManage.systemConfig.unknownError')) }));
  }
}

async function onToggleStatus(row: ComponentInfo) {
  if (!row.id) return;
  const newStatus = row.status === 1 ? 2 : 1;
  const label = newStatus === 1 ? t('iotApp.deviceDetail.up') : t('iotApp.deviceDetail.down');
  try {
    await ComponentApi.update({ id: row.id, status: newStatus });
    message.success(t('orgPark.dynamic.actionSuccess', { action: label }));
    onRefresh();
  } catch (error: any) {
    message.error(t('bigscreenManagement.dynamic.actionFailed', { action: label, error: error.msg || error.message || t('orgManage.systemConfig.unknownError') }));
  }
}

async function onCopy(row: ComponentInfo) {
  if (!row.id) return;
  try {
    await ComponentApi.copy(row.id);
    message.success(t('iotApp.productPage.copySuccess'));
    onRefresh();
  } catch (error: any) {
    message.error(t('bigscreenManagement.dynamic.failedToDuplicate', { error: String(error.msg || error.message || t('orgManage.systemConfig.unknownError')) }));
  }
}

function getStatusTag(status?: number) {
  return status === 1 ? { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.up'); }, type: 'success' as const } : { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.down'); }, type: 'warning' as const };
}

function getSourceTag(row: ComponentInfo) {
  return row.tenantCode === 'common'
    ? { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('platformManage.ai.scopeCommon'); }, type: 'default' as const }
    : { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.custom'); }, type: 'info' as const };
}

function getDropdownOptions(row: ComponentInfo) {
  return [
    { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.clone.editInfo'); }, key: 'edit' },
    ...(row.id ? [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.editContent'); }, key: 'editContent' }] : []),
    { type: 'divider' as const, key: 'd1' },
    { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.copy'); }, key: 'copy' },
    { label: row.status === 1 ? t('iotApp.deviceDetail.down') : t('iotApp.deviceDetail.up'), key: 'toggle' },
    { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.delete'); }, key: 'delete' },
  ];
}

function onEditContent(row: ComponentInfo) {
  void router.push({
    path: buildBigscreenPath(route.path, '/component-editor/0'),
    query: {
      componentId: String(row.id),
    },
  });
}

function onDropdownSelect(key: string, row: ComponentInfo) {
  const actions: Record<string, (component: ComponentInfo) => void> = {
    copy: onCopy,
    delete: onDelete,
    edit: onEdit,
    editContent: onEditContent,
    toggle: onToggleStatus,
  };
  actions[key]?.(row);
}
</script>

<template>
  <Page title="" auto-content-height>
    <Drawer @success="onRefresh" />
    <div class="comp-page bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" :placeholder="t('bigscreenManagement.ui.searchComponentName')" clearable @keyup.enter="onSearch" />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
          </div>
        </div>
        <div class="page-filter-row page-filter-row--secondary">
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.common.status') }}</span>
            <NSelect v-model:value="filterStatus" clearable :options="statusOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.createdBy') }}</span>
            <NSelect v-model:value="filterCreatedUserID" clearable filterable :loading="creatorOptionsLoading" :options="creatorOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item page-filter-item--daterange">
            <span class="page-filter-label">{{ t('orgManage.clone.createTime') }}</span>
            <NDatePicker v-model:value="filterCreatedTime" clearable type="daterange" />
          </div>
          <div class="page-filter-item page-filter-item--daterange">
            <span class="page-filter-label">{{ t('orgManage.flow.updatedAtLabel') }}</span>
            <NDatePicker v-model:value="filterUpdatedTime" clearable type="daterange" />
          </div>
        </div>
      </div>

      <div class="component-page">
        <div class="toolbar">
          <div class="toolbar-left">
            <NButton type="primary" ghost @click="onCreate">
              <span class="icon-[mdi--plus] size-5"></span>
              {{ t('bigscreenManagement.ui.addComponent') }}
            </NButton>
          </div>
        </div>
        <NSpin :show="loading" class="min-h-0 flex-1">
          <div v-if="list.length > 0" class="card-grid">
            <div v-for="item in list" :key="item.id" class="comp-card" @dblclick="onEditContent(item)">
              <div class="card-cover">
                <img v-if="item.cover" :src="ossUrl(item.cover)" alt="cover" />
                <div v-else class="cover-placeholder">
                  <span class="icon-[mdi--puzzle] size-10 opacity-30"></span>
                </div>
                <div class="cover-actions">
                  <NButton circle quaternary size="small" @click.stop="onEditContent(item)">
                    <span class="icon-[mdi--pencil-outline] size-5"></span>
                  </NButton>
                </div>
              </div>
              <div class="card-footer">
                <div class="card-title" :title="item.name">{{ item.name || '-' }}</div>
                <div class="card-meta">
                  <div class="flex items-center gap-2">
                    <NTag :type="getSourceTag(item).type" size="small" round>
                      {{ getSourceTag(item).label }}
                    </NTag>
                    <NTag :type="getStatusTag(item.status).type" size="small" round>
                      {{ getStatusTag(item.status).label }}
                    </NTag>
                  </div>
                  <NDropdown trigger="click" :options="getDropdownOptions(item)" @select="(key: string) => onDropdownSelect(key, item)">
                    <NButton text size="small">
                      <span class="icon-[mdi--dots-vertical] size-5"></span>
                    </NButton>
                  </NDropdown>
                </div>
              </div>
            </div>
          </div>
          <NEmpty v-else-if="!loading" :description="t('bigscreenManagement.ui.noComponents')" />
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
.comp-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
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
  grid-template-columns: minmax(200px, 1fr) minmax(200px, 1fr) minmax(300px, 1.15fr) minmax(300px, 1.15fr);
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

.page-filter-item :deep(.n-select),
.page-filter-item :deep(.n-date-picker) {
  flex: 1;
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

.component-page {
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
  padding: 0 0 2px;
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

.comp-card {
  overflow: hidden;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-card-border);
  border-radius: var(--bigscreen-radius);
  transition: box-shadow 0.2s;
}

.comp-card:hover {
  box-shadow: var(--bigscreen-card-hover-shadow);
}

.card-cover {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--bigscreen-cover-bg);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgb(15 23 42 / 18%);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--bigscreen-placeholder-text);
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

.comp-card:hover .cover-actions {
  opacity: 1;
}

.card-footer {
  padding: 8px 10px;
  background: var(--bigscreen-footer-bg);
}

.card-title {
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  .page-filter-item--search,
  .page-filter-item--daterange {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .toolbar {
    flex-wrap: wrap;
  }
}
</style>
