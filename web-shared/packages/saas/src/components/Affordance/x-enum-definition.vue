<!-- 文件说明：编辑枚举定义与选项。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import { NButton, NInput, NInputNumber } from 'naive-ui'
import { onMounted, ref, watch } from 'vue'

import type { Define } from './schema-types'

defineOptions({ name: 'XEnumDefinition', inheritAttrs: false })

const props = defineProps<{ modelValue: Define }>()
const emit = defineEmits<{ 'update:modelValue': [Define] }>()

type EnumItem = { key: number; value: string }

const listRef = ref<EnumItem[]>([])

function mappingToArray(m: Record<string, string> | undefined): EnumItem[] {
  if (!m || typeof m !== 'object') return []
  return Object.entries(m).map(([k, v]) => ({
    key: Number(k),
    value: String(v ?? ''),
  }))
}

function arrayToMapping(arr: EnumItem[]): Record<string, string> {
  const obj: Record<string, string> = {}
  arr.forEach((item) => {
    const k = String(item.key)
    if (k !== '' && !Number.isNaN(Number(k))) obj[k] = String(item.value ?? '')
  })
  return obj
}

function nextKey(arr: EnumItem[]): number {
  if (arr.length === 0) return 1
  const keys = arr.map((x) => Number(x?.key) || 0).filter((n) => !Number.isNaN(n))
  return keys.length ? Math.max(...keys) + 1 : 1
}

function writeMapping(arr: EnumItem[]) {
  const next = { ...props.modelValue }
  next.mapping = arrayToMapping(arr)
  emit('update:modelValue', next)
}

function syncFromModel() {
  listRef.value = mappingToArray(props.modelValue?.mapping)
}

function addRow() {
  const list = listRef.value
  const k = nextKey(list)
  list.push({ key: k, value: `选项${k}` })
  writeMapping(list)
}

function removeRow(index: number) {
  const list = listRef.value
  list.splice(index, 1)
  writeMapping(list)
}

function copyRow(index: number, sourceItem: EnumItem) {
  const list = listRef.value
  if (!list[index]) return
  const desc = String(sourceItem?.value ?? list[index]?.value ?? '').trim()
  const k = nextKey(list)
  list.splice(index + 1, 0, { key: k, value: desc || `选项${k}` })
  writeMapping(list)
}

function updateKey(index: number, val: number | null) {
  const list = listRef.value
  if (!list[index]) return
  list[index].key = val ?? 0
  writeMapping(list)
}

function updateValue(index: number, val: string | null) {
  const list = listRef.value
  if (!list[index]) return
  list[index].value = val ?? ''
  writeMapping(list)
}

onMounted(() => {
  syncFromModel()
  if (listRef.value.length === 0) {
    listRef.value = [{ key: 1, value: '选项1' }]
    writeMapping(listRef.value)
  }
})
watch(() => props.modelValue?.mapping, syncFromModel, { deep: true })
</script>

<template>
  <div class="x-enum-definition flex flex-col gap-3">
    <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2 text-sm text-gray-500">
      <span>{{ $t('iotApp.schemaForm.enumKey') }}</span>
      <span>{{ $t('iotApp.schemaForm.enumDesc') }}</span>
      <span class="w-20" />
    </div>
    <div
      v-for="(item, index) in listRef"
      :key="`${item.key}-${index}`"
      class="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
    >
      <NInputNumber
        :value="Number(item?.key) || undefined"
        size="small"
        :placeholder="$t('iotApp.schemaForm.enumKeyPlaceholder')"
        class="w-full"
        @update:value="(v) => updateKey(index, v)"
      />
      <NInput
        :value="item?.value ?? ''"
        size="small"
        :placeholder="$t('iotApp.schemaForm.enumDescPlaceholder')"
        @update:value="(v) => updateValue(index, v ?? '')"
      />
      <div class="flex w-20 shrink-0 items-center gap-1">
        <NButton quaternary size="small" :title="$t('iotApp.schemaForm.copy')" @click="copyRow(index, item)">
          <span class="icon-[carbon--copy] text-base" />
        </NButton>
        <NButton quaternary size="small" :title="$t('iotApp.schemaForm.delete')" @click="removeRow(index)">
          <span class="icon-[carbon--trash-can] text-base" />
        </NButton>
      </div>
    </div>
    <NButton type="primary" ghost size="small" block @click="addRow">
      <span class="icon-[carbon--add] mr-1" />
      {{ $t('iotApp.schemaForm.addEnumItem') }}
    </NButton>
  </div>
</template>
