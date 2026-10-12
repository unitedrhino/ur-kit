<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { DragKeyEnum } from '@/enums/editPageEnum';
import { icon } from '@/plugins';
// ColorWandOutline/LayersOutline 未收录在 icon.ionicons5 聚合导出中，改为从图标包直接导入
import { ColorWandOutline as TemplateIcon, LayersOutline as LayersOutlineIcon } from '@vicons/ionicons5';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { getEditorFetchHeaders } from '@/utils';

import { resolveAssetUrl } from '../../../../../../views/bigscreen/shared/asset-url';
import {
  BIGSCREEN_COVER_UPDATED_EVENT,
  isProjectCoverUpdatedStorageKey,
  parseProjectCoverUpdatedDetail,
} from '../../../../../../views/bigscreen/shared/coverEvents';
import { applyScreenTemplate } from '../../../hooks/useScreenTemplateApply.hook';

type ScreenTemplateItem = {
  id?: string;
  indexImage?: string;
  isSystem?: boolean;
  name?: string;
  source?: string;
  status?: number;
  type?: string;
  updatedTime?: number;
};

const MAX_TEMPLATE_FETCH_SIZE = 1000;

const { EyeOutlineIcon } = icon.ionicons5;
const chartEditStore = useChartEditStore();

const loading = ref(false);
const searchName = ref('');
const list = ref<ScreenTemplateItem[]>([]);
const coverErrorMap = ref<Record<string, boolean>>({});

function getCoverSrc(item: ScreenTemplateItem) {
  if (!item.indexImage) return '';
  const base = resolveAssetUrl(item.indexImage);
  const version = item.updatedTime ? String(item.updatedTime) : '';
  if (!version || base.includes('X-Amz-Signature')) return base;
  return `${base}${base.includes('?') ? '&' : '?'}t=${version}`;
}

function getCoverErrorKey(item?: ScreenTemplateItem) {
  return item ? getCoverSrc(item) : '';
}

function hasCoverError(item?: ScreenTemplateItem) {
  const key = getCoverErrorKey(item);
  return !!(key && coverErrorMap.value[key]);
}

function markCoverError(item?: ScreenTemplateItem) {
  const key = getCoverErrorKey(item);
  if (!key) return;
  coverErrorMap.value = {
    ...coverErrorMap.value,
    [key]: true,
  };
}

function getSourceTag(source?: string) {
  return source === 'system' ? { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.system'); }, type: 'default' as const } : { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.custom'); }, type: 'info' as const };
}

const filteredList = computed(() => {
  const keyword = searchName.value.trim().toLowerCase();
  if (!keyword) return list.value;
  return list.value.filter((item) =>
    String(item.name || '')
      .toLowerCase()
      .includes(keyword),
  );
});

async function loadList() {
  loading.value = true;
  try {
    const res = await fetch('/api/v1/view/project/get-list', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        page: { page: 1, size: MAX_TEMPLATE_FETCH_SIZE },
        status: 1,
        type: 'template',
      }),
    });
    const json = await res.json();
    if (json.code === 200) {
      list.value = (json.data?.list || [])
        .filter((item: ScreenTemplateItem) => item.type === 'template')
        .map((item: ScreenTemplateItem) => ({
          ...item,
          source: item.source || (item.isSystem ? 'system' : 'custom'),
        }))
        .sort((left: ScreenTemplateItem, right: ScreenTemplateItem) => {
          const createdTimeDiff = Number((right as any).createdTime || 0) - Number((left as any).createdTime || 0);
          if (createdTimeDiff !== 0) {
            return createdTimeDiff;
          }
          return Number(right.id || 0) - Number(left.id || 0);
        });
      coverErrorMap.value = {};
      return;
    }

    list.value = [];
    window.$message?.warning(json.msg || editorT('bigscreenEditor.ui.failedLoadTemplateList'));
  } catch (error: any) {
    list.value = [];
    window.$message?.warning(error?.message || editorT('bigscreenEditor.ui.failedLoadTemplateList'));
  } finally {
    loading.value = false;
  }
}

function onPreview(item: ScreenTemplateItem) {
  const coverSrc = getCoverSrc(item);
  if (!coverSrc) {
    window.$message?.info(editorT('bigscreenEditor.ui.thisTemplateHasNoPreviewImage'));
    return;
  }
  const nextWindow = window.open(coverSrc, '_blank', 'noopener,noreferrer');
  if (nextWindow) {
    nextWindow.opener = null;
  }
}

