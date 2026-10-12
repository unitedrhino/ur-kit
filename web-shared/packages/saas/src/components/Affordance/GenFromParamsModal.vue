<!-- 文件说明：从参数 JSON 生成并预览物模型定义。 -->
<script lang="ts" setup>

import { Table as ResizableTable } from '@unitedrhino/saas-ui/ui/table';

import { notifyRequestError } from '@vben/saas/request-error';

import { ref, computed } from 'vue';
import { preferences } from '@vben/preferences';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NRadioGroup, NRadio, NSpace, NSteps, NStep, NInput } from 'naive-ui';

import { createProForm, ProForm } from 'pro-naive-ui';

import { $t, AceEditor } from '@vben/saas';
import { message } from '@vben/saas';

import { ThingsApi } from '@vben/api';

import AffordanceModal from './AffordanceModal.vue';
import AffordanceForm from './AffordanceForm.vue';

import { initDefineByType, schemaTypeEnum, schemaTypeOptions } from './constants';

import type { AffordanceFormData, SchemaGenItem } from './form-types';
import { formatDataDefinition, transformApiDataToFormData, transformFormData } from './utils';

const emit = defineEmits<{
  success: [];
  /** 点击「返回自定义」链接时触发，父组件关闭本 modal 并打开 AffordanceModal 新建表单 */
  backToCustom: [];
}>();

const props = withDefaults(
  defineProps<{
    /** 确认导入回调，父组件负责调用对应的批量创建 API；type 为物模型类型 1 属性 2 事件 3 行为 */
    onBatchConfirm?: (schemas: SchemaGenItem[], type: number) => Promise<void> | void;
    /** 可选类型限制，如 [1] 仅属性（设备物模型），默认 [1,2,3] 全部 */
    allowedSchemaTypes?: number[];
    /** 是否显示「返回自定义」链接，仅当从新建物模型表单的「从参数生成」进入时为 true，从工具栏打开时为 false */
    showBackToCustom?: boolean;
  }>(),
  { allowedSchemaTypes: () => [1, 2, 3], showBackToCustom: false },
);

const step = ref(1);
const type = ref(1);
const paramsJson = ref('{}');
const inputParamsJson = ref('{}');
const outputParamsJson = ref('{}');
const schemas = ref<SchemaGenItem[]>([]);
const generating = ref(false);
const importing = ref(false);
const paramsEditorRef = ref<InstanceType<typeof AceEditor>>();
const inputParamsEditorRef = ref<InstanceType<typeof AceEditor>>();
const outputParamsEditorRef = ref<InstanceType<typeof AceEditor>>();

const filteredSchemaTypeOptions = computed(() => {
  // 切换语言后重新读取类型名称，避免显示模块初始化时的旧文案。
  void preferences.app.locale;
  const allowed = props.allowedSchemaTypes ?? [1, 2, 3];
  return schemaTypeOptions.filter((o) => allowed.includes(o.value)).map((option) => ({
    ...option,
    label: $t(`iotApp.schemaForm.${option.value === 1 ? 'property' : option.value === 2 ? 'event' : 'action'}`),
  }));
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      step.value = 1;
      const allowed = props.allowedSchemaTypes ?? [1, 2, 3];
      type.value = allowed[0] ?? 1;
      paramsJson.value = '{}';
      inputParamsJson.value = '{}';
      outputParamsJson.value = '{}';
      schemas.value = [];
    } else {
      const allowed = props.allowedSchemaTypes ?? [1, 2, 3];
      type.value = allowed[0] ?? 1;
    }
  },
});

const typeLabel = computed(() => {
  const opt = filteredSchemaTypeOptions.value.find((o) => o.value === type.value);
  return opt?.label ?? '';
});

/** 是否为事件或行为（第二步使用内嵌表单而非表格） */
const isEventOrAction = computed(
  () =>
    type.value === schemaTypeEnum.EVENT || type.value === schemaTypeEnum.ACTION,
);

/** 事件/行为第二步内嵌表单（复用 AffordanceForm） */
const eventActionFormInitial: AffordanceFormData = {
  type: 1,
  name: '',
  identifier: '',
  desc: '',
  order: 0,
  extendConfig: '',
  funcGroup: 1,
  isCanSceneLinkage: 2,
  affordance: {
    define: { type: 'bool', mapping: { '0': '关', '1': '开' } },
    mode: 'rw',
    recordMode: 1,
    isUseShadow: false,
    controlMode: 1,
    isPassword: 2,
  } as any,
};
const eventActionForm = createProForm<AffordanceFormData>({
  initialValues: eventActionFormInitial,
  onReset: () => {},
  onSubmit: () => {},
  onSubmitFailed: () => {},
});

