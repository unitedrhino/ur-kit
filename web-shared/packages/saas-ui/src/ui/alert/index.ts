/**
 * 文件说明：shadcn 提示组件导出与样式变体。
 * 统一提供普通提示和错误提示的语义化视觉规则。
 */
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Alert } from './Alert.vue';
export { default as AlertDescription } from './AlertDescription.vue';
export { default as AlertTitle } from './AlertTitle.vue';

/** alertVariants 定义提示容器支持的语义变体。 */
export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/** AlertVariants 描述提示组件支持的语义变体。 */
export type AlertVariants = VariantProps<typeof alertVariants>;
