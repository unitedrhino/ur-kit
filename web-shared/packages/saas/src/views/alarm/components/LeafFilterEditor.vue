<script setup lang="ts">
/**
 * 文件说明：事件与行为原始记录参数过滤编辑器。
 * 过滤条件只作用于窗口内候选记录，之后再执行是否发生或次数统计。
 */
import type { Cmp, CmpType, SchemaField } from '../types/alarm-v2.types';

import { computed } from 'vue';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Input } from '@unitedrhino/saas-ui/ui/input';

import { CmpTypeList } from '../types/alarm-v2.types';
import AlarmSelect from './AlarmSelect.vue';

const props = defineProps<{
  /** 当前事件或行为定义的参数字段。 */
  fields?: SchemaField[];
  /** 是否存在需要阻断保存的参数过滤错误。 */
  invalid?: boolean;
  /** 是否禁止修改过滤条件。 */
  readonly?: boolean;
  /** 当前原始记录过滤条件。 */
  terms?: Cmp[];
}>();

const emit = defineEmits<{
  /** 过滤条件变化后提交完整列表。 */
  (event: 'update:terms', value: Cmp[]): void;
}>();

/** fieldOptions 提供当前事件或行为允许过滤的参数。 */
const fieldOptions = computed(() =>
  (props.fields ?? []).map((field) => ({
    label: field.unit ? `${field.name}（${field.unit}）` : field.name,
    value: field.dataID,
  })),
);

/** updateTerm 更新指定过滤条件并保持父级数据不可变。 */
function updateTerm(index: number, patch: Partial<Cmp>): void {
  const terms = [...(props.terms ?? [])];
  const current = terms[index];
  if (!current) return;
  terms[index] = { ...current, ...patch };
  emit('update:terms', terms);
}

/** addTerm 以第一个参数创建可立即编辑的等值过滤条件。 */
function addTerm(): void {
  const field = props.fields?.[0];
  if (!field || props.readonly) return;
  emit('update:terms', [
    ...(props.terms ?? []),
    { column: field.dataID, termType: 'eq', values: [''] },
  ]);
}

/** removeTerm 删除指定参数过滤条件。 */
function removeTerm(index: number): void {
  if (props.readonly) return;
  emit(
    'update:terms',
    (props.terms ?? []).filter((_, termIndex) => termIndex !== index),
  );
}

/** onCompareChange 切换比较方式时同步所需的值数量。 */
function onCompareChange(index: number, termType: CmpType): void {
  const firstValue = props.terms?.[index]?.values[0] ?? '';
  updateTerm(index, {
    termType,
    values: termType === 'btw' ? [firstValue, ''] : [firstValue],
  });
}

/** onValueChange 更新过滤条件中的指定比较值。 */
function onValueChange(index: number, value: string, valueIndex = 0): void {
  const values = [...(props.terms?.[index]?.values ?? [])];
  values[valueIndex] = value;
  updateTerm(index, { values });
}

/** onListValuesChange 把逗号分隔输入转换为列表比较值。 */
function onListValuesChange(index: number, value: string): void {
  updateTerm(index, {
    values: value
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
  });
}
</script>

<template>
  <div
    v-if="fieldOptions.length > 0"
    class="border-border/70 basis-full rounded-md border border-dashed px-3 py-2"
    :class="invalid ? '!border-destructive bg-destructive/5' : ''"
  >
    <div class="mb-2 flex items-center justify-between gap-3">
      <span class="text-muted-foreground text-xs">参数过滤（先过滤原始记录，再统计）</span>
      <Button
        v-if="!readonly"
        class="h-auto px-1 py-0.5"
        size="xs"
        variant="link"
        @click="addTerm"
      >
        ＋ 添加参数过滤
      </Button>
    </div>

    <div
      v-for="(term, index) in terms ?? []"
      :key="`${term.column}-${index}`"
      class="mb-2 flex flex-wrap items-center gap-2 last:mb-0"
    >
      <AlarmSelect
        :model-value="term.column"
        :disabled="readonly"
        class="h-8 min-w-32 text-xs"
        :options="fieldOptions"
        @update:model-value="updateTerm(index, { column: String($event) })"
      />
      <AlarmSelect
        :model-value="term.termType"
        :disabled="readonly"
        class="h-8 w-24 text-xs"
        :options="CmpTypeList"
        @update:model-value="onCompareChange(index, $event as CmpType)"
      />
      <Input
        v-if="term.termType === 'in'"
        :model-value="term.values.join('，')"
        :disabled="readonly"
        class="h-8 min-w-40 text-xs"
        placeholder="多个值用逗号分隔"
        @update:model-value="onListValuesChange(index, String($event))"
      />
      <Input
        v-else
        :model-value="term.values[0]"
        :disabled="readonly"
        class="h-8 w-28 text-xs"
        :placeholder="term.termType === 'btw' ? '起始值' : '过滤值'"
        @update:model-value="onValueChange(index, String($event))"
      />
      <template v-if="term.termType === 'btw'">
        <span class="text-muted-foreground text-xs">至</span>
        <Input
          :model-value="term.values[1]"
          :disabled="readonly"
          class="h-8 w-28 text-xs"
          placeholder="结束值"
          @update:model-value="onValueChange(index, String($event), 1)"
        />
      </template>
      <Button
        v-if="!readonly"
        class="text-destructive"
        size="xs"
        variant="ghost"
        @click="removeTerm(index)"
      >
        删除
      </Button>
    </div>
  </div>
</template>
