<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useProjectStore } from '@vben/stores';

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import ProjectFormDrawer from '../../../components/ProjectFormDrawer.vue';

defineOptions({ name: 'SelectProject' });

const router = useRouter();
const route = useRoute();
const projectStore = useProjectStore();

const searchKeyword = ref('');
const loading = ref(false);

// 抽屉
const drawerVisible = ref(false);

const redirect = computed(() => {
  const r = route.query.redirect;
  return r ? decodeURIComponent(r as string) : '/';
});

const filteredProjects = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const list = keyword
    ? projectStore.projects.filter((p) =>
        p.projectName?.toLowerCase().includes(keyword),
      )
    : [...projectStore.projects];
  const currentID = projectStore.currentProjectID;
  if (currentID) {
    list.sort((a, b) =>
      a.projectID === currentID ? -1 : b.projectID === currentID ? 1 : 0,
    );
  }
  return list;
});

onMounted(async () => {
  loading.value = true;
  try {
    await projectStore.getProjects();
  } finally {
    loading.value = false;
  }
});

function getProjectColor(id: string | undefined): string {
  const colors = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
  ];
  if (!id) return colors[0]!;
  const hash = String(id)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length]!;
}

function getStatusLabel(status: number | undefined): string {
  if (status === 2) return '禁用';
  if (status === 3) return '过期';
  return '正常';
}

function getStatusVariant(
  status: number | undefined,
): 'default' | 'destructive' | 'secondary' {
  if (status === 2) return 'destructive';
  if (status === 3) return 'secondary';
  return 'default';
}

function handleSelect(projectID: string) {
  projectStore.setCurrentProjectID(projectID);
  router.replace(redirect.value);
}

function openCreateDrawer() {
  drawerVisible.value = true;
}

function handleDrawerSaved(projectID: string) {
  projectStore.setCurrentProjectID(projectID);
  router.replace(redirect.value);
}
</script>

<template>
  <div>
    <!-- 标题区域：与 TenantChoose 保持一致 -->
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2
        class="text-foreground mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl"
      >
        选择项目
      </h2>
      <p class="text-muted-foreground lg:text-md text-sm">
        请选择一个项目以继续操作
      </p>
    </div>

    <!-- 搜索 + 新建 -->
    <div class="mb-4 flex items-center gap-2">
      <div class="relative flex-1">
        <VbenIcon
          icon="carbon:search"
          class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          v-model="searchKeyword"
          placeholder="搜索项目..."
          class="h-10 pl-9"
        />
      </div>
      <Button class="h-10" @click="openCreateDrawer">
        <VbenIcon icon="carbon:add" class="mr-1 size-4" />
        新建项目
      </Button>
    </div>

    <!-- 项目列表 -->
    <div class="max-h-[60vh] overflow-y-auto scroll-smooth" style="scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <VbenIcon
          icon="carbon:circle-dash"
          class="text-muted-foreground size-8 animate-spin"
        />
      </div>

      <div v-else-if="filteredProjects.length > 0" class="space-y-2">
        <Card
          v-for="project in filteredProjects"
          :key="project.projectID"
          class="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md"
          @click="handleSelect(project.projectID!)"
        >
          <CardContent class="flex items-center gap-4 p-4">
            <!-- 头像 -->
            <div
              class="flex size-12 flex-shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-white"
              :style="{
                backgroundColor: getProjectColor(project.projectID),
              }"
            >
              {{ (project.projectName || 'P').charAt(0) }}
            </div>

            <!-- 项目信息 -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-foreground truncate text-sm font-medium">
                  {{ project.projectName || '未命名项目' }}
                </span>
                <Badge :variant="getStatusVariant(project.status)">
                  {{ getStatusLabel(project.status) }}
                </Badge>
              </div>
              <div class="text-muted-foreground mt-1 truncate text-xs">
                {{ project.address || project.desc || '暂无描述' }}
              </div>
            </div>

            <!-- 右箭头 -->
            <VbenIcon
              icon="mdi:chevron-right"
              class="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              :size="20"
            />
          </CardContent>
        </Card>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <VbenIcon
          icon="carbon:building"
          class="text-muted-foreground mb-3"
          :size="48"
        />
        <div class="text-muted-foreground mb-4 text-sm">
          {{
            projectStore.projects.length > 0
              ? '无匹配项目'
              : '暂无项目，请先创建一个项目'
          }}
        </div>
        <Button
          v-if="projectStore.projects.length === 0"
          @click="openCreateDrawer"
        >
          <VbenIcon icon="carbon:add" class="mr-1 size-4" />
          创建第一个项目
        </Button>
      </div>
    </div>

    <!-- 项目表单抽屉 -->
    <ProjectFormDrawer
      v-model:show="drawerVisible"
      :project="null"
      @saved="handleDrawerSaved"
    />
  </div>
</template>
