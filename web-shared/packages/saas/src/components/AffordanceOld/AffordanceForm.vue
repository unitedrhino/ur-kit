<script setup lang="ts">
import { h } from 'vue';
import { $t } from '@vben/saas';
import {
  ProInput,
  ProDigit,
  ProRadioGroup,
  ProTextarea,
  ProFormList,
  ProSelect,
  ProCheckboxGroup,
} from 'pro-naive-ui';

import {
  schemaTypeOptions,
  recordModeOptions,
  dataTypeOptions,
  dataTypeStructOptionsList,
  arrayElementTypeOptions,
  eventTypeOptions,
} from './constants';
import {
  NFlex,
  NGrid,
  NGridItem,
  NSpace,
  NTooltip,
  NCollapse,
  NCollapseItem,
} from 'naive-ui';

// 定义 props
const props = defineProps<{
  isCreate: boolean;
  form: any; // ProForm 实例
  currentType: any; // computed ref
  currentDataType: any; // computed ref
  currentArrayType: any; // computed ref
}>();

const form = props.form;

function handleDataTypeChange(value: string) {
  // console.log('value===========', value)
  if (value === 'bool') {
    form.values.value.affordance.define.mapping = { 0: '关', 1: '开' }
    form.values.value.affordance.define.start = 0
  }

  if (value === 'float') {
    form.values.value.affordance.define.step = 0.001
    form.values.value.affordance.define.min = 0.001
    form.values.value.affordance.define.max = 100.001
    form.values.value.affordance.define.start = 0.001
  }

  if (value === 'int') {
    form.values.value.affordance.define.step = 1
    form.values.value.affordance.define.min = 0
    form.values.value.affordance.define.max = 100
    form.values.value.affordance.define.start = 0
  }
  if (value === 'string') {
    form.values.value.affordance.define.max = 2048
    form.values.value.affordance.define.start = undefined
  }

  if (value === 'enum') {
    form.values.value.affordance.define.mappingList = []
    form.values.value.affordance.define.mappingList.push({ key: 1, value: '选项1' })
    form.values.value.affordance.define.start = 1
  }

  if (value === 'struct') {
    form.values.value.affordance.define.specs = []
    form.values.value.affordance.define.specs.push({
      name: '',
      identifier: '',
      dataType: {
        type: 'bool',
        mapping: {
          0: '关',
          1: '开',
        },
      },
    })
  }

  if (value === 'array') {
    form.values.value.affordance.define.max = 10
    form.values.value.affordance.define.arrayInfo = {
      type: 'int',
      min: 0,
      max: 100,
      step: 1,
      start: 0,
      unit: '',
    }
  }


}

// 处理结构体参数数据类型变化
function handleStructDataTypeChange(index: number, value: string) {
  console.log('结构体参数数据类型改变 - 索引:', index, '值:', value)

  // 可以在这里根据数据类型初始化默认值
  const specs = form.values.value.affordance?.define?.specs
  if (!specs || !specs[index]) return

  const currentSpec = specs[index]

  // 根据数据类型初始化默认值
  if (value === 'int') {
    currentSpec.dataType.min = 0
    currentSpec.dataType.max = 100
    currentSpec.dataType.step = 1
    currentSpec.dataType.start = 0
  } else if (value === 'float') {
    currentSpec.dataType.min = 0.000
    currentSpec.dataType.max = 100.000
    currentSpec.dataType.step = 0.001
    currentSpec.dataType.start = 0.000
  } else if (value === 'string') {
    currentSpec.dataType.max = 2048
  } else if (value === 'bool') {
    currentSpec.dataType.mapping = { 0: '关', 1: '开' }
    currentSpec.dataType.start = 0
  } else if (value === 'enum') {
    currentSpec.dataType.mappingList = []
    currentSpec.dataType.mappingList.push({ key: 1, value: '选项1' })
    currentSpec.dataType.start = 1
  } else if (value === 'array') {
    currentSpec.dataType.max = 10
    currentSpec.dataType.arrayInfo = { type: 'int' }
    currentSpec.dataType.arrayInfo.min = 0
    currentSpec.dataType.arrayInfo.max = 100
    currentSpec.dataType.arrayInfo.step = 1
    currentSpec.dataType.arrayInfo.start = 0
    currentSpec.dataType.arrayInfo.unit = ''
  }
}

