<script setup lang="ts">
import { ChevronLeftIcon } from 'lucide-vue-next'
import { Button } from '@vben-core/shadcn-ui'
import { useMessageBranchContext } from './context'

const { goToPrevious, totalBranches } = useMessageBranchContext()
</script>

<template>
  <Button
    aria-label="Previous branch"
    :disabled="totalBranches <= 1"
    size="xs"
    type="button"
    variant="ghost"
    v-bind="$attrs"
    @click="goToPrevious"
  >
    <slot>
      <ChevronLeftIcon :size="14" />
    </slot>
  </Button>
</template>
