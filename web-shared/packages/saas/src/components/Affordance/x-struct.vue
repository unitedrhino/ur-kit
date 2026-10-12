<!-- 文件说明：编辑结构体及事件、行为参数列表。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import type { FormItemRule } from 'naive-ui'
import {
  NButton,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NTable,
} from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { proInputProps, useProField } from 'pro-naive-ui'

import type { Define } from './schema-types'

import { DATA_TYPE_OPTIONS, initDefineByType } from './constants'
import XArrayDefinition from './x-array-definition.vue'
import XBoolDefinition from './x-bool-definition.vue'
import XEnumDefinition from './x-enum-definition.vue'
import XNumberDefinition from './x-number-definition.vue'
import XStructDefinition from './x-struct-definition.vue'
import { getStructRowsValidationError } from './utils'

defineOptions({ name: 'XStruct', inheritAttrs: false })

/** 数据定义字段名：dataType 用于 Spec[]（属性结构体），define 用于 Param[]（事件/行为参数） */
const props = defineProps({
  ...proInputProps,
  defineKey: {
    type: String as () => 'dataType' | 'define',
    default: 'dataType',
  },
})
const { field } = useProField(props)

const defineKey = computed(() => props.defineKey ?? 'dataType')

/** 行数据：Spec 或 Param，通过 defineKey 访问数据定义 */
const specsRef = ref<Array<Record<string, unknown>>>([])

const rule = computed<FormItemRule | undefined>(() => {
  return {
    required: props.required,
    validator(_rule, value: unknown) {
      // 事件/行为参数（define key）允许为空，属性结构体（dataType key）不允许为空
      const allowEmpty = defineKey.value === 'define'
      const error = getStructRowsValidationError(value, Boolean(props.required), allowEmpty)
      if (error) return new Error(error)
      return true
    },
    trigger: ['blur', 'input'],
  }
})

function writeSpecs(arr: Array<Record<string, unknown>>) {
  field.value.value = arr
}

function syncFromForm() {
  const val = field.value?.value
  specsRef.value = Array.isArray(val) ? [...val] : []
}

function addRow() {
  const list = specsRef.value
  const key = defineKey.value
  const newRow: Record<string, unknown> = {
    identifier: '',
    name: '',
  }
  // 只有属性结构体（dataType key）才默认填充 define
  // 事件/行为参数（define key）不默认填充，允许不定义数据类型
  if (key === 'dataType') {
    newRow[key] = {
      type: 'bool',
      mapping: { '0': '关', '1': '开' },
    } as Define
  }
  list.push(newRow)
  writeSpecs(list)
}

function removeRow(index: number) {
  const list = specsRef.value
  list.splice(index, 1)
  writeSpecs(list)
}

function updateName(index: number, val: string | null) {
  const list = specsRef.value
  if (!list[index]) return
  list[index].name = val ?? ''
  writeSpecs(list)
}

function updateIdentifier(index: number, val: string | null) {
  const list = specsRef.value
  if (!list[index]) return
  list[index].identifier = val ?? ''
  writeSpecs(list)
}

function updateDataType(index: number, val: string | null) {
  const list = specsRef.value
  if (!list[index]) return
  const type = (val ?? 'bool') as Define['type']
  list[index][defineKey.value] = initDefineByType(type)
  writeSpecs(list)
}

function updateDataDefine(index: number, payload: Define) {
  const list = specsRef.value
  if (!list[index]) return
  list[index][defineKey.value] = payload
  writeSpecs([...list])
}

function getDefine(item: Record<string, unknown>): Define | undefined {
  return item[defineKey.value] as Define | undefined
}

onMounted(() => {
  syncFromForm()
  // 属性结构体（dataType）为空时自动添加占位行，方便用户填写
  // 事件/行为参数（define）允许为空，不自动填充占位行，避免触发"请至少添加一个参数"校验
  if (specsRef.value.length === 0 && defineKey.value === 'dataType') {
    addRow()
  }
})
watch(() => field.value?.value, syncFromForm, { deep: true })

const formItemProps = computed(() => ({
  label: props.title ?? props.label,
  path: props.path,
  required: props.required,
  rule: rule.value,
}))
</script>

