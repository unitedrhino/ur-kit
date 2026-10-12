<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CompositeAdapterConfig, CompositeChildBinding, CompositeDataOutput, CompositeDataSource } from '@/packages/custom/types';
import type { CreateComponentGroupType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { computed, ref, watch } from 'vue';

import { getDeviceList, getProductList, getProductSchema, getUserAreaTree } from '@/api/thingsDevice';
import { CollapseItem } from '@/components/Pages/ChartItemSetting';
import { RequestBodyEnum, RequestHttpEnum } from '@/enums/httpEnum';
import { createCompositeChildBinding, createCompositeDataOutput, createCompositeDataSource, normalizeCompositeAdapterConfig } from '@/packages/custom/types';

const props = defineProps({
  targetData: {
    type: Object as PropType<CreateComponentGroupType>,
    required: true,
  },
});

const groupList = computed(() => (props.targetData as CreateComponentGroupType).groupList ?? []);

const syncCompositeAdapter = () => {
  const simplifiedData = props.targetData.option?._simplifiedData;
  if (!simplifiedData) return;

  simplifiedData.compositeAdapter = normalizeCompositeAdapterConfig(
    simplifiedData.compositeAdapter as CompositeAdapterConfig | undefined,
    groupList.value.map((child) => child.id),
  );
};

watch(groupList, syncCompositeAdapter, { deep: true, immediate: true });

const loadAreaOptions = async () => {
  try {
    const res: any = await getUserAreaTree();
    const flat: SelectOption[] = [];
    const walk = (items: any[]) => {
      for (const item of items ?? []) {
        flat.push({ label: item.areaName || item.name || item.areaID, value: normalizeOptionValue(item.areaID) });
        if (Array.isArray(item.children)) walk(item.children);
      }
    };
    walk(extractList(res));
    areaOptions.value = flat;
  } catch {
    areaOptions.value = [];
  }
};

const loadProductOptions = async () => {
  try {
    const res = await getProductList({ page: { page: 1, size: 1000 } });
    productOptions.value = extractList(res).map((item: any) => ({
      label: item.productName ?? item.name ?? normalizeOptionValue(item.productID),
      value: normalizeOptionValue(item.productID),
    }));
  } catch {
    productOptions.value = [];
  }
};

void loadAreaOptions();
void loadProductOptions();

const compositeAdapter = computed(() => props.targetData.option?._simplifiedData?.compositeAdapter as CompositeAdapterConfig | undefined);

const sourceTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.static'); }, value: 'static' },
  { label: 'AJAX', value: 'ajax' },
  { label: 'IoT', value: 'iot' },
];

const outputKindOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.object'); }, value: 'object' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dataset'); }, value: 'dataset' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.schemaForm.dataTypeArray'); }, value: 'array' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.scalar'); }, value: 'scalar' },
];

const transformTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.passThroughDirectly'); }, value: 'identity' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.fieldExtraction'); }, value: 'pick' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.aggregation'); }, value: 'aggregate' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.convertDataset'); }, value: 'toDataset' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.script'); }, value: 'script' },
];

const ajaxMethodOptions = [
  { label: 'GET', value: RequestHttpEnum.GET },
  { label: 'POST', value: RequestHttpEnum.POST },
  { label: 'PUT', value: RequestHttpEnum.PUT },
  { label: 'PATCH', value: RequestHttpEnum.PATCH },
  { label: 'DELETE', value: RequestHttpEnum.DELETE },
];

const ajaxBodyTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.noBody'); }, value: RequestBodyEnum.NONE },
  { label: 'JSON', value: RequestBodyEnum.JSON },
  { label: 'form-data', value: RequestBodyEnum.FORM_DATA },
  { label: 'x-www-form-urlencoded', value: RequestBodyEnum.X_WWW_FORM_URLENCODED },
  { label: 'XML', value: RequestBodyEnum.XML },
];

const iotQueryTypeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.propertyData'); }, value: 'property' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.deviceStatusStatistics'); }, value: 'deviceStatus' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.deviceInformation'); }, value: 'deviceInfo' },
];

const iotModeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.latestValue'); }, value: 'latest' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.historicalTimeSeries'); }, value: 'log' },
];

const iotAggFuncOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.latestValueLast'); }, value: 'last' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.averageAvg'); }, value: 'avg' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.maximumMax2'); }, value: 'max' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.minimumMin'); }, value: 'min' },
];

const iotTimeRangeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.pastHour'); }, value: '1h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.past6Hours'); }, value: '6h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.past24Hours'); }, value: '24h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.past7Days'); }, value: '7d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.past30Days'); }, value: '30d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgIotClient.deviceLogs.customTime'); }, value: 'custom' },
];

type SelectOption = {
  label: string;
  value: string;
};

const extractList = (response: any) => {
  const directList = response?.list;
  if (Array.isArray(directList)) return directList;
  const nestedList = response?.data?.list;
  if (Array.isArray(nestedList)) return nestedList;
  return [];
};

const normalizeOptionValue = (value: unknown) => String(value ?? '');

const ajaxHeaderDraftMap = ref<Record<string, string>>({});
const ajaxParamsDraftMap = ref<Record<string, string>>({});
const areaOptions = ref<SelectOption[]>([]);
const productOptions = ref<SelectOption[]>([]);
const schemaOptionsMap = ref<Record<string, SelectOption[]>>({});
const deviceOptionsMap = ref<Record<string, SelectOption[]>>({});

const writeModeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.writePath'); }, value: 'path' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.writeDataset'); }, value: 'dataset' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.objectPatch'); }, value: 'patch' },
];

const sourceOptions = computed(() =>
  (compositeAdapter.value?.sources ?? []).map((source) => ({
    label: source.name || source.id,
    value: source.id,
  })),
);

const outputOptions = computed(() =>
  (compositeAdapter.value?.outputs ?? []).map((output) => ({
    label: output.name || output.id,
    value: output.id,
  })),
);

const getChildTitle = (childId: string, idx: number) => {
  const child = groupList.value.find((item) => item.id === childId);
  if (!child) return editorT('bigscreenEditor.dynamic.message60', { index: String(idx + 1) });
  return child.chartConfig?.title || child.chartConfig?.key?.replace(/Common$/, '') || editorT('bigscreenEditor.dynamic.message60', { index: String(idx + 1) });
};

const summarizeSource = (source: CompositeDataSource) => {
  if (source.type === 'ajax') {
    return source.config?.requestUrl || editorT('bigscreenEditor.ui.noURLConfigured');
  }
  if (source.type === 'iot') {
    const config = ensureIotConfig(source);
    return [config.queryType, config.productID || editorT('bigscreenEditor.ui.noProductSelected'), config.deviceNames?.length ? editorT('bigscreenEditor.dynamic.message61', { count: String(config.deviceNames.length) }) : editorT('scene.ui.noDeviceSelected')]
      .filter(Boolean)
      .join(' / ');
  }
  return editorT('bigscreenEditor.ui.useStaticPayloadOrGroupLevelRequest');
};

const summarizeOutput = (output: CompositeDataOutput) => [output.kind, output.transformType, output.path || editorT('bigscreenEditor.ui.noPath')].filter(Boolean).join(' / ');

const summarizeBinding = (binding: CompositeChildBinding, idx: number) =>
  editorT('bigscreenEditor.dynamic.message62', { name: String(getChildTitle(binding.childId, idx)), output: String(binding.outputId || editorT('bigscreenEditor.ui.noOutputSelected')), path: String(binding.targetPath || editorT('bigscreenEditor.ui.noTargetPath')) });

const addSource = () => {
  if (!compositeAdapter.value) return;
  compositeAdapter.value.sources.push(
    createCompositeDataSource({
      name: editorT('bigscreenEditor.dynamic.message63', { index: String(compositeAdapter.value.sources.length + 1) }),
      type: 'static',
    }),
  );
};

