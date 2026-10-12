<script setup lang="ts">
import type { ButtonVariantSize, ButtonVariants } from '@vben-core/shadcn-ui'
import { Button } from '@vben-core/shadcn-ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@vben-core/shadcn-ui'

interface Props {
  tooltip?: string
  label?: string
  variant?: ButtonVariants
  size?: ButtonVariantSize
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'xs',
})

const buttonProps = {
  variant: props.variant,
  size: props.size,
  type: 'button' as const,
}
</script>

<template>
  <TooltipProvider v-if="props.tooltip">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button v-bind="{ ...buttonProps, ...$attrs }">
          <slot />
          <span class="sr-only">
            {{ props.label || props.tooltip }}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ props.tooltip }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <Button v-else v-bind="{ ...buttonProps, ...$attrs }">
    <slot />
    <span class="sr-only">{{ props.label || props.tooltip }}</span>
  </Button>
</template>