<template>
  <NFormItem v-bind="formItemProps" class="x-struct">
    <div class="flex flex-col gap-4">
      <div class="min-w-0 flex-1 overflow-x-auto">
        <NTable :bordered="false" :single-line="false" class="x-struct-table">
          <thead>
            <tr>
              <th>{{ $t('iotApp.schemaForm.paramName') }}</th>
              <th>{{ $t('iotApp.schemaForm.paramIdentifier') }}</th>
              <th>{{ $t('iotApp.schemaForm.dataTypeLabel') }}</th>
              <th class="min-w-[200px]">{{ $t('iotApp.schemaForm.dataDefinition') }}</th>
              <th class="w-16">{{ $t('iotApp.schemaForm.paramAction') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in specsRef" :key="index">
              <td>
                <NInput
                  :value="(item.name as string) ?? ''"
                  size="small"
                  :placeholder="$t('iotApp.schemaForm.paramNamePlaceholder')"
                  class="w-full"
                  @update:value="(v) => updateName(index, v)"
                />
              </td>
              <td>
                <NInput
                  :value="(item.identifier as string) ?? ''"
                  size="small"
                  :placeholder="$t('iotApp.schemaForm.paramIdentifierPlaceholder')"
                  class="w-full"
                  @update:value="(v) => updateIdentifier(index, v)"
                />
              </td>
              <td>
                <NSelect
                  :value="getDefine(item)?.type ?? 'bool'"
                  :options="DATA_TYPE_OPTIONS"
                  size="small"
                  class="min-w-[100px] w-full"
                  @update:value="(v) => updateDataType(index, v)"
                />
              </td>
              <td class="align-top">
                <!-- define 为空时，显示选择数据类型的下拉框 -->
                <template v-if="!getDefine(item)">
                  <NSelect
                    value=""
                    :options="DATA_TYPE_OPTIONS"
                    size="small"
                    class="min-w-[100px] w-full"
                    :placeholder="$t('iotApp.schemaForm.selectDataType')"
                    @update:value="(v) => updateDataType(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'bool'">
                  <XBoolDefinition
                    :model-value="getDefine(item) as Define"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'int'">
                  <XNumberDefinition
                    :model-value="getDefine(item) as Define"
                    :is-float="false"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'float'">
                  <XNumberDefinition
                    :model-value="getDefine(item) as Define"
                    :is-float="true"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'string'">
                  <div>
                    <div class="flex items-center gap-2">
                      <NInputNumber
                        :value="Number(getDefine(item)?.max) || 2048"
                        :min="1"
                        :max="2048"
                        size="small"
                        :placeholder="$t('iotApp.schemaForm.stringMaxPlaceholder')"
                        class="max-w-[120px]"
                        @update:value="(v) => updateDataDefine(index, { ...(getDefine(item) ?? {}), type: 'string', max: String(v ?? 2048) })"
                      />
                      <span class="text-xs text-gray-500">{{ $t('iotApp.schemaForm.bytesUnit') }}</span>
                    </div>
                    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {{ $t('iotApp.schemaForm.stringLenTooltip') }}
                    </p>
                  </div>
                </template>
                <template v-else-if="getDefine(item)?.type === 'enum'">
                  <XEnumDefinition
                    :model-value="getDefine(item) as Define"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'timestamp'">
                  <span class="text-xs text-gray-500">{{ $t('iotApp.schemaForm.utcHint') }}</span>
                </template>
                <template v-else-if="getDefine(item)?.type === 'array'">
                  <XArrayDefinition
                    :model-value="getDefine(item) as Define"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
                <template v-else-if="getDefine(item)?.type === 'struct'">
                  <XStructDefinition
                    :model-value="getDefine(item) as Define"
                    @update:model-value="(v) => updateDataDefine(index, v)"
                  />
                </template>
              </td>
              <td>
                <NButton type="primary" text size="small" @click="removeRow(index)">
                  {{ $t('iotApp.schemaForm.delete') }}
                </NButton>
              </td>
            </tr>
          </tbody>
        </NTable>
        <!-- <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {{ $t('iotApp.schemaForm.identifierHint') }}
        </p> -->
        <NButton type="primary" ghost size="small" class="mt-2" @click="addRow">
          <span class="icon-[carbon--add] mr-1" />
          {{ $t('iotApp.schemaForm.addParam') }}
        </NButton>
      </div>
    </div>
  </NFormItem>
</template>

<style scoped>
.x-struct-table :deep(th),
.x-struct-table :deep(td) {
  padding: 8px 12px;
  vertical-align: middle;
}
</style>
