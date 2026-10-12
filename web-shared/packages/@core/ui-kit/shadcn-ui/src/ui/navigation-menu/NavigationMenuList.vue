<script setup lang="ts">
import type { NavigationMenuListProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuList, useForwardProps } from 'radix-vue';

const props = defineProps<NavigationMenuListProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NavigationMenuList v-bind="forwarded" :class="cn('group flex flex-1 list-none items-center justify-center gap-1', props.class)">
    <slot></slot>
  </NavigationMenuList>
</template>
