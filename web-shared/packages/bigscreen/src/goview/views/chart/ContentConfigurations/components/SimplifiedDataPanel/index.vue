<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
﻿<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';

import { SettingItemBox } from '@/components/Pages/ChartItemSetting';
import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { loadAsyncComponent } from '@/utils';
import { resolveDatasetSourceMeta, sortDatasetsBySource } from '@/utils/datasetSource';
import { cloneDeep } from 'lodash';
import { useMessage } from 'naive-ui';

import { customizeHttp } from '@/api/http';
import { getDatasetOne, getEditorDatasetList, getEditorGroupList, previewDataset } from '../../../../../api/dataset';
import { isSingleValueChart } from '../ChartData/components/ChartDataIoTDevice/queryTypeSupport';
import { useTargetData } from '../hooks/useTargetData.hook';

const ChartDataMatchingAndShow = loadAsyncComponent(() => import('../ChartData/components/ChartDataMatchingAndShow/index.vue'));
const ChartDataIoTDevice = loadAsyncComponent(() => import('../ChartData/components/ChartDataIoTDevice/index.vue'));
const CompositeAdapterEditor = loadAsyncComponent(() => import('./components/CompositeAdapterEditor/index.vue'));

const { targetData } = useTargetData();
const chartEditStore = useChartEditStore();
const message = useMessage();

const defaultJsFilterCode = '// 请编写过滤函数，必须 return 数组\nreturn data.filter(item => item.province === "广东");';

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const mockPreview = computed({
  get: () => chartEditStore.getComponentMockPreview,
  set: (val: boolean) => chartEditStore.setComponentMockPreview(val),
});

const baseSeries = computed(() => targetData.value?.option?.series?.[0] || { type: 'bar' });

let autoRenderTimer: null | ReturnType<typeof setTimeout> = null;

const selectedGroup = ref<null | string>(null);
const selectedModel = ref<null | string>(null);
const groupOptions = ref<Array<{ label: string; value: string }>>([]);
const modelOptions = ref<Array<{ label: string; value: string }>>([]);

const showPreviewModal = ref(false);
const previewData = ref<any>(null);
const previewLoading = ref(false);
const cachedDatasetData = ref<any>(null);

const dynamicParams = ref<any>({});
const paramValues = ref<Record<string, any>>({});

const fieldOptions = ref<any[]>([]);
const datasetOutputFields = ref<any[] | null>(null);
const selectedDimension = ref<null | string>(null);
const selectedMetrics = ref<string[]>([]);

const uiFilterEnabled = ref(false);
const uiFilterField = ref<null | string>(null);
const uiFilterRule = ref<string>('=');
const uiFilterValue = ref<string>('');
const uiFilterRuleOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.equal'); }, value: '=' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.notEqual'); }, value: '!=' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.greaterThan'); }, value: '>' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.lessThan'); }, value: '<' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.containsContains'); }, value: 'contains' },
];

const jsFilterEnabled = ref(false);
const jsFilterCode = ref<string>(defaultJsFilterCode);

const maxMetricsCount = computed(() => {
  const saved = targetData.value?.option?._datasetConfig?.maxMetrics;
  if (saved !== undefined && saved !== null) return saved;

  const seriesLen = targetData.value?.option?.series?.length;
  if (seriesLen && seriesLen >= 1) return seriesLen;

  const chartKey = targetData.value?.chartConfig?.key || (targetData.value as any)?.chartKey;
  const singleMetricCharts = ['PieCommon', 'CapsuleChart', 'LineGradientSingle', 'PieCircle', 'Process', 'WaterPolo', 'Dial'];
  if (chartKey && singleMetricCharts.includes(chartKey)) return 1;

  return Infinity;
});

const isMultiMetricChart = computed(() => maxMetricsCount.value > 1);

const isShowDimension = computed(() => {
  const chartKey = targetData.value?.chartConfig?.key || (targetData.value as any)?.chartKey || (targetData.value?.chartConfig as any)?.chartKey;
  if (!chartKey) return true;
  return !isSingleValueChart(chartKey);
});

