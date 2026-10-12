<!-- 按钮组容器:提供横向/纵向组合布局 -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@vben-core/shared/utils';

interface Props {
  /** 布局方向 */
  orientation?: 'horizontal' | 'vertical';
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
});
</script>

<template>
  <div
    data-slot="button-group"
    :data-orientation="props.orientation"
    role="group"
    :class="
      cn(
        'flex w-fit items-stretch [&>*]:m-0 [&>*]:rounded-none',
        props.orientation === 'vertical' ? 'flex-col' : 'flex-row',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
