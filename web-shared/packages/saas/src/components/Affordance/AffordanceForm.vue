<!-- 文件说明：编辑物模型属性、事件和行为的公共表单。 -->
<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@vben/saas';
import { preferences } from '@vben/preferences';
import { ProDigit, ProInput, ProRadioGroup, ProSelect, ProTextarea } from 'pro-naive-ui';
import { NCollapse, NCollapseItem, NFlex } from 'naive-ui';

import {
  arrayElementTypeOptions,
  controlModeOptions,
  dataTypeOptions,
  eventDirOptions,
  eventTypeOptions,
  funcGroupOptions,
  initDefineByType,
  isPasswordOptions,
  modeOptions,
  recordModeOptions,
  sceneLinkageOptions,
  schemaTypeOptions,
  shadowTypeOptions,
} from './constants';
import type { AffordanceFormInstance } from './form-types';
import type { PropertyAffordance } from './schema-types';
import XBoolMapping from './x-bool-mapping.vue';
import XDigital from './x-digital.vue';
import XEnumMapping from './x-enum-mapping.vue';
import XStruct from './x-struct.vue';

// 定义 props
const props = withDefaults(
  defineProps<{
    isCreate: boolean;
    form: AffordanceFormInstance;
    /** 可选类型，如 [1] 仅属性（设备物模型），[1,2,3] 全部，默认全部 */
    allowedSchemaTypes?: number[];
    /** 属性下可用的数据类型，如 ['bool','int','string','float','enum','timestamp'] 排除结构体/数组，默认全部 */
    allowedDataTypes?: string[];
    /** 标识符是否可编辑，默认跟随 isCreate（新建时可编辑，编辑时不可编辑） */
    identifierEditable?: boolean;
  }>(),
  { allowedSchemaTypes: () => [1, 2, 3], allowedDataTypes: undefined, identifierEditable: undefined },
);

const form = props.form;

/** 标识符是否可编辑：如果明确指定 identifierEditable 则使用，否则跟随 isCreate */
const isIdentifierEditable = computed(() => {
  if (props.identifierEditable !== undefined) {
    return props.identifierEditable;
  }
  return props.isCreate;
});

/** 从 form 派生的当前值，用于条件渲染 */
const currentType = computed(() => form?.values?.value?.type);
const currentDataType = computed(() => (form?.values?.value?.affordance as PropertyAffordance | undefined)?.define?.type);
const currentArrayType = computed(() => (form?.values?.value?.affordance as PropertyAffordance | undefined)?.define?.arrayInfo?.type);

/** 动态类型选项：按 allowedSchemaTypes 过滤，编辑时非当前项禁用 */
const schemaTypeOptionsComputed = computed(() => {
  // 当前语言变化时重新生成选项，避免模块初始化时的语言被缓存。
  void preferences.app.locale;
  const allowed = props.allowedSchemaTypes ?? [1, 2, 3];
  const current = currentType.value;
  const isEdit = !props.isCreate;
  // 编辑时需包含当前类型，否则无法正确展示已选值
  const typeValues = isEdit && current != null ? [...new Set([...allowed, current])] : allowed;
  return schemaTypeOptions
    .filter((opt) => typeValues.includes(opt.value as number))
    .map((opt) => ({
      ...opt,
      label: $t(`iotApp.schemaForm.${opt.value === 1 ? 'property' : opt.value === 2 ? 'event' : 'action'}`),
      disabled: isEdit && opt.value !== current,
    }));
});

/** 动态数据类型选项：按 allowedDataTypes 过滤，编辑时可重新选择 */
const dataTypeOptionsComputed = computed(() => {
  void preferences.app.locale;
  const allowed = props.allowedDataTypes;
  const current = currentDataType.value;
  const isEdit = !props.isCreate;
  let typeValues: string[];
  if (allowed == null || allowed.length === 0) {
    typeValues = dataTypeOptions.map((o) => o.value as string);
  } else {
    typeValues =
      isEdit && current ? [...new Set([...allowed, current])] : allowed;
  }
  return dataTypeOptions
    .filter((opt) => typeValues.includes(opt.value as string))
    .map((opt) => ({
      ...opt,
      disabled: false, // 编辑时也允许重新选择数据类型
    }));
});

function handleDataTypeChange(value: string) {
  const aff = form.values.value?.affordance as PropertyAffordance | undefined;
  if (!aff?.define) return;
  if (value === 'bool') {
    aff.define = initDefineByType('bool');
  } else if (value === 'float') {
    aff.define = initDefineByType('float');
  } else if (value === 'int') {
    aff.define = initDefineByType('int');
  } else if (value === 'string') {
    aff.define = initDefineByType('string');
  }
  if (value === 'enum') {
    aff.define.mapping = { '1': '选项1' };
  }
  if (value === 'struct') {
    aff.define.specs = [
      { name: '', identifier: '', dataType: initDefineByType('bool') },
    ];
  }
  if (value === 'array') {
    aff.define.max = '10';
    aff.define.arrayInfo = initDefineByType('int');
  }
  if (value === 'matrix') {
    aff.define = initDefineByType('matrix');
  }
}

