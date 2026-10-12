<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { useLocalizedGrid as useVbenVxeGrid } from '../shared/manage-i18n';

import { $t as t } from '@vben/saas/locales';

import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import type { DatasetInfo } from './index.api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { } from '@vben/saas';

import { NButton, NInput, NSelect, useMessage } from 'naive-ui';

import { DataSourceApi } from '../datasource/index.api';
import GroupPanel from '../shared/group-panel.vue';
import '../shared/manage-theme.css';
import { buildBigscreenPath } from '../shared/route-path';
import { useColumns } from './data';
import { DatasetApi, datasetTypeOptions } from './index.api';

const router = useRouter();
const route = useRoute();
const message = useMessage();
const currentGroupId = ref<null | string>(null);
const searchName = ref('');
const filterType = ref<null | string>(null);
const filterTags = ref('');
const filterSourceId = ref<null | string>(null);
const datasourceOptions = ref<Array<{ label: string; value: string }>>([]);

function onActionClick({ code, row }: OnActionClickParams<DatasetInfo>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'preview': {
      onPreview(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid(() => ({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const params: Record<string, any> = {};
          const trimmedName = searchName.value.trim();
          const trimmedTags = filterTags.value.trim();
          if (trimmedName) params.name = trimmedName;
          if (filterType.value) params.type = filterType.value;
          if (trimmedTags) params.tags = trimmedTags;
          if (filterSourceId.value) params.sourceId = filterSourceId.value;
          if (currentGroupId.value) {
            params.groupId = currentGroupId.value;
          }
          const res = await DatasetApi.list(page.currentPage, page.pageSize, params);
          return {
            items: res.list ?? [],
            total: res.total ?? 0,
          };
        },
      },
      response: {
        list: 'items',
        total: 'total',
      },
    },
    rowConfig: { keyField: 'id' },
    id: 'bigscreen-dataset-grid',
    customConfig: { storage: true, mode: 'default' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
}));

async function loadDataSourceOptions() {
  try {
    const res = await DataSourceApi.list(1, 999, {});
    datasourceOptions.value = (res.list ?? []).map((item) => ({
      label: item.name || '',
      value: item.id || '',
    }));
  } catch {
    datasourceOptions.value = [];
  }
}

onMounted(() => {
  void loadDataSourceOptions();
  gridApi.query();
});

function onSearch() {
  gridApi.query({ page: 1 });
}

function onResetFilters() {
  searchName.value = '';
  filterType.value = null;
  filterTags.value = '';
  filterSourceId.value = null;
  currentGroupId.value = null;
  gridApi.query({ page: 1 });
}

function onGroupSelect(groupId: null | string) {
  currentGroupId.value = groupId;
  gridApi.query({ page: 1 });
}

function onCreate() {
  router.push(buildBigscreenPath(route.path, '/dataset/edit'));
}

function onEdit(row: DatasetInfo) {
  router.push(buildBigscreenPath(route.path, `/dataset/edit/${row.id}`));
}

async function onDelete(row: DatasetInfo) {
  if (!row.id) return;
  try {
    await DatasetApi.delete(row.id);
    message.success(t('orgManage.common.deleteSuccess'));
    gridApi.query();
  } catch (error: any) {
    message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(error.msg || error.message || t('orgManage.systemConfig.unknownError')) }));
  }
}

async function onPreview(row: DatasetInfo) {
  if (!row.id) return;
  try {
    const res = await DatasetApi.preview(row.id);
    let rowCount = 0;
    if (res.rows) {
      try {
        const parsed = JSON.parse(res.rows);
        rowCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        // ignore
      }
    }
    message.info(t('bigscreenManagement.dynamic.previewRows', { count: rowCount }));
  } catch (error: any) {
    message.error(t('bigscreenManagement.dynamic.previewFailed', { error: String(error.msg || error.message || t('orgManage.systemConfig.unknownError')) }));
  }
}
</script>

<template>
  <Page title="" auto-content-height>
    <div class="dataset-shell bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" :placeholder="t('bigscreenManagement.ui.searchDatasetName')" clearable @keyup.enter="onSearch" />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
          </div>
        </div>
        <div class="page-filter-row page-filter-row--secondary">
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.role.type') }}</span>
            <NSelect v-model:value="filterType" clearable :options="datasetTypeOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.dataSource') }}</span>
            <NSelect v-model:value="filterSourceId" clearable :options="datasourceOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('iotApp.productPage.tags') }}</span>
            <NInput v-model:value="filterTags" :placeholder="t('bigscreenManagement.ui.searchTags')" clearable @keyup.enter="onSearch" />
          </div>
        </div>
      </div>

      <div class="dataset-page">
        <div class="dataset-content">
          <GroupPanel type="dataset" @select="onGroupSelect" />
          <div class="dataset-main">
            <Grid>
              <template #toolbar-tools>
                <NButton type="primary" ghost @click="onCreate">
                  <span class="icon-[mdi--plus] size-5"></span>
                  {{ t('bigscreenManagement.ui.createDataset') }}
                </NButton>
              </template>
            </Grid>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.dataset-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.page-filter-item :deep(.n-base-selection),
.page-filter-item :deep(.n-input) {
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

.dataset-page {
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

.dataset-content {
  display: flex;
  min-height: 0;
  flex: 1;
  gap: 12px;
}

.dataset-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 16px;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-section-border);
  border-radius: var(--bigscreen-radius);
}

/* 去掉 VxeGrid 默认内边距，与上方筛选区左对齐 */
.dataset-main :deep(> .bg-card) {
  background: transparent;
  border-radius: 0;
}

.dataset-main :deep(.vxe-grid) {
  padding: 0;
}

@media (max-width: 1400px) {
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
  .dataset-content {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .dataset-content {
    flex-direction: column;
  }

  .dataset-main {
    margin-top: 12px;
  }
}
</style>
