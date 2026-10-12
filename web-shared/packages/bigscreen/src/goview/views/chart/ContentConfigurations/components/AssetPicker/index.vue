<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

/**
 * 资源选择弹窗组件
 *
 * 供图片组件配置面板调用，在弹窗中展示资源库图片列表，
 * 支持搜索名称、按格式筛选、分页浏览，点击选中后确认返回选中资源。
 */
import { computed, onMounted, ref, watch } from 'vue';

import { getRequestClient } from '@vben/api';

import {
  NButton,
  NEmpty,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpin,
  NTag,
} from 'naive-ui';

// ── 类型定义 ──────────────────────────────────────────────

/** 资源信息（与 asset/index.api.ts 保持一致） */
interface AssetInfo {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
  groupId?: string;
}

/** 资源列表 API 响应 */
interface AssetListResponse {
  list: AssetInfo[];
  total: number;
}

// ── 图片格式选项（仅保留图片格式） ────────────────────────

const imageFormatOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.common.all'); }, value: '' },
  { label: 'jpg', value: 'jpg' },
  { label: 'jpeg', value: 'jpeg' },
  { label: 'png', value: 'png' },
  { label: 'gif', value: 'gif' },
  { label: 'bmp', value: 'bmp' },
  { label: 'svg', value: 'svg' },
  { label: 'webp', value: 'webp' },
  { label: 'ico', value: 'ico' },
  // CAD 图纸（作为图片类资源展示，由图片组件 CAD 分支渲染）
  { label: 'dwg', value: 'dwg' },
  { label: 'dxf', value: 'dxf' },
];

// ── Props & Emits ─────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /** 控制弹窗显隐 */
    show: boolean;
    /** 预选分组 ID（可选，不传则查询全部） */
    groupId?: string;
  }>(),
  { groupId: undefined },
);

const emit = defineEmits<{
  /** 双向绑定弹窗显隐 */
  'update:show': [value: boolean];
  /** 选中某个资源时触发 */
  select: [asset: AssetInfo];
}>();

// ── 内部状态 ──────────────────────────────────────────────

const loading = ref(false);
const list = ref<AssetInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 16;

/** 搜索名称 */
const searchName = ref('');
/** 格式筛选（空字符串 = 全部） */
const filterFormat = ref('');
/** 当前选中的资源 */
const selectedAsset = ref<AssetInfo | null>(null);

/** 计算总页数 */
const pageCount = computed(() => Math.ceil(total.value / pageSize));

/** v-model:show 双向绑定 */
const showModal = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
});

// ── 数据加载 ──────────────────────────────────────────────

/** 加载资源列表 */
async function loadData() {
  loading.value = true;
  try {
    const requestClient = getRequestClient();
    const res = await requestClient.post<AssetListResponse>(
      '/api/v1/view/asset/get-list',
      {
        page: { page: page.value, size: pageSize },
        name: searchName.value || undefined,
        format: filterFormat.value || undefined,
        groupId: props.groupId || undefined,
      },
    );
    list.value = res.list ?? [];
    total.value = res.total ?? 0;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 搜索：重置到第一页 */
function onSearch() {
  page.value = 1;
  loadData();
}

/** 翻页 */
function onPageChange(p: number) {
  page.value = p;
  loadData();
}

// 组件挂载时预加载数据
onMounted(() => {
  loadData();
});

// 弹窗打开时重置选中状态和分页，重新加载最新数据
watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedAsset.value = null;
      page.value = 1;
      searchName.value = '';
      filterFormat.value = '';
      loadData();
    }
  },
);

// ── 交互处理 ──────────────────────────────────────────────

/** 点击卡片：选中/取消选中（同一张卡片再次点击取消） */
function onCardClick(asset: AssetInfo) {
  if (selectedAsset.value?.id === asset.id) {
    selectedAsset.value = null;
  } else {
    selectedAsset.value = asset;
  }
}

/** 确认选择：触发 select 事件并关闭弹窗 */
function onConfirm() {
  if (selectedAsset.value) {
    emit('select', selectedAsset.value);
    showModal.value = false;
  }
}

