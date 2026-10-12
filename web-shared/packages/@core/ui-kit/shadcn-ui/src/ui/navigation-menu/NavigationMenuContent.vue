<script setup lang="ts">
import type { NavigationMenuContentEmits, NavigationMenuContentProps } from 'radix-vue';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { NavigationMenuContent, useForwardPropsEmits } from 'radix-vue';

const props = withDefaults(defineProps<NavigationMenuContentProps & { class?: any }>(), {});
const emits = defineEmits<NavigationMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <NavigationMenuContent
    v-bind="forwarded"
    :class="
      cn(
        'bg-popover text-popover-foreground duration-200',
        'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out',
        'data-[motion^=from-]:fade-in-0 data-[motion^=to-]:fade-out-0',
        'data-[motion^=from-]:zoom-in-95 data-[motion^=to-]:zoom-out-95',
        'left-0 top-0 w-full md:absolute md:w-auto',
        'border-border z-popup overflow-hidden rounded-md border p-2 shadow-md',
        props.class,
      )
    "
  >
    <slot></slot>
  </NavigationMenuContent>
</template>
