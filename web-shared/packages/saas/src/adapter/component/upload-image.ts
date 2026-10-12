import type { Recordable } from '@vben/types';

export function resolveUploadImageModelValue(
  props: Recordable<any>,
  attrs: Recordable<any>,
): string {
  const value = props.modelValue ?? attrs.modelValue ?? props.value ?? attrs.value;
  return typeof value === 'string' ? value : '';
}
