<!-- 文件说明：共享大屏管理界面及交互，文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as t } from '@vben/saas/locales';

import type { AssetInfo } from './index.api';

import { computed, onBeforeUnmount, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { uploadFile } from '@vben/saas';

import { NButton, NEmpty, NIcon, NInput, NModal, NPagination, NSelect, NSpace, NSpin, useDialog, useMessage } from 'naive-ui';

import { getErrorMessage } from '../../../shared/error';
import GroupPanel from '../shared/group-panel.vue';
import '../shared/manage-theme.css';
import { GroupApi, type GroupInfo } from '../shared/group.api';
import { formatOptions } from './data';
import { AssetApi } from './index.api';
import AssetCard from './modules/asset-card.vue';

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const list = ref<AssetInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const searchName = ref('');
const filterType = ref<null | string>(null);
const searchFormat = ref<null | string>(null);
const selectedGroupId = ref<null | string>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 编辑弹窗
const editModalVisible = ref(false);
const editAsset = ref<AssetInfo | null>(null);
const editName = ref('');
const editGroupId = ref<null | string>(null);
const editSaving = ref(false);
const editGroups = ref<GroupInfo[]>([]);

/** 所有分组列表（用于卡片上显示分组名） */
const allGroups = ref<GroupInfo[]>([]);

/** 加载全量分组列表 */
async function loadAllGroups() {
  try {
    const res = await GroupApi.list('asset');
    allGroups.value = res.list ?? [];
  } catch { allGroups.value = []; }
}

/** 根据 groupId 查找分组名，无分组或"0"统一显示"未分组" */
function getGroupName(groupId?: string): string {
  if (!groupId || groupId === '0') return t('orgManage.flow.grouped');
  const g = allGroups.value.find((g) => String(g.id) === String(groupId));
  return g?.name || t('orgManage.flow.grouped');
}

const assetTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('console.im.image'); }, value: 'image' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('console.im.callTypeVideo'); }, value: 'video' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('platformManage.aiModel.modalityAudio'); }, value: 'audio' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.opLog.actionOther'); }, value: 'other' },
];

const pageCount = computed(() => Math.ceil(total.value / pageSize.value));

