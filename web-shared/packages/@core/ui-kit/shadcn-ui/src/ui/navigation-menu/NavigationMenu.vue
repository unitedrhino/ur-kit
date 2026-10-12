<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuRoot, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<NavigationMenuRootProps & { class?: any }>();
const emits = defineEmits<NavigationMenuRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NavigationMenuRoot v-bind="forwarded" :class="cn('relative z-10 flex max-w-max flex-1 items-center justify-center', props.class)">
    <slot></slot>
  </NavigationMenuRoot>
</template>
