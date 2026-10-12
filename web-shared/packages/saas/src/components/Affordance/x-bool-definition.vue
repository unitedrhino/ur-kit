<!-- 文件说明：编辑布尔值映射定义。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import { NInput } from 'naive-ui'
import { computed } from 'vue'

import type { Define } from './schema-types'


defineOptions({ name: 'XBoolDefinition', inheritAttrs: false })

const props = defineProps<{ modelValue: Define }>()
const emit = defineEmits<{ 'update:modelValue': [Define] }>()

const mapping0 = computed(() => props.modelValue?.mapping?.['0'] ?? '关')
const mapping1 = computed(() => props.modelValue?.mapping?.['1'] ?? '开')

function updateMapping(key: '0' | '1', value: string) {
  const next = { ...props.modelValue }
  if (!next.mapping) next.mapping = {}
  next.mapping = { ...next.mapping, [key]: value ?? '' }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="x-bool-definition flex flex-col gap-2">
    <div class="flex gap-2">
      <div class="bool-input-wrap min-w-0 flex-1">
        <NInput
          :value="mapping0"
          size="small"
          :placeholder="$t('iotApp.schemaForm.shadowOff')"
          class="w-full"
          @update:value="(v) => updateMapping('0', v ?? '')"
        >
          <template #prefix>
            <span class="prefix-label">0</span>
          </template>
        </NInput>
      </div>
      <div class="bool-input-wrap min-w-0 flex-1">
        <NInput
          :value="mapping1"
          size="small"
          :placeholder="$t('iotApp.schemaForm.shadowOn')"
          class="w-full"
          @update:value="(v) => updateMapping('1', v ?? '')"
        >
          <template #prefix>
            <span class="prefix-label">1</span>
          </template>
        </NInput>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      {{ $t('iotApp.schemaForm.identifierHint') }}
    </p>
  </div>
</template>

<style scoped>
.prefix-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0 0.25rem;
  font-weight: 600;
  border-radius: var(--radius);
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  transition: background-color 0.2s ease, color 0.2s ease;
}

.bool-input-wrap:focus-within .prefix-label {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
</style>
