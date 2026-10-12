<script setup lang="ts">
import type { NavigationMenuViewportProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuViewport, useForwardProps } from 'radix-vue';

const props = defineProps<NavigationMenuViewportProps & { class?: any }>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <NavigationMenuViewport
    v-bind="forwarded"
    :class="
      cn(
        'origin-top-center bg-popover text-popover-foreground data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 border-border relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]',
        props.class,
      )
    "
  >
    <slot></slot>
  </NavigationMenuViewport>
</template>