async function loadData() {
  loading.value = true;
  try {
    const params = {
      name: searchName.value || undefined,
      type: filterType.value || undefined,
      format: searchFormat.value || undefined,
      // 后端 groupId 为 ,string 编码的 int64，必须传字符串
      groupId: selectedGroupId.value && selectedGroupId.value !== '0' ? selectedGroupId.value : undefined,
    };
    // ★ 先加载分组，再赋值列表——否则卡片渲染时 getGroupName 查不到分组名
    const [res] = await Promise.all([
      AssetApi.list(page.value, pageSize.value, params),
      loadAllGroups(),
    ]);
    list.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 编辑弹窗分组选项：naive-ui 选项值类型不含 null，但运行时支持 null 表示"未分组"（与 clearable 清空值一致），窄断言以保持行为不变
const editGroupOptions = computed(() => [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.grouped'); }, value: null as unknown as string },
  ...editGroups.value.map((g) => ({ label: g.name, value: g.id })),
]);

function onSearch() {
  page.value = 1;
  loadData();
}

function onResetFilters() {
  searchName.value = '';
  filterType.value = null;
  searchFormat.value = null;
  selectedGroupId.value = null;
  page.value = 1;
  loadData();
}

function onGroupSelect(groupId: null | string) {
  selectedGroupId.value = groupId;
  page.value = 1;
  loadData();
}

function onPageChange(p: number) {
  page.value = p;
  loadData();
}

function onPageSizeChange(size: number) {
  pageSize.value = size;
  page.value = 1;
  loadData();
}

function onPreview(asset: AssetInfo) {
  if (asset.url) window.open(asset.url, '_blank');
}

function onDownload(asset: AssetInfo) {
  if (!asset.url) return;
  const a = document.createElement('a');
  a.href = asset.url;
  a.download = asset.name || 'download';
  a.click();
}

function onDelete(asset: AssetInfo) {
  if (!asset.id) return;
  dialog.warning({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.deleteAsset'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get content() { return t('bigscreenManagement.ui.ifDashboardUsesThisAssetDeletingItWill'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get positiveText() { return t('orgManage.memory.deleteConfirmTitle'); },
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get negativeText() { return t('orgManage.common.cancel'); },
    onPositiveClick: async () => {
      try {
        await AssetApi.delete(String(asset.id));
        message.success(t('orgManage.common.deleteSuccess'));
        loadData();
      } catch (error) {
        message.error(t('bigscreenManagement.dynamic.failedToDelete', { error: String(getErrorMessage(error)) }));
      }
    },
  });
}

async function copyText(text: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is unavailable');
  }
  await navigator.clipboard.writeText(text);
}

async function onCopyLink(asset: AssetInfo) {
  if (!asset.url) return;
  try {
    await copyText(asset.url);
    message.success(t('bigscreenManagement.ui.linkCopied'));
  } catch {
    message.info(t('bigscreenManagement.ui.automaticCopyingUnavailableCopyLinkManually'));
  }
}

// 打开编辑弹窗
async function onEditAsset(asset: AssetInfo) {
  editAsset.value = asset;
  editName.value = asset.name || '';
  // groupId 为 "0" 时也视为未分组，归一化为 null
  editGroupId.value = asset.groupId && asset.groupId !== '0' ? String(asset.groupId) : null;
  editModalVisible.value = true;
  // 从已有的全量分组列表中获取，避免重复请求
  // 若 allGroups 为空，兜底给空数组（编辑弹窗 NSelect 已有"未分组"选项，不受影响）
  editGroups.value = allGroups.value ?? [];
  if (!editGroups.value || editGroups.value.length === 0) {
    editGroups.value = [];
  }
}

// 保存编辑
async function onSaveEdit() {
  if (!editAsset.value?.id) return;
  editSaving.value = true;
  try {
    await AssetApi.update({
      id: editAsset.value.id,
      name: editName.value.trim(),
      groupId: editGroupId.value || '0',
    } as any);
    message.success(t('orgManage.orgSettings.saveSuccess'));
    editModalVisible.value = false;
    loadData(); // 刷新列表
  } catch (error) {
    message.error(t('bigscreenManagement.dynamic.failedToSave', { error: String(getErrorMessage(error)) }));
  } finally {
    editSaving.value = false;
  }
}

/** 批量上传：遍历所有选中文件，自动去后缀并将后缀存入 tags */
async function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  let successCount = 0;
  let failCount = 0;

  for (const file of Array.from(files)) {
    try {
      const uploadRes = await uploadFile(file);
      const fileUri = (uploadRes as any)?.data?.fileUri || (uploadRes as any)?.fileUri;
      if (!fileUri) throw new Error(t('bigscreenManagement.ui.uploadFailedNoFilePathReturned'));

      // 去掉文件后缀，后缀单独存到 tags
      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx > 0 ? file.name.substring(0, dotIdx) : file.name;
      const ext = dotIdx > 0 ? file.name.substring(dotIdx + 1).toLowerCase() : '';

      // 根据 MIME 类型判断资源类型；CAD 图纸（.dwg/.dxf 等）视为图片类资源，
      // 使其进入侧边栏图片库、可被拖入画布并由图片组件 CAD 分支渲染
      let type = 'other';
      if (file.type.startsWith('image')) {
        type = 'image';
      } else if (file.type.startsWith('video')) {
        type = 'video';
      } else if (file.type.startsWith('audio')) {
        type = 'audio';
      } else if (/(\.dwg|\.dxf|\.dwf|\.dwfx|\.xps)$/i.test(file.name)) {
        type = 'image';
      }

      const upGroupId = selectedGroupId.value && selectedGroupId.value !== '0' ? selectedGroupId.value : undefined;

      await AssetApi.upload({
        name: baseName,
        type,
        url: fileUri,
        size: file.size,
        tags: ext || undefined,
        groupId: upGroupId,
      });
      successCount++;
    } catch {
      failCount++;
    }
  }

  if (successCount > 0 && failCount === 0) {
    message.success(t('bigscreenManagement.dynamic.uploadedAssets', { count: successCount }));
  } else if (successCount > 0) {
    message.warning(t('bigscreenManagement.dynamic.uploadSummary', { success: successCount, failed: failCount }));
  } else {
    message.error(t('aiChat.ui.uploadFailed'));
  }
  loadData();

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function ensureFileInput() {
  if (fileInputRef.value) return fileInputRef.value;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,.svg,.xls,.xlsx,.csv,.dwg,.dxf,.dwf,.dwfx,.xps';
  input.multiple = true;
  input.style.display = 'none';
  input.addEventListener('change', handleFileChange);
  document.body.append(input);
  fileInputRef.value = input;
  return input;
}

function onUpload() {
  ensureFileInput().click();
}

onBeforeUnmount(() => {
  if (!fileInputRef.value) return;

  fileInputRef.value.removeEventListener('change', handleFileChange);
  if (document.body.contains(fileInputRef.value)) {
    fileInputRef.value.remove();
  }
  fileInputRef.value = null;
});

loadData();
</script>

<template>
  <Page title="" auto-content-height>
    <div class="asset-shell bigscreen-manage-page">
      <div class="page-filter-panel">
        <div class="page-filter-row page-filter-row--primary">
          <div class="page-filter-item page-filter-item--search">
            <span class="page-filter-label">{{ t('orgManage.common.search') }}</span>
            <NInput v-model:value="searchName" clearable :placeholder="t('bigscreenManagement.ui.searchAssetName')" @keyup.enter="onSearch">
              <template #prefix>
                <NIcon size="16">
                  <span class="icon-[mdi--magnify]"></span>
                </NIcon>
              </template>
            </NInput>
          </div>
          <div class="page-filter-actions">
            <NButton type="primary" @click="onSearch">{{ t('orgManage.common.search') }}</NButton>
            <NButton @click="onResetFilters">{{ t('orgManage.orgSettings.reset') }}</NButton>
          </div>
        </div>
        <div class="page-filter-row page-filter-row--secondary">
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('orgManage.role.type') }}</span>
            <NSelect v-model:value="filterType" clearable :options="assetTypeOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
          <div class="page-filter-item">
            <span class="page-filter-label">{{ t('bigscreenManagement.ui.format') }}</span>
            <NSelect v-model:value="searchFormat" clearable :options="formatOptions" :placeholder="t('orgManage.common.phSelect')" />
          </div>
        </div>
      </div>

      <div class="asset-page">
        <div class="asset-content">
          <GroupPanel type="asset" @select="onGroupSelect" />

          <div class="asset-main">
            <div class="asset-main-toolbar">
              <div class="asset-main-toolbar-spacer"></div>
              <div class="toolbar-right">
                <NButton type="primary" @click="onUpload">
                  <template #icon>
                    <NIcon><span class="icon-[mdi--upload]"></span></NIcon>
                  </template>
                  {{ t('bigscreenManagement.ui.uploadAsset') }}
                </NButton>
              </div>
            </div>

            <div class="asset-main-body">
              <div class="flex-1 overflow-auto">
                <NSpin :show="loading">
                  <div v-if="list.length > 0" class="asset-grid">
                    <AssetCard
                      v-for="item in list"
                      :key="item.id"
                      :asset="item"
                      :group-name="getGroupName(item.groupId)"
                      @preview="onPreview"
                      @download="onDownload"
                      @edit="onEditAsset"
                      @delete="onDelete"
                      @copy-link="onCopyLink"
                    />
                  </div>
                  <NEmpty v-else-if="!loading" :description="t('bigscreenManagement.ui.noAssets')" />
                </NSpin>
              </div>

              <div class="mt-3 flex items-center justify-between border-t pt-3">
                <span class="text-xs text-gray-400">{{ t('knowledgeBase.text_3b6ef811b85a') }} {{ total }} {{ t('aiChat.ui.bar') }}</span>
                <NPagination
                  v-model:page="page"
                  :page-count="pageCount"
                  :page-size="pageSize"
                  :page-sizes="[20, 40, 80]"
                  show-size-picker
                  size="small"
                  @update:page="onPageChange"
                  @update:page-size="onPageSizeChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <NModal v-model:show="editModalVisible" preset="card" :title="t('bigscreenManagement.ui.editAsset')" style="width: 420px">
      <NSpace vertical :size="16">
        <div>
          <div class="text-sm mb-1.5">{{ t('orgManage.agent.name') }}</div>
          <NInput v-model:value="editName" :placeholder="t('bigscreenManagement.ui.assetName')" />
        </div>
        <div>
          <div class="text-sm mb-1.5">{{ t('iotApp.project.tabGroups') }}</div>
          <NSelect
            v-model:value="editGroupId"
            :options="editGroupOptions"
            :placeholder="t('bigscreenManagement.ui.selectGroup')"
            clearable
          />
        </div>
      </NSpace>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton @click="editModalVisible = false">{{ t('orgManage.common.cancel') }}</NButton>
          <NButton type="primary" :loading="editSaving" @click="onSaveEdit">{{ t('orgManage.common.save') }}</NButton>
        </div>
      </template>
    </NModal>
  </Page>
</template>

<style scoped>
.asset-shell {
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

.asset-page {
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

.asset-main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 2px;
}

.asset-main-toolbar-spacer {
  flex: 1 1 auto;
}

.asset-main-body {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.asset-content {
  display: flex;
  min-height: 0;
  flex: 1;
  gap: 12px;
}

.asset-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 12px 16px;
  background: var(--bigscreen-panel-bg);
  border: 1px solid var(--bigscreen-section-border);
  border-radius: var(--bigscreen-radius);
}

.asset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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
  .asset-content {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .asset-content {
    flex-direction: column;
  }

  .asset-main {
    margin-top: 12px;
  }
}
</style>
