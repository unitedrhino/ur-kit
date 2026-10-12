<script setup lang="ts">
import type { NavigationMenuTriggerProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuTrigger, useForwardProps } from 'radix-vue';

const props = defineProps<NavigationMenuTriggerProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NavigationMenuTrigger v-bind="forwarded" class="outline-none" :class="cn(props.class)">
    <slot></slot>
  </NavigationMenuTrigger>
</template>
