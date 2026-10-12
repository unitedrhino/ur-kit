import { useDebounceFn } from '@vueuse/core';

export const useFloatingPreview = (applyHandle: () => void, debounceMs: number) => {
  const debouncedApply = useDebounceFn(() => {
    applyHandle();
  }, debounceMs);

  const triggerPreview = () => {
    debouncedApply();
  };

  const cancelPreview = () => {
    const cancelHandle = (debouncedApply as { cancel?: () => void }).cancel;
    if (typeof cancelHandle === 'function') {
      cancelHandle();
    }
  };

  return {
    triggerPreview,
    cancelPreview,
  };
};