async function handleGenerate() {
  try {
    JSON.parse(paramsJson.value);
    if (type.value === schemaTypeEnum.ACTION) {
      JSON.parse(inputParamsJson.value);
      JSON.parse(outputParamsJson.value);
    }
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('iotApp.schemaForm.invalidJson'), (text) => message.error(text));
    return;
  }

  generating.value = true;
  try {
    const req: ThingsApi.CommonSchemaMockGenReq = {
      type: type.value,
    };
    if (type.value === schemaTypeEnum.ACTION) {
      req.inputParams = inputParamsJson.value;
      req.outputParams = outputParamsJson.value;
    } else {
      req.params = paramsJson.value;
    }

    const res = await ThingsApi.postApiV1ThingsSchemaCommonMockGen(req);
    const list = (res as any)?.data?.schemas ?? res?.schemas ?? [];
    if (list.length === 0) {
      message.warning($t('iotApp.schemaForm.noGeneratedSchema'));
      return;
    }
    schemas.value = list.map((item: SchemaGenItem) => ({
      ...item,
      name: item.name ?? item.identifier,
    }));
    step.value = 2;
    if (
      type.value === schemaTypeEnum.EVENT ||
      type.value === schemaTypeEnum.ACTION
    ) {
      syncEventActionFormFromSchemas();
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.message ?? $t('iotApp.schemaForm.generateFailed'), (text) => message.error(text));
  } finally {
    generating.value = false;
  }
}

/** 将 schemas[0] 同步到事件/行为内嵌表单（与 handleEdit 相同的 rawData 逻辑） */
function syncEventActionFormFromSchemas() {
  const item = schemas.value[0];
  if (!item) return;
  let affordanceObj: any;
  try {
    affordanceObj =
      typeof item.affordance === 'string'
        ? JSON.parse(item.affordance)
        : item.affordance;
  } catch {
    affordanceObj = {};
  }
  const define = affordanceObj?.define;
  const defineType = define?.type;
  if (define && defineType) {
    const defaults = initDefineByType(defineType);
    affordanceObj.define = { ...defaults, ...define };
  }
  const rawData = {
    type: type.value,
    name: '', // 事件/行为由用户自行填写
    identifier: '', // 事件/行为由用户自行填写
    desc: '',
    order: 0,
    extendConfig: '',
    funcGroup: 1,
    isCanSceneLinkage: 2,
    affordance: affordanceObj,
  };
  eventActionForm.values.value = transformApiDataToFormData(
    rawData,
  ) as AffordanceFormData;
}

function handleBack() {
  step.value = 1;
}

const [AffordanceModalComponent, affordanceModalApi] = useVbenModal({
  connectedComponent: AffordanceModal,
  destroyOnClose: true,
});

const editingIndex = ref(-1);

function handleEdit(item: SchemaGenItem, index: number) {
  editingIndex.value = index;
  let affordanceObj: any;
  try {
    affordanceObj =
      typeof item.affordance === 'string'
        ? JSON.parse(item.affordance)
        : item.affordance;
  } catch {
    affordanceObj = {};
  }
  const define = affordanceObj?.define;
  const defineType = define?.type;
  if (define && defineType) {
    const defaults = initDefineByType(defineType);
    affordanceObj.define = { ...defaults, ...define };
  }
  const rawData = {
    type: type.value,
    name: item.name ?? item.identifier,
    identifier: item.identifier,
    desc: '',
    order: 0,
    extendConfig: '',
    funcGroup: 1,
    isCanSceneLinkage: 2,
    affordance: affordanceObj,
  };
  affordanceModalApi
    .setState({ title: $t('iotApp.schemaForm.editIdentifier', { identifier: item.identifier }) })
    .setData(rawData)
    .open();
}

function handleAffordanceEditConfirm(data: any) {
  const idx = editingIndex.value;
  const list = schemas.value;
  if (idx >= 0 && idx < list.length) {
    const current = list[idx]!;
    const affordanceStr =
      typeof data.affordance === 'string'
        ? data.affordance
        : JSON.stringify(data.affordance ?? {});
    list[idx] = {
      identifier: data.identifier ?? current.identifier,
      name: data.name ?? current.name ?? current.identifier,
      affordance: affordanceStr,
    };
  }
  editingIndex.value = -1;
}

