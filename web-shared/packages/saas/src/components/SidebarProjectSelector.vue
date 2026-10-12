/** 文件说明：在侧栏和查询栏展示项目选择、管理和多语言操作反馈。 */
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, ref, watch } from 'vue';

import type { ThingsApi } from '@vben/api';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { useProjectStore } from '@vben/stores';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import { useToast } from '../hooks/use-toast';
import ProjectFormDrawer from './ProjectFormDrawer.vue';

defineOptions({
  name: 'SidebarProjectSelector',
});

const props = withDefaults(
  defineProps<{
    /** 展示模式：sidebar 用于左侧导航，filter 用于查询表单。 */
    variant?: 'filter' | 'sidebar';
  }>(),
  {
    variant: 'sidebar',
  },
);

const emit = defineEmits<{
  /** 当前项目发生变化后通知所属页面刷新数据。 */
  change: [projectID: string];
}>();

const projectStore = useProjectStore();
const { toast } = useToast();

type ProjectOption = { label?: string; value?: string };
type ProjectInfoWithLegacySysFlag = ThingsApi.ProjectInfo & {
  isSysCreate?: unknown;
};

const searchKeyword = ref('');
const popoverVisible = ref(false);

// 抽屉表单
const drawerVisible = ref(false);
const editingProject = ref<ThingsApi.ProjectInfo | null>(null);

// 删除确认
const deleting = ref<null | string>(null);
const deleteConfirmOpen = ref(false);
const pendingDeleteProject = ref<ProjectOption | null>(null);

const collapsed = computed(() => preferences.sidebar.collapsed);
const filterMode = computed(() => props.variant === 'filter');

const hasProjects = computed(() => projectStore.projects.length > 0);

const currentProjectName = computed(() => {
  if (!hasProjects.value) return $t('iotApp.projectSelect.noProjects');
  return projectStore.currentProject?.projectName || $t('iotApp.projectSelect.selectProject');
});

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const list = keyword
    ? projectStore.projectOptions.filter((p) =>
        p.label?.toLowerCase().includes(keyword),
      )
    : [...projectStore.projectOptions];
  const currentID = projectStore.currentProjectID;
  if (currentID) {
    list.sort((a, b) =>
      a.value === currentID ? -1 : b.value === currentID ? 1 : 0,
    );
  }
  return list;
});

function getProjectColor(id: string | undefined): string {
  const colors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  if (!id) return colors[0]!;
  const hash = String(id)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length]!;
}

function getProjectByID(projectID: string | undefined) {
  return projectStore.projects.find(
    (project) => String(project.projectID) === String(projectID),
  );
}

