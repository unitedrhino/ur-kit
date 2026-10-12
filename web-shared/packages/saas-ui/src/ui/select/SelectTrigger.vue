<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ChevronDownIcon } from '@radix-icons/vue';
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'border-input bg-background ring-offset-background data-[placeholder]:text-muted-foreground focus:ring-ring data-[state=open]:ring-ring flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border px-3 py-2 text-start text-sm shadow-sm focus:outline-none focus:ring-1 data-[state=open]:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDownIcon class="h-4 w-4 shrink-0 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
<style lang="scss" scoped>
button {
  --ring: var(--primary);
}
</style>
