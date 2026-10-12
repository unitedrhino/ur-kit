<!--
  文件说明：FormRenderer — 通用审批表单渲染器（跨页面复用，放 saas 业务包）。
  输入 form_schema（设计方案 2.6 契约）+ mode(edit/readonly) + formPermissions(字段级权限)
  + 初始值 variable；组件映射 saas-ui 既有 UI；校验 VeeValidate+Zod（useFormRender）。

  使用方式：
  - 编辑态：模板 ref → await ref.validate() 通过后 ref.getValues() 取扁平值提交；
  - 只读态：mode="readonly"，全部字段文本化展示（hidden 字段依旧隐藏）；
  - fields 运行时可变场景（如发起 Drawer 切换流程）请用 :key 重建组件。
-->
<script setup lang="ts">
import type { FlowFieldOption, FlowFieldPerm, FlowFieldSchema, FlowFormSchema, FlowRenderMode } from './types';

import { ref } from 'vue';

import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Label } from '@unitedrhino/saas-ui/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Switch } from '@unitedrhino/saas-ui/ui/switch';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@unitedrhino/saas-ui/ui/toggle-group';

import { uploadFile } from '../../../api/upload';
import DeptPickerField from './pickers/dept-picker-field.vue';
import UserPickerField from './pickers/user-picker-field.vue';
import { useFormRender } from './use-form-render';

const props = withDefaults(
  defineProps<{
    /** 编辑态是否禁用全部控件（如提交中） */
    disabled?: boolean;
    /** 字段级权限（get-detail 按当前节点计算返回；未配置字段默认 readonly） */
    formPermissions?: FlowFieldPerm[];
    /** 渲染模式：edit 可编辑 / readonly 全只读 */
    mode: FlowRenderMode;
    /** 初始表单值（instance.variable 扁平对象） */
    modelValue?: Record<string, any>;
    /** 表单 schema（form_schema 契约结构） */
    schema: FlowFormSchema;
  }>(),
  {
    formPermissions: undefined,
    modelValue: undefined,
    disabled: false,
  },
);

// 表单校验与权限决策（fields 视为挂载期固定；可变场景由父级 :key 重建）
const { form, errors, validate, getValues, setValues, visibleFields, editable, permMap } = useFormRender({
  schema: props.schema,
  mode: props.mode,
  formPermissions: props.formPermissions,
  initialValues: props.modelValue,
});

/** 上传中字段集合（key → uploading） */
const uploadingKeys = ref<Set<string>>(new Set());

/** 原生 file input 引用表（key → HTMLInputElement） */
const fileInputs = ref<Record<string, HTMLInputElement | null>>({});

/** 判断某字段在当前模式下是否可编辑（模式 × 字段权限 × 外层 disabled）。
 *  无权限映射时（formPermissions 未下发，如发起人填表场景）默认可编辑。 */
function isFieldEditable(field: FlowFieldSchema): boolean {
  if (!editable || props.disabled) return false;
  if (permMap.size === 0) return true;
  return permMap.get(field.key) === 'editable';
}

/** 读字段值（vee-validate values 为 reactive 对象）。 */
function fieldValue(field: FlowFieldSchema): any {
  return (form.values as Record<string, any>)[field.key];
}

/** 写字段值（整体校验在提交时执行，输入过程不打断）。 */
function setFieldValue(field: FlowFieldSchema, value: any) {
  form.setFieldValue(field.key, value, false);
}

/** 选项列表读取（select/radio/checkbox/dict 通用）。 */
function fieldOptions(field: FlowFieldSchema): FlowFieldOption[] {
  return field.componentProps?.options ?? [];
}

/**
 * displayValue 将字段值文本化（只读态展示）。
 * select/radio/checkbox/dict 按 options 反查 label；其余数组顿号连接。
 * 注意 user/dept 只读展示为原始 ID：名称反查需额外接口支持（见 TODO，SDK 对齐时补）。
 */
/** cascaderFirst 取级联值一级 value（值格式 "一级/二级"）。 */
function cascaderFirst(value: any): string {
  return String(value ?? '').split('/')[0] ?? '';
}

/** cascaderSecond 取级联值二级 value。 */
function cascaderSecond(value: any): string {
  return String(value ?? '').split('/')[1] ?? '';
}