function onApply(item: ScreenTemplateItem) {
  if (!item.id) return;
  void applyScreenTemplate({
    id: String(item.id),
    name: item.name,
  });
}

function onDragStart(event: DragEvent, item: ScreenTemplateItem) {
  if (!item.id || !event.dataTransfer) return;
  event.dataTransfer.setData(
    DragKeyEnum.SCREEN_TEMPLATE_DRAG_KEY,
    JSON.stringify({
      id: item.id,
      name: item.name,
    }),
  );
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
}

function onDragEnd() {
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
}

function applyCoverUpdate(detail?: null | { filePath?: string; projectId: string; updatedAt: number }) {
  if (!detail?.projectId) return;

  let changed = false;
  list.value = list.value.map((item) => {
    if (String(item.id || '') !== String(detail.projectId)) return item;
    changed = true;
    return {
      ...item,
      indexImage: detail.filePath || item.indexImage,
      updatedTime: Number(detail.updatedAt || Date.now()),
    };
  });

  if (!changed) return;

  list.value = [...list.value].sort((left: ScreenTemplateItem, right: ScreenTemplateItem) => Number(right.updatedTime || 0) - Number(left.updatedTime || 0));
  coverErrorMap.value = {};
}

function onProjectCoverUpdated(event: Event) {
  const customEvent = event as CustomEvent<{ filePath?: string; projectId: string; updatedAt: number }>;
  applyCoverUpdate(customEvent.detail);
}

function onProjectCoverUpdatedStorage(event: StorageEvent) {
  if (!isProjectCoverUpdatedStorageKey(event.key)) return;
  applyCoverUpdate(parseProjectCoverUpdatedDetail(event.newValue));
}

onMounted(() => {
  void loadList();
  window.addEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.addEventListener('storage', onProjectCoverUpdatedStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener(BIGSCREEN_COVER_UPDATED_EVENT, onProjectCoverUpdated);
  window.removeEventListener('storage', onProjectCoverUpdatedStorage);
});
</script>

<template>
  <div class="screen-template-content">
    <div class="toolbar">
      <n-input v-model:value="searchName" size="small" clearable :placeholder="editorT('bigscreenEditor.ui.searchTemplates')" />
      <n-button tertiary size="small" @click="loadList">{{ editorT('orgManage.agent.refresh') }}</n-button>
    </div>

    <n-scrollbar trigger="none">
      <n-spin :show="loading" size="small">
        <div class="template-grid">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="template-card"
            draggable="true"
            @click="onApply(item)"
            @dragstart="onDragStart($event, item)"
            @dragend="onDragEnd"
          >
            <img v-if="item.indexImage && !hasCoverError(item)" :src="getCoverSrc(item)" class="card-thumbnail" @error="markCoverError(item)" />
            <div v-else class="card-placeholder">
              <n-icon size="24" color="#667085">
                <TemplateIcon />
              </n-icon>
            </div>

            <div class="card-actions">
              <n-button circle quaternary size="tiny" @click.stop="onPreview(item)">
                <template #icon>
                  <n-icon size="14">
                    <EyeOutlineIcon />
                  </n-icon>
                </template>
              </n-button>
              <n-button circle quaternary size="tiny" @click.stop="onApply(item)">
                <template #icon>
                  <n-icon size="14">
                    <LayersOutlineIcon />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <div class="card-name" :title="item.name">{{ item.name || '-' }}</div>
            <n-tag size="small" round :type="getSourceTag(item.source).type">
              {{ getSourceTag(item.source).label }}
            </n-tag>
          </div>
        </div>

        <n-empty v-if="!loading && filteredList.length === 0" :description="editorT('bigscreenManagement.ui.noAvailableTemplates')" style="margin-top: 40px" />
      </n-spin>
    </n-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.screen-template-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
  gap: 8px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  cursor: pointer;
  background: rgb(255 255 255 / 2%);
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 8px;
  transition:
    border-color 0.2s,
    transform 0.2s;

  &:hover {
    border-color: #2d8cf0;
    transform: translateY(-1px);
  }
}

.card-thumbnail,
.card-placeholder {
  width: 100%;
  height: 84px;
  overflow: hidden;
  border-radius: 6px;
}

.card-thumbnail {
  object-fit: cover;
  background: #111822;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(17 24 39 / 96%), rgb(30 41 59 / 92%));
}

.card-actions {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.template-card:hover .card-actions {
  opacity: 1;
}

.card-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: rgb(255 255 255 / 82%);
  text-align: center;
  white-space: nowrap;
}
</style>