const xAxisOptions = computed(() => {
  return fieldOptions.value.map((item) => ({
    ...item,
    label: `${item.label}`,
    disabled: selectedMetrics.value.includes(item.value),
  }));
});

const yAxisOptions = computed(() => {
  const limit = maxMetricsCount.value;
  const atLimit = selectedMetrics.value.length >= limit;
  const sourceOptions = isShowDimension.value
    ? fieldOptions.value.filter((item) => item.type === 'number')
    : fieldOptions.value.filter((item) => item.role !== 'dimension');

  return sourceOptions.map((item) => ({
    ...item,
    label: `${item.label}`,
    disabled: selectedDimension.value === item.value || (atLimit && !selectedMetrics.value.includes(item.value)),
  }));
});

const parseDynamicParams = (paramsJson: string) => {
  try {
    const params = JSON.parse(paramsJson || '{}');
    dynamicParams.value = params;
    paramValues.value = {};
    Object.keys(params).forEach((key) => {
      if (params[key].default !== undefined) {
        paramValues.value[key] = params[key].default;
      }
    });
  } catch (error) {
    console.error('解析动态参数失败:', error);
    dynamicParams.value = {};
    paramValues.value = {};
  }
};

const extractFields = (data: any) => {
  try {
    let rows = data?.rows;
    if (typeof rows === 'string') rows = JSON.parse(rows);
    if (!Array.isArray(rows) || rows.length === 0) return [];

    if (jsFilterEnabled.value && jsFilterCode.value) {
      try {
        // eslint-disable-next-line no-new-func
        const sandbox = new Function('data', jsFilterCode.value);
        const result = sandbox(rows);
        if (Array.isArray(result) && result.length > 0) {
          rows = result;
        }
      } catch (error) {
        console.warn('extractFields: JS filter 执行失败，改用原始数据提取字段', error);
      }
    }

    const firstRow = rows[0];
    const fields = Object.keys(firstRow);
    const outputFieldMap = new Map<string, { label: string; hidden: boolean; role: string }>();

    if (Array.isArray(datasetOutputFields.value)) {
      for (const field of datasetOutputFields.value) {
        if (field?.key) {
          outputFieldMap.set(field.key, {
            label: field.label || field.key,
            hidden: field.hidden === 'true' || field.hidden === true,
            role: field.role || '',
          });
        }
      }
    }

    fieldOptions.value = fields
      .filter((field) => !outputFieldMap.get(field)?.hidden)
      .map((field) => {
        const meta = outputFieldMap.get(field);
        const value = firstRow[field];
        return {
          label: meta?.label || field,
          value: field,
          type: typeof value === 'number' ? 'number' : 'string',
          role: meta?.role || '',
        };
      });

    if (fieldOptions.value.length > 0) {
      const dimField = fieldOptions.value.find((item) => item.role === 'dimension');
      const metricField = fieldOptions.value.find((item) => item.role === 'metric');
      if (dimField && isShowDimension.value) selectedDimension.value = dimField.value;
      if (metricField && selectedMetrics.value.length === 0) selectedMetrics.value = [metricField.value];
    }

    return fields;
  } catch (error) {
    console.error('提取字段失败:', error);
  }
  return [];
};

const handlePreview = async () => {
  if (!selectedModel.value) {
    message.warning(editorT('bigscreenEditor.ui.selectDataModelFirst'));
    return;
  }
  previewLoading.value = true;
  try {
    const res = await previewDataset(Number(selectedModel.value));
    previewData.value = res.data;
    showPreviewModal.value = true;
    extractFields(res.data);
  } catch {
    message.error(editorT('bigscreenEditor.ui.failedPreviewData'));
  } finally {
    previewLoading.value = false;
  }
};

const formattedPreviewData = computed(() => {
  if (!previewData.value) return {};
  const data = { ...previewData.value };
  if (typeof data.rows === 'string') {
    try {
      data.rows = JSON.parse(data.rows);
    } catch (error) {
      console.warn('预览解析失败', error);
    }
  }
  return data;
});