/** cascaderChildren 取一级选项的二级列表（componentProps.options 项带 children）。 */
function cascaderChildren(field: FlowFieldSchema, firstValue: string): FlowFieldOption[] {
  const first = fieldOptions(field).find((o) => o.value === firstValue);
  return ((first as unknown as { children?: FlowFieldOption[] })?.children ?? []) as FlowFieldOption[];
}

/** transferPicked 已选中选项列表。 */
function transferPicked(field: FlowFieldSchema, value: any): FlowFieldOption[] {
  const picked = Array.isArray(value) ? value.map(String) : [];
  return fieldOptions(field).filter((o) => picked.includes(o.value));
}

/** transferAvailable 未选中选项列表。 */
function transferAvailable(field: FlowFieldSchema, value: any): FlowFieldOption[] {
  const picked = Array.isArray(value) ? value.map(String) : [];
  return fieldOptions(field).filter((o) => !picked.includes(o.value));
}

/** transferPick 穿梭框加入选项。 */
function transferPick(field: FlowFieldSchema, optionValue: string) {
  const picked = Array.isArray(fieldValue(field)) ? fieldValue(field).map(String) : [];
  if (!picked.includes(optionValue)) setFieldValue(field, [...picked, optionValue]);
}

/** transferUnpick 穿梭框移除选项。 */
function transferUnpick(field: FlowFieldSchema, optionValue: string) {
  const picked = Array.isArray(fieldValue(field)) ? fieldValue(field).map(String) : [];
  setFieldValue(
    field,
    picked.filter((v: string) => v !== optionValue),
  );
}

function displayValue(field: FlowFieldSchema, value: any): string {
  if (field.component === 'switch') return value === true ? '开' : '关';
  if (field.component === 'rate') return value === undefined || value === null || value === '' ? '-' : `${Number(value)} 分`;
  if (field.component === 'color') return value ? String(value) : '-';
  if (field.component === 'password') return value ? '••••••' : '-';
  if (field.component === 'transfer') {
    return Array.isArray(value) ? value.map((v: any) => fieldOptions(field).find((o) => o.value === v)?.label ?? v).join('、') || '-' : '-';
  }
  if (field.component === 'cascader') return value ? String(value).split('/').join(' / ') : '-';
  if (value === undefined || value === null || value === '') return '-';
  const opts = fieldOptions(field);
  const toLabel = (v: any) => opts.find((o) => o.value === String(v))?.label ?? String(v);
  if (Array.isArray(value)) return value.length === 0 ? '-' : value.map((item) => toLabel(item)).join('、');
  return toLabel(value);
}

/** fileNameFromUrl 从上传返回的 URL/路径中提取展示文件名。 */
function fileNameFromUrl(url: string): string {
  const pure = url.split('?')[0] ?? url;
  return pure.split('/').pop() || url;
}

/** triggerUpload 触发某字段的文件选择。 */
function triggerUpload(field: FlowFieldSchema) {
  fileInputs.value[field.key]?.click();
}

/** handleUpload 执行上传并把返回 URL 写入字段值。 */
async function handleUpload(field: FlowFieldSchema, event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  if (files.length === 0) return;
  uploadingKeys.value.add(field.key);
  try {
    const urls: string[] = [];
    for (const file of files) {
      const resp: any = await uploadFile(file);
      urls.push(resp?.fileUri || resp?.filePath || '');
    }
    const valid = urls.filter(Boolean);
    const multiple = field.componentProps?.multiple === true;
    const prev = fieldValue(field);
    if (multiple) {
      let prevList: string[] = [];
      if (Array.isArray(prev)) prevList = prev;
      else if (prev) prevList = [prev];
      const next = [...prevList, ...valid];
      setFieldValue(field, next);
    } else {
      setFieldValue(field, valid[0] ?? '');
    }
  } finally {
    uploadingKeys.value.delete(field.key);
    input.value = '';
  }
}

/** removeUpload 移除一个已上传文件。 */
function removeUpload(field: FlowFieldSchema, url: string) {
  const prev = fieldValue(field);
  if (Array.isArray(prev)) {
    setFieldValue(
      field,
      prev.filter((v: string) => v !== url),
    );
  } else {
    setFieldValue(field, '');
  }
}

/** uploadList 归一化上传字段值为 URL 数组（展示用）。 */
function uploadList(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [String(value)] : [];
}

/** validateForm 整体校验，返回是否通过（父级提交前调用）。 */
async function validateForm(): Promise<boolean> {
  return await validate();
}

/** getFormValues 读取当前表单值（扁平对象，父级提交用）。 */
function getFormValues(): Record<string, any> {
  return getValues();
}