function handleDelete(index: number) {
  schemas.value = schemas.value.filter((_, i) => i !== index);
}

function handleIdentifierChange(index: number, value: string) {
  if (index >= 0 && index < schemas.value.length) {
    schemas.value[index]!.identifier = value;
  }
}

async function handleConfirmImport() {
  if (isEventOrAction.value) {
    const valid = await eventActionForm.validate();
    if (!valid) return;
    const data = transformFormData(eventActionForm.values.value) as any;
    const affordanceStr =
      typeof data.affordance === 'string'
        ? data.affordance
        : JSON.stringify(data.affordance ?? {});
    const item: SchemaGenItem = {
      identifier: data.identifier ?? '',
      name: data.name ?? schemas.value[0]?.name ?? data.identifier ?? '',
      affordance: affordanceStr,
    };
    if (schemas.value.length > 0) {
      schemas.value[0] = item;
    } else {
      schemas.value.push(item);
    }
  }
  if (schemas.value.length === 0) {
    message.warning($t('iotApp.schemaForm.nothingToImport'));
    return;
  }

  importing.value = true;
  try {
    if (props.onBatchConfirm) {
      await props.onBatchConfirm(schemas.value, type.value);
    }
    modalApi.close();
    emit('success');
  } catch (error: any) {
    notifyRequestError(error, () => error?.message ?? $t('iotApp.schemaForm.importFailed'), (text) => message.error(text));
  } finally {
    importing.value = false;
  }
}

function getAffordancePreview(affordance: string) {
  return formatDataDefinition(affordance);
}

function formatParamsJson() {
  formatEditorRef(paramsEditorRef);
}
function formatInputParamsJson() {
  formatEditorRef(inputParamsEditorRef);
}
function formatOutputParamsJson() {
  formatEditorRef(outputParamsEditorRef);
}
function formatEditorRef(editorRef: typeof paramsEditorRef) {
  const editor = editorRef.value as { format?: () => boolean } | null;
  if (!editor?.format) {
    message.error($t('iotApp.schemaForm.editorNotReady'));
    return;
  }
  const ok = editor.format();
  if (ok) {
    message.success($t('iotApp.schemaForm.formatSucceeded'));
  } else {
    message.error($t('iotApp.schemaForm.formatInvalidJson'));
  }
}

function handleBackToCustom() {
  modalApi.close();
  emit('backToCustom');
}

defineExpose({
  open: () => modalApi.open(),
  close: () => modalApi.close(),
});
</script>

