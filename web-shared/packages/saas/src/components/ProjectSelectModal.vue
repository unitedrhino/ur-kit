<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { useProjectStore } from '@vben/stores';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '@unitedrhino/saas-ui';

import ProjectFormDrawer from './ProjectFormDrawer.vue';

defineOptions({
  name: 'ProjectSelectModal',
});

const projectStore = useProjectStore();

const searchKeyword = ref('');
const drawerVisible = ref(false);

const open = computed({
  get: () => projectStore.showProjectSelectModal,
  set: (val: boolean) => {
    if (!val) {
      projectStore.closeProjectSelectModal();
    }
  },
});

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return projectStore.projects;
  return projectStore.projects.filter((p) => p.projectName?.toLowerCase().includes(keyword) || p.desc?.toLowerCase().includes(keyword));
});

const PROJECT_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
];

const PROJECT_ICONS = [
  'carbon:building',
  'carbon:industry',
  'carbon:enterprise',
  'carbon:factory',
  'carbon:warehouse',
  'carbon:home',
  'carbon:location-company',
  'carbon:store',
];

function getProjectColor(id: string | undefined): string {
  if (!id) return PROJECT_COLORS[0]!;
  const hash = [...String(id)].reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0);
  return PROJECT_COLORS[hash % PROJECT_COLORS.length]!;
}

function getProjectIcon(id: string | undefined): string {
  if (!id) return PROJECT_ICONS[0]!;
  const hash = [...String(id)].reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0);
  return PROJECT_ICONS[hash % PROJECT_ICONS.length]!;
}

function handleSelect(projectID: string) {
  projectStore.setCurrentProjectID(projectID);
  projectStore.closeProjectSelectModal();
  searchKeyword.value = '';
}

async function openCreateDrawer() {
  projectStore.closeProjectSelectModal();
  // 选择弹窗根节点通过 v-if 在本轮更新中完整卸载，释放页面交互锁后再打开新建弹窗。
  await nextTick();
  drawerVisible.value = true;
}

async function handleDrawerSaved(projectID: string) {
  await projectStore.getProjects();
  projectStore.setCurrentProjectID(projectID);
}

// 弹窗打开时清空搜索
watch(open, (val) => {
  if (val) {
    searchKeyword.value = '';
  }
});
</script>

<template>
  <Dialog v-if="open" v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader class="pb-2">
        <DialogTitle class="text-lg font-semibold"> {{ $t('iotApp.projectSelect.selectProject') }} </DialogTitle>
        <DialogDescription class="text-muted-foreground text-sm"> {{ $t('iotApp.projectSelect.selectSpace') }} </DialogDescription>
      </DialogHeader>

      <!-- 搜索框 -->
      <div v-if="projectStore.projects.length > 5" class="relative mt-2">
        <IconifyIcon icon="carbon:search" class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input v-model="searchKeyword" :placeholder="$t('iotApp.projectSelect.searchPh')" class="h-10 rounded-lg pl-9 text-sm" />
      </div>

      <!-- 项目卡片网格 -->
      <div class="-mx-1 mt-3 max-h-[55vh] overflow-y-auto scroll-smooth px-1" style="scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="project in filteredProjects"
            :key="project.projectID"
            class="border-border hover:border-primary/30 group relative cursor-pointer rounded-xl border px-4 py-4 transition-colors"
            :class="[projectStore.currentProjectID === project.projectID ? 'border-primary bg-primary/5' : 'hover:bg-muted/50']"
            @click="handleSelect(project.projectID!)"
          >
            <div class="flex items-start gap-3">
              <!-- 项目图标 -->
              <div
                class="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white"
                :class="getProjectColor(project.projectID)"
              >
                <IconifyIcon :icon="getProjectIcon(project.projectID)" class="size-5" />
              </div>

              <!-- 项目信息 -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between">
                  <h3 class="truncate text-sm font-semibold">
                    {{ project.projectName || $t('iotApp.projectSelect.unnamedProject') }}
                  </h3>
                  <!-- 选中标记 -->
                  <IconifyIcon
                    v-if="projectStore.currentProjectID === project.projectID"
                    icon="carbon:checkmark-filled"
                    class="text-primary ml-1 size-4 flex-shrink-0"
                  />
                </div>
                <p v-if="project.desc" class="text-muted-foreground mt-0.5 truncate text-xs">
                  {{ project.desc }}
                </p>
              </div>
            </div>

            <!-- 统计信息 -->
            <div v-if="project.areaCount != null || project.deviceCount != null" class="text-muted-foreground mt-2.5 flex gap-4 pl-14 text-xs">
              <span v-if="project.areaCount != null"> {{ $t('iotApp.projectSelect.areaCount', { count: project.areaCount }) }} </span>
              <span v-if="project.deviceCount != null"> {{ $t('iotApp.projectSelect.deviceCount', { count: project.deviceCount }) }} </span>
              <span v-if="project.deviceOnlineCount != null" class="text-emerald-500"> {{ $t('iotApp.projectSelect.onlineCount', { count: project.deviceOnlineCount }) }} </span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredProjects.length === 0" class="flex flex-col items-center justify-center py-12">
          <IconifyIcon icon="carbon:search-locate" class="text-muted-foreground/40 mb-3 size-10" />
          <p class="text-muted-foreground text-sm">
            {{ searchKeyword ? $t('iotApp.projectSelect.noMatch') : $t('iotApp.projectSelect.noAvailableProjects') }}
          </p>
          <Button v-if="!searchKeyword && projectStore.projects.length === 0" class="mt-4" @click="openCreateDrawer">
            <IconifyIcon icon="carbon:add" class="mr-1 size-4" />
            {{ $t('iotApp.projectSelect.createProject') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 项目表单抽屉（直接嵌入，不再依赖 SidebarProjectSelector） -->
  <ProjectFormDrawer v-model:show="drawerVisible" @saved="handleDrawerSaved" />
</template>
