<script setup lang="ts">
/**
 * 设备物模型路径选择器。
 *
 * 依赖外部传入 schemaList（物模型 affordance 列表），内部维护各级选项与字段。
 *
 * dataID_data        根 identifier（属性/事件 id）
 * dataID_00          array 索引
 * dataID_00_aa       array -> struct 子字段
 * dataID_aa          struct 子字段
 * dataID_bb          事件 params 路径
 * dataID_bb_cc       event param mapping value（枚举）
 */
import { computed, watch } from 'vue';
import { $t } from '@vben/locales';
import NativeSelect from './NativeSelect.vue';
import FieldRow from './FieldRow.vue';

interface SchemaItem {
  identifier: string;
  name?: string;
  type?: number;
  affordance?: string;
}

const props = defineProps<{
  /** 绑定的拆字段对象：直接取 draft.device / draft.property / valueDraft */
  modelValue: Record<string, any>;
  schemaList: SchemaItem[];
  /** 1=属性, 2=事件。用于过滤 schema */
  schemaType?: number;
  /** 是否在仅有一个 dataID_data 候选时自动选择 */
  autoPickSingle?: boolean;
}>();

const model = computed(() => props.modelValue);

// 仅按 schemaType 过滤
const filteredSchema = computed(() => {
  if (!props.schemaType) return props.schemaList;
  return props.schemaList.filter((s) => s.type === props.schemaType);
});

const rootOptions = computed(() =>
  filteredSchema.value.map((s) => ({
    label: s.name || s.identifier,
    value: s.identifier,
  })),
);

function currentSchema() {
  return filteredSchema.value.find((s) => s.identifier === model.value.dataID_data);
}

function affordance() {
  const s = currentSchema();
  if (!s?.affordance) return null;
  try {
    return JSON.parse(s.affordance);
  } catch {
    return null;
  }
}

// 数组索引
const arrayIndexOptions = computed(() => {
  const a = affordance();
  if (a?.define?.type !== 'array') return [];
  const max = a.define.max || 10;
  return Array.from({ length: max }, (_, i) => ({
    label: $t('scene.ui.indexIndex', { index: i }),
    value: String(i),
  }));
});

const arrayStructOptions = computed(() => {
  const a = affordance();
  if (a?.define?.type !== 'array' || a.define.arrayInfo?.type !== 'struct')
    return [];
  return (a.define.arrayInfo.specs || []).map((sp: any) => ({
    label: sp.name || sp.identifier,
    value: sp.identifier,
  }));
});

const structOptions = computed(() => {
  const a = affordance();
  if (a?.define?.type !== 'struct') return [];
  return (a.define.specs || []).map((sp: any) => ({
    label: sp.name || sp.identifier,
    value: sp.identifier,
  }));
});

const eventParamOptions = computed(() => {
  const a = affordance();
  if (!a?.params?.length) return [];
  return a.params.map((sp: any) => ({
    label: sp.name || sp.identifier,
    value: sp.identifier,
  }));
});

const eventParamEnumOptions = computed(() => {
  const a = affordance();
  if (!a?.params?.length) return [];
  const p = a.params.find((x: any) => x.identifier === model.value.dataID_bb);
  if (!p?.define?.mapping) return [];
  return Object.keys(p.define.mapping).map((k) => ({
    label: p.define.mapping[k],
    value: k,
  }));
});

// 当根 dataID 变化时，重置子级
watch(
  () => model.value.dataID_data,
  () => {
    model.value.dataID_00 = '';
    model.value.dataID_00_aa = '';
    model.value.dataID_aa = '';
    model.value.dataID_bb = '';
    model.value.dataID_bb_cc = '';
  },
);

watch(
  () => model.value.dataID_bb,
  () => {
    model.value.dataID_bb_cc = '';
  },
);

// 可选：只有一条时自动选中
watch(
  rootOptions,
  (opts) => {
    if (
      props.autoPickSingle &&
      opts.length === 1 &&
      !model.value.dataID_data
    ) {
      model.value.dataID_data = opts[0]!.value;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <FieldRow :label="$t('scene.ui.propertiesEvents')" required width-class="w-52">
      <NativeSelect
        v-model="model.dataID_data"
        :options="rootOptions"
        :placeholder="$t('scene.ui.selectAttributesEvents')"
      />
    </FieldRow>

    <FieldRow
      v-if="arrayIndexOptions.length"
      :label="$t('scene.ui.arrayIndex_f92b9b')"
      required
      width-class="w-40"
    >
      <NativeSelect
        v-model="model.dataID_00"
        :options="arrayIndexOptions"
        :placeholder="$t('scene.ui.selectIndex')"
      />
    </FieldRow>

    <FieldRow
      v-if="arrayStructOptions.length"
      :label="$t('scene.ui.arrayStructureField')"
      required
      width-class="w-52"
    >
      <NativeSelect
        v-model="model.dataID_00_aa"
        :options="arrayStructOptions"
        :placeholder="$t('orgManage.cloneGroup.selectField')"
      />
    </FieldRow>

    <FieldRow
      v-if="structOptions.length"
      :label="$t('scene.ui.structureFields')"
      required
      width-class="w-52"
    >
      <NativeSelect
        v-model="model.dataID_aa"
        :options="structOptions"
        :placeholder="$t('orgManage.cloneGroup.selectField')"
      />
    </FieldRow>

    <FieldRow
      v-if="eventParamOptions.length"
      :label="$t('scene.ui.eventParameters')"
      required
      width-class="w-52"
    >
      <NativeSelect
        v-model="model.dataID_bb"
        :options="eventParamOptions"
        :placeholder="$t('scene.ui.selectParameters')"
      />
    </FieldRow>

    <FieldRow
      v-if="eventParamEnumOptions.length"
      :label="$t('scene.ui.parameterValue_e6a363')"
      required
      width-class="w-52"
    >
      <NativeSelect
        v-model="model.dataID_bb_cc"
        :options="eventParamEnumOptions"
        :placeholder="$t('scene.ui.selectValue')"
      />
    </FieldRow>
  </div>
</template>