/** 取消：关闭弹窗 */
function onCancel() {
  showModal.value = false;
}

/** 获取文件扩展名（用于格式标签） */
function getFileExt(name?: string): string {
  if (!name) return '--';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext || '--';
}
</script>

<template>
  <NModal
    v-model:show="showModal"
    preset="card"
    :title="editorT('bigscreenEditor.ui.selectImageAsset')"
    style="width: 640px; max-height: 70vh"
  >
    <!-- 搜索栏 -->
    <div class="picker-search">
      <NInput
        v-model:value="searchName"
        clearable
        :placeholder="editorT('bigscreenManagement.ui.searchAssetName')"
        @keyup.enter="onSearch"
      />
      <NSelect
        v-model:value="filterFormat"
        :options="imageFormatOptions"
        :placeholder="editorT('bigscreenEditor.ui.formatCheck')"
        clearable
        style="width: 140px; flex-shrink: 0"
      />
      <NButton type="primary" @click="onSearch">{{ editorT('orgManage.common.search') }}</NButton>
    </div>

    <!-- 资源卡片网格 -->
    <div class="picker-body">
      <NSpin :show="loading">
        <div v-if="list.length > 0" class="picker-grid">
          <div
            v-for="item in list"
            :key="item.id"
            class="picker-card"
            :class="{ 'picker-card--selected': selectedAsset?.id === item.id }"
            @click="onCardClick(item)"
          >
            <!-- 缩略图 -->
            <div class="picker-card__thumb">
              <img
                v-if="item.url"
                :src="item.url"
                class="picker-card__img"
                loading="lazy"
              />
              <span v-else class="picker-card__placeholder">{{ editorT('bigscreenEditor.ui.noPreview') }}</span>
            </div>
            <!-- 名称 + 格式标签 -->
            <div class="picker-card__info">
              <span class="picker-card__name" :title="item.name">{{ item.name }}</span>
              <NTag size="tiny" :bordered="false">
                {{ getFileExt(item.name) }}
              </NTag>
            </div>
          </div>
        </div>
        <NEmpty v-else-if="!loading" :description="editorT('bigscreenManagement.ui.noAssets')" />
      </NSpin>
    </div>

    <!-- 分页 -->
    <div class="picker-pagination">
      <span class="picker-pagination__total">{{ editorT('knowledgeBase.text_3b6ef811b85a') }} {{ total }} {{ editorT('aiChat.ui.bar') }}</span>
      <NPagination
        v-model:page="page"
        :page-count="pageCount"
        size="small"
        @update:page="onPageChange"
      />
    </div>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="picker-footer">
        <NButton @click="onCancel">{{ editorT('orgManage.common.cancel') }}</NButton>
        <NButton type="primary" :disabled="!selectedAsset" @click="onConfirm">
          {{ editorT('bigscreenEditor.ui.confirmSelection') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
/* ── 搜索栏 ──────────────────────────────────────────────── */
.picker-search {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.picker-search :deep(.n-input) {
  flex: 1;
}

/* ── 内容区域 ────────────────────────────────────────────── */
.picker-body {
  min-height: 200px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* ── 卡片 ────────────────────────────────────────────────── */
.picker-card {
  display: flex;
  flex-direction: column;
  border: 2px solid var(--n-border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background: var(--n-card-color, #fafafa);
}

.picker-card:hover {
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
}

/* 选中态：蓝色边框 */
.picker-card--selected {
  border-color: #2080f0;
  box-shadow: 0 0 0 1px #2080f0;
}

.picker-card__thumb {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f3f4f6;
}

.picker-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-card__placeholder {
  font-size: 12px;
  color: #9ca3af;
}

.picker-card__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  gap: 6px;
}

.picker-card__name {
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* ── 分页栏 ──────────────────────────────────────────────── */
.picker-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color, #e5e7eb);
}

.picker-pagination__total {
  font-size: 12px;
  color: var(--n-text-color-3, #9ca3af);
}

/* ── 底部操作栏 ──────────────────────────────────────────── */
.picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
