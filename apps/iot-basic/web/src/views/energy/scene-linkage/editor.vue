<script setup lang="ts">
/**
 * org-iot-client 场景编辑器宿主页。
 *
 * 负责把共享场景编辑器接入当前项目，并在保存或返回时保留组织作用域路由前缀。
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { SceneEditorPage } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { buildOrgPath, extractOrgIdFromPath } from '#/router/org-scope';

const projectStore = useProjectStore();
/** 当前路由用于读取 URL 第一段组织 code。 */
const route = useRoute();

const projectID = computed(() => String(projectStore.currentProjectID || ''));
/** 场景列表真实路由，保留 /{tccode} 前缀。 */
const sceneListRoute = computed(() => buildOrgPath(extractOrgIdFromPath(route.path), '/scene-linkage/auto-scene'));
</script>

<template>
  <SceneEditorPage :project-id="projectID" :list-route="sceneListRoute" :create-title="$t('orgIotClient.energyDashboard.addScene')" :edit-title="$t('orgIotClient.energyDashboard.editScene')" />
</template>
