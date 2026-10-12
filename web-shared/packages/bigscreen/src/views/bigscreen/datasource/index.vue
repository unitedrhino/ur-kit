<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { useLocalizedGrid as useVbenVxeGrid } from '../shared/manage-i18n';

import { $t as t } from '@vben/saas/locales';

import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import type { DataSourceInfo } from './index.api';

import { onMounted, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { } from '@vben/saas';

import { NButton, NInput, NSelect, useMessage } from 'naive-ui';

import '../shared/manage-theme.css';

import { datasourceStatusOptions, datasourceTypeOptions, useColumns } from './data';
import { DataSourceApi } from './index.api';
import FormDrawer from './modules/form.vue';

const message = useMessage();
const searchName = ref('');
const filterType = ref<null | string>(null);
const filterStatus = ref<null | number>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: FormDrawer,
  destroyOnClose: true,
});

function onActionClick({ code, row }: OnActionClickParams<DataSourceInfo>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'test': {
      onTest(row);
      break;
    }
    default: {
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
          if (trimmedName) params.name = trimmedName;
          if (filterType.value) params.type = filterType.value;
          if (filterStatus.value !== null && filterStatus.value !== undefined) params.status = filterStatus.value;
          const res = await DataSourceApi.list(page.currentPage, page.pageSize, params);
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
    rowConfig: {
      keyField: 'id',
    },
    id: 'bigscreen-datasource-grid',
    customConfig: {
      storage: true,
      mode: 'default',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
}));

onMounted(() => {
  gridApi.query();
});

function onSearch() {
  gridApi.query({ page: 1 });
}

function onResetFilters() {
  searchName.value = '';
  filterType.value = null;
  filterStatus.value = null;
  gridApi.query({ page: 1 });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  drawerApi.setData({}).open();
}

function onEdit(row: DataSourceInfo) {
  drawerApi.setData(row).open();
}

async function onDelete(row: DataSourceInfo) {
  if (!row.id) return;
  try {
    await DataSourceApi.delete(row.id);
    message.success(t('orgManage.common.deleteSuccess'));
    onRefresh();
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  }
}

async function onTest(row: DataSourceInfo) {
  if (!row.id) return;
  try {
    const res = await DataSourceApi.test(row.id);
    if (res.success) {
      message.success(res.duration ? t('bigscreenManagement.dynamic.connectionDuration', { duration: res.duration }) : t('orgPark.ui.connected'));
    } else {
      message.warning(res.message || t('bigscreenManagement.ui.connectionFailed'));
    }
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.testFailed', { error: String(((error as any).msg || (error as any).message || t('orgManage.systemConfig.unknownError')) as string) }));
  }
}
</script>

<template>
  <Page title="" auto-content-height>
    <Drawer @success="onRefresh" />
    <div class="datasource-shell bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" :placeholder="t('bigscreenManagement.ui.searchDataSourceName')" clearable @keyup.enter="onSearch" />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
          </div>
        </div>
        <div class="page-filter-row page-filter-row--secondary page-filter-row--secondary-compact">
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.role.type') }}</span>
            <NSelect v-model:value="filterType" clearable :options="datasourceTypeOptions.map(({ label, value }) => ({ label, value }))" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.common.status') }}</span>
            <NSelect
              v-model:value="filterStatus"
              clearable
              :options="datasourceStatusOptions.map(({ label, value }) => ({ label, value }))"
              :placeholder="t('orgManage.common.phSelect')"
            />
          </div>
        </div>
      </div>

      <div class="datasource-page">
        <Grid>
          <template #toolbar-tools>
            <NButton type="primary" ghost @click="onCreate">
              <span class="icon-[mdi--plus] size-5"></span>
              {{ t('bigscreenManagement.ui.createDataSource') }}
            </NButton>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.datasource-shell {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 14px;
  gap: 16px 24px;
  align-items: center;
}

.page-filter-row--secondary-compact {
  max-width: 720px;
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

.datasource-page {
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

/* 去掉 VxeGrid 默认内边距，与上方筛选区左对齐 */
.datasource-page :deep(> .bg-card) {
  background: transparent;
  border-radius: 0;
}

.datasource-page :deep(.vxe-grid) {
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
  .page-filter-item--search {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }
}
</style>
