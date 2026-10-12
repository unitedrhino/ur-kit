<!-- 文件说明：编辑并验证枚举映射。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import type { FormItemRule } from 'naive-ui'
import { NButton, NFormItem, NInput, NInputNumber } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { proInputProps, useProField } from 'pro-naive-ui'

defineOptions({ name: 'XEnumMapping', inheritAttrs: false })

type EnumItem = { key: number; value: string }

const DEFAULT_FIRST_ITEM: EnumItem = { key: 1, value: '选项1' }

const props = defineProps(proInputProps)
const { field } = useProField(props)

const listRef = ref<EnumItem[]>([])

const rule = computed<FormItemRule | undefined>(() => {
  if (!props.required) return undefined
  return {
    required: true,
    validator(_rule, value: unknown) {
      const arr = mappingToArray(value)
      if (arr.length === 0) return new Error($t('iotApp.schemaForm.enumItemRequired'))
      const emptyIndex = arr.findIndex((item) => !String(item?.value ?? '').trim())
      if (emptyIndex !== -1) return new Error($t('iotApp.schemaForm.enumDescRequiredAt', { index: emptyIndex + 1 }))
    },
    trigger: ['blur', 'input'],
  }
})

function mappingToArray(m: unknown): EnumItem[] {
  if (m == null) return []
  if (Array.isArray(m)) return m as EnumItem[]
  if (typeof m === 'object' && !Array.isArray(m)) {
    return Object.entries(m as Record<string, string>).map(([k, v]) => ({
      key: Number(k),
      value: String(v ?? ''),
    }))
  }
  return []
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

function formatOptionLabel(k: number) {
  return `选项${k}`
}

function writeList(arr: EnumItem[]) {
  field.value.value = arrayToMapping(arr)
}

function syncFromForm() {
  listRef.value = mappingToArray(field.value?.value)
}

function addRow() {
  const list = listRef.value
  const k = nextKey(list)
  list.push({ key: k, value: formatOptionLabel(k) })
  writeList(list)
}

function copyRow(index: number, sourceItem: EnumItem) {
  const list = listRef.value
  if (!list[index]) return
  const desc = String(sourceItem?.value ?? list[index]?.value ?? '').trim()
  const k = nextKey(list)
  list.splice(index + 1, 0, { key: k, value: desc || formatOptionLabel(k) })
  writeList(list)
}

function removeRow(index: number) {
  const list = listRef.value
  list.splice(index, 1)
  writeList(list)
}

function updateKey(index: number, val: number | null) {
  const list = listRef.value
  if (!list[index]) return
  list[index].key = val ?? 0
  writeList(list)
}

function updateValue(index: number, val: string | null) {
  const list = listRef.value
  if (!list[index]) return
  list[index].value = val ?? ''
  writeList(list)
}

onMounted(() => {
  syncFromForm()
  if (listRef.value.length === 0) {
    listRef.value = [DEFAULT_FIRST_ITEM]
    writeList(listRef.value)
  }
})
watch(() => field.value?.value, syncFromForm, { deep: true })
</script>

<template>
  <NFormItem
    :label="props.title ?? props.label"
    :path="props.path"
    :required="props.required"
    :rule="rule"
    class="x-enum-mapping"
  >
    <div class="flex flex-col gap-3">
      <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2 text-sm text-gray-500">
        <span>{{ $t('iotApp.schemaForm.enumKey') }} <span v-if="props.required" class="text-red-500">*</span></span>
        <span>{{ $t('iotApp.schemaForm.enumDesc') }} <span v-if="props.required" class="text-red-500">*</span></span>
        <span class="w-20" />
      </div>
      <div
        v-for="(item, index) in listRef"
        :key="`${item.key}-${index}`"
        class="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
      >
        <NInputNumber
          :value="Number(item?.key) || undefined"
          :placeholder="$t('iotApp.schemaForm.enumKeyPlaceholder')"
          class="w-full"
          @update:value="(v) => updateKey(index, v)"
        />
        <NInput
          :value="item?.value ?? ''"
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
      <NButton type="primary" ghost block @click="addRow">
        <span class="icon-[carbon--add] mr-1" />
        {{ $t('iotApp.schemaForm.addEnumItem') }}
      </NButton>
    </div>
  </NFormItem>
</template>
