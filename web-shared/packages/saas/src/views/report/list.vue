<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/**
 * 报表管理列表页（共享包 @vben/saas）— 布局与大屏项目页保持一致：
 * Page + ProjectManagerSelector（项目筛选）+ 搜索 + 卡片网格 + NTag 状态 + NPagination + NEmpty，
 * 新建/编辑用 useVbenDrawer 抽屉（modules/form.vue）。
 * 页面组件支持 routePrefix prop（其他应用照告警样板接入时定制路由前缀）。
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { ProjectManagerSelector, ProjectSelectModal, useSessionStore } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import {
  NButton,
  NDropdown,
  NEmpty,
  NInput,
  NPagination,
  NSpin,
  NTag,
  useDialog,
  useMessage,
} from 'naive-ui';

import { buildContextParams, ensureProject } from './context';
import { ReportApi, type ReportInfo } from './api';
import FormDrawer from './modules/form.vue';

const props = withDefaults(defineProps<{ routePrefix?: string }>(), {
  routePrefix: '/iot/report',
});

const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const projectStore = useProjectStore();
const sessionStore = useSessionStore();

const reports = ref<ReportInfo[]>([]);
const total = ref(0);
const loading = ref(false);
const searchName = ref('');
const page = ref(1);
const pageSize = ref(12);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const [Form, formApi] = useVbenDrawer({
  connectedComponent: FormDrawer,
  destroyOnClose: false,
});

const pagedReports = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return reports.value.slice(start, start + pageSize.value);
});

const shouldShowEmpty = computed(
  () => !loading.value && !!projectStore.currentProjectID && total.value === 0,
);
const shouldShowNoProject = computed(
  () => !loading.value && !projectStore.currentProjectID,
);

function statusTag(status?: number): { type: 'success' | 'warning'; label: string } {
  return Number(status) === 2
    ? { type: 'warning', label: '停用' }
    : { type: 'success', label: '启用' };
}

// 卡片下拉操作：编辑 / 导出 / 删除（预览、设计在封面 hover 按钮）
function rowDropdownOptions() {
  return [
    { label: '编辑', key: 'edit' },
    { label: '导出', key: 'export' },
    { type: 'divider', key: 'd1' },
    { label: '删除', key: 'delete', props: { style: 'color: #d03050' } },
  ];
}

function onDropdownSelect(key: string, item: ReportInfo) {
  switch (key) {
    case 'edit':
      formApi.setData({ item, routePrefix: props.routePrefix });
      formApi.open();
      break;
    case 'export':
      onExport(item);
      break;
    case 'delete':
      onDelete(item);
      break;
  }
}

async function loadProjectsIfNeeded() {
  // 项目 store 有 localStorage 持久化，换账号/租户后会残留旧数据；此处强制刷新并校验
  await ensureProject(projectStore);
}

// 加载报表列表（按当前项目 + 搜索名）
async function loadReports() {
  loading.value = true;
  try {
    const pid = projectStore.currentProjectID;
    if (!pid) {
      reports.value = [];
      total.value = 0;
      return;
    }
    const resp = await ReportApi.getList({
      projectID: pid,
      name: searchName.value.trim() || undefined,
      page: { page: 1, size: 1000 },
    });
    reports.value = resp.list || [];
    total.value = resp.total || 0;
  } catch (e: any) {
    notifyRequestError(e, () => $t('ui.actionMessage.loadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  loadReports();
}

function onResetFilters() {
  searchName.value = '';
  page.value = 1;
  loadReports();
}

// 搜索输入防抖 300ms 后刷新（回到第一页）
watch(searchName, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    loadReports();
  }, 300);
});

// 切换项目后刷新列表（重置分页与搜索）
watch(
  () => projectStore.currentProjectID,
  () => {
    page.value = 1;
    loadReports();
  },
);

function onCreate() {
  formApi.setData({ item: null, routePrefix: props.routePrefix });
  formApi.open();
}

function onOpenEditor(item: ReportInfo) {
  window.location.hash = `#${props.routePrefix}/editor/${item.id}`;
}

function onPreview(item: ReportInfo) {
  window.location.hash = `#${props.routePrefix}/preview/${item.id}`;
}

// 导出报表（含上下文参数：企业/项目/区域名称）
async function onExport(item: ReportInfo) {
  try {
    const params = await buildContextParams(sessionStore, projectStore);
    const resp = await ReportApi.exportById(String(item.id), params);
    message.success('导出成功，正在打开下载...');
    window.open(resp.url, '_blank');
  } catch (e: any) {
    notifyRequestError(e, () => $t('ui.actionMessage.operationFailed'), (text) => message.error(text));
  }
}

// 删除报表（useDialog 确认，照大屏项目）
function onDelete(item: ReportInfo) {
  dialog.warning({
    title: '删除确认',
    content: `确认删除报表「${item.name}」？删除后不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await ReportApi.delete(String(item.id));
        message.success('已删除');
        loadReports();
      } catch (e: any) {
        notifyRequestError(e, () => $t('orgManage.common.deleteFailed'), (text) => message.error(text));
      }
    },
  });
}

onMounted(async () => {
  await loadProjectsIfNeeded();
  await loadReports();
});
</script>

<template>
  <Page title="" auto-content-height>
    <ProjectSelectModal />
    <Form @success="loadReports" />
    <div class="report-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <ProjectManagerSelector variant="filter" />
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ $t('iotApp.reportPage.search') }}</span>
            <NInput
              v-model:value="searchName"
              :placeholder="$t('iotApp.reportPage.searchReportPh')"
              clearable
              @keyup.enter="onSearch"
            />
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ $t('iotApp.reportPage.search') }}</NButton>
            <NButton @click="onResetFilters">{{ $t('iotApp.common.reset') }}</NButton>
          </div>
        </div>
      </div>

      <div class="report-page">
        <div class="toolbar">
          <div class="toolbar-left">
            <NButton type="primary" ghost @click="onCreate">
              <span class="icon-[mdi--plus] size-5"></span>
              {{ $t('iotApp.reportPage.createReport') }}
            </NButton>
          </div>
        </div>

        <NSpin :show="loading" class="min-h-0 flex-1">
          <div class="content-sections">
            <div v-if="pagedReports.length > 0" class="card-grid">
              <div
                v-for="item in pagedReports"
                :key="item.id"
                class="report-card"
                @dblclick="onOpenEditor(item)"
              >
                <div class="card-cover">
                  <div class="cover-placeholder">
                    <span class="icon-[mdi--file-table] size-10 opacity-30"></span>
                  </div>
                  <div class="cover-actions">
                    <NButton
                      circle
                      quaternary
                      size="small"
                      title="预览"
                      @click.stop="onPreview(item)"
                    >
                      <span class="icon-[mdi--eye-outline] size-5"></span>
                    </NButton>
                    <NButton
                      circle
                      quaternary
                      size="small"
                      title="设计"
                      @click.stop="onOpenEditor(item)"
                    >
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
                      <NTag :type="statusTag(item.status).type" size="small" round>
                        {{ statusTag(item.status).label }}
                      </NTag>
                      <span class="card-updated">
                        {{ item.updatedTime ? new Date(Number(item.updatedTime)).toLocaleDateString() : '-' }}
                      </span>
                    </div>
                    <NDropdown
                      trigger="click"
                      :options="rowDropdownOptions()"
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

            <NEmpty v-if="shouldShowEmpty" description="当前项目下暂无报表" />

            <NEmpty v-else-if="shouldShowNoProject" :description="$t('iotApp.reportPage.noProjectSelected')">
              <template #extra>
                <NButton @click="projectStore.openProjectSelectModal(route.fullPath)">
                  选择项目
                </NButton>
              </template>
            </NEmpty>
          </div>
        </NSpin>

        <div v-if="total > 0" class="pagination">
          <NPagination
            :page="page"
            :page-size="pageSize"
            :item-count="total"
            :page-sizes="[12, 24, 48]"
            show-size-picker
            @update:page="(p: number) => { page = p; }"
            @update:page-size="(s: number) => { pageSize = s; page = 1; }"
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 布局样式对齐大屏项目管理页（Vben 主题变量，见 packages/bigscreen 的 manage-theme.css 同款） */
.report-manage-page {
  --report-radius: var(--radius, 0.5rem);
  --report-content-padding-x: 1rem;
  --report-content-padding-y: 1rem;
  --report-section-gap: 1rem;
  --report-panel-bg: hsl(var(--card));
  --report-panel-border: hsl(var(--border) / 70%);
  --report-card-border: hsl(var(--border));
  --report-cover-bg: hsl(var(--muted));
  --report-card-hover-shadow: 0 4px 12px hsl(var(--foreground) / 8%);
  --report-muted-text: hsl(var(--muted-foreground));
}