const handleExecuteAndRender = async () => {
  // ── 公共数据池模式 ──
  if (dataSourceMode.value === 'pool') {
    if (!selectedModel.value) {
      message.warning(editorT('bigscreenEditor.ui.selectDataModelFirst'));
      return;
    }
    if (isShowDimension.value && !selectedDimension.value) {
      message.warning(editorT('bigscreenEditor.ui.selectDimensionFieldXAxis'));
      return;
    }
    if (isShowDimension.value && selectedMetrics.value.length === 0) {
      message.warning(editorT('bigscreenEditor.ui.selectAtLeastOneMetricFieldYAxis'));
      return;
    }

    const capturedId = targetData.value?.id;

    try {
      const res = await previewDataset(Number(selectedModel.value));
      if (targetData.value?.id !== capturedId) return;
      const dataToRender = res.data;
      cachedDatasetData.value = dataToRender;

      let rows = dataToRender?.rows;
      if (typeof rows === 'string') rows = JSON.parse(rows);
      if (!Array.isArray(rows) || rows.length === 0) {
        message.warning(editorT('bigscreenEditor.ui.datasetReturnedNoData'));
        return;
      }

      let finalSource = [...rows];

      if (jsFilterEnabled.value && jsFilterCode.value) {
        try {
          // eslint-disable-next-line no-new-func
          const sandbox = new Function('data', jsFilterCode.value);
          const result = sandbox(finalSource);
          if (Array.isArray(result)) {
            finalSource = result;
          } else {
            message.warning(editorT('bigscreenEditor.ui.javascriptFilterMustReturnArrayThisStepWas'));
          }
        } catch (error) {
          message.error(editorT('bigscreenEditor.ui.checkJavaScriptFilterSyntaxErrors'));
          console.error(error);
          return;
        }
      }

      if (uiFilterEnabled.value && uiFilterField.value && uiFilterValue.value !== '') {
        finalSource = finalSource.filter((row: any) => {
          const rowVal = row[uiFilterField.value!];
          const targetVal = uiFilterValue.value;
          if (uiFilterRule.value === '=') return String(rowVal) === String(targetVal);
          if (uiFilterRule.value === '!=') return String(rowVal) !== String(targetVal);
          if (uiFilterRule.value === '>') return Number(rowVal) > Number(targetVal);
          if (uiFilterRule.value === '<') return Number(rowVal) < Number(targetVal);
          if (uiFilterRule.value === 'contains') return String(rowVal).includes(String(targetVal));
          return true;
        });
      }

      if (finalSource.length === 0) {
        message.warning(editorT('bigscreenEditor.ui.filterReturnedNoDataCheckConditionsOrJavaScript'));
        return;
      }

      const dimensions = [selectedDimension.value, ...selectedMetrics.value].filter(Boolean) as string[];
      finalSource = finalSource.map((row: any) => {
        const nextRow: any = { ...row };
        dimensions.forEach((dim) => {
          if (selectedMetrics.value.includes(dim)) {
            const num = Number(row[dim]);
            nextRow[dim] = Number.isFinite(num) ? num : row[dim];
          }
        });
        return nextRow;
      });

      if (targetData.value?.id !== capturedId) return;

      if (targetData.value?.option) {
        if (isShowDimension.value) {
          const existingSeries = targetData.value.option.series || [];
          targetData.value.option.series = selectedMetrics.value.map((_, index) => cloneDeep(existingSeries[index] || existingSeries[0] || baseSeries.value));
          targetData.value.option.dataset = { dimensions, source: finalSource };
        } else {
          const metric = selectedMetrics.value[0] || Object.keys(finalSource[0] || {})[0] || '';
          const chartKey = targetData.value?.chartConfig?.key || (targetData.value as any)?.chartKey || '';
          const rawValue = finalSource[0]?.[metric];
          const singleValue = chartKey === 'TextCommon' ? (rawValue ?? '') : Number(rawValue) || 0;
          targetData.value.option.dataset = singleValue;
        }

        targetData.value.option._datasetConfig = {
          selectedGroup: selectedGroup.value,
          selectedModel: selectedModel.value,
          pollingEnabled: pollingEnabled.value,
          pollingInterval: pollingInterval.value,
          pollingUnit: pollingUnit.value,
          selectedDimension: selectedDimension.value,
          selectedMetrics: [...selectedMetrics.value],
          maxMetrics: maxMetricsCount.value,
          uiFilterEnabled: uiFilterEnabled.value,
          uiFilterField: uiFilterField.value,
          uiFilterRule: uiFilterRule.value,
          uiFilterValue: uiFilterValue.value,
          jsFilterEnabled: jsFilterEnabled.value,
          jsFilterCode: jsFilterCode.value,
        };
      }

      message.success(editorT('bigscreenEditor.ui.dataLoadedAndChartRendered'));
    } catch (error) {
      message.error(editorT('bigscreenEditor.ui.requestFailed'));
      console.error('执行请求失败:', error);
    }
    return;
  }

  // ── 自定义专属请求模式 ──
  if (!requestUrl.value) {
    message.warning(editorT('bigscreenEditor.ui.enterAPIURL'));
    return;
  }

  if (targetData.value?.request) {
    targetData.value.request.requestHttpType = requestMethod.value as any;
    targetData.value.request.requestUrl = requestUrl.value;
    targetData.value.request.requestDataType = RequestDataTypeEnum.AJAX;
  }

  try {
    const res = await customizeHttp(toRaw(targetData.value!.request), toRaw(chartEditStore.getRequestGlobalConfig));
    if (res) {
      targetData.value!.option.dataset = res.data;
      message.success(editorT('bigscreenEditor.ui.dataLoadedAndChartRendered'));
    }
  } catch (error) {
    message.error(editorT('bigscreenEditor.ui.requestFailed'));
    console.error('执行请求失败:', error);
  }
};

