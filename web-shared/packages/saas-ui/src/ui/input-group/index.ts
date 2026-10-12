/**
 * 文件说明：shadcn 输入组合组件导出与样式变体。
 * 统一提供输入框、文本域、附加区域和内嵌按钮的组合能力。
 */
import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'vue';
import type { ButtonVariants } from '@unitedrhino/saas-ui/ui/button';
import { cva } from 'class-variance-authority';

export { default as InputGroup } from './InputGroup.vue';
export { default as InputGroupAddon } from './InputGroupAddon.vue';
export { default as InputGroupButton } from './InputGroupButton.vue';
export { default as InputGroupInput } from './InputGroupInput.vue';
export { default as InputGroupText } from './InputGroupText.vue';
export { default as InputGroupTextarea } from './InputGroupTextarea.vue';

/** inputGroupAddonVariants 定义输入附加区域在四个方向上的布局规则。 */
export const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)] group-data-[disabled=true]/input-group:opacity-50",
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]',
        'inline-end': 'order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]',
        'block-start': 'order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5',
        'block-end': 'order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
);

/** InputGroupVariants 描述输入附加区域支持的变体。 */
export type InputGroupVariants = VariantProps<typeof inputGroupAddonVariants>;

/** inputGroupButtonVariants 定义输入组合内按钮的紧凑尺寸。 */
export const inputGroupButtonVariants = cva('text-sm shadow-none flex gap-2 items-center', {
  variants: {
    size: {
      xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
      sm: 'h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5',
      'icon-xs': 'size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0',
      'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
    },
  },
  defaultVariants: {
    size: 'xs',
  },
});

/** InputGroupButtonVariants 描述输入组合按钮支持的尺寸变体。 */
export type InputGroupButtonVariants = VariantProps<typeof inputGroupButtonVariants>;

/** InputGroupButtonProps 描述输入组合按钮的外部属性。 */
export interface InputGroupButtonProps {
  variant?: ButtonVariants['variant'];
  size?: InputGroupButtonVariants['size'];
  class?: HTMLAttributes['class'];
}
