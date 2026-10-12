<script setup lang="ts">
import type { SelectSeparatorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { SelectSeparator } from 'reka-ui';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

const props = defineProps<SelectSeparatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <SelectSeparator v-bind="delegatedProps" :class="cn('bg-muted -mx-1 my-1 h-px', props.class)" />
</template>