function handleArrayTypeChange(value: string) {
  const aff = form.values.value?.affordance as PropertyAffordance | undefined;
  if (aff?.define) {
    aff.define.arrayInfo = initDefineByType(value as 'bool' | 'int' | 'float' | 'string' | 'enum' | 'struct');
  }
}

function handleTypeChange(value: number) {
  if (value === 1) {
    const aff = form.values.value?.affordance as { mode?: string } | undefined;
    if (aff && aff.mode === undefined) aff.mode = 'rw';
  }
  if (value === 2) {
    const aff = form.values.value?.affordance as { type?: string; dir?: string } | undefined;
    if (aff) {
      aff.type = 'alert';
      if (aff.dir === undefined) aff.dir = 'up';
    }
  }
  if (value === 3) {
    const aff = form.values.value?.affordance as { dir?: string } | undefined;
    if (aff && aff.dir === undefined) aff.dir = 'down';
  }
}
</script>

<template>
  <!--
    物模型表单布局（按 type 分块）：
    - 公共：type / name / identifier
    - 属性 type=1：define（数据类型 + 按类型展示的 define 字段）
    - 事件 type=2：affordance.type + params
    - 行为 type=3：input + output
    - 公共：recordMode / 其他配置（模型特性、order、extendConfig、desc）
  -->
  <!-- ========== 公共字段（所有类型共用）========== -->
  <ProRadioGroup path="type" :title="$t('iot.schema.type')"
    :field-props="{ options: schemaTypeOptionsComputed, type: 'button' }" required @change="handleTypeChange" />
  <NFlex>
    <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="name" :title="$t('iot.schema.name')" :tooltip="$t('iotApp.schemaForm.nameTooltip')" required />
    <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="identifier" :readonly="!isIdentifierEditable" :title="$t('iot.schema.identifier')"
      :tooltip="$t('iotApp.schemaForm.identifierTooltip')" required />
  </NFlex>

  <!-- ========== 属性 type=1：数据定义 ========== -->
  <template v-if="currentType === 1">
    <!-- 属性-数据类型选择 -->
    <NFlex>
      <ProRadioGroup path="affordance.define.type" :tooltip="$t('iotApp.schemaForm.arrayMatrixTooltip')" :title="$t('iot.schema.dataTypeDefine')"
        :field-props="{ options: dataTypeOptionsComputed, type: 'button' }" required @change="handleDataTypeChange" />
      <template v-if="currentDataType === 'array'">
        <XDigital path="affordance.define.max" :title="$t('iot.schema.arrayLength')" :min="1" :max="10"
          :tooltip="$t('iotApp.schemaForm.arrayLengthTooltip')" required />
      </template>
    </NFlex>

    <!-- 属性-读写类型 -->
    <ProRadioGroup path="affordance.mode" :title="$t('iot.schema.mode')"
      :field-props="{ options: modeOptions, type: 'button' }"
      :tooltip="$t('iotApp.schemaForm.modeHelp')" />

    <!-- 属性-define：按数据类型展示 -->
    <!-- define.type=bool -->
    <template v-if="currentDataType === 'bool'">
      <XBoolMapping path="affordance.define" :title="$t('iotApp.schemaForm.boolMapping')" required />
      <NFlex>
        <XDigital path="affordance.define.start" :title="$t('iot.schema.initialValue')" :min="0" :max="1" />
      </NFlex>
    </template>
    <!-- define.type=int -->
    <template v-if="currentDataType === 'int'">
      <NFlex>
        <XDigital path="affordance.define.min" :title="$t('iot.schema.minValue')" :precision="0" required />
        <XDigital path="affordance.define.max" :title="$t('iot.schema.maxValue')" :precision="0" required />
        <XDigital path="affordance.define.start" :title="$t('iot.schema.initialValue')" :precision="0" required />
        <XDigital path="affordance.define.step" :title="$t('iot.schema.step')" :precision="0"
          :tooltip="$t('iotApp.schemaForm.stepTooltip')" required />
        <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.unit" :title="$t('iot.schema.unit')" :tooltip="$t('iotApp.schemaForm.unitTooltip')" />
      </NFlex>
    </template>
    <!-- define.type=float -->
    <template v-if="currentDataType === 'float'">
      <NFlex>
        <XDigital path="affordance.define.min" :title="$t('iot.schema.minValue')" :precision="3" required />
        <XDigital path="affordance.define.max" :title="$t('iot.schema.maxValue')" :precision="3" required />
        <XDigital path="affordance.define.start" :title="$t('iot.schema.initialValue')" :precision="3" required />
        <XDigital path="affordance.define.step" :title="$t('iot.schema.step')" :precision="3"
          :tooltip="$t('iotApp.schemaForm.stepTooltip')" required />
        <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.unit" :title="$t('iot.schema.unit')" :tooltip="$t('iotApp.schemaForm.unitTooltip')" />
      </NFlex>
    </template>
    <!-- define.type=string -->
    <template v-if="currentDataType === 'string'">
      <NFlex>
        <XDigital path="affordance.define.max" :title="$t('iot.schema.stringLength')" :min="1" :max="2048" :suffix="$t('iotApp.schemaForm.bytesUnit')"
          :tooltip="$t('iotApp.schemaForm.stringLenTooltip')" required />
      </NFlex>
    </template>
    <!-- define.type=enum -->
    <template v-if="currentDataType === 'enum'">
      <XEnumMapping path="affordance.define.mapping" :title="$t('iot.schema.enumMapping')" required />
    </template>
    <!-- define.type=timestamp：UTC 秒级时间戳，无需额外配置 -->
    <template v-if="currentDataType === 'timestamp'">
      <div class="mb-4 flex flex-col gap-2">
        <div>{{ $t('iotApp.schemaForm.dataDefinition') }}</div>
        <div class="min-w-0">
          <div>{{ $t('iotApp.schemaForm.utcHint') }}</div>
        </div>
      </div>
    </template>
    <!-- define.type=struct -->
    <template v-if="currentDataType === 'struct'">
      <XStruct path="affordance.define.specs" :title="$t('iot.schema.structParams')" required />
    </template>
    <!-- define.type=array / matrix：数组有长度，矩阵无长度；二者共用元素类型及后续配置 -->
    <template v-if="currentDataType === 'array' || currentDataType === 'matrix'">
      <NFlex>
        <ProSelect
          :placeholder="$t('iotApp.schemaForm.selectDataType')"
          path="affordance.define.arrayInfo.type"
          :title="currentDataType === 'matrix' ? $t('iotApp.schemaForm.matrixType') : $t('iot.schema.arrayType')"
          :tooltip="currentDataType === 'matrix' ? $t('iotApp.schemaForm.matrixTooltip') : undefined"
          :field-props="{ options: arrayElementTypeOptions, consistentMenuWidth: false }"
          required
          @change="handleArrayTypeChange"
        />
      </NFlex>
      <!-- 数组元素 arrayInfo 按元素类型展示 -->
      <!-- arrayInfo.type=int -->
      <template v-if="currentArrayType === 'int'">
        <NFlex>
          <XDigital path="affordance.define.arrayInfo.min" :title="$t('iotApp.schemaForm.minValue')" :precision="0" />
          <XDigital path="affordance.define.arrayInfo.max" :title="$t('iotApp.schemaForm.maxValue')" :precision="0" />
          <XDigital path="affordance.define.arrayInfo.start" :title="$t('iotApp.schemaForm.startValue')" :precision="0" />
          <XDigital path="affordance.define.arrayInfo.step" :title="$t('iotApp.schemaForm.stepLabel')" :precision="0" />
          <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.arrayInfo.unit" :title="$t('iotApp.schemaForm.unitLabel')" />
        </NFlex>
      </template>
      <!-- arrayInfo.type=float -->
      <template v-if="currentArrayType === 'float'">
        <NFlex>
          <XDigital path="affordance.define.arrayInfo.min" :title="$t('iotApp.schemaForm.minValue')" :precision="3" />
          <XDigital path="affordance.define.arrayInfo.max" :title="$t('iotApp.schemaForm.maxValue')" :precision="3" />
          <XDigital path="affordance.define.arrayInfo.start" :title="$t('iotApp.schemaForm.startValue')" :precision="3" />
          <XDigital path="affordance.define.arrayInfo.step" :title="$t('iotApp.schemaForm.stepLabel')" :precision="3" />
          <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.arrayInfo.unit" :title="$t('iotApp.schemaForm.unitLabel')" />
        </NFlex>
      </template>
      <!-- arrayInfo.type=string -->
      <template v-if="currentArrayType === 'string'">
        <XDigital path="affordance.define.arrayInfo.max" :title="$t('iotApp.schemaForm.maxLenLabel')" :min="1" :max="2048" :suffix="$t('iotApp.schemaForm.bytesUnit')" />
      </template>
      <!-- arrayInfo.type=bool -->
      <template v-if="currentArrayType === 'bool'">
        <NFlex>
          <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.arrayInfo.mapping.0" :title="$t('iotApp.schemaForm.bool0Mapping')" />
          <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="affordance.define.arrayInfo.mapping.1" :title="$t('iotApp.schemaForm.bool1Mapping')" />
          <XDigital path="affordance.define.arrayInfo.start" :title="$t('iotApp.schemaForm.startValue')" :min="0" :max="1" />
        </NFlex>
      </template>
      <!-- arrayInfo.type=enum -->
      <template v-if="currentArrayType === 'enum'">
        <XEnumMapping path="affordance.define.arrayInfo.mapping" :title="$t('iotApp.schemaForm.enumMapping')" required />
      </template>
      <!-- arrayInfo.type=struct -->
      <template v-if="currentArrayType === 'struct'">
        <XStruct path="affordance.define.arrayInfo.specs" :title="$t('iotApp.schemaForm.structParams')" required />
      </template>
    </template>
  </template>

  <!-- ========== 事件 type=2：事件类型 + 通知方向 + 事件参数 ========== -->
  <template v-if="currentType === 2">
    <ProRadioGroup path="affordance.type" :title="$t('iot.schema.eventType')"
      :field-props="{ options: eventTypeOptions, type: 'button' }" required />
    <ProRadioGroup path="affordance.dir" :title="$t('iotApp.schemaForm.eventDirection')" :tooltip="$t('iotApp.schemaForm.eventDirectionTooltip')"
      :field-props="{ options: eventDirOptions, type: 'button' }" required />

    <XStruct path="affordance.params" :title="$t('iot.schema.callParams')" define-key="define" required />
  </template>

  <!-- ========== 行为 type=3：执行方向 + 调用参数 + 返回参数 ========== -->
  <template v-if="currentType === 3">
    <ProRadioGroup path="affordance.dir" :title="$t('iotApp.schemaForm.executionDirection')" :tooltip="$t('iotApp.schemaForm.dirTooltip')"
      :field-props="{ options: eventDirOptions, type: 'button' }" required />
    <XStruct path="affordance.input" :title="$t('iot.schema.callParams')" define-key="define" />
    <XStruct path="affordance.output" :title="$t('iot.schema.returnParams')" define-key="define" />
  </template>

  <!-- ========== 属性专用：记录模式 ========== -->
  <ProRadioGroup v-if="currentType === 1" path="affordance.recordMode" :title="$t('iotApp.schemaForm.recordModeLabel')"
    :field-props="{ options: recordModeOptions, type: 'button' }" />
  <NCollapse>
    <NCollapseItem :title="$t('iotApp.schemaForm.otherConfig')">
      <!-- 模型特性：属性专用 + 通用 -->
      <NFlex>
        <template v-if="currentType === 1">
          <ProRadioGroup path="affordance.isUseShadow" :title="$t('iotApp.schemaForm.featureShadow')" :tooltip="$t('iotApp.schemaForm.featureShadowTooltip')"
            :field-props="{ options: shadowTypeOptions, type: 'button' }" />
          <ProRadioGroup path="affordance.controlMode" :title="$t('iotApp.schemaForm.controlMode')" :tooltip="$t('iotApp.schemaForm.controlModeTooltip')"
            :field-props="{ options: controlModeOptions, type: 'button' }" />
        </template>
        <ProRadioGroup path="funcGroup" :title="$t('iotApp.schemaForm.featureSystemFunc')" :tooltip="$t('iotApp.schemaForm.featureSystemFuncTooltip')"
          :field-props="{ options: funcGroupOptions, type: 'button' }" />
        <ProRadioGroup v-if="currentType === 1" path="affordance.isPassword" :title="$t('iotApp.schemaForm.featurePassword')"
          :tooltip="$t('iotApp.schemaForm.featurePasswordTooltip')" :field-props="{ options: isPasswordOptions, type: 'button' }" />
        <ProRadioGroup   path="isCanSceneLinkage" :title="$t('iotApp.schemaForm.featureSceneLinkage')" :tooltip="$t('iotApp.schemaForm.featureSceneLinkageTooltip')"
          :field-props="{ options: sceneLinkageOptions, type: 'button' }" />
      </NFlex>
      <!-- 排序、拓展、描述 -->
      <ProDigit path="order" :title="$t('iot.schema.order')" />
      <ProTextarea :placeholder="$t('iotApp.schemaForm.requiredInput')" path="extendConfig" :title="$t('iot.schema.extendConfig')" rows="3" />
      <ProTextarea :placeholder="$t('iotApp.schemaForm.requiredInput')" path="desc" :title="$t('system.role.remark')" rows="3" />
    </NCollapseItem>
  </NCollapse>
</template>
