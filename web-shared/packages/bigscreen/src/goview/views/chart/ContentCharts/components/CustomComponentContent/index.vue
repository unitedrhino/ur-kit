<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { onMounted, onUnmounted, ref } from 'vue';

import { DragKeyEnum } from '@/enums/editPageEnum';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { getEditorFetchHeaders } from '@/utils';
import { useProjectStore } from '@vben/stores';

import { localPresetTemplates } from './localPresetTemplates';
import { instantiateTemplate } from './templateInstantiate';

const props = withDefaults(
  defineProps<{
    mode?: 'custom' | 'preset';
  }>(),
  {
    mode: 'custom',
  },
);

const { AppsOutlineIcon: AppsIcon } = icon.ionicons5;
const chartEditStore = useChartEditStore();
const projectStore = useProjectStore();

const loading = ref(false);
const list = ref<any[]>([]);

const loadList = async () => {
  loading.value = true;
  try {
    let remoteList: any[] = [];
    const res = await fetch('/api/v1/view/component/get-list', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        page: { page: 1, size: 200 },
        projectID: projectStore.currentProjectID || undefined,
      }),
    });
    const json = await res.json();
    if (json.code === 200) {
      remoteList = (json.data?.list || [])
        .filter((c: any) => c.content)
        .map((c: any) => {
          try {
            const parsed = JSON.parse(c.content);
            return {
              ...c,
              category: parsed.category || 'custom',
              templateType: parsed.type,
              thumbnail: parsed.thumbnail || '',
            };
          } catch {
            return {
              ...c,
              category: 'custom',
              templateType: '',
              thumbnail: '',
            };
          }
        })
        .filter((c: any) => {
          if (props.mode === 'preset') return c.category !== 'custom';
          return c.category === 'custom';
        });
    }
    list.value = props.mode === 'preset' ? [...localPresetTemplates, ...remoteList] : remoteList;
  } catch {
    list.value = props.mode === 'preset' ? [...localPresetTemplates] : [];
  } finally {
    loading.value = false;
  }
};

const onSelect = async (comp: any) => {
  try {
    let template = comp.content;

    if (!template) {
      const res = await fetch('/api/v1/view/component/get-one', {
        method: 'POST',
        headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: comp.id }),
      });
      const json = await res.json();
      if (json.code !== 200 || !json.data?.content) return;
      template = JSON.parse(json.data.content);
    }

    const instance = instantiateTemplate(
      {
        id: comp.id,
        source: comp.source === 'local' ? 'local' : 'remote',
        thumbnail: comp.thumbnail,
      },
      template,
    );
    chartEditStore.addComponentList(instance, false, true);
    chartEditStore.setTargetSelectChart(instance.id);
    window.$message?.success(editorT('bigscreenEditor.dynamic.message8', { name: String(comp.name) }));
  } catch {
    window.$message?.error(editorT('bigscreenEditor.ui.failedLoadComponent'));
  }
};

onMounted(() => {
  loadList();
  window.addEventListener('custom-component-changed', loadList);
});

onUnmounted(() => {
  window.removeEventListener('custom-component-changed', loadList);
});

const onDragStart = (e: DragEvent, comp: any) => {
  e.dataTransfer!.setData(
    DragKeyEnum.CUSTOM_DRAG_KEY,
    JSON.stringify({
      id: comp.id,
      name: comp.name,
      source: comp.source,
      thumbnail: comp.thumbnail,
      content: comp.content,
    }),
  );
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
};

const onDragEnd = () => {
  chartEditStore.setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
};
</script>

<template>
  <div class="custom-component-content">
    <n-scrollbar trigger="none">
      <n-spin :show="loading" size="small">
        <div class="component-grid">
          <div
            v-for="comp in list"
            :key="comp.id"
            class="component-card"
            draggable="true"
            @click="onSelect(comp)"
            @dragstart="onDragStart($event, comp)"
            @dragend="onDragEnd"
          >
            <img v-if="comp.thumbnail" :src="comp.thumbnail" class="card-thumbnail" @error="comp.thumbnail = ''" />
            <n-icon v-else size="28" color="#666"><AppsIcon /></n-icon>
            <div class="card-name">{{ comp.name }}</div>
          </div>
        </div>
        <n-empty v-if="!loading && list.length === 0" :description="props.mode === 'preset' ? editorT('bigscreenEditor.ui.noPresetTemplates') : editorT('bigscreenEditor.ui.noCustomComponents')" style="margin-top: 40px" />
      </n-spin>
    </n-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.custom-component-content {
  height: 100%;
  padding: 8px;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 12px 6px;
  cursor: pointer;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #2d8cf0;
  }
}

.card-thumbnail {
  width: 100%;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
}

.card-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: rgb(255 255 255 / 65%);
  text-align: center;
  white-space: nowrap;
}
</style>