const loadGroups = async () => {
  try {
    const res = await getEditorGroupList('dataset');
    groupOptions.value = (res.data?.list || [])
      .filter((item: any) => resolveDatasetSourceMeta(item).value !== 'system')
      .map((item: any) => ({ label: item.name, value: String(item.id) }));
  } catch {}
};

const loadDatasets = async (groupId?: number) => {
  try {
    const res = await getEditorDatasetList({ groupId });
    modelOptions.value = sortDatasetsBySource(res.data?.list || [])
      .filter((item: any) => resolveDatasetSourceMeta(item).value !== 'system')
      .map((item: any) => ({ label: item.displayName || item.name, value: String(item.id) }));
  } catch {}
};

watch(selectedGroup, (newGroupId) => {
  if (!isDynamic.value || dataSourceMode.value !== 'pool') return;
  if (newGroupId) {
    void loadDatasets(Number(newGroupId));
  } else {
    void loadDatasets();
  }
});

const handleModelChange = async (newModelId: null | number | string) => {
  if (!newModelId) return;
  const capturedId = targetData.value?.id;

  selectedDimension.value = null;
  selectedMetrics.value = [];
  cachedDatasetData.value = null;

  try {
    try {
      const detailRes = await getDatasetOne(Number(newModelId));
      if (targetData.value?.id !== capturedId) return;
      if (detailRes.data?.dynamicParams) parseDynamicParams(detailRes.data.dynamicParams);
      if (detailRes.data?.outputFields) {
        try {
          datasetOutputFields.value = typeof detailRes.data.outputFields === 'string' ? JSON.parse(detailRes.data.outputFields) : detailRes.data.outputFields;
        } catch {
          datasetOutputFields.value = null;
        }
      } else {
        datasetOutputFields.value = null;
      }
    } catch {}

    const previewRes = await previewDataset(Number(newModelId));
    if (targetData.value?.id !== capturedId) return;
    cachedDatasetData.value = previewRes.data;
    extractFields(previewRes.data);
    message.success(editorT('bigscreenEditor.ui.datasetSwitchedAndFieldDictionaryUpdated'));
  } catch {
    message.error(editorT('bigscreenEditor.ui.failedFetchDatasetAutomatically'));
  }
};

