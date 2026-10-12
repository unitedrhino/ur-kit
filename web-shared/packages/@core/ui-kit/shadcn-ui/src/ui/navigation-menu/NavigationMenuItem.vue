<script setup lang="ts">
import type { NavigationMenuItemProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuItem, useForwardProps } from 'radix-vue';

const props = defineProps<NavigationMenuItemProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NavigationMenuItem v-bind="forwarded" :class="cn(props.class)">
    <slot></slot>
  </NavigationMenuItem>
</template>
