<!--
文件说明：shadcn 输入组合附加区域。
用于在输入框前后或上下展示图标、文字和操作，并支持点击空白处聚焦输入框。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import type { InputGroupVariants } from '.';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { inputGroupAddonVariants } from '.';

/** 组件属性定义附加区域的位置和扩展类名。 */
const props = withDefaults(
  defineProps<{
    align?: InputGroupVariants['align'];
    class?: HTMLAttributes['class'];
  }>(),
  {
    align: 'inline-start',
  },
);

/** handleInputGroupAddonClick 在非按钮区域被点击时聚焦同组输入框。 */
function handleInputGroupAddonClick(e: MouseEvent) {
  const currentTarget = e.currentTarget as HTMLElement | null;
  const target = e.target as HTMLElement | null;
  if (target && target.closest('button')) {
    return;
  }
  if (currentTarget && currentTarget?.parentElement) {
    currentTarget.parentElement?.querySelector('input')?.focus();
  }
}
</script>

<template>
  <div
    role="group"
    data-slot="input-group-addon"
    :data-align="props.align"
    :class="cn(inputGroupAddonVariants({ align: props.align }), props.class)"
    @click="handleInputGroupAddonClick"
  >
    <slot />
  </div>
</template>
