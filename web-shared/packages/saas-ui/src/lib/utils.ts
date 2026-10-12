import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn 合并 shadcn-vue 组件的条件 class，并处理 Tailwind 冲突。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