function handleArrayTypeChange(value: string) {
  // console.log('value===========', value)
  if (value === 'bool') {
    form.values.value.affordance.define.arrayInfo.type = 'bool'
    form.values.value.affordance.define.arrayInfo.mapping = { 0: '关', 1: '开' }
    form.values.value.affordance.define.arrayInfo.start = 0
  }
  if (value === 'int') {
    form.values.value.affordance.define.arrayInfo.min = 0
    form.values.value.affordance.define.arrayInfo.max = 100
    form.values.value.affordance.define.arrayInfo.step = 1
    form.values.value.affordance.define.arrayInfo.start = 0
    form.values.value.affordance.define.arrayInfo.unit = ''
  }
  if (value === 'float') {
    form.values.value.affordance.define.arrayInfo.min = 0.000
    form.values.value.affordance.define.arrayInfo.max = 100.000
    form.values.value.affordance.define.arrayInfo.step = 0.001
    form.values.value.affordance.define.arrayInfo.start = 0.000
    form.values.value.affordance.define.arrayInfo.unit = ''
  }
  if (value === 'string') {
    form.values.value.affordance.define.arrayInfo.max = 2048
    form.values.value.affordance.define.arrayInfo.start = undefined
  }
  if (value === 'enum') {
    form.values.value.affordance.define.arrayInfo.mappingList = []
    form.values.value.affordance.define.arrayInfo.mappingList.push({ key: 1, value: '选项1' })
    form.values.value.affordance.define.arrayInfo.start = 1
  }
  if (value === 'struct') {
    form.values.value.affordance.define.arrayInfo.specs = []
    form.values.value.affordance.define.arrayInfo.specs.push({
      name: '',
      identifier: '',
      dataType: { type: 'bool' },
      mapping: { 0: '关', 1: '开' },
    })
  }
}

// 获取数组中结构体参数的数据类型
const getArrayStructDataType = (index: number) => {
  return form.values.value.affordance?.define?.arrayInfo?.specs?.[index]?.dataType?.type || '';
}

// 获取结构体参数的数据类型
const getStructDataType = (index: number) => {
  if (!form || !form.values || !form.values.value) return '';
  const specs = form.values.value.affordance?.define?.specs;
  if (!specs || !Array.isArray(specs) || !specs[index]) return '';
  return specs[index]?.dataType?.type || '';
}

// 获取结构体参数的数组元素类型
const getStructArrayType = (index: number) => {
  if (!form || !form.values || !form.values.value) return '';
  const specs = form.values.value.affordance?.define?.specs;
  if (!specs || !Array.isArray(specs) || !specs[index]) return '';
  return specs[index]?.dataType?.arrayInfo?.type || '';
}

// 处理结构体内数组类型变化
function handleStructArrayTypeChange(index: number, value: string) {
  // console.log('结构体数组类型改变 - 索引:', index, '值:', value);
  const specs = form.values.value.affordance?.define?.specs;
  if (!specs || !Array.isArray(specs) || !specs[index]) return;
  const currentSpec = specs[index];

  if (value === 'int') {
    currentSpec.dataType.arrayInfo.min = 0;
    currentSpec.dataType.arrayInfo.max = 100;
    currentSpec.dataType.arrayInfo.step = 1;
    currentSpec.dataType.arrayInfo.start = 0;
    currentSpec.dataType.arrayInfo.unit = '';
  }
  if (value === 'float') {
    currentSpec.dataType.arrayInfo.min = 0.000;
    currentSpec.dataType.arrayInfo.max = 100.000;
    currentSpec.dataType.arrayInfo.step = 0.001;
    currentSpec.dataType.arrayInfo.start = 0.000;
    currentSpec.dataType.arrayInfo.unit = '';
  }
  if (value === 'string') {
    currentSpec.dataType.arrayInfo.max = 2048;
  }
}

const getEventDataType = (index: number) => {
  if (!form || !form.values || !form.values.value) return '';
  const specs = form.values.value.affordance?.params;
  if (!specs || !Array.isArray(specs) || !specs[index]) return '';
  return specs[index]?.define?.type || '';
}

const getActionDataType = (index: number) => {
  if (!form || !form.values || !form.values.value) return '';
  const specs = form.values.value.affordance?.input;
  if (!specs || !Array.isArray(specs) || !specs[index]) return '';
  return specs[index]?.define?.type || '';
}

const getReturnDataType = (index: number) => {
  if (!form || !form.values || !form.values.value) return '';
  const specs = form.values.value.affordance?.output;
  if (!specs || !Array.isArray(specs) || !specs[index]) return '';
  return specs[index]?.define?.type || '';
}

// 辅助函数：创建带 tooltip 的 label
function createLabelWithTooltip(text: string, tooltip: string) {
  return () => h(
    NSpace,
    { align: 'center', size: 4 },
    {
      default: () => [
        h('span', text),
        h(
          NTooltip,
          { placement: 'top' },
          {
            trigger: () => h('span', {
              class: 'icon-[carbon--information] text-gray-400 cursor-help',
              style: { fontSize: '14px' }
            }),
            default: () => tooltip
          }
        )
      ]
    }
  );
}
// 定义选项配置（包含 tooltip 说明）
const modelFeaturesConfig = [
  { value: 'isUseShadow', label: '设备影子', tooltip: '设备影子是物联网设备在云端的虚拟副本，用于存储设备的最新状态' },
  { value: 'isNoRecord', label: '只读数据', tooltip: '该数据仅用于显示，不会被存储到数据库中' },
  { value: 'funcGroup', label: '作为系统功能', tooltip: '将此功能标记为系统级功能，用于系统管理和配置' },
  { value: 'isHistory', label: '历史存储', tooltip: '启用后会保存数据的历史记录，方便追溯和分析' },
  { value: 'isPassword', label: '密码类型', tooltip: '该字段将被标记为密码类型，输入时会被加密显示' },
  { value: 'isCanSceneLinkage', label: '场景联动', tooltip: '允许该功能参与场景自动化和联动规则' },
];

