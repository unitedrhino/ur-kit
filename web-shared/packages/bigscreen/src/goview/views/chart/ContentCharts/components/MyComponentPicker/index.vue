<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentType } from '@/packages/index.type';

import { ref } from 'vue';

import { PublicGroupConfigClass } from '@/packages/public/publicConfig';
import { icon } from '@/plugins';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getEditorFetchHeaders, getUUID } from '@/utils';
import { useProjectStore } from '@vben/stores';

const { AppsOutlineIcon: AppsIcon } = icon.ionicons5;
const chartEditStore = useChartEditStore();
const projectStore = useProjectStore();

const showModal = ref(false);
const loading = ref(false);
const list = ref<any[]>([]);

const loadList = async () => {
  loading.value = true;
  try {
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
      list.value = (json.data?.list || []).filter((c: any) => c.content);
    }
  } finally {
    loading.value = false;
  }
};

const onSelect = async (comp: any) => {
  try {
    const res = await fetch('/api/v1/view/component/get-one', {
      method: 'POST',
      headers: getEditorFetchHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: comp.id }),
    });
    const json = await res.json();
    if (json.code !== 200 || !json.data?.content) return;

    const template = JSON.parse(json.data.content);

    if (template.type === 'single_template' && template.component) {
      const single = { ...template.component, id: getUUID() } as CreateComponentType;
      chartEditStore.addComponentList(single, false, true);
    } else {
      const groupConfig = new PublicGroupConfigClass();
      groupConfig.attr.w = template.attr?.w || 400;
      groupConfig.attr.h = template.attr?.h || 300;
      if (template.styles) groupConfig.styles = template.styles;
      groupConfig.groupList = (template.groupList || []).map((child: CreateComponentType) => ({ ...child, id: getUUID() }));
      chartEditStore.addComponentList(groupConfig, false, true);
    }
    showModal.value = false;
    window.$message?.success(editorT('bigscreenEditor.dynamic.message9', { name: String(comp.name) }));
  } catch {
    window.$message?.error(editorT('bigscreenEditor.ui.failedLoadComponent'));
  }
};

const open = () => {
  showModal.value = true;
  loadList();
};

defineExpose({ open });
</script>

<template>
  <n-modal v-model:show="showModal" preset="card" :title="editorT('bigscreenEditor.ui.myComponents')" style="width: 600px; max-height: 80vh">
    <n-spin :show="loading">
      <div class="component-grid">
        <div v-for="comp in list" :key="comp.id" class="component-card" @click="onSelect(comp)">
          <n-icon size="32" color="#666"><AppsIcon /></n-icon>
          <div class="card-name">{{ comp.name }}</div>
        </div>
        <n-empty v-if="!loading && list.length === 0" :description="editorT('bigscreenEditor.ui.noSavedComponents')" />
      </div>
    </n-spin>
  </n-modal>
</template>

<style scoped>
.component-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  min-height: 120px;
}

.component-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  cursor: pointer;
  border: 1px solid #333;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.component-card:hover {
  border-color: #2d8cf0;
}

.card-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #aaa;
  text-align: center;
  white-space: nowrap;
}
</style>
