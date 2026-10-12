<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Cross2Icon } from '@radix-icons/vue';
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

/** closeLabel 与 overlayClass 允许业务按语言和图稿调整，既有调用保持原默认值。 */
const props = withDefaults(defineProps<DialogContentProps & { class?: HTMLAttributes['class']; zIndex?: number; closeLabel?: string; overlayClass?: HTMLAttributes['class'] }>(), {
  zIndex: 2000,
  closeLabel: 'Close',
});
const emits = defineEmits<DialogContentEmits>();

const delegatedProps = reactiveOmit(props, 'class', 'zIndex', 'closeLabel', 'overlayClass');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      :class="cn('data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/80', props.overlayClass)"
      :style="{ zIndex: props.zIndex }"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] pointer-events-auto fixed left-1/2 top-1/2 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
          props.class,
        )
      "
      :style="{ zIndex: props.zIndex }"
    >
      <slot />

      <DialogClose
        class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
      >
        <Cross2Icon class="h-4 w-4" />
        <span class="sr-only">{{ closeLabel }}</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