const removeSource = (sourceId: string) => {
  if (!compositeAdapter.value || compositeAdapter.value.sources.length <= 1) return;
  const nextSources = compositeAdapter.value.sources.filter((source) => source.id !== sourceId);
  const fallbackSourceId = nextSources[0]?.id;
  const removedOutputIds = new Set(compositeAdapter.value.outputs.filter((output) => output.sourceId === sourceId).map((output) => output.id));
  compositeAdapter.value.sources = nextSources;

  compositeAdapter.value.outputs = compositeAdapter.value.outputs
    .filter((output) => output.sourceId !== sourceId)
    .map((output) => ({
      ...output,
      sourceId: output.sourceId || fallbackSourceId || '',
    }));

  if (compositeAdapter.value.outputs.length === 0 && fallbackSourceId) {
    compositeAdapter.value.outputs.push(
      createCompositeDataOutput(fallbackSourceId, {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.rawOutput'); },
        transformType: 'identity',
      }),
    );
  }

  const fallbackOutputId = compositeAdapter.value.outputs[0]?.id;
  compositeAdapter.value.childBindings = compositeAdapter.value.childBindings.map((binding) =>
    createCompositeChildBinding(binding.childId, {
      ...binding,
      outputId: removedOutputIds.has(binding.outputId ?? '') ? fallbackOutputId : (binding.outputId ?? fallbackOutputId),
    }),
  );
};

const addOutput = () => {
  if (!compositeAdapter.value) return;
  const sourceId = compositeAdapter.value.sources[0]?.id;
  if (!sourceId) return;
  compositeAdapter.value.outputs.push(
    createCompositeDataOutput(sourceId, {
      kind: 'object',
      name: editorT('bigscreenEditor.dynamic.message64', { index: String(compositeAdapter.value.outputs.length + 1) }),
      transformType: 'identity',
    }),
  );
};

const removeOutput = (outputId: string) => {
  if (!compositeAdapter.value || compositeAdapter.value.outputs.length <= 1) return;
  compositeAdapter.value.outputs = compositeAdapter.value.outputs.filter((output) => output.id !== outputId);
  const fallbackOutputId = compositeAdapter.value.outputs[0]?.id;
  compositeAdapter.value.childBindings = compositeAdapter.value.childBindings.map((binding) =>
    createCompositeChildBinding(binding.childId, {
      ...binding,
      outputId: binding.outputId === outputId ? fallbackOutputId : (binding.outputId ?? fallbackOutputId),
    }),
  );
};

const addBinding = () => {
  if (!compositeAdapter.value || groupList.value.length === 0) return;
  const defaultChildId = groupList.value[0]?.id ?? '';
  const defaultOutputId = compositeAdapter.value.outputs[0]?.id;
  compositeAdapter.value.childBindings.push(
    createCompositeChildBinding(defaultChildId, {
      outputId: defaultOutputId,
      targetPath: '',
      valuePath: '',
      writeMode: 'path',
    }),
  );
};

const removeBinding = (idx: number) => {
  if (!compositeAdapter.value || compositeAdapter.value.childBindings.length <= 1) return;
  compositeAdapter.value.childBindings.splice(idx, 1);
};

const updateBindingField = (binding: CompositeChildBinding, field: 'outputId' | 'targetPath' | 'valuePath' | 'writeMode', value: string) => {
  if (field === 'outputId') {
    binding.outputId = value;
    return;
  }
  if (field === 'writeMode') {
    binding.writeMode = value as CompositeChildBinding['writeMode'];
    return;
  }
  if (field === 'targetPath') {
    binding.targetPath = value;
    binding.childProp = value;
    return;
  }
  binding.valuePath = value;
  binding.sourceField = value;
};

const childSelectOptions = computed(() =>
  groupList.value.map((child, idx) => ({
    label: getChildTitle(child.id, idx),
    value: child.id,
  })),
);

const updateSource = (source: CompositeDataSource, field: 'name' | 'type', value: string) => {
  if (field === 'name') {
    source.name = value;
    return;
  }
  source.type = value as CompositeDataSource['type'];
  source.config = source.config ?? {};
};

const updateOutput = (output: CompositeDataOutput, field: 'kind' | 'name' | 'sourceId' | 'transformType', value: string) => {
  if (field === 'name') {
    output.name = value;
    return;
  }
  if (field === 'sourceId') {
    output.sourceId = value;
    return;
  }
  if (field === 'kind') {
    output.kind = value as CompositeDataOutput['kind'];
    return;
  }
  output.transformType = value as CompositeDataOutput['transformType'];
};