const requestMethod = ref('GET');
const requestUrl = ref('');
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

const simplifiedData = computed(() => targetData.value?.option?._simplifiedData);
const isComposite = computed(() => simplifiedData.value?.isComposite === true);

const selectOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.static'); }, value: RequestDataTypeEnum.STATIC },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.iotDevicesRecommended'); }, value: RequestDataTypeEnum.IoTDevice },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.dynamicDataAdvancedGeneralAPI'); }, value: 'DYNAMIC' },
];

const dataSourceMode = computed(() => {
  const type = targetData.value?.request?.requestDataType;
  if (type === RequestDataTypeEnum.AJAX) return 'custom';
  return 'pool';
});

const uiRequestType = computed(() => {
  const type = targetData.value?.request?.requestDataType;
  if (type === RequestDataTypeEnum.AJAX || type === RequestDataTypeEnum.Pond) return 'DYNAMIC';
  return type ?? RequestDataTypeEnum.STATIC;
});

const handleRequestTypeChange = (value: any) => {
  if (!targetData.value?.request) return;
  if (value === 'DYNAMIC') {
    targetData.value.request.requestDataType = dataSourceMode.value === 'pool' ? RequestDataTypeEnum.Pond : RequestDataTypeEnum.AJAX;
  } else {
    targetData.value.request.requestDataType = value;
  }
};

const handleDataSourceModeChange = (mode: 'custom' | 'pool') => {
  if (targetData.value?.request) {
    targetData.value.request.requestDataType = mode === 'pool' ? RequestDataTypeEnum.Pond : RequestDataTypeEnum.AJAX;
  }
};

const isStatic = computed(() => targetData.value?.request?.requestDataType === RequestDataTypeEnum.STATIC);
const isDynamic = computed(() => {
  const type = targetData.value?.request?.requestDataType;
  return type === RequestDataTypeEnum.AJAX || type === RequestDataTypeEnum.Pond;
});

const pollingEnabled = ref(false);
const pollingInterval = ref(5);
const pollingUnit = ref(editorT('orgManage.cloneGroup.unitSeconds'));
const pollingUnitOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.cloneGroup.unitSeconds'); }, value: '秒' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitMinute'); }, value: '分钟' },
];

const clearAutoRenderTimer = () => {
  if (autoRenderTimer) {
    clearTimeout(autoRenderTimer);
    autoRenderTimer = null;
  }
};

const resetPanelState = () => {
  clearAutoRenderTimer();
  selectedGroup.value = null;
  selectedModel.value = null;
  groupOptions.value = [];
  modelOptions.value = [];
  showPreviewModal.value = false;
  previewData.value = null;
  previewLoading.value = false;
  cachedDatasetData.value = null;
  dynamicParams.value = {};
  paramValues.value = {};
  fieldOptions.value = [];
  datasetOutputFields.value = null;
  selectedDimension.value = null;
  selectedMetrics.value = [];
  uiFilterEnabled.value = false;
  uiFilterField.value = null;
  uiFilterRule.value = '=';
  uiFilterValue.value = '';
  jsFilterEnabled.value = false;
  jsFilterCode.value = defaultJsFilterCode;
  requestMethod.value = 'GET';
  requestUrl.value = '';
  pollingEnabled.value = false;
  pollingInterval.value = 5;
  pollingUnit.value = editorT('orgManage.cloneGroup.unitSeconds');
};

