import type { Ref } from 'vue';

import { watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';

interface UseMenuScrollOptions {
  delay?: number;
  enable?: boolean | Ref<boolean>;
}

export function useMenuScroll(activePath: Ref<string | undefined>, options: UseMenuScrollOptions = {}) {
  const { enable = true, delay = 320 } = options;

  function findScrollContainer(activeElement: Element) {
    return activeElement.closest('[data-radix-scroll-area-viewport], [data-slot="scroll-area-viewport"]') as HTMLElement | null;
  }

  function scrollToActiveItem() {
    const isEnabled = typeof enable === 'boolean' ? enable : enable.value;
    if (!isEnabled) return;

    const activeElement = document.querySelector(`aside li[role=menuitem].is-active`);
    if (activeElement) {
      const scrollContainer = findScrollContainer(activeElement);
      if (!scrollContainer) {
        activeElement.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        });
        return;
      }

      const activeRect = activeElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const nextScrollTop = scrollContainer.scrollTop + activeRect.top - containerRect.top - (containerRect.height - activeRect.height) / 2;

      scrollContainer.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: 'auto',
      });
    }
  }

  const debouncedScroll = useDebounceFn(scrollToActiveItem, delay);

  watch(activePath, () => {
    const isEnabled = typeof enable === 'boolean' ? enable : enable.value;
    if (!isEnabled) return;

    debouncedScroll();
  });

  return {
    scrollToActiveItem,
  };
}