.report-manage-page {
  display: flex;
  flex-direction: column;
  gap: var(--report-section-gap);
  height: 100%;
  min-height: 0;
}

.page-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--report-content-padding-y) var(--report-content-padding-x);
  background: var(--report-panel-bg);
  border: 1px solid var(--report-panel-border);
  border-radius: var(--report-radius);
  flex: 0 0 auto;
}
.page-filter-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px 24px;
  align-items: center;
}
.page-filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.page-filter-item :deep(.n-input) {
  width: 100%;
}
.page-filter-item--search {
  flex: 1;
  max-width: 360px;
}
.page-filter-label {
  color: var(--report-muted-text);
  font-size: 13px;
  flex-shrink: 0;
}
.page-filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.report-page {
  display: flex;
  flex-direction: column;
  gap: var(--report-section-gap);
  flex: 1;
  min-height: 0;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 2px;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.content-sections {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  align-content: start;
}
.report-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--report-card-border);
  border-radius: var(--report-radius);
  overflow: hidden;
  background: var(--report-panel-bg);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}
.report-card:hover {
  box-shadow: var(--report-card-hover-shadow);
}
.card-cover {
  position: relative;
  aspect-ratio: 16 / 7;
  background: var(--report-cover-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-placeholder {
  color: var(--report-muted-text);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.report-card:hover .cover-actions {
  opacity: 1;
}
.card-footer {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-title {
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.card-updated {
  color: var(--report-muted-text);
  font-size: 12px;
}
.pagination {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
</style>
