<script setup lang="ts">
import { computed } from 'vue';

import { ProjectDeviceMapPage } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

const projectStore = useProjectStore();
const projectID = computed(() => String(projectStore.currentProjectID || ''));
</script>

<template>
  <ProjectDeviceMapPage :project-id="projectID" profile-code="device_map_v2" />
</template>
