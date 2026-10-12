<!-- 文件说明：编辑数值范围和步长定义。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import { NInput, NInputNumber, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import type { Define } from './schema-types'

defineOptions({ name: 'XNumberDefinition', inheritAttrs: false })

const props = defineProps<{
  modelValue: Define
  isFloat?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [Define] }>()

const precision = computed(() => (props.isFloat ? 3 : 0))

function toNum(v: string | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function update(field: 'min' | 'max' | 'start' | 'step' | 'unit', value: string | number | null | undefined) {
  const next = { ...props.modelValue }
  const str = typeof value === 'number' ? (Number.isNaN(value) ? '' : String(value)) : (value ?? '')
  if (field === 'min') next.min = str
  else if (field === 'max') next.max = str
  else if (field === 'start') next.start = str
  else if (field === 'step') next.step = str
  else if (field === 'unit') next.unit = str
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="x-number-definition flex flex-col gap-3">
    <div>
      <div class="mb-1 text-xs text-gray-500">{{ $t('iotApp.schemaForm.numberRange') }}</div>
      <div class="flex items-center gap-2">
        <NInputNumber
          :value="toNum(modelValue.min)"
          :precision="precision"
          size="small"
          :placeholder="$t('iotApp.schemaForm.minValue')"
          class="min-w-0 flex-1"
          @update:value="(v) => update('min', v)"
        />
        <span class="shrink-0 text-gray-400">-</span>
        <NInputNumber
          :value="toNum(modelValue.max)"
          :precision="precision"
          size="small"
          :placeholder="$t('iotApp.schemaForm.maxValue')"
          class="min-w-0 flex-1"
          @update:value="(v) => update('max', v)"
        />
      </div>
    </div>
    <div>
      <div class="mb-1 text-xs text-gray-500">{{ $t('iotApp.schemaForm.startValue') }}</div>
      <NInputNumber
        :value="toNum(modelValue.start)"
        :precision="precision"
        size="small"
        :placeholder="$t('iotApp.schemaForm.startValue')"
        class="w-full"
        @update:value="(v) => update('start', v)"
      />
    </div>
    <div>
      <div class="mb-1 flex items-center gap-1">
        <span class="text-xs text-gray-500">{{ $t('iotApp.schemaForm.stepLabel') }}</span>
        <NTooltip>
          <template #trigger>
            <span class="icon-[lucide--circle-help] ml-1 size-4 cursor-help opacity-50" />
          </template>
          {{ $t('iotApp.schemaForm.stepTooltip') }}
        </NTooltip>
      </div>
      <NInputNumber
        :value="toNum(modelValue.step)"
        :precision="precision"
        size="small"
        :placeholder="$t('iotApp.schemaForm.stepLabel')"
        class="w-full"
        @update:value="(v) => update('step', v)"
      />
    </div>
    <div>
      <div class="mb-1 text-xs text-gray-500">{{ $t('iotApp.schemaForm.unitLabel') }}</div>
      <NInput
        :value="modelValue.unit ?? ''"
        size="small"
        :placeholder="$t('iotApp.schemaForm.unitLabel')"
        maxlength="12"
        show-count
        class="w-full"
        @update:value="(v) => update('unit', v)"
      />
    </div>
  </div>
</template>