// 生成带 tooltip 的 options
const modelFeaturesOptions = modelFeaturesConfig.map(item => ({
  value: item.value,
  label: createLabelWithTooltip(item.label, item.tooltip)
}));

function handleTypeChange(value: number) {
  // console.log('类型改变 - 值:', value);
  if(value === 2) {
    // form.values.value.recordMode = 3;
    form.values.value.affordance.type = 'alert';
  }

}

</script>

<template>

  <ProRadioGroup path="type" :title="$t('iot.schema.type')" :field-props="{
    options: schemaTypeOptions,
    type: 'button',
  }" required @change="handleTypeChange" />

  <NFlex>
    <ProInput path="name" :title="$t('iot.schema.name')" :tooltip="'支持中文、英文、数字、下划线的组合，最多不超过20个字符'" required />

    <ProInput path="identifier" :readonly="!isCreate" :title="$t('iot.schema.identifier')"
      :tooltip="'第一个字符不能是数字，支持英文、数字、下划线的组合，最多不超过32个字符'" required />
  </NFlex>


  <!-- 属性类型字段 (type === 1) -->
  <template v-if="currentType === 1">
    <NFlex>
      <ProRadioGroup path="affordance.define.type" :title="$t('iot.schema.dataTypeDefine')" :field-props="{
        options: dataTypeOptions,
        type: 'button',
      }" required @change="handleDataTypeChange" />

      <template v-if="currentDataType === 'array'">
        <ProDigit path="affordance.define.max" :title="$t('iot.schema.arrayLength')" :tooltip="'数组的最大长度'" required />
      </template>
    </NFlex>

    <!-- 布尔型字段 -->
    <template v-if="currentDataType === 'bool'">
      <NFlex>
        <ProInput path="affordance.define.mapping.0" :title="$t('iot.schema.boolMapping0')" required>
          <template #prefix>
            <div>0</div>
          </template>
        </ProInput>

        <ProInput path="affordance.define.mapping.1" :title="$t('iot.schema.boolMapping1')" required>
          <template #prefix>
            <div>1</div>
          </template>
        </ProInput>

      </NFlex>

      <ProDigit path="affordance.define.start" :title="$t('iot.schema.initialValue')" :field-props="{
        min: 0,
        max: 1,
      }" />
    </template>

    <!-- 整数型字段 -->
    <template v-if="currentDataType === 'int'">
      <NFlex>

        <ProDigit path="affordance.define.min" :title="$t('iot.schema.minValue')" :precision="0" required />

        <ProDigit path="affordance.define.max" :title="$t('iot.schema.maxValue')" :precision="0" required />

        <ProDigit path="affordance.define.start" :title="$t('iot.schema.initialValue')" required />

        <ProDigit path="affordance.define.step" :title="$t('iot.schema.step')"
          :tooltip="'步长指数值类型属性数值变化的最小粒度单元，由用户根据设备具体应用场景定义。'" required />
        <ProInput path="affordance.define.unit" :title="$t('iot.schema.unit')" :tooltip="'0-12个字符'" />
      </NFlex>

    </template>

    <!-- 浮点型字段 -->
    <template v-if="currentDataType === 'float'">
      <ProDigit path="affordance.define.min" :title="$t('iot.schema.minValue')" :field-props="{
        precision: 3,
      }" required />

      <ProDigit path="affordance.define.max" :title="$t('iot.schema.maxValue')" :field-props="{
        precision: 3,
      }" required />

      <ProDigit path="affordance.define.start" :title="$t('iot.schema.initialValue')" :field-props="{
        precision: 3,
      }" required />

      <ProDigit path="affordance.define.step" :title="$t('iot.schema.step')" :field-props="{
        precision: 3,
      }" :tooltip="'步长指数值类型属性数值变化的最小粒度单元，由用户根据设备具体应用场景定义。'" required />

      <ProInput path="affordance.define.unit" :title="$t('iot.schema.unit')" :tooltip="'0-12个字符'" />
    </template>

    <!-- 字符串型字段 -->
    <template v-if="currentDataType === 'string'">
      <ProDigit path="affordance.define.max" :title="$t('iot.schema.stringLength')" :field-props="{
        min: 0,
        max: 2048,
      }" :tooltip="'请输入字符串长度限制，最大长度不超过2048个字节'" required>
        <template #suffix>
          <div>字节</div>
        </template>
      </ProDigit>
    </template>

    <!-- 枚举型字段 - 使用 ProFormList -->
    <template v-if="currentDataType === 'enum'">
      <div class="flex flex-row">
        <div class="flex w-[150px] flex-shrink-0 justify-end pr-6">数据定义</div>
        <div class="flex flex-1 min-w-0">
          <ProFormList only-show-first-item-label label-placement="top" :showLabel="false"
            path="affordance.define.mappingList" :title="$t('iot.schema.enumMapping')" required :creator-button-props="{
              content: '添加枚举项',
            }">


            <ProDigit path="key" title="枚举键值" label-placement="top" required />

            <ProInput path="value" title="枚举项描述" label-placement="top" required />

          </ProFormList>
        </div>
      </div>

      <ProDigit path="affordance.define.start" :title="$t('iot.schema.initialValue')" :field-props="{
        placeholder: '请输入初始值（枚举键值）',
      }" :tooltip="'请输入枚举映射中的键值'" />
    </template>

    <!-- 时间型字段 - 无需额外配置 -->
    <template v-if="currentDataType === 'timestamp'">
      <div class="flex flex-row mb-4">
        <div class="flex w-[150px] flex-shrink-0 justify-end pr-6">数据定义</div>
        <div class="flex flex-1 min-w-0">
          <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
        </div>
      </div>
    </template>

    <!-- 结构体型字段 - 使用嵌套 ProFormList -->
    <template v-if="currentDataType === 'struct'">
      <div class="flex mb-4">
        <div class="flex w-[150px] flex-shrink-0 justify-end pr-6">数据定义</div>
        <div class="flex flex-1 min-w-0 border p-2 rounded-md">
          <ProFormList only-show-first-item-label label-placement="top" :showLabel="false" path="affordance.define.specs"
        :title="$t('iot.schema.structParams')" required :creator-button-props="{
          content: '添加参数',
        }">
        <template #action="{ index, actionDom }">

          <NGrid :cols="8" :x-gap="10" :y-gap="10" class="w-full">

            <NGridItem :span="1">
              <ProInput label-placement="top" path="name" :title="$t('iot.schema.paramName')" required />
            </NGridItem>

            <NGridItem :span="1">
              <ProInput label-placement="top" path="identifier" :title="$t('iot.schema.paramIdentifier')" required />
            </NGridItem>

            <NGridItem :span="1">
              <ProSelect label-placement="top" path="dataType.type" :title="$t('iot.schema.dataTypeDefine')"
                :field-props="{
                  options: dataTypeStructOptionsList,
                }" required @change="(value) => handleStructDataTypeChange(index, value)" />
            </NGridItem>


            <NGridItem :span="4">

              <template v-if="getStructDataType(index) === 'bool'">
                <ProInput label-placement="left" :show-label="true" path="dataType.mapping.0" title="布尔值0的映射"
                  required />
                <ProInput label-placement="left" :show-label="true" path="dataType.mapping.1" title="布尔值1的映射"
                  required />
                <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                  :title="$t('iot.schema.initialValue')" required :field-props="{
                    min: 0,
                    max: 1,
                  }" />
              </template>
              <template v-if="getStructDataType(index) === 'int'">
                <ProDigit label-placement="left" :show-label="true" path="dataType.min"
                  :title="$t('iot.schema.minValue')" required />
                <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                  :title="$t('iot.schema.maxValue')" required />
                <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                  :title="$t('iot.schema.initialValue')" required />
                <ProDigit label-placement="left" :show-label="true" path="dataType.step" :title="$t('iot.schema.step')"
                  required />
                <ProInput label-placement="left" :show-label="true" path="dataType.unit"
                  :title="$t('iot.schema.unit')" />
              </template>
              <template v-if="getStructDataType(index) === 'float'">
                <ProDigit label-placement="left" :show-label="true" path="dataType.min"
                  :title="$t('iot.schema.minValue')" required :field-props="{ precision: 3 }" />
                <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                  :title="$t('iot.schema.maxValue')" required :field-props="{ precision: 3 }" />
                <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                  :title="$t('iot.schema.initialValue')" required :field-props="{ precision: 3 }" />
                <ProDigit label-placement="left" :show-label="true" path="dataType.step" :title="$t('iot.schema.step')"
                  required :field-props="{ precision: 3 }" />
                <ProInput label-placement="left" :show-label="true" path="dataType.unit"
                  :title="$t('iot.schema.unit')" />
              </template>
              <template v-if="getStructDataType(index) === 'string'">
                <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                  :title="$t('iot.schema.stringLength')" required :field-props="{
                    min: 0,
                    max: 2048,
                  }" />
              </template>
              <template v-if="getStructDataType(index) === 'enum'">
                <ProFormList label-placement="left" :show-label="true" path="dataType.mappingList"
                  :title="$t('iot.schema.enumMapping')" required :creator-button-props="{
                    content: '添加枚举项',
                  }">
                  <template #default>
                    <ProDigit label-placement="left" :show-label="true" path="key" title="枚举键值" required />
                    <ProInput label-placement="left" :show-label="true" path="value" title="枚举项描述" required />
                  </template>
                </ProFormList>
              </template>
              <template v-if="getStructDataType(index) === 'timestamp'">
                <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
              </template>

              <template v-if="getStructDataType(index) === 'array'">
                <NFlex>
                  <ProDigit label-placement="top" :show-label="true" path="dataType.max"
                    :title="$t('iot.schema.arrayLength')" required />
                  <ProRadioGroup label-placement="top" :show-label="true" path="dataType.arrayInfo.type"
                    :title="$t('iot.schema.arrayType')" :field-props="{
                      options: [
                        { value: 'int', label: '整数型' },
                        { value: 'float', label: '浮点型' },
                        { value: 'string', label: '字符串' },
                      ]
                    }" required @change="(value) => handleStructArrayTypeChange(index, value)" />
                </NFlex>

                <!-- 整数型/浮点型数组元素 -->
                <template v-if="getStructArrayType(index) === 'int' || getStructArrayType(index) === 'float'">
                  <NGrid :cols="2" :x-gap="10" :y-gap="10" class="w-full">
                    <NGridItem :span="1">
                      <ProDigit label-placement="left" :show-label="true" path="dataType.arrayInfo.min"
                        :title="$t('iot.schema.minValue')" required
                        :field-props="getStructArrayType(index) === 'float' ? { precision: 3 } : {}" />
                    </NGridItem>
                    <NGridItem :span="1">
                      <ProDigit label-placement="left" :show-label="true" path="dataType.arrayInfo.max"
                        :title="$t('iot.schema.maxValue')" required
                        :field-props="getStructArrayType(index) === 'float' ? { precision: 3 } : {}" />
                    </NGridItem>
                    <NGridItem :span="1">
                      <ProDigit label-placement="left" :show-label="true" path="dataType.arrayInfo.start"
                        :title="$t('iot.schema.initialValue')" required
                        :field-props="getStructArrayType(index) === 'float' ? { precision: 3 } : {}" />
                    </NGridItem>
                    <NGridItem :span="1">
                      <ProDigit label-placement="left" :show-label="true" path="dataType.arrayInfo.step"
                        :title="$t('iot.schema.step')" required
                        :field-props="getStructArrayType(index) === 'float' ? { precision: 3 } : {}" />
                    </NGridItem>
                    <NGridItem :span="1">
                      <ProInput label-placement="left" :show-label="true" path="dataType.arrayInfo.unit"
                        :title="$t('iot.schema.unit')" />
                    </NGridItem>
                  </NGrid>
                </template>

                <!-- 字符串型数组元素 -->
                <template v-if="getStructArrayType(index) === 'string'">
                  <ProDigit label-placement="top" :show-label="true" path="dataType.arrayInfo.max"
                    :title="$t('iot.schema.stringLength')" required :field-props="{
                      min: 0,
                      max: 2048,
                    }" />
                </template>

              </template>
            </NGridItem>

            <NGridItem :span="1">
              <component :is="actionDom" />
            </NGridItem>

          </NGrid>

        </template>
      </ProFormList>
        </div>
      </div>

    </template>

    <!-- 数组型字段 -->
    <template v-if="currentDataType === 'array'">


      <ProSelect path="affordance.define.arrayInfo.type" :title="$t('iot.schema.arrayType')" :field-props="{
        options: arrayElementTypeOptions
      }" required @change="handleArrayTypeChange" />

      <!-- 根据数组元素类型显示对应字段 -->
      <!-- 整数型数组元素 -->
      <template v-if="currentArrayType === 'int'">
        <NFlex>
          <ProDigit path="affordance.define.arrayInfo.min" title="最小值" />
          <ProDigit path="affordance.define.arrayInfo.max" title="最大值" />
          <ProDigit path="affordance.define.arrayInfo.start" title="初始值" />
          <ProDigit path="affordance.define.arrayInfo.step" title="步长" />
          <ProInput path="affordance.define.arrayInfo.unit" title="单位" />
        </NFlex>
      </template>

      <!-- 浮点型数组元素 -->
      <template v-if="currentArrayType === 'float'">
        <NFlex>
          <ProDigit path="affordance.define.arrayInfo.min" title="最小值" />
          <ProDigit path="affordance.define.arrayInfo.max" title="最大值" />
          <ProDigit path="affordance.define.arrayInfo.start" title="初始值" />
          <ProDigit path="affordance.define.arrayInfo.step" title="步长" />
          <ProInput path="affordance.define.arrayInfo.unit" title="单位" />
        </NFlex>
      </template>

      <!-- 字符串型数组元素 -->
      <template v-if="currentArrayType === 'string'">
        <ProDigit path="affordance.define.arrayInfo.max" title="最大长度" :field-props="{
          min: 1,
          max: 2048,
        }" />
      </template>

      <!-- 布尔型数组元素  -->
      <template v-if="currentArrayType === 'bool'">
        <NFlex>
          <ProInput path="affordance.define.arrayInfo.mapping.0" title="布尔值0的映射" />
          <ProInput path="affordance.define.arrayInfo.mapping.1" title="布尔值1的映射" />
          <ProDigit path="affordance.define.arrayInfo.start" title="初始值" />
        </NFlex>
      </template>

      <!-- 枚举型数组元素 -->
      <template v-if="currentArrayType === 'enum'">
        <ProFormList :showLabel="false" path="affordance.define.arrayInfo.mappingList" :creator-button-props="{
          content: '添加枚举项',
        }">
          <template #default>
            <NFlex>
              <ProDigit path="key" title="枚举键值" required />
              <ProInput path="value" title="枚举项描述" required />
            </NFlex>
          </template>
        </ProFormList>
      </template>

      <!-- 结构体型数组元素 -->
      <template v-if="currentArrayType === 'struct'">

        <ProFormList only-show-first-item-label label-placement="top" path="affordance.define.arrayInfo.specs"
          :creator-button-props="{
            content: '添加参数',
          }">
          <template #action="{ index, actionDom }">

            <NGrid :cols="8" :x-gap="10" :y-gap="10" class="w-full">

              <NGridItem :span="1">
                <ProInput label-placement="top" path="name" title="参数名称" required />
              </NGridItem>
              <NGridItem :span="1">
                <ProInput label-placement="top" path="identifier" title="参数标识符" required />
              </NGridItem>
              <NGridItem :span="1">
                <ProSelect label-placement="top" path="dataType.type" title="数据类型" :field-props="{
                  options: [
                    { value: 'bool', label: '布尔型' },
                    { value: 'int', label: '整数型' },
                    { value: 'string', label: '字符串' },
                    { value: 'float', label: '浮点型' },
                    { value: 'enum', label: '枚举整型' },
                    { value: 'timestamp', label: '时间型' },
                  ]
                }" required />
              </NGridItem>


              <NGridItem :span="4">
                <template v-if="getArrayStructDataType(index) === 'bool'">
                  <ProInput label-placement="left" :show-label="true" path="dataType.mapping.0"
                    title="布尔值0的映射" />
                  <ProInput label-placement="left" :show-label="true" path="dataType.mapping.1"
                    title="布尔值1的映射" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                    title="初始值" :field-props="{
                      min: 0,
                      max: 1,
                    }" />
                </template>
                <template v-if="getArrayStructDataType(index) === 'int'">
                  <ProDigit label-placement="left" :show-label="true" path="dataType.min"
                    title="最小值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                    title="最大值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                    title="初始值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.step"
                    title="步长" />
                  <ProInput label-placement="left" :show-label="true" path="dataType.unit"
                    title="单位" />
                </template>
                <template v-if="getArrayStructDataType(index) === 'float'">
                  <ProDigit label-placement="left" :show-label="true" path="dataType.min"
                    title="最小值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                    title="最大值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.start"
                    title="初始值" />
                  <ProDigit label-placement="left" :show-label="true" path="dataType.step"
                    title="步长" />
                  <ProInput label-placement="left" :show-label="true" path="dataType.unit"
                    title="单位" />
                </template>
                <template v-if="getArrayStructDataType(index) === 'string'">
                  <ProDigit label-placement="left" :show-label="true" path="dataType.max"
                    title="最大长度" :field-props="{
                      min: 1,
                      max: 2048,
                    }" />
                </template>
                <template v-if="getArrayStructDataType(index) === 'enum'">
                  <ProFormList label-placement="left" :show-label="true" only-show-first-item-label
                    path="dataType.mappingList" :creator-button-props="{
                      content: '添加枚举项',
                    }">
                    <template #action="{ actionDom }">
                      <NFlex>

                        <ProDigit label-placement="top" path="key" title="枚举键值" required />
                        <ProInput label-placement="top" path="value" title="枚举项描述" required />
                        <component :is="actionDom" />
                      </NFlex>

                    </template>
                  </ProFormList>
                </template>
                <template v-if="getArrayStructDataType(index) === 'timestamp'">
                  <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
                </template>

              </NGridItem>

              <NGridItem :span="1">
                <component :is="actionDom" />
              </NGridItem>
            </NGrid>
          </template>
        </ProFormList>
      </template>
    </template>
  </template>

  <!-- 事件类型字段 (type === 2) -->
  <template v-if="currentType === 2">
    <ProRadioGroup path="affordance.type" :title="$t('iot.schema.eventType')" :field-props="{
      options: eventTypeOptions,
      type: 'button',
    }" required />

    <ProFormList path="affordance.params" :title="$t('iot.schema.callParams')" :creator-button-props="{
      content: '添加事件参数',
    }">
      <template #action="{ index, actionDom }">
        <NGrid :cols="8" :x-gap="10" :y-gap="10" class="w-full">
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="name" :title="$t('iot.schema.paramName')"
              required />
          </NGridItem>
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="identifier"
              :title="$t('iot.schema.paramIdentifier')" required />
          </NGridItem>
          <NGridItem :span="1">
            <ProSelect label-placement="top" :show-label="true" path="define.type"
              :title="$t('iot.schema.dataTypeDefine')" :field-props="{
                options: [
                  { value: 'bool', label: '布尔型' },
                  { value: 'int', label: '整数型' },
                  { value: 'string', label: '字符串' },
                  { value: 'float', label: '浮点型' },
                  { value: 'enum', label: '枚举整型' },
                  { value: 'timestamp', label: '时间型' },
                ],
              }" required />
          </NGridItem>

          <NGridItem :span="4">
            <template v-if="getEventDataType(index) === 'bool'">
              <ProInput label-placement="left" :show-label="true" path="define.mapping.0" title="布尔值0的映射" />
              <ProInput label-placement="left" :show-label="true" path="define.mapping.1" title="布尔值1的映射" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" :field-props="{
                min: 0,
                max: 1,
              }" />
            </template>
            <template v-if="getEventDataType(index) === 'int'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getEventDataType(index) === 'float'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getEventDataType(index) === 'string'">
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大长度" :field-props="{
                min: 0,
                max: 2048,
              }" />
            </template>
            <template v-if="getEventDataType(index) === 'enum'">
              <ProFormList label-placement="left" :show-label="true" only-show-first-item-label
                path="define.mappingList" :creator-button-props="{
                  content: '添加枚举项',
                }">
                <template #action="{ actionDom }">
                  <NFlex>
                    <ProDigit label-placement="top" path="key" title="枚举键值" required />
                    <ProInput label-placement="top" path="value" title="枚举项描述" required />
                    <component :is="actionDom" />
                  </NFlex>
                </template>
              </ProFormList>
            </template>
            <template v-if="getEventDataType(index) === 'timestamp'">
              <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
            </template>
          </NGridItem>

          <NGridItem :span="1">
            <component :is="actionDom" />
          </NGridItem>
        </NGrid>
      </template>
    </ProFormList>
  </template>

  <!-- 行为类型字段 (type === 3) -->
  <template v-if="currentType === 3">
    <ProFormList path="affordance.input" :title="$t('iot.schema.callParams')" :creator-button-props="{
      content: '添加调用参数',
    }">
      <template #action="{ index, actionDom }">
        <NGrid :cols="8" :x-gap="10" :y-gap="10" class="w-full">
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="name" :title="$t('iot.schema.paramName')"
              required />
          </NGridItem>
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="identifier"
              :title="$t('iot.schema.paramIdentifier')" required />
          </NGridItem>
          <NGridItem :span="1">
            <ProSelect label-placement="top" :show-label="true" path="define.type"
              :title="$t('iot.schema.dataTypeDefine')" :field-props="{
                options: [
                  { value: 'bool', label: '布尔型' },
                  { value: 'int', label: '整数型' },
                  { value: 'string', label: '字符串' },
                  { value: 'float', label: '浮点型' },
                  { value: 'enum', label: '枚举整型' },
                  { value: 'timestamp', label: '时间型' },
                ],
              }" required />
          </NGridItem>

          <NGridItem :span="4">
            <template v-if="getActionDataType(index) === 'bool'">
              <ProInput label-placement="left" :show-label="true" path="define.mapping.0" title="布尔值0的映射" />
              <ProInput label-placement="left" :show-label="true" path="define.mapping.1" title="布尔值1的映射" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" :field-props="{
                min: 0,
                max: 1,
              }" />
            </template>
            <template v-if="getActionDataType(index) === 'int'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getActionDataType(index) === 'float'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getActionDataType(index) === 'string'">
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大长度" />
            </template>
            <template v-if="getActionDataType(index) === 'enum'">
              <ProFormList label-placement="left" :show-label="true" only-show-first-item-label
                path="define.mappingList" :creator-button-props="{
                  content: '添加枚举项',
                }">
                <template #action="{ actionDom }">
                  <NFlex>
                    <ProDigit label-placement="top" path="key" title="枚举键值" required />
                    <ProInput label-placement="top" path="value" title="枚举项描述" required />
                    <component :is="actionDom" />
                  </NFlex>
                </template>
              </ProFormList>
            </template>
            <template v-if="getActionDataType(index) === 'timestamp'">
              <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
            </template>
          </NGridItem>


          <NGridItem :span="1">
            <component :is="actionDom" />
          </NGridItem>
        </NGrid>
      </template>
    </ProFormList>

    <ProFormList path="affordance.output" :title="$t('iot.schema.returnParams')" :creator-button-props="{
      content: '添加返回参数',
    }">
      <template #action="{ index, actionDom }">
        <NGrid :cols="8" :x-gap="10" :y-gap="10" class="w-full">
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="name" :title="$t('iot.schema.paramName')"
              required />
          </NGridItem>
          <NGridItem :span="1">
            <ProInput label-placement="top" :show-label="true" path="identifier"
              :title="$t('iot.schema.paramIdentifier')" required />
          </NGridItem>
          <NGridItem :span="1">
            <ProSelect label-placement="top" :show-label="true" path="define.type"
              :title="$t('iot.schema.dataTypeDefine')" :field-props="{
                options: [
                  { value: 'bool', label: '布尔型' },
                  { value: 'int', label: '整数型' },
                  { value: 'string', label: '字符串' },
                  { value: 'float', label: '浮点型' },
                  { value: 'enum', label: '枚举整型' },
                  { value: 'timestamp', label: '时间型' },
                ],
              }" required />
          </NGridItem>
          <NGridItem :span="4">
            <template v-if="getReturnDataType(index) === 'bool'">
              <ProInput label-placement="left" :show-label="true" path="define.mapping.0" title="布尔值0的映射" />
              <ProInput label-placement="left" :show-label="true" path="define.mapping.1" title="布尔值1的映射" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" :field-props="{
                min: 0,
                max: 1,
              }" />
            </template>
            <template v-if="getReturnDataType(index) === 'int'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getReturnDataType(index) === 'float'">
              <ProDigit label-placement="left" :show-label="true" path="define.min" title="最小值" />
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大值" />
              <ProDigit label-placement="left" :show-label="true" path="define.start" title="初始值" />
              <ProDigit label-placement="left" :show-label="true" path="define.step" title="步长" />
              <ProInput label-placement="left" :show-label="true" path="define.unit" title="单位" />
            </template>
            <template v-if="getReturnDataType(index) === 'string'">
              <ProDigit label-placement="left" :show-label="true" path="define.max" title="最大长度" :field-props="{
                min: 1,
                max: 2048,
              }" />
            </template>
            <template v-if="getReturnDataType(index) === 'enum'">
              <ProFormList label-placement="left" :show-label="true" only-show-first-item-label
                path="define.mappingList" :creator-button-props="{
                  content: '添加枚举项',
                }">
                <template #action="{ actionDom }">
                  <NFlex>
                    <ProDigit label-placement="top" path="key" title="枚举键值" required />
                    <ProInput label-placement="top" path="value" title="枚举项描述" required />
                    <component :is="actionDom" />
                  </NFlex>
                </template>
              </ProFormList>
            </template>
            <template v-if="getReturnDataType(index) === 'timestamp'">
              <div>INT类型的UTC时间戳（秒） - 无需额外配置 Unix时间戳</div>
            </template>
          </NGridItem>
          <NGridItem :span="1">
            <component :is="actionDom" />
          </NGridItem>
        </NGrid>
      </template>
    </ProFormList>
  </template>

  <ProRadioGroup path="recordMode" title="记录模式" :field-props="{
    options: recordModeOptions,
    type: 'button',
  }" />

  <ProCheckboxGroup path="modelFeatures" title="模型特性" tooltip='默认普通功能' :field-props="{
    options: [
      ...currentType === 1 ? [{ value: 'isUseShadow', label: '设备影子', tooltip: '设备影子是物联网设备在云端的虚拟副本，用于存储设备的最新状态' }] : [],//属性才有
      ...currentType === 1 ? [{ value: 'isNoRecord', label: '只读数据', tooltip: '该数据仅用于显示，不会被存储到数据库中' }] : [],//属性才有
      ...currentType === 1 ? [{ value: 'controlMode', label: '控制模式', tooltip: '1: 可以群控,可以单控  2:只能单控' }] : [],//属性才有
      { value: 'funcGroup', label: '作为系统功能', tooltip: '将此功能标记为系统级功能，用于系统管理和配置' },
      // { value: 'isHistory', label: '历史存储', tooltip: '启用后会保存数据的历史记录，方便追溯和分析' },
      { value: 'isPassword', label: '密码类型', tooltip: '该字段将被标记为密码类型，输入时会被加密显示' },
      { value: 'isCanSceneLinkage', label: '场景联动', tooltip: '允许该功能参与场景自动化和联动规则' },
    ],
  }" />

  <NCollapse>
    <NCollapseItem title="其他配置">
      <ProDigit path="order" :title="$t('iot.schema.order')" />
      <ProTextarea path="extendConfig" :title="$t('iot.schema.extendConfig')" rows="3" />
      <ProTextarea path="desc" :title="$t('system.role.remark')" rows="3" />
    </NCollapseItem>
  </NCollapse>


</template>