const restorePanelState = async () => {
  const savedConfig = targetData.value?.option?._datasetConfig;
  if (!savedConfig) return;

  const savedGroup = savedConfig.selectedGroup ?? null;
  const savedModel = savedConfig.selectedModel ?? null;

  if (savedGroup !== null && savedGroup !== undefined && savedGroup !== '') {
    await loadGroups();
    selectedGroup.value = String(savedGroup);
    await loadDatasets(Number(savedGroup));
  } else {
    selectedGroup.value = null;
    modelOptions.value = [];
  }

  selectedModel.value = savedModel !== null && savedModel !== undefined && savedModel !== '' ? String(savedModel) : null;
  pollingEnabled.value = savedConfig.pollingEnabled ?? false;
  pollingInterval.value = savedConfig.pollingInterval ?? 5;
  pollingUnit.value = savedConfig.pollingUnit ?? editorT('orgManage.cloneGroup.unitSeconds');
  selectedDimension.value = savedConfig.selectedDimension ?? null;
  selectedMetrics.value = savedConfig.selectedMetrics ?? [];
  uiFilterEnabled.value = savedConfig.uiFilterEnabled ?? false;
  uiFilterField.value = savedConfig.uiFilterField ?? null;
  uiFilterRule.value = savedConfig.uiFilterRule ?? '=';
  uiFilterValue.value = savedConfig.uiFilterValue ?? '';
  jsFilterEnabled.value = savedConfig.jsFilterEnabled ?? false;
  jsFilterCode.value = savedConfig.jsFilterCode ?? defaultJsFilterCode;

  const limit = maxMetricsCount.value;
  if (limit !== Infinity && selectedMetrics.value.length > limit) {
    selectedMetrics.value = selectedMetrics.value.slice(0, limit);
  }

  if (selectedModel.value) {
    const mountedId = targetData.value?.id;

    getDatasetOne(Number(selectedModel.value))
      .then((res) => {
        if (targetData.value?.id !== mountedId) return;
        if (res.data?.outputFields) {
          try {
            datasetOutputFields.value = typeof res.data.outputFields === 'string' ? JSON.parse(res.data.outputFields) : res.data.outputFields;
          } catch {
            datasetOutputFields.value = null;
          }
        }
        return previewDataset(Number(selectedModel.value));
      })
      .then((previewRes) => {
        if (!previewRes || targetData.value?.id !== mountedId) return;
        cachedDatasetData.value = previewRes.data;
        extractFields(previewRes.data);
      })
      .catch(() => {});

    if (selectedMetrics.value.length > 0 || !isShowDimension.value) {
      autoRenderTimer = setTimeout(() => {
        autoRenderTimer = null;
        if (targetData.value?.id === mountedId) {
          void handleExecuteAndRender();
        }
      }, 500);
    }
  }
};

onMounted(() => {
  void restorePanelState();
});

watch(
  () => targetData.value?.id,
  (newId, oldId) => {
    if (!newId || newId === oldId) return;
    resetPanelState();
    void restorePanelState();
  },
);

onUnmounted(() => {
  clearAutoRenderTimer();
});

watch(
  () => [isDynamic.value, dataSourceMode.value] as const,
  ([dynamic, mode]) => {
    if (!dynamic || mode !== 'pool') return;
    if (groupOptions.value.length === 0) {
      void loadGroups();
    }
    void loadDatasets(selectedGroup.value ? Number(selectedGroup.value) : undefined);
  },
  { immediate: true },
);

watch([jsFilterEnabled, jsFilterCode], () => {
  if (cachedDatasetData.value) {
    extractFields(cachedDatasetData.value);
  }
});
</script>