/** setFormValues 批量回填表单值（详情回显用）。 */
function setFormValues(values: Record<string, any>) {
  setValues(values);
}

// 对父级暴露校验与取值入口
defineExpose({ validate: validateForm, getValues: getFormValues, setValues: setFormValues });
</script>

<template>
  <div>
    <!-- 表单说明（设计器"表单配置"维护，展示在表单顶部） -->
    <p v-if="schema.description" class="text-muted-foreground mb-3 text-sm" data-testid="flow-form-description">
      {{ schema.description }}
    </p>
    <div class="grid grid-cols-2 gap-4">
      <div v-for="field in visibleFields" :key="field.key" class="space-y-1.5" :class="field.span === 12 ? 'col-span-1' : 'col-span-2'">
        <!-- 说明文字：纯展示组件，不录入数据、无校验 -->
        <div v-if="field.component === 'text'" class="bg-muted/40 text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
          {{ field.componentProps?.text || field.label }}
        </div>
        <template v-else>
          <Label :for="`flow-field-${field.key}`" class="text-foreground text-sm font-medium">
            {{ field.label }}
            <span v-if="field.required && isFieldEditable(field)" class="text-destructive">*</span>
          </Label>

          <!-- ============ 编辑态控件 ============ -->
          <template v-if="isFieldEditable(field)">
            <!-- 文本输入 -->
            <Input
              v-if="field.component === 'input'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              type="text"
              :placeholder="field.componentProps?.placeholder"
              :maxlength="field.componentProps?.maxLength"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            />
            <!-- 多行文本 -->
            <Textarea
              v-else-if="field.component === 'textarea'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              :placeholder="field.componentProps?.placeholder"
              :maxlength="field.componentProps?.maxLength"
              :rows="3"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            />
            <!-- 数值 -->
            <Input
              v-else-if="field.component === 'number'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              type="number"
              :placeholder="field.componentProps?.placeholder"
              :min="field.componentProps?.min"
              :max="field.componentProps?.max"
              @update:model-value="(v: any) => setFieldValue(field, v === '' ? '' : Number(v))"
            />
            <!-- 下拉选择（值一律字符串） -->
            <Select
              v-else-if="field.component === 'select' || field.component === 'dict'"
              :model-value="fieldValue(field) === undefined || fieldValue(field) === null ? '' : String(fieldValue(field))"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            >
              <SelectTrigger :id="`flow-field-${field.key}`" class="w-full">
                <SelectValue :placeholder="field.componentProps?.placeholder || '请选择'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in fieldOptions(field)" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <!-- 单选（saas-ui 无 radio，用 ToggleGroup 单选语义等价实现） -->
            <ToggleGroup
              v-else-if="field.component === 'radio'"
              type="single"
              :model-value="fieldValue(field) === undefined || fieldValue(field) === null ? '' : String(fieldValue(field))"
              class="flex-wrap justify-start"
              @update:model-value="(v: any) => setFieldValue(field, v ?? '')"
            >
              <ToggleGroupItem v-for="opt in fieldOptions(field)" :key="opt.value" :value="opt.value" variant="outline" class="px-3">
                {{ opt.label }}
              </ToggleGroupItem>
            </ToggleGroup>
            <!-- 多选（有 options 时为多选组；无 options 时单个布尔勾选） -->
            <template v-else-if="field.component === 'checkbox'">
              <ToggleGroup
                v-if="fieldOptions(field).length > 0"
                type="multiple"
                :model-value="(Array.isArray(fieldValue(field)) ? fieldValue(field) : fieldValue(field) ? [fieldValue(field)] : []).map(String)"
                class="flex-wrap justify-start"
                @update:model-value="(v: any) => setFieldValue(field, v)"
              >
                <ToggleGroupItem v-for="opt in fieldOptions(field)" :key="opt.value" :value="opt.value" variant="outline" class="px-3">
                  {{ opt.label }}
                </ToggleGroupItem>
              </ToggleGroup>
              <label v-else class="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox :model-value="fieldValue(field) === true" @update:model-value="(v: any) => setFieldValue(field, v === true)" />
                {{ field.componentProps?.placeholder || field.label }}
              </label>
            </template>
            <!-- 日期（原生 date 控件，值为 YYYY-MM-DD 字符串） -->
            <Input
              v-else-if="field.component === 'date'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              type="date"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            />
            <!-- 日期区间（值为 [start, end] 字符串数组） -->
            <div v-else-if="field.component === 'range'" class="flex items-center gap-2">
              <Input
                type="date"
                :model-value="(fieldValue(field)?.[0] as string) || ''"
                aria-label="开始日期"
                @update:model-value="(v: any) => setFieldValue(field, [v, (fieldValue(field)?.[1] as string) || ''])"
              />
              <span class="text-muted-foreground text-sm">至</span>
              <Input
                type="date"
                :model-value="(fieldValue(field)?.[1] as string) || ''"
                aria-label="结束日期"
                @update:model-value="(v: any) => setFieldValue(field, [(fieldValue(field)?.[0] as string) || '', v])"
              />
            </div>
            <!-- 时间（原生 time 控件，值为 HH:mm 字符串） -->
            <Input
              v-else-if="field.component === 'time'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              type="time"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            />
            <!-- 级联选择（两级联动 Select，值 "一级/二级" 路径字符串） -->
            <template v-else-if="field.component === 'cascader'">
              <div class="flex items-center gap-2">
                <Select
                  :model-value="cascaderFirst(fieldValue(field))"
                  @update:model-value="
                    (v: any) => {
                      const kids = cascaderChildren(field, String(v));
                      setFieldValue(field, kids.length > 0 ? `${v}/${kids[0]!.value}` : String(v));
                    }
                  "
                >
                  <SelectTrigger :id="`flow-field-${field.key}`" class="w-full">
                    <SelectValue :placeholder="field.componentProps?.placeholder || '请选择'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in fieldOptions(field)" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  :model-value="cascaderSecond(fieldValue(field))"
                  :disabled="cascaderChildren(field, cascaderFirst(fieldValue(field))).length === 0"
                  @update:model-value="(v: any) => setFieldValue(field, `${cascaderFirst(fieldValue(field))}/${v}`)"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="field.componentProps?.secondPlaceholder || '请选择二级'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="opt in cascaderChildren(field, cascaderFirst(fieldValue(field)))" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </template>
            <!-- 穿梭框（options 全量选项，值为选中 value 数组；两列点击移动） -->
            <div v-else-if="field.component === 'transfer'" class="grid grid-cols-2 gap-2">
              <div class="border-border rounded-md border p-2">
                <p class="text-muted-foreground mb-1 text-xs">未选（{{ transferAvailable(field, fieldValue(field)).length }}）</p>
                <button
                  v-for="opt in transferAvailable(field, fieldValue(field))"
                  :key="opt.value"
                  type="button"
                  class="hover:bg-accent block w-full rounded px-2 py-1 text-left text-sm"
                  @click="transferPick(field, opt.value)"
                >
                  {{ opt.label }}
                </button>
                <span v-if="transferAvailable(field, fieldValue(field)).length === 0" class="text-muted-foreground block px-2 py-1 text-xs">已全部选择</span>
              </div>
              <div class="border-primary/30 rounded-md border p-2">
                <p class="text-muted-foreground mb-1 text-xs">已选（{{ transferPicked(field, fieldValue(field)).length }}）</p>
                <button
                  v-for="opt in transferPicked(field, fieldValue(field))"
                  :key="opt.value"
                  type="button"
                  class="hover:bg-accent block w-full rounded px-2 py-1 text-left text-sm"
                  @click="transferUnpick(field, opt.value)"
                >
                  {{ opt.label }}
                </button>
                <span v-if="transferPicked(field, fieldValue(field)).length === 0" class="text-muted-foreground block px-2 py-1 text-xs">点击左侧选项添加</span>
              </div>
            </div>
            <!-- 开关（布尔值） -->
            <Switch
              v-else-if="field.component === 'switch'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field) === true"
              @update:model-value="(v: any) => setFieldValue(field, v === true)"
            />
            <!-- 评分（1-5 星，值 number） -->
            <div v-else-if="field.component === 'rate'" class="flex items-center gap-1">
              <button v-for="star in 5" :key="star" type="button" :aria-label="`${star} 分`" class="p-0.5" @click="setFieldValue(field, star)">
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  :fill="(Number(fieldValue(field)) ?? 0) >= star ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="1.6"
                  :class="(Number(fieldValue(field)) ?? 0) >= star ? 'text-amber-400' : 'text-muted-foreground/50'"
                >
                  <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6L12 16.8 6.6 19.7l1.1-6L3.2 9.4l6.1-.8L12 3Z" />
                </svg>
              </button>
              <span class="text-muted-foreground ml-1 text-sm">{{ Number(fieldValue(field)) || 0 }} 分</span>
            </div>
            <!-- 滑块（min/max/step，值 number） -->
            <div v-else-if="field.component === 'slider'" class="flex items-center gap-3">
              <input
                :id="`flow-field-${field.key}`"
                type="range"
                class="accent-primary w-full"
                :min="field.componentProps?.min ?? 0"
                :max="field.componentProps?.max ?? 100"
                :step="field.componentProps?.step ?? 1"
                :value="Number(fieldValue(field)) || Number(field.componentProps?.min ?? 0)"
                @input="(e: any) => setFieldValue(field, Number(e.target.value))"
              />
              <span class="w-10 text-right text-sm">{{ Number(fieldValue(field)) || Number(field.componentProps?.min ?? 0) }}</span>
            </div>
            <!-- 颜色选择器（值 HEX 字符串） -->
            <div v-else-if="field.component === 'color'" class="flex items-center gap-2">
              <input
                :id="`flow-field-${field.key}`"
                type="color"
                class="border-input h-8 w-14 cursor-pointer rounded-md border"
                :value="fieldValue(field) || '#ffffff'"
                @input="(e: any) => setFieldValue(field, e.target.value)"
              />
              <span class="text-muted-foreground font-mono text-xs">{{ fieldValue(field) || '未选择' }}</span>
            </div>
            <!-- 密码（掩码输入） -->
            <Input
              v-else-if="field.component === 'password'"
              :id="`flow-field-${field.key}`"
              :model-value="fieldValue(field)"
              type="password"
              :placeholder="field.componentProps?.placeholder"
              :maxlength="field.componentProps?.maxLength"
              @update:model-value="(v: any) => setFieldValue(field, v)"
            />
            <!-- 选人 -->
            <UserPickerField
              v-else-if="field.component === 'user'"
              :model-value="fieldValue(field)"
              :multiple="field.componentProps?.multiple === true"
              :placeholder="field.componentProps?.placeholder || '点击选择人员'"
              @update:model-value="(v) => setFieldValue(field, v)"
            />
            <!-- 选部门 -->
            <DeptPickerField
              v-else-if="field.component === 'dept'"
              :model-value="fieldValue(field)"
              :multiple="field.componentProps?.multiple === true"
              :placeholder="field.componentProps?.placeholder || '点击选择部门'"
              @update:model-value="(v) => setFieldValue(field, v)"
            />
            <!-- 上传（值为文件 URL；multiple 为 string[]） -->
            <template v-else-if="field.component === 'upload'">
              <input
                :ref="(el) => (fileInputs[field.key] = el as HTMLInputElement)"
                type="file"
                class="hidden"
                :multiple="field.componentProps?.multiple === true"
                @change="handleUpload(field, $event)"
              />
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="border-border hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
                  :disabled="uploadingKeys.has(field.key)"
                  @click="triggerUpload(field)"
                >
                  {{ uploadingKeys.has(field.key) ? '上传中...' : '上传文件' }}
                </button>
                <span v-for="url in uploadList(fieldValue(field))" :key="url" class="bg-muted flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                  {{ fileNameFromUrl(url) }}
                  <button type="button" class="text-muted-foreground hover:text-foreground" @click="removeUpload(field, url)">×</button>
                </span>
              </div>
            </template>
            <!-- 未知组件兜底：按只读文本展示 -->
            <div v-else class="text-muted-foreground text-sm">暂不支持的组件类型：{{ field.component }}</div>
          </template>

          <!-- ============ 只读展示 ============ -->
          <template v-else>
            <div v-if="field.component === 'upload'" class="flex flex-wrap gap-2">
              <a
                v-for="url in uploadList(fieldValue(field))"
                :key="url"
                :href="url"
                target="_blank"
                rel="noreferrer"
                class="bg-muted text-foreground rounded-full px-2 py-0.5 text-xs underline"
              >
                {{ fileNameFromUrl(url) }}
              </a>
              <span v-if="uploadList(fieldValue(field)).length === 0" class="text-muted-foreground text-sm">-</span>
            </div>
            <div v-else class="text-foreground text-sm">{{ displayValue(field, fieldValue(field)) }}</div>
          </template>

          <!-- 校验错误 -->
          <p v-if="errors[field.key]" class="text-destructive text-xs">{{ errors[field.key] }}</p>
          <p v-else-if="field.description" class="text-muted-foreground text-xs">{{ field.description }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
