<script setup lang="ts">
import type { NavigationMenuLinkEmits, NavigationMenuLinkProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuLink, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<NavigationMenuLinkProps & { class?: any }>();
const emits = defineEmits<NavigationMenuLinkEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NavigationMenuLink v-bind="forwarded" :class="cn(props.class)">
    <slot></slot>
  </NavigationMenuLink>
</template>