const updateSourceConfig = (source: CompositeDataSource, field: 'queryType' | 'requestUrl', value: string) => {
  if (!source.config) {
    source.config = {};
  }
  if (field === 'requestUrl') {
    source.config.requestUrl = value;
    return;
  }
  source.config.requestIoTDeviceConfig = source.config.requestIoTDeviceConfig
    ? {
        ...source.config.requestIoTDeviceConfig,
        queryType: value as 'deviceInfo' | 'deviceStatus' | 'property',
      }
    : {
        queryType: value as 'deviceInfo' | 'deviceStatus' | 'property',
      };
};

const ensureAjaxConfig = (source: CompositeDataSource) => {
  source.config = source.config ?? {};
  source.config.requestHttpType = source.config.requestHttpType ?? RequestHttpEnum.GET;
  source.config.requestParamsBodyType = source.config.requestParamsBodyType ?? RequestBodyEnum.JSON;
  source.config.requestParams = source.config.requestParams
    ? {
        Body: {
          'form-data': source.config.requestParams.Body?.['form-data'] ?? {},
          'x-www-form-urlencoded': source.config.requestParams.Body?.['x-www-form-urlencoded'] ?? {},
          json: source.config.requestParams.Body?.json ?? '{}',
          xml: source.config.requestParams.Body?.xml ?? '',
        },
        Header: source.config.requestParams.Header ?? {},
        Params: source.config.requestParams.Params ?? {},
      }
    : {
        Body: {
          'form-data': {},
          'x-www-form-urlencoded': {},
          json: '{}',
          xml: '',
        },
        Header: {},
        Params: {},
      };
  return source.config;
};

const updateAjaxConfig = (source: CompositeDataSource, field: 'bodyJson' | 'method' | 'requestParamsBodyType' | 'requestUrl', value: string) => {
  const config = ensureAjaxConfig(source);
  if (field === 'requestUrl') {
    config.requestUrl = value;
    return;
  }
  if (field === 'method') {
    config.requestHttpType = value as RequestHttpEnum;
    return;
  }
  if (field === 'requestParamsBodyType') {
    config.requestParamsBodyType = value as RequestBodyEnum;
    return;
  }
  config.requestParams = config.requestParams ?? {
    Body: {
      'form-data': {},
      'x-www-form-urlencoded': {},
      json: '{}',
      xml: '',
    },
    Header: {},
    Params: {},
  };
  config.requestParams.Body.json = value;
};

const getDefaultCustomTimeRange = (): [number, number] => {
  const now = Date.now();
  return [now - 3_600_000, now];
};

const getAjaxHeaderDraft = (source: CompositeDataSource) => {
  const sourceId = source.id;
  if (ajaxHeaderDraftMap.value[sourceId] === undefined) {
    ajaxHeaderDraftMap.value[sourceId] = JSON.stringify(ensureAjaxConfig(source).requestParams?.Header ?? {}, null, 2);
  }
  return ajaxHeaderDraftMap.value[sourceId];
};

const getAjaxParamsDraft = (source: CompositeDataSource) => {
  const sourceId = source.id;
  if (ajaxParamsDraftMap.value[sourceId] === undefined) {
    ajaxParamsDraftMap.value[sourceId] = JSON.stringify(ensureAjaxConfig(source).requestParams?.Params ?? {}, null, 2);
  }
  return ajaxParamsDraftMap.value[sourceId];
};

const setAjaxHeaderDraft = (sourceId: string, value: string) => {
  ajaxHeaderDraftMap.value = {
    ...ajaxHeaderDraftMap.value,
    [sourceId]: value,
  };
};

const setAjaxParamsDraft = (sourceId: string, value: string) => {
  ajaxParamsDraftMap.value = {
    ...ajaxParamsDraftMap.value,
    [sourceId]: value,
  };
};

const commitAjaxObjectDraft = (source: CompositeDataSource, field: 'Header' | 'Params') => {
  const config = ensureAjaxConfig(source);
  const draft = field === 'Header' ? ajaxHeaderDraftMap.value[source.id] : ajaxParamsDraftMap.value[source.id];
  if (draft === undefined) return;

  try {
    const parsed = draft.trim() ? JSON.parse(draft) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new TypeError('invalid object');
    }
    config.requestParams = config.requestParams ?? {
      Body: {
        'form-data': {},
        'x-www-form-urlencoded': {},
        json: '{}',
        xml: '',
      },
      Header: {},
      Params: {},
    };
    config.requestParams[field] = parsed as Record<string, string>;
  } catch {
    (window as any).$message?.warning(editorT('bigscreenEditor.dynamic.message65', { field: String(field) }));
  }
};

