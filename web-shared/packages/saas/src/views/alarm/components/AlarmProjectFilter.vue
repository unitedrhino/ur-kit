<script setup lang="ts">
/**
 * 文件说明：告警列表项目管理器入口。
 * 复用全局项目管理器的增删改查能力，并确保告警查询始终绑定有效项目。
 */
import { onMounted, watch } from 'vue';

import { ProjectManagerSelector, ProjectSelectModal } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

const emit = defineEmits<{
  /** 当前有效项目变化后通知所属列表重新查询。 */
  (e: 'change', projectID: string): void;
}>();

const projectStore = useProjectStore();
let projectsReady = false;
let lastEmittedProjectID = '';

/** emitProjectChange 对有效项目去重通知列表，避免初始化与状态监听重复查询。 */
function emitProjectChange(projectID: string): void {
  if (!projectID || projectID === lastEmittedProjectID) return;
  lastEmittedProjectID = projectID;
  emit('change', projectID);
}

/** 加载可选项目；未选择时沿用大屏管理规则，始终要求用户先明确选择项目。 */
async function loadProjects(): Promise<void> {
  try {
    await projectStore.getProjects();
    projectsReady = true;
    let currentProjectID = String(projectStore.currentProjectID ?? '');
    const currentProjectValid = currentProjectID && projectStore.projects.some((project) => String(project.projectID) === currentProjectID);
    if (!currentProjectValid) {
      if (currentProjectID) {
        projectStore.clearCurrentProjectID();
      }
      currentProjectID = '';
    }

    if (currentProjectID) {
      emitProjectChange(currentProjectID);
      return;
    }

    projectStore.openProjectSelectModal();
  } catch {
    // 项目列表失败时不发起缺少 project-id 的告警查询。
  }
}

/** 切换全局请求头使用的项目上下文，并触发当前列表重新查询。 */
function onProjectChange(projectID: string): void {
  if (!projectID) return;
  projectStore.setCurrentProjectID(projectID);
  emitProjectChange(projectID);
}

// 项目选择弹窗直接更新全局项目状态；监听该变化后再放行告警列表查询。
watch(
  () => projectStore.currentProjectID,
  (projectID) => {
    if (!projectsReady || !projectID) return;
    const normalizedProjectID = String(projectID);
    if (!projectStore.projects.some((project) => String(project.projectID) === normalizedProjectID)) return;
    emitProjectChange(normalizedProjectID);
  },
);

onMounted(loadProjects);
</script>

<template>
  <ProjectSelectModal />
  <ProjectManagerSelector variant="filter" data-testid="alarm-project-filter" @change="onProjectChange" />
</template>
