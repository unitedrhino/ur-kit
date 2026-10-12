<!-- 文件说明：编辑嵌套结构体定义。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import {
  NButton,
  NInput,
  NInputNumber,
  NSelect,
  NTable,
} from 'naive-ui'
import { computed, defineAsyncComponent } from 'vue'

import type { Define, Spec } from './schema-types'

import { DATA_TYPE_OPTIONS, initDefineByType } from './constants'
import XArrayDefinition from './x-array-definition.vue'
import XBoolDefinition from './x-bool-definition.vue'
import XEnumDefinition from './x-enum-definition.vue'
import XNumberDefinition from './x-number-definition.vue'

const XStructDefinition = defineAsyncComponent(() => import('./x-struct-definition.vue'))

defineOptions({ name: 'XStructDefinition', inheritAttrs: false })

const props = defineProps<{ modelValue: Define }>()
const emit = defineEmits<{ 'update:modelValue': [Define] }>()

const specs = computed({
  get: () => props.modelValue?.specs ?? [],
  set: (v: Spec[]) => {
    const next = { ...props.modelValue }
    next.specs = v
    emit('update:modelValue', next)
  },
})

function ensureSpecs() {
  if (!props.modelValue?.specs?.length) {
    const next = { ...props.modelValue }
    next.specs = [{ identifier: '', name: '', dataType: initDefineByType('bool') as Define }]
    emit('update:modelValue', next)
  }
}

function addRow() {
  ensureSpecs()
  const list = [...(specs.value ?? [])]
  list.push({
    identifier: '',
    name: '',
    dataType: initDefineByType('bool') as Define,
  })
  specs.value = list
}

function removeRow(index: number) {
  const list = [...(specs.value ?? [])]
  list.splice(index, 1)
  specs.value = list
}

function updateSpec(index: number, field: 'name' | 'identifier' | 'dataType', value: string | Define) {
  const list = [...(specs.value ?? [])]
  if (!list[index]) return
  if (field === 'dataType') {
    list[index].dataType = value as Define
  } else {
    list[index][field] = value as string
  }
  specs.value = list
}
</script>

<template>
  <div class="x-struct-definition">
    <NTable :bordered="false" :single-line="false" size="small" class="struct-def-table">
      <thead>
        <tr>
          <th>{{ $t('iotApp.schemaForm.paramName') }}</th>
          <th>{{ $t('iotApp.schemaForm.paramIdentifier') }}</th>
          <th>{{ $t('iotApp.schemaForm.dataTypeLabel') }}</th>
          <th>{{ $t('iotApp.schemaForm.dataDefinition') }}</th>
          <th class="w-14">{{ $t('iotApp.schemaForm.paramAction') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(spec, idx) in (specs ?? [])" :key="idx">
          <td>
            <NInput
              :value="spec.name ?? ''"
              size="small"
              :placeholder="$t('iotApp.schemaForm.paramName')"
              class="w-full"
              @update:value="(v) => updateSpec(idx, 'name', v ?? '')"
            />
          </td>
          <td>
            <NInput
              :value="spec.identifier ?? ''"
              size="small"
              :placeholder="$t('iotApp.schemaForm.paramIdentifier')"
              class="w-full"
              @update:value="(v) => updateSpec(idx, 'identifier', v ?? '')"
            />
          </td>
          <td>
            <NSelect
              :value="(spec.dataType as Define)?.type ?? 'bool'"
              :options="DATA_TYPE_OPTIONS"
              size="small"
              class="min-w-[90px] w-full"
              @update:value="(v) => updateSpec(idx, 'dataType', initDefineByType((v ?? 'bool') as Define['type']))"
            />
          </td>
          <td>
            <template v-if="(spec.dataType as Define)?.type === 'bool'">
              <XBoolDefinition
                :model-value="spec.dataType as Define"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'int'">
              <XNumberDefinition
                :model-value="spec.dataType as Define"
                :is-float="false"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'float'">
              <XNumberDefinition
                :model-value="spec.dataType as Define"
                :is-float="true"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'string'">
              <NInputNumber
                :value="Number((spec.dataType as Define)?.max) || 2048"
                :min="1"
                :max="2048"
                size="small"
                :placeholder="$t('iotApp.schemaForm.stringMaxPlaceholder')"
                class="max-w-[120px] w-full"
                @update:value="(v) => updateSpec(idx, 'dataType', { ...spec.dataType, type: 'string', max: String(v ?? 2048) })"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'enum'">
              <XEnumDefinition
                :model-value="spec.dataType as Define"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'timestamp'">
              <span class="text-xs text-gray-500">{{ $t('iotApp.schemaForm.utcHint') }}</span>
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'array'">
              <XArrayDefinition
                :model-value="spec.dataType as Define"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
            <template v-else-if="(spec.dataType as Define)?.type === 'struct'">
              <XStructDefinition
                :model-value="spec.dataType as Define"
                @update:model-value="(v) => updateSpec(idx, 'dataType', v)"
              />
            </template>
          </td>
          <td>
            <NButton type="primary" text size="small" @click="removeRow(idx)">
              {{ $t('iotApp.schemaForm.delete') }}
            </NButton>
          </td>
        </tr>
      </tbody>
    </NTable>
    <NButton type="primary" ghost size="small" class="mt-2" @click="addRow">
      <span class="icon-[carbon--add] mr-1" />
      {{ $t('iotApp.schemaForm.addParam') }}
    </NButton>
  </div>
</template>

<style scoped>
.struct-def-table :deep(th),
.struct-def-table :deep(td) {
  padding: 6px 8px;
  vertical-align: middle;
}
</style>