<template>
  <Modal :class="step === 1 ? 'w-[900px]' : 'w-[1200px]'" :showConfirmButton="false" :showCancelButton="false">
    <template #title>
      <NSpace>
        <span>{{ $t('iotApp.schemaForm.generateSchemaTitle') }}</span>
        <a
          v-if="props.showBackToCustom"
          class="text-primary cursor-pointer text-sm whitespace-nowrap hover:underline"
          @click.prevent="handleBackToCustom"
        >
          {{ $t('iotApp.schemaForm.backToCustom') }}
        </a>
      </NSpace>
    </template>
    <NSteps :current="step" style="margin-bottom: 20px">
      <NStep :title="$t('iotApp.schemaForm.inputParamsStep')" :description="$t('iotApp.schemaForm.inputParamsStepDesc')" />
      <NStep :title="$t('iotApp.schemaForm.previewStep')" :description="$t('iotApp.schemaForm.previewStepDesc')" />
    </NSteps>

    <!-- Step 1: 输入参数 -->
    <div v-if="step === 1" class="flex flex-col gap-4">
      <div>
        <div class="text-sm font-medium mb-2">{{ $t('iotApp.schemaForm.schemaTypeLabel') }}</div>
        <NRadioGroup v-model:value="type">
          <NSpace>
            <NRadio
              v-for="opt in filteredSchemaTypeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
      </div>

      <div v-if="type === schemaTypeEnum.ACTION">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{{ $t('iotApp.schemaForm.inputParamsJson') }}</span>
          <NButton size="small" quaternary @click="formatInputParamsJson">
            {{ $t('iotApp.schemaForm.format') }}
          </NButton>
        </div>
        <AceEditor
          ref="inputParamsEditorRef"
          v-model="inputParamsJson"
          mode="json"
          theme="monokai"
          :height="220"
        />
        <div class="mt-3 mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{{ $t('iotApp.schemaForm.outputParamsJson') }}</span>
          <NButton size="small" quaternary @click="formatOutputParamsJson">
            {{ $t('iotApp.schemaForm.format') }}
          </NButton>
        </div>
        <AceEditor
          ref="outputParamsEditorRef"
          v-model="outputParamsJson"
          mode="json"
          theme="monokai"
          :height="220"
        />
      </div>
      <div v-else>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{{ $t('iotApp.schemaForm.paramsJson') }}</span>
          <NButton size="small" quaternary @click="formatParamsJson">
            {{ $t('iotApp.schemaForm.format') }}
          </NButton>
        </div>
        <AceEditor
          ref="paramsEditorRef"
          v-model="paramsJson"
          mode="json"
          theme="monokai"
          :height="400"
        />
      </div>

      <NButton type="primary" :loading="generating" @click="handleGenerate">
        {{ $t('iotApp.schemaForm.generateSchema') }}
      </NButton>
    </div>

    <!-- Step 2: 预览编辑 -->
    <div v-else class="flex flex-col gap-4">
      <!-- 属性：表格列表 -->
      <template v-if="type === schemaTypeEnum.PROPERTY">
        <div class="text-sm opacity-70">
          {{ $t('iotApp.schemaForm.generatedCount', { count: schemas.length, type: typeLabel }) }}
        </div>

        <div class="border rounded overflow-auto max-h-[400px]">
          <ResizableTable class="w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left">{{ $t('iotApp.schemaForm.paramIdentifier') }}</th>
                <th class="px-3 py-2 text-left">{{ $t('iotApp.schemaForm.dataDefinition') }}</th>
                <th class="px-3 py-2 w-24">{{ $t('iotApp.schemaForm.paramAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in schemas"
                :key="index"
                class="border-t dark:border-gray-700"
              >
                <td class="px-3 py-2">
                  <NInput
                    :value="item.identifier"
                    size="small"
                    class="font-mono"
                    :placeholder="$t('iotApp.schemaForm.paramIdentifier')"
                    @update:value="(v: string) => handleIdentifierChange(index, v)"
                  />
                </td>
                <td class="px-3 py-2 text-xs max-w-[300px] truncate" :title="getAffordancePreview(item.affordance)">
                  {{ getAffordancePreview(item.affordance) }}
                </td>
                <td class="px-3 py-2">
                  <NSpace size="small">
                    <NButton size="small" quaternary @click="handleEdit(item, index)">
                      {{ $t('iotApp.schemaForm.edit') }}
                    </NButton>
                    <NButton size="small" quaternary type="error" @click="handleDelete(index)">
                      {{ $t('iotApp.schemaForm.delete') }}
                    </NButton>
                  </NSpace>
                </td>
              </tr>
            </tbody>
          </ResizableTable>
        </div>
      </template>

      <!-- 事件/行为：内嵌表单（复用 AffordanceForm） -->
      <template v-else>
        <div class="text-sm opacity-70">
          {{ $t('iotApp.schemaForm.generatedOne', { type: typeLabel }) }}
        </div>
        <div class="flex pl-2 pr-2">
          <ProForm
            :form="eventActionForm"
            :loading="false"
            label-placement="top"
          >
            <AffordanceForm
              :isCreate="false"
              :form="eventActionForm"
              :allowed-schema-types="props.allowedSchemaTypes"
              :identifier-editable="true"
            />
          </ProForm>
        </div>
      </template>

      <NSpace>
        <NButton @click="handleBack">{{ $t('iotApp.schemaForm.backEditParams') }}</NButton>
        <NButton type="primary" :loading="importing" @click="handleConfirmImport">
          {{ $t('iotApp.schemaForm.confirmImport', { count: type === schemaTypeEnum.PROPERTY ? schemas.length : 1 }) }}
        </NButton>
      </NSpace>
    </div>

    <!-- 内嵌编辑单条的 AffordanceModal -->
    <AffordanceModalComponent
      :onConfirm="handleAffordanceEditConfirm"
      :isCreate="false"
      :identifierEditable="true"
      @success="editingIndex = -1"
    />
  </Modal>
</template>