function normalizeSystemFlag(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function isSystemProject(projectID: string | undefined) {
  const project = getProjectByID(projectID) as
    | ProjectInfoWithLegacySysFlag
    | undefined;
  return normalizeSystemFlag(project?.isSysCreated ?? project?.isSysCreate);
}

function handleSelect(projectID: string) {
  projectStore.setCurrentProjectID(projectID);
  popoverVisible.value = false;
  searchKeyword.value = '';
  emit('change', projectID);
}

// --- 创建 ---
function openCreateDrawer() {
  editingProject.value = null;
  drawerVisible.value = true;
  popoverVisible.value = false;
}

// --- 编辑 ---
function openEditDrawer(projectID: string) {
  const project = getProjectByID(projectID);
  editingProject.value = project || null;
  drawerVisible.value = true;
  popoverVisible.value = false;
}

async function handleDrawerSaved(projectID: string) {
  await projectStore.getProjects();
  projectStore.setCurrentProjectID(projectID);
  emit('change', projectID);
  toast({
    title: $t('iotApp.projectSelect.saved'),
    description: $t('iotApp.projectSelect.switched'),
    duration: 2000,
    type: 'success',
  });
}

// 响应 store 触发的"新建项目"外部信号（如路由守卫在 0 项目时触发）
// immediate=true 确保 SidebarProjectSelector 挂载时若 store 已标记 show=true，立即打开本地 drawer
watch(
  () => projectStore.showProjectCreateModal,
  (val) => {
    if (val) {
      editingProject.value = null;
      drawerVisible.value = true;
      popoverVisible.value = false;
    } else if (drawerVisible.value) {
      drawerVisible.value = false;
    }
  },
  { immediate: true },
);

// 本地关闭时同步清理 store 标记
watch(drawerVisible, (val) => {
  if (!val && projectStore.showProjectCreateModal) {
    projectStore.closeProjectCreateModal();
  }
});

// --- 删除 ---
function openDeleteConfirm(event: Event, project: ProjectOption) {
  event.stopPropagation();
  if (isSystemProject(project.value)) {
    toast({
      title: $t('iotApp.projectSelect.systemCannotDelete'),
      duration: 2000,
      type: 'warning',
    });
    return;
  }
  pendingDeleteProject.value = project;
  deleteConfirmOpen.value = true;
}

async function handleConfirmDelete() {
  const projectID = pendingDeleteProject.value?.value;
  if (!projectID) return;
  deleting.value = projectID;
  try {
    await projectStore.deleteProject(projectID);
    await projectStore.getProjects();
    if (projectStore.currentProjectID === projectID) {
      projectStore.clearCurrentProjectID();
      if (projectStore.projects.length > 0) {
        const nextProjectID = projectStore.projects[0]?.projectID || '';
        projectStore.setCurrentProjectID(nextProjectID);
        emit('change', nextProjectID);
      } else {
        emit('change', '');
      }
    }
    toast({
      title: $t('iotApp.common.deleteSuccess'),
      duration: 2000,
      type: 'success',
    });
  } catch (e: any) {
    notifyRequestError(e, () => $t('iotApp.common.deleteFailed'), (text) => toast({ description: e?.message || $t('iotApp.project.retryLater'), duration: 3000, type: 'error', title: text }));
  } finally {
    deleting.value = null;
    deleteConfirmOpen.value = false;
    pendingDeleteProject.value = null;
  }
}
</script>

<template>
  <div :class="filterMode ? 'shrink-0' : 'border-border border-t px-2 py-2'">
    <Popover v-model:open="popoverVisible">
      <PopoverTrigger as-child>
        <button
          v-if="filterMode"
          type="button"
          data-testid="project-manager-filter"
          class="border-input bg-background hover:bg-accent flex h-8 w-[220px] items-center gap-2 rounded-md border px-3 text-sm transition-colors"
        >
          <span class="text-muted-foreground shrink-0">{{ $t('iotApp.deviceDetail.project') }}</span>
          <span class="min-w-0 flex-1 truncate text-left">{{ currentProjectName }}</span>
          <VbenIcon icon="carbon:chevron-sort" class="text-muted-foreground size-4 shrink-0" />
        </button>
        <div
          v-else
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-all hover:bg-accent"
          :class="collapsed ? 'justify-center' : ''"
        >
          <!-- 项目头像 -->
          <div
            class="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            :class="getProjectColor(projectStore.currentProjectID ?? undefined)"
          >
            {{ currentProjectName.charAt(0) }}
          </div>
          <template v-if="!collapsed">
            <div class="min-w-0 flex-1">
              <div class="text-muted-foreground text-[11px] leading-tight">
                {{ $t('iotApp.projectSelect.currentProject') }}
              </div>
              <div class="truncate text-sm font-medium leading-snug">
                {{ currentProjectName }}
              </div>
            </div>
            <VbenIcon
              icon="carbon:chevron-sort"
              class="text-muted-foreground size-4 flex-shrink-0"
            />
          </template>
        </div>
      </PopoverTrigger>

      <PopoverContent
        :side="filterMode ? 'bottom' : 'right'"
        align="start"
        :side-offset="filterMode ? 6 : 8"
        :collision-padding="16"
        class="z-[2000] w-72 p-3"
      >
        <!-- 搜索 + 新建按钮 -->
        <div class="mb-2 flex items-center gap-1">
          <div class="relative flex-1">
            <VbenIcon
              icon="carbon:search"
              class="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2"
            />
            <Input
              v-model="searchKeyword"
              :placeholder="$t('iotApp.projectSelect.searchPh')"
              class="h-8 pl-8 text-sm"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 flex-shrink-0"
                  @click="openCreateDrawer"
                >
                  <VbenIcon icon="carbon:add" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{{ $t('iotApp.projectSelect.createProject') }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 项目列表 -->
        <div class="max-h-60 overflow-y-auto scroll-smooth" style="scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent">
          <div class="space-y-0.5">
            <div
              v-for="project in filteredProjects"
              :key="project.value"
              class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
              :class="
                projectStore.currentProjectID === project.value
                  ? 'bg-accent'
                  : ''
              "
              @click="handleSelect(project.value!)"
            >
              <!-- 彩色头像 -->
              <div
                class="flex size-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                :class="getProjectColor(project.value)"
              >
                {{ project.label?.charAt(0) || 'P' }}
              </div>
              <!-- 项目名 -->
              <span class="flex-1 truncate text-sm">{{
                project.label
              }}</span>
              <!-- 操作区 -->
              <div class="flex items-center gap-0.5">
                <VbenIcon
                  v-if="projectStore.currentProjectID === project.value"
                  icon="carbon:checkmark"
                  class="text-primary size-3.5 flex-shrink-0"
                />
                <span
                  v-if="isSystemProject(project.value)"
                  class="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] leading-none"
                  :title="$t('iotApp.projectSelect.systemProjectTip')"
                >
                  {{ $t('iotApp.project.sourceSystem') }}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  class="!size-5 opacity-0 transition-opacity group-hover:opacity-100"
                  @click.stop="openEditDrawer(project.value!)"
                >
                  <VbenIcon icon="carbon:edit" class="size-3" />
                </Button>
                <Button
                  v-if="!isSystemProject(project.value)"
                  variant="ghost"
                  size="xs"
                  class="!size-5 text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  :disabled="deleting === project.value"
                  @click="openDeleteConfirm($event, project)"
                >
                  <VbenIcon
                    v-if="deleting !== project.value"
                    icon="carbon:trash-can"
                    class="size-3"
                  />
                  <VbenIcon
                    v-else
                    icon="carbon:circle-dash"
                    class="size-3 animate-spin"
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="filteredProjects.length === 0"
          class="text-muted-foreground py-4 text-center text-sm"
        >
          {{ hasProjects ? $t('iotApp.projectSelect.noMatch') : $t('iotApp.projectSelect.noProjectsCreate') }}
        </div>
      </PopoverContent>
    </Popover>

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="deleteConfirmOpen">
      <AlertDialogContent :open="deleteConfirmOpen" centered :overlay-blur="4"
        class="border-border left-0 right-0 mx-auto border sm:w-[420px] sm:max-w-[80%] sm:rounded-lg"
      >
        <div class="flex flex-col gap-2">
          <AlertDialogTitle class="text-lg font-semibold">
            {{ $t('iotApp.project.confirmDelete') }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-muted-foreground text-sm">
            {{ $t('iotApp.projectSelect.confirmDeleteProject', { name: pendingDeleteProject?.label ?? '' }) }}
          </AlertDialogDescription>
        </div>
        <div class="mt-4 flex items-center justify-end gap-2">
          <AlertDialogCancel as-child>
            <Button variant="outline" @click="deleteConfirmOpen = false">
              {{ $t('iotApp.common.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button variant="destructive" @click="handleConfirmDelete">
              {{ $t('iotApp.common.delete') }}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 项目表单抽屉 -->
    <ProjectFormDrawer
      v-model:show="drawerVisible"
      :project="editingProject"
      :required="projectStore.isCreateRequired && !editingProject"
      @saved="handleDrawerSaved"
    />
  </div>
</template>