const updateOutputConfig = (output: CompositeDataOutput, field: 'aggregateKeys' | 'path', value: string) => {
  if (field === 'path') {
    output.path = value;
    return;
  }
  output.aggregateKeys = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const ensureIotConfig = (source: CompositeDataSource) => {
  source.config = source.config ?? {};
  source.config.requestIoTDeviceConfig = source.config.requestIoTDeviceConfig
    ? {
        // 原显式兜底字段会被下方展开整体覆盖（TS2783 判定冗余），行为等价于纯展开
        ...source.config.requestIoTDeviceConfig,
      }
    : {
        aggFunc: 'last',
        aggFuncs: ['avg', 'min', 'max'],
        areaIDs: [],
        dataIDs: [],
        dataView: 'prop',
        deviceNames: [],
        logInterval: '10m',
        logTimeRange: '1h',
        mode: 'latest',
        productID: '',
        queryType: 'property',
      };

  return source.config.requestIoTDeviceConfig;
};

const getSourceDeviceOptions = (sourceId: string) => deviceOptionsMap.value[sourceId] ?? [];
const getSourceSchemaOptions = (sourceId: string) => schemaOptionsMap.value[sourceId] ?? [];

const loadSchemaOptions = async (sourceId: string, productID: string) => {
  if (!productID) {
    schemaOptionsMap.value = { ...schemaOptionsMap.value, [sourceId]: [] };
    return;
  }
  try {
    const res = await getProductSchema({ productID });
    schemaOptionsMap.value = {
      ...schemaOptionsMap.value,
      [sourceId]: (res?.data?.list ?? []).map((item: any) => ({
        label: `${item.name ?? item.identifier}（${item.identifier}）`,
        value: item.identifier,
      })),
    };
  } catch {
    schemaOptionsMap.value = { ...schemaOptionsMap.value, [sourceId]: [] };
  }
};

const loadDeviceOptions = async (sourceId: string, productID: string, areaIDs?: string[]) => {
  if (!productID) {
    deviceOptionsMap.value = { ...deviceOptionsMap.value, [sourceId]: [] };
    return;
  }
  try {
    const normalizedAreaIDs = Array.isArray(areaIDs) ? areaIDs.filter(Boolean) : [];
    const params: {
      areaID?: string;
      areaIDs?: string[];
      page: { page: number; size: number };
      productID: string;
    } = {
      page: { page: 1, size: 200 },
      productID,
    };
    if (normalizedAreaIDs.length === 1) {
      params.areaID = normalizedAreaIDs[0];
    } else if (normalizedAreaIDs.length > 1) {
      params.areaIDs = normalizedAreaIDs;
    }
    const res = await getDeviceList(params);
    deviceOptionsMap.value = {
      ...deviceOptionsMap.value,
      [sourceId]: extractList(res).map((item: any) => ({
        label: item.deviceAlias || item.deviceName || normalizeOptionValue(item.deviceName),
        value: normalizeOptionValue(item.deviceName),
      })),
    };
  } catch {
    deviceOptionsMap.value = { ...deviceOptionsMap.value, [sourceId]: [] };
  }
};

const updateIotConfig = (
  source: CompositeDataSource,
  field: 'aggFunc' | 'areaIDs' | 'customTimeRange' | 'dataIDs' | 'deviceNames' | 'logInterval' | 'logTimeRange' | 'mode' | 'productID' | 'queryType',
  value: any,
) => {
  const config = ensureIotConfig(source);
  (config as any)[field] = field === 'productID' ? (value ? normalizeOptionValue(value) : '') : value;

  if (field === 'productID') {
    config.deviceNames = [];
    config.dataIDs = [];
    // productID 类型上可空，loadSchemaOptions/loadDeviceOptions 内部对空值已有守卫，兜底空串行为等价
    void loadSchemaOptions(source.id, config.productID ?? '');
    void loadDeviceOptions(source.id, config.productID ?? '', config.areaIDs);
  }

  if (field === 'areaIDs') {
    config.deviceNames = [];
    void loadDeviceOptions(source.id, config.productID ?? '', config.areaIDs);
  }

  if (field === 'logTimeRange' && value !== 'custom') {
    config.customTimeRange = undefined;
  }
};

watch(
  () => compositeAdapter.value?.sources,
  (sources) => {
    for (const source of sources ?? []) {
      if (source.type !== 'iot') continue;
      const config = ensureIotConfig(source);
      if (config.productID) {
        void loadSchemaOptions(source.id, config.productID);
        void loadDeviceOptions(source.id, config.productID, config.areaIDs ?? []);
      }
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div v-if="compositeAdapter" class="composite-adapter-editor">
    <n-text depth="3" style="display: block; margin-bottom: 8px; font-size: 12px">
      {{ editorT('bigscreenEditor.ui.compositeComponentsUseDataSourceOutputPortChild') }}
    </n-text>

    <CollapseItem :name="editorT('bigscreenManagement.ui.dataSource')" :expanded="true">
      <n-space vertical :size="8">
        <n-collapse>
          <n-collapse-item v-for="source in compositeAdapter.sources" :key="source.id" :name="source.id">
            <template #header>
              <n-space align="center" justify="space-between" style="width: 100%">
                <n-space align="center" :size="6">
                  <n-tag size="small" type="info">{{ source.type }}</n-tag>
                  <n-text>{{ source.name }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 12px">{{ summarizeSource(source) }}</n-text>
              </n-space>
            </template>

            <n-space vertical :size="8">
              <n-grid :cols="4" :x-gap="8">
                <n-gi>
                  <n-input :value="source.name" :placeholder="editorT('bigscreenManagement.ui.definitionDataSourceName')" size="small" @update:value="(value: string) => updateSource(source, 'name', value)" />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="source.type"
                    :options="sourceTypeOptions"
                    size="small"
                    @update:value="(value: string) => updateSource(source, 'type', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-space align="center" justify="space-between">
                    <n-text depth="3" style="font-size: 12px">{{ source.id }}</n-text>
                    <n-switch v-model:value="source.enabled" size="small" />
                  </n-space>
                </n-gi>
                <n-gi>
                  <n-button block size="small" tertiary type="error" @click="removeSource(source.id)">{{ editorT('orgManage.common.delete') }}</n-button>
                </n-gi>
              </n-grid>

              <template v-if="source.type === 'ajax'">
                <n-space vertical :size="6" style="width: 100%">
                  <n-input
                    :value="ensureAjaxConfig(source).requestUrl"
                    placeholder="requestUrl"
                    size="small"
                    @update:value="(value: string) => updateAjaxConfig(source, 'requestUrl', value)"
                  />
                  <n-grid :cols="2" :x-gap="6">
                    <n-gi>
                      <n-select
                        :value="ensureAjaxConfig(source).requestHttpType"
                        :options="ajaxMethodOptions"
                        size="small"
                        @update:value="(value: string) => updateAjaxConfig(source, 'method', value)"
                      />
                    </n-gi>
                    <n-gi>
                      <n-select
                        :value="ensureAjaxConfig(source).requestParamsBodyType"
                        :options="ajaxBodyTypeOptions"
                        size="small"
                        @update:value="(value: string) => updateAjaxConfig(source, 'requestParamsBodyType', value)"
                      />
                    </n-gi>
                  </n-grid>
                  <n-input
                    :value="getAjaxHeaderDraft(source)"
                    type="textarea"
                    placeholder="Header JSON"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    @update:value="(value: string) => setAjaxHeaderDraft(source.id, value)"
                    @blur="() => commitAjaxObjectDraft(source, 'Header')"
                  />
                  <n-input
                    :value="getAjaxParamsDraft(source)"
                    type="textarea"
                    placeholder="Params JSON"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    @update:value="(value: string) => setAjaxParamsDraft(source.id, value)"
                    @blur="() => commitAjaxObjectDraft(source, 'Params')"
                  />
                  <n-input
                    :value="ensureAjaxConfig(source).requestParams?.Body?.json"
                    type="textarea"
                    placeholder="JSON Body"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                    @update:value="(value: string) => updateAjaxConfig(source, 'bodyJson', value)"
                  />
                </n-space>
              </template>

              <template v-else-if="source.type === 'iot'">
                <n-space vertical :size="6" style="width: 100%">
                  <n-select
                    :value="ensureIotConfig(source).queryType"
                    :options="iotQueryTypeOptions"
                    size="small"
                    @update:value="(value: string) => updateIotConfig(source, 'queryType', value)"
                  />
                  <n-select
                    :value="ensureIotConfig(source).mode"
                    :options="iotModeOptions"
                    size="small"
                    @update:value="(value: string) => updateIotConfig(source, 'mode', value)"
                  />
                  <n-select
                    :value="ensureIotConfig(source).productID"
                    :options="productOptions"
                    size="small"
                    :placeholder="editorT('scene.ui.selectProduct')"
                    @update:value="(value: string) => updateIotConfig(source, 'productID', value)"
                  />
                  <n-select
                    :value="ensureIotConfig(source).areaIDs"
                    :options="areaOptions"
                    multiple
                    filterable
                    clearable
                    size="small"
                    :placeholder="editorT('orgIotClient.console.selectAreaTitle')"
                    @update:value="(value: string[]) => updateIotConfig(source, 'areaIDs', value)"
                  />
                  <n-select
                    :value="ensureIotConfig(source).deviceNames"
                    :options="getSourceDeviceOptions(source.id)"
                    multiple
                    filterable
                    clearable
                    size="small"
                    :placeholder="editorT('iotApp.ota.chooseDevices')"
                    @update:value="(value: string[]) => updateIotConfig(source, 'deviceNames', value)"
                  />
                  <n-select
                    v-if="ensureIotConfig(source).queryType === 'property'"
                    :value="ensureIotConfig(source).dataIDs"
                    :options="getSourceSchemaOptions(source.id)"
                    multiple
                    filterable
                    clearable
                    size="small"
                    :placeholder="editorT('bigscreenEditor.ui.selectProperty')"
                    @update:value="(value: string[]) => updateIotConfig(source, 'dataIDs', value)"
                  />
                  <n-grid :cols="2" :x-gap="6">
                    <n-gi>
                      <n-select
                        :value="ensureIotConfig(source).aggFunc"
                        :options="iotAggFuncOptions"
                        size="small"
                        @update:value="(value: string) => updateIotConfig(source, 'aggFunc', value)"
                      />
                    </n-gi>
                    <n-gi>
                      <n-select
                        :value="ensureIotConfig(source).logTimeRange"
                        :options="iotTimeRangeOptions"
                        size="small"
                        @update:value="(value: string) => updateIotConfig(source, 'logTimeRange', value)"
                      />
                    </n-gi>
                  </n-grid>
                  <n-input
                    v-if="ensureIotConfig(source).mode === 'log'"
                    :value="ensureIotConfig(source).logInterval"
                    :placeholder="editorT('bigscreenEditor.ui.logintervalEG10m1h')"
                    size="small"
                    @update:value="(value: string) => updateIotConfig(source, 'logInterval', value)"
                  />
                  <n-date-picker
                    v-if="ensureIotConfig(source).mode === 'log' && ensureIotConfig(source).logTimeRange === 'custom'"
                    :value="ensureIotConfig(source).customTimeRange"
                    type="datetimerange"
                    clearable
                    size="small"
                    :default-value="getDefaultCustomTimeRange()"
                    @update:value="(value: [number, number] | null) => updateIotConfig(source, 'customTimeRange', value ?? undefined)"
                  />
                </n-space>
              </template>

              <n-text v-else depth="3" style="font-size: 12px">{{ editorT('bigscreenEditor.ui.thisTypeCurrentlyUsesGroupLevelRequestOr') }}</n-text>
            </n-space>
          </n-collapse-item>
        </n-collapse>

        <n-button block size="small" dashed @click="addSource">{{ editorT('platformManage.devops.newDatasource') }}</n-button>
      </n-space>
    </CollapseItem>

    <CollapseItem :name="editorT('bigscreenEditor.ui.dataOutput')" :expanded="false">
      <n-space vertical :size="8">
        <n-collapse>
          <n-collapse-item v-for="output in compositeAdapter.outputs" :key="output.id" :name="output.id">
            <template #header>
              <n-space align="center" justify="space-between" style="width: 100%">
                <n-space align="center" :size="6">
                  <n-tag size="small" type="warning">{{ output.kind }}</n-tag>
                  <n-text>{{ output.name }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 12px">{{ summarizeOutput(output) }}</n-text>
              </n-space>
            </template>

            <n-space vertical :size="8">
              <n-grid :cols="5" :x-gap="8">
                <n-gi>
                  <n-input :value="output.name" :placeholder="editorT('bigscreenEditor.ui.outputName')" size="small" @update:value="(value: string) => updateOutput(output, 'name', value)" />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="output.sourceId"
                    :options="sourceOptions"
                    size="small"
                    @update:value="(value: string) => updateOutput(output, 'sourceId', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="output.kind"
                    :options="outputKindOptions"
                    size="small"
                    @update:value="(value: string) => updateOutput(output, 'kind', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="output.transformType"
                    :options="transformTypeOptions"
                    size="small"
                    @update:value="(value: string) => updateOutput(output, 'transformType', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-button block size="small" tertiary type="error" @click="removeOutput(output.id)">{{ editorT('orgManage.common.delete') }}</n-button>
                </n-gi>
              </n-grid>

              <n-grid :cols="2" :x-gap="8">
                <n-gi>
                  <n-input
                    :value="output.path"
                    placeholder="output.path（pick / toDataset）"
                    size="small"
                    @update:value="(value: string) => updateOutputConfig(output, 'path', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-input
                    :value="(output.aggregateKeys ?? []).join(',')"
                    :placeholder="editorT('bigscreenEditor.ui.aggregatekeysCommaSeparated')"
                    size="small"
                    @update:value="(value: string) => updateOutputConfig(output, 'aggregateKeys', value)"
                  />
                </n-gi>
              </n-grid>
            </n-space>
          </n-collapse-item>
        </n-collapse>

        <n-button block size="small" dashed @click="addOutput">{{ editorT('bigscreenEditor.ui.addOutputPort') }}</n-button>
      </n-space>
    </CollapseItem>

    <CollapseItem :name="editorT('bigscreenEditor.ui.childComponentBindings')" :expanded="false">
      <n-space vertical :size="8">
        <n-collapse>
          <n-collapse-item v-for="(binding, idx) in compositeAdapter.childBindings" :key="`${binding.childId}_${idx}`" :name="`${binding.childId}_${idx}`">
            <template #header>
              <n-space align="center" justify="space-between" style="width: 100%">
                <n-space align="center" :size="6">
                  <n-tag size="small" type="success">{{ binding.writeMode || 'path' }}</n-tag>
                  <n-text>{{ getChildTitle(binding.childId, idx) }}</n-text>
                </n-space>
                <n-text depth="3" style="font-size: 12px">{{ summarizeBinding(binding, idx) }}</n-text>
              </n-space>
            </template>

            <n-space vertical :size="8">
              <n-grid :cols="5" :x-gap="8">
                <n-gi>
                  <n-select v-model:value="binding.childId" :options="childSelectOptions" size="small" />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="binding.outputId"
                    :options="outputOptions"
                    size="small"
                    @update:value="(value: string) => updateBindingField(binding, 'outputId', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-select
                    :value="binding.writeMode"
                    :options="writeModeOptions"
                    size="small"
                    @update:value="(value: string) => updateBindingField(binding, 'writeMode', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-input
                    :value="binding.targetPath"
                    placeholder="targetPath"
                    size="small"
                    @update:value="(value: string) => updateBindingField(binding, 'targetPath', value)"
                  />
                </n-gi>
                <n-gi>
                  <n-input
                    :value="binding.valuePath"
                    placeholder="valuePath"
                    size="small"
                    @update:value="(value: string) => updateBindingField(binding, 'valuePath', value)"
                  />
                </n-gi>
              </n-grid>
              <n-button block size="small" tertiary type="error" @click="removeBinding(idx)">{{ editorT('bigscreenEditor.ui.deleteThisBinding') }}</n-button>
            </n-space>
          </n-collapse-item>
        </n-collapse>

        <n-button block size="small" dashed @click="addBinding">{{ editorT('bigscreenEditor.ui.addBinding') }}</n-button>
      </n-space>
    </CollapseItem>
  </div>
  <n-empty v-else :description="editorT('bigscreenEditor.ui.compositeAdapterConfigurationNotFound')" size="small" />
</template>

<style lang="scss" scoped>
.composite-adapter-editor {
  padding: 0 4px;
}
</style>