<template>
  <div class="simplified-data-panel" v-if="targetData">
    <SettingItemBox :name="editorT('platformManage.devops.requestMethod')" :alone="true">
      <n-select :value="uiRequestType" @update:value="handleRequestTypeChange" :options="selectOptions" />
    </SettingItemBox>

    <SettingItemBox v-if="isComponentMode" :name="editorT('bigscreenEditor.ui.mockDataPreview')" :alone="true">
      <n-space align="center" justify="space-between">
        <n-switch v-model:value="mockPreview" />
        <n-text depth="3" style="font-size: 12px">
          {{ mockPreview ? editorT('bigscreenEditor.ui.skipLiveRequestAndUseStaticData') : editorT('bigscreenEditor.ui.requestLiveData') }}
        </n-text>
      </n-space>
    </SettingItemBox>

    <SettingItemBox v-if="isDynamic" :name="editorT('bigscreenEditor.ui.accessMethod')" :alone="true">
      <n-radio-group :value="dataSourceMode" @update:value="handleDataSourceModeChange">
        <n-space>
          <n-radio value="pool">{{ editorT('bigscreenEditor.ui.fromSharedDataPool') }}</n-radio>
          <n-radio value="custom">{{ editorT('bigscreenEditor.ui.customComponentRequest') }}</n-radio>
        </n-space>
      </n-radio-group>
    </SettingItemBox>

    <CompositeAdapterEditor v-if="isComposite" :target-data="targetData as any" />

    <template v-if="isStatic">
      <ChartDataMatchingAndShow :show="false" :ajax="false" />
    </template>

    <template v-if="isDynamic">
      <n-alert type="info" size="small" style="margin: 10px 0">
        {{ editorT('bigscreenEditor.ui.dynamicDataSuitableGeneralHTTPAPIsSharedData') }}
      </n-alert>
    </template>

    <template v-if="isDynamic && dataSourceMode === 'pool'">
      <SettingItemBox :name="editorT('bigscreenManagement.ui.selectGroup')" :alone="true">
        <n-select v-model:value="selectedGroup" :options="groupOptions" :placeholder="editorT('iotApp.group.selectFirst')" />
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.selectDataset2')" :alone="true">
        <n-select
          v-model:value="selectedModel"
          :options="modelOptions"
          :placeholder="editorT('bigscreenEditor.ui.selectDataset')"
          @update:value="handleModelChange"
        />
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.dynamicParametersAPIArguments')" :alone="true" v-if="Object.keys(dynamicParams).length > 0">
        <n-space vertical>
          <div v-for="(param, key) in dynamicParams" :key="key">
            <n-input v-if="param.type === 'text' || param.type === 'string'" v-model:value="paramValues[key]" :placeholder="param.label">
              <template #prefix>{{ param.label }}:</template>
            </n-input>
            <n-input-number v-else-if="param.type === 'number'" v-model:value="paramValues[key]" :placeholder="param.label" style="width: 100%">
              <template #prefix>{{ param.label }}:</template>
            </n-input-number>
            <n-select v-else-if="param.type === 'select'" v-model:value="paramValues[key]" :options="param.options || []" :placeholder="param.label" />
          </div>
        </n-space>
      </SettingItemBox>

      <SettingItemBox :alone="true">
        <n-button size="small" :loading="previewLoading" @click="handlePreview">{{ editorT('bigscreenEditor.ui.previewResponseData') }}</n-button>
      </SettingItemBox>
    </template>

    <template v-else-if="isDynamic && dataSourceMode === 'custom'">
      <n-alert type="warning" size="small" style="margin: 10px 0">{{ editorT('bigscreenEditor.ui.thisTemporaryRequestOnlyAppliesCurrentComponent') }}</n-alert>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.requestType')" :alone="true">
        <n-select v-model:value="requestMethod" :options="methodOptions" />
      </SettingItemBox>
      <SettingItemBox :name="editorT('bigscreenEditor.ui.apiURL')" :alone="true">
        <n-input v-model:value="requestUrl" placeholder="http://api.example.com" />
      </SettingItemBox>
    </template>

    <template v-if="isDynamic">
      <n-divider style="margin: 15px 0" />
      <SettingItemBox :name="editorT('bigscreenEditor.ui.enablePolling')" :alone="true">
        <n-space align="center">
          <n-switch v-model:value="pollingEnabled" />
          <template v-if="pollingEnabled">
            <n-input-number v-model:value="pollingInterval" :min="1" :max="3600" style="width: 80px" size="small" />
            <n-select v-model:value="pollingUnit" :options="pollingUnitOptions" style="width: 80px" size="small" />
          </template>
        </n-space>
      </SettingItemBox>

      <n-divider style="margin: 15px 0">
        <n-text depth="3">{{ editorT('bigscreenEditor.ui.dataExtractionAndFiltering') }}</n-text>
      </n-divider>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.option1VisualConditionFilter')" :alone="true">
        <n-space vertical>
          <n-switch v-model:value="uiFilterEnabled" size="small">
            <template #checked>{{ editorT('iotApp.deviceDetail.enabled') }}</template>
            <template #unchecked>{{ editorT('iotApp.av.notEnabledWord') }}</template>
          </n-switch>
          <template v-if="uiFilterEnabled">
            <n-select v-model:value="uiFilterField" :options="fieldOptions" :placeholder="editorT('bigscreenEditor.ui.selectFieldEGProvince')" size="small" />
            <n-select v-model:value="uiFilterRule" :options="uiFilterRuleOptions" :placeholder="editorT('bigscreenEditor.ui.matchingRule')" size="small" />
            <n-input v-model:value="uiFilterValue" :placeholder="editorT('bigscreenEditor.ui.targetValueEGGuangdong')" size="small" />
          </template>
        </n-space>
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.option2AdvancedJavaScriptFilter')" :alone="true">
        <n-space vertical>
          <n-switch v-model:value="jsFilterEnabled" size="small">
            <template #checked>{{ editorT('iotApp.deviceDetail.enabled') }}</template>
            <template #unchecked>{{ editorT('iotApp.av.notEnabledWord') }}</template>
          </n-switch>
          <n-input
            v-if="jsFilterEnabled"
            v-model:value="jsFilterCode"
            type="textarea"
            :placeholder="editorT('bigscreenEditor.ui.writeJavaScriptCode')"
            :autosize="{ minRows: 4, maxRows: 8 }"
            style="font-family: monospace; font-size: 12px; background-color: #1e1e20"
          />
        </n-space>
      </SettingItemBox>

      <n-divider style="margin: 15px 0">
        <n-text depth="3">{{ editorT('bigscreenEditor.ui.fieldBindingMap') }}</n-text>
      </n-divider>

      <SettingItemBox v-if="isShowDimension" :name="editorT('bigscreenEditor.ui.dimensionXAxisCategory')" :alone="true">
        <n-select v-model:value="selectedDimension" :options="xAxisOptions" :placeholder="editorT('bigscreenEditor.ui.selectDimensionField')" />
      </SettingItemBox>

      <SettingItemBox :name="editorT('bigscreenEditor.ui.metricYAxisValue')" :alone="true">
        <n-space vertical style="width: 100%">
          <n-select v-model:value="selectedMetrics" :options="yAxisOptions" :placeholder="editorT('bigscreenEditor.ui.selectMetricField')" multiple :max="isMultiMetricChart ? null : 1" />
          <n-text depth="3" style="font-size: 12px">
            {{ editorT('bigscreenEditor.ui.tip2') }}{{ isMultiMetricChart ? editorT('bigscreenEditor.ui.multipleMetricFieldsCanBeSelected') : editorT('bigscreenEditor.ui.thisChartSupportsOnlyOneMetric') }}
          </n-text>
        </n-space>
      </SettingItemBox>

      <SettingItemBox :alone="true">
        <n-button type="primary" block @click="handleExecuteAndRender">{{ editorT('bigscreenEditor.ui.requestDataAndRenderChart') }}</n-button>
      </SettingItemBox>
    </template>

    <template v-else-if="targetData?.request?.requestDataType === RequestDataTypeEnum.IoTDevice">
      <ChartDataIoTDevice />
    </template>

    <n-modal v-model:show="showPreviewModal" preset="card" :title="editorT('bigscreenEditor.ui.dataSamplePreview')" style="width: 80%; max-width: 800px">
      <div style="padding: 16px; background-color: #1e1e20; border-radius: 6px">
        <n-code :code="JSON.stringify(formattedPreviewData, null, 2)" language="json" word-wrap style="max-height: 60vh; overflow-y: auto" />
      </div>
    </n-modal>
  </div>
</template>
