<script setup lang="ts">
/**
 * org-iot-client 场景联动列表宿主页。
 *
 * 负责把共享场景列表组件接入当前项目，并补齐组织作用域路由前缀。
 */
import { $t } from '@vben/locales';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { ProjectSceneTab } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { buildOrgPath, extractOrgIdFromPath } from '#/router/org-scope';

const props = withDefaults(
  defineProps<{
    sceneLabel?: string;
    sceneType?: 'auto' | 'manual';
  }>(),
  {
    sceneLabel: 'orgIotClient.energyDashboard.sceneList',
    sceneType: 'auto',
  },
);

const projectStore = useProjectStore();
/** 当前路由用于读取 URL 第一段组织 code。 */
const route = useRoute();

const projectID = computed(() => String(projectStore.currentProjectID || ''));
/** 新增场景真实路由，保留 /{tccode} 前缀，避免跳到 app_not_found。 */
const createRouteV2 = computed(() => buildOrgPath(extractOrgIdFromPath(route.path), '/scene-linkage/create-v2'));
</script>

<template>
  <Page title="" auto-content-height>
    <ProjectSceneTab
      :fixed-scene-type="props.sceneType"
      :project-id="projectID"
      :scene-list-title="$t(props.sceneLabel)"
      :show-logs="false"
      :create-route-v2="createRouteV2"
    />
  </Page>
</template>
