<script setup lang="ts">
import type { MappingRendererProps } from './types';

import SharedMappingRenderer from './SharedMappingRenderer.vue';

defineProps<MappingRendererProps>();
</script>

<template>
  <SharedMappingRenderer v-bind="$props" />
</template>
