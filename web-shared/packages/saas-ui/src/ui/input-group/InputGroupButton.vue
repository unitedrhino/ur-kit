<!--
文件说明：shadcn 输入组合内嵌按钮。
复用统一 Button 变体并提供适合输入框高度的紧凑尺寸。
-->
<script setup lang="ts">
import type { InputGroupButtonProps } from '.';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { inputGroupButtonVariants } from '.';

/** 组件属性定义内嵌按钮的尺寸、变体和扩展类名。 */
const props = withDefaults(defineProps<InputGroupButtonProps>(), {
  size: 'xs',
  variant: 'ghost',
});
</script>

<template>
  <Button :data-size="props.size" :variant="props.variant" :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)">
    <slot />
  </Button>
</template>
