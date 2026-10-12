<script setup lang="ts">
import { ChevronRightIcon } from 'lucide-vue-next'
import { Button } from '@vben-core/shadcn-ui'
import { useMessageBranchContext } from './context'

const { goToNext, totalBranches } = useMessageBranchContext()
</script>

<template>
  <Button
    aria-label="Next branch"
    :disabled="totalBranches <= 1"
    size="xs"
    type="button"
    variant="ghost"
    v-bind="$attrs"
    @click="goToNext"
  >
    <slot>
      <ChevronRightIcon :size="14" />
    </slot>
  </Button>
</template>
