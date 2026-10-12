<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { IoTOutputView, IoTPropertyMode, IoTQueryType } from './queryTypeSupport';

import { computed, ref, watch } from 'vue';

import {
  getCommonSchema,
  getDeviceInfoOne,
  getDeviceList,
  getProductCategoryList,
  getProductCategorySchemaList,
  getProductList,
  getProductSchema,
  getUserAreaTree,
} from '@/api/thingsDevice';
import { RequestHttpIntervalEnum } from '@/enums/httpEnum';
import {
  normalizeDatasetForTableList,
  normalizeDatasetForTablesBasic,
  normalizeDatasetForTableScrollBoard,
} from '@/packages/components/Tables/shared/iotDataset';
import { ChartFrameEnum } from '@/packages/index.type';
import { getIoTDeviceInfoFieldDisplayLabel } from '@/utils/iotDeviceInfoFieldMeta';
import { endOfDay, startOfDay, subDays, subHours } from 'date-fns';

import { useTargetData } from '../../../hooks/useTargetData.hook';
import { applyIoTDatasetToComponent } from '../../../SimplifiedDataPanel/adapters/applyIoTDatasetToComponent';
import { getAdapter } from '../../../SimplifiedDataPanel/adapters';
import { resolveIoTAggregationRuleState } from '../../../SimplifiedDataPanel/adapters/iotAggregation';
import { buildIoTDataset } from '../../../SimplifiedDataPanel/adapters/iotDatasetBuilder';
import { ChartDataMatchingAndShow } from '../ChartDataMatchingAndShow';
import FieldSelector from './FieldSelector.vue';
import FieldHint from './FieldHint.vue';
import PreviewControls from './PreviewControls.vue';
import {
  getDefaultOutputView,
  getDefaultPropertyMode,
  getPropertyModeHint,
  getQueryTypeHint,
  isOutputViewSupported,
  isPropertyModeSupported,
  isQueryTypeSupported,
  // TASK-045 
  isRankingChartMode,
  isSingleStatChartMode,
  isTrendChartMode,
  isMultiDeviceInfoChart,
  normalizeChartKey,
} from './queryTypeSupport';
import { getTemplateSuggestedDataIDs, sortSchemaValuesBySuggestedOrder } from './templateFieldDefaults';

type AreaOption = { label: string; value: string };
type DeviceOption = { label: string; value: string };
type SchemaOption = { label: string; unit: string; value: string };
type FieldOption = { label: string; value: string };
type ProductCategoryOption = { hasOwnSchema?: boolean; label: string; value: string };

let previewTimer: null | ReturnType<typeof setTimeout> = null;

const { targetData } = useTargetData();
const cfg = computed(() => targetData.value.request.requestIoTDeviceConfig!);
const chartKey = computed(() => (targetData.value as any)?.chartConfig?.chartKey ?? (targetData.value as any)?.chartConfig?.key ?? '');
const normalizedChartKey = computed(() => normalizeChartKey(chartKey.value));

const areaOptions = ref<AreaOption[]>([]);
const productOptions = ref<DeviceOption[]>([]);
const productCategoryOptions = ref<ProductCategoryOption[]>([]);
const deviceOptions = ref<DeviceOption[]>([]);
const schemaOptions = ref<SchemaOption[]>([]);
const deviceMetricOptions = ref<FieldOption[]>([]);
const loadingAreas = ref(false);
const loadingProducts = ref(false);
const loadingDevices = ref(false);
const loadingSchema = ref(false);
const loadingPreview = ref(false);
const previewResult = ref('');
const previewPanelVisible = ref(false);
const showMatching = ref(false);
const lastAutoSuffix = ref('');
const categorySchemaStatus = ref<'' | 'empty' | 'error'>('');
const queryTypeOptions = computed(() => [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.propertyData'); }, value: 'property' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.deviceStatusStatistics'); }, value: 'deviceStatus', disabled: !isQueryTypeSupported(chartKey.value, 'deviceStatus') },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.deviceInformation'); }, value: 'deviceInfo', disabled: !isQueryTypeSupported(chartKey.value, 'deviceInfo') },
]);
const queryTypeHint = computed(() => getQueryTypeHint(chartKey.value));
const propertyModeHint = computed(() => getPropertyModeHint(chartKey.value));
// 实时推送模式：property latest（无 chartMode）或 deviceStatus 时走 WebSocket 实时刷新，轮询间隔不生效
const isRealtimePushMode = computed(() => {
  const queryType = cfg.value?.queryType ?? 'property';
  return queryType === 'deviceStatus' || (queryType === 'property' && cfg.value?.mode === 'latest' && !cfg.value?.chartMode);
});
const queryTypeModel = computed({
  get: () => (cfg.value.queryType ?? 'property') as IoTQueryType,
  set: (value) => {
    cfg.value.queryType = value;
  },
});
const isPropertyQuery = computed(() => queryTypeModel.value === 'property');
const isDeviceStatusQuery = computed(() => queryTypeModel.value === 'deviceStatus');
const isDeviceInfoQuery = computed(() => queryTypeModel.value === 'deviceInfo');
const isMultiDeviceInfoMode = computed(() => isDeviceInfoQuery.value && isMultiDeviceInfoChart(chartKey.value));
const outputViewOptions = computed(() => {
  if (isDeviceStatusQuery.value) {
    return [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.statisticMetric'); }, value: 'fields', disabled: !isOutputViewSupported(chartKey.value, 'deviceStatus', 'fields') }];
  }
  if (isDeviceInfoQuery.value) {
    return [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.deviceInformationFields'); }, value: 'fields', disabled: !isOutputViewSupported(chartKey.value, 'deviceInfo', 'fields') }];
  }
  return [];
});
const outputViewModel = computed<IoTOutputView>({
  get: () => {
    if (isPropertyQuery.value) return 'distribution';
    return (cfg.value.outputView ?? getDefaultOutputView(chartKey.value, queryTypeModel.value)) as IoTOutputView;
  },
  set: (value) => {
    cfg.value.outputView = value;
  },
});
const isTableListPropertyChart = computed(() => isPropertyQuery.value && normalizedChartKey.value === 'TableList');
const isCapsulePropertyChart = computed(() => isPropertyQuery.value && ['CapsuleChart', 'CapsuleCommon'].includes(normalizedChartKey.value));
const isSingleSeriesLinePropertyChart = computed(() => isPropertyQuery.value && ['LineGradientSingle', 'LineLinearSingle'].includes(normalizedChartKey.value));
const isPieLatestPropertyChart = computed(
  () => isPropertyQuery.value && cfg.value.mode === 'latest' && ['PieCircle', 'PieCommon'].includes(normalizedChartKey.value),
);
const isSinglePropertySelectionChart = computed(
  () =>
    isSingleStatMode.value ||
    isTableListPropertyChart.value ||
    isPieLatestPropertyChart.value ||
    isCapsulePropertyChart.value ||
    isSingleSeriesLinePropertyChart.value,
);
const propertyModeOptions = computed(() => [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.latestValuePolling'); }, value: 'latest', disabled: !isPropertyModeSupported(chartKey.value, 'latest') },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.historicalTimeSeries'); }, value: 'log', disabled: !isPropertyModeSupported(chartKey.value, 'log') },
]);
const deviceStatusFieldOptions: FieldOption[] = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.totalDevicesTotalCount'); }, value: 'totalCount' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.onlineDevicesOnlineCount'); }, value: 'onlineCount' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.offlineDevicesOfflineCount'); }, value: 'offlineCount' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.inactiveDevicesInactiveCount'); }, value: 'inactiveCount' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.onlineRateOnlineRate'); }, value: 'onlineRate' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.offlineRateOfflineRate'); }, value: 'offlineRate' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.inactiveRateInactiveRate'); }, value: 'inactiveRate' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.systemUptimeDaysSystemUptimeDays'); }, value: 'systemUptimeDays' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.systemUptimeHoursSystemUptimeHours'); }, value: 'systemUptimeHours' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.systemStartTimeSystemStartTime'); }, value: 'systemStartTime' },
];
const fieldSelectionOptions = computed(() => {
  if (isDeviceInfoQuery.value) return deviceMetricOptions.value;
  if (isDeviceStatusQuery.value) return deviceStatusFieldOptions;
  return [];
});
const showFieldSelection = computed(() => isDeviceInfoQuery.value || isDeviceStatusQuery.value);
const fieldSelectionTitle = computed(() => {
  if (isDeviceInfoQuery.value) return editorT('bigscreenEditor.ui.deviceInformationFields');
  if (isDeviceStatusQuery.value) return editorT('bigscreenEditor.ui.statisticMetric');
  return editorT('bigscreenEditor.ui.fieldSelection');
});
const deviceSelectorValue = computed({
  get() {
    if (isDeviceInfoQuery.value) {
      return isMultiDeviceInfoMode.value ? cfg.value.deviceNames : (cfg.value.deviceNames?.[0] ?? '');
    }
    return cfg.value.deviceNames;
  },
  set(value) {
    if (isDeviceInfoQuery.value) {
      if (isMultiDeviceInfoMode.value) {
        cfg.value.deviceNames = normalizeStringArray(value as null | string[]);
      } else {
        cfg.value.deviceNames = value ? [String(value)] : [];
      }
      return;
    }
    cfg.value.deviceNames = normalizeStringArray(value as null | string[]);
  },
});

const isMultiAreaMode = computed(() => normalizeStringArray(cfg.value.areaIDs).length > 1);

// ── TASK-045 模板级聚合模式判断 ──
const isTemplateChartMode = computed(() => isPropertyQuery.value && !!cfg.value.chartMode && cfg.value.chartMode !== 'traditional');
const sourceModeModel = computed<'category' | 'product'>({
  get: () => (cfg.value.productCategoryCode && !cfg.value.productID ? 'category' : 'product'),
  set: (value) => {
    if (value === 'category') {
      cfg.value.productID = '';
      cfg.value.deviceNames = [];
      cfg.value.dataIDs = [];
      cfg.value.dataIDNames = undefined;
      cfg.value.dataUnits = undefined;
      cfg.value.templateAutoField = undefined;
      cfg.value.selectedFields = [];
      deviceOptions.value = [];
      schemaOptions.value = [];
      deviceMetricOptions.value = [];
      cfg.value.productCategoryCode ||= productCategoryOptions.value[0]?.value ?? '';
      if (cfg.value.productCategoryCode) {
        void loadCategorySchema(cfg.value.productCategoryCode);
      }
      return;
    }

    cfg.value.productCategoryCode = '';
    cfg.value.productCategoryID = undefined;
    cfg.value.deviceNames = [];
    cfg.value.dataIDs = [];
    cfg.value.dataIDNames = undefined;
    cfg.value.dataUnits = undefined;
    cfg.value.templateAutoField = undefined;
    cfg.value.selectedFields = [];
    deviceOptions.value = [];
    schemaOptions.value = [];
    deviceMetricOptions.value = [];
    void loadProducts(cfg.value.areaIDs);
  },
});
const isSingleStatMode = computed(() => isSingleStatChartMode(cfg.value.chartMode));
const isTrendMode = computed(() => isTrendChartMode(cfg.value.chartMode));
const isAggregateMode = computed(() => isRankingChartMode(cfg.value.chartMode));

const timeRangeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.1Hour'); }, value: '1h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.6Hours'); }, value: '6h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgIotClient.dashboard.range24h'); }, value: '24h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.dashboard.last7d'); }, value: '7d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.dashboard.last30d'); }, value: '30d' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.custom'); }, value: 'custom' },
];

const aggFuncOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.latestValueLast'); }, value: 'last' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.averageAvg'); }, value: 'avg' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.maximumMax2'); }, value: 'max' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.minimumMin'); }, value: 'min' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.sumSum'); }, value: 'sum' },
];

// ── TASK-045 模板级聚合配置选项 ──
const chartModeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.standardDeviceMode'); }, value: 'traditional' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.singleValueStatisticCard'); }, value: 'singleStat' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.trendChart'); }, value: 'trend' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.aggregateStatistics'); }, value: 'aggregate' },
];

const aggregateViewModeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.rankingChart'); }, value: 'ranking' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.proportionChart'); }, value: 'share' },
];

const templateTimeRangeOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.memory.today'); }, value: 'today' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.memory.yesterday'); }, value: 'yesterday' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.dashboard.thisWeek'); }, value: 'week' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgEnergy.overview.thisMonth'); }, value: 'month' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgEnergy.ui.thisYear'); }, value: 'year' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.custom'); }, value: 'custom' },
];

const templateIntervalUnitOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitHour'); }, value: 'h' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.unitDay'); }, value: 'd' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.monthSuffix'); }, value: 'n' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.deviceDetail.yearSuffix'); }, value: 'y' },
];

const templateGroupByOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.byArea'); }, value: 'area' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.byDevice'); }, value: 'device' },
];

const templateSortByOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.ascending'); }, value: 'valueAsc' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.descending'); }, value: 'valueDesc' },
];

const templateFieldHint = computed(() => {
  if (!isTemplateChartMode.value) return '';
  switch (cfg.value.chartMode) {
    case 'traditional':
      return editorT('bigscreenEditor.ui.standardDeviceModeSelectsDevicesByProductAnd');
    case 'singleStat':
      return editorT('bigscreenEditor.ui.singleValueCardsPreferStandardPropertyPPower');
    case 'trend':
      return editorT('bigscreenEditor.ui.trendChartsPreferStandardPropertyPPowerFactor');
    case 'aggregate':
      return editorT('bigscreenEditor.ui.preferStandardPropertyTotalEnergyChangeAggregateStatisticsSuchAs');
    case 'ranking':
      return editorT('bigscreenEditor.ui.preferStandardPropertyTotalEnergyChangeAggregateRankingCharts');
    case 'share':
      return editorT('bigscreenEditor.ui.preferStandardPropertyTotalEnergyChangeAggregateProportionCharts');
    default:
      return editorT('bigscreenEditor.ui.preferStandardPropertyFieldsConsistentDataAcrossOrganizations');
  }
});

/** 配置说明跟随当前语言刷新，不改变已选择的业务配置。 */
const dataModeHint = computed(() => editorT('bigscreenEditor.ui.templateModeUsesCategoriesScopeRuntimeDevicesAnd'));
/** 配置说明跟随当前语言刷新，不改变已选择的业务配置。 */
const rangeHint = computed(() => editorT('bigscreenEditor.ui.statisticScopeFiltersDevicesBeforeAggregationIfGrouping'));
const templateProductHint = computed(() =>
  sourceModeModel.value === 'product'
    ? editorT('bigscreenEditor.ui.whenFieldSourceByProductProductLimitsWhich')
    : editorT('bigscreenEditor.ui.standardPropertyFieldsAreSelectedNoProductSelection')
);
/** 配置说明跟随当前语言刷新，不改变已选择的业务配置。 */
const templateCategoryHint = computed(() => editorT('bigscreenEditor.ui.standardPropertyFieldsAreUseCategoriesDetermineDevice'));
/** 配置说明跟随当前语言刷新，不改变已选择的业务配置。 */
const multiAreaHint = computed(() => editorT('bigscreenEditor.ui.whenMultipleScopesAreSelectedAllVisibleProducts'));
/** 配置说明跟随当前语言刷新，不改变已选择的业务配置。 */
const fieldSelectionHint = computed(() => editorT('bigscreenEditor.ui.whenUncheckedAvailableOptionsAreNotAllRendered'));

const intervalUnitOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.cloneGroup.unitSeconds'); }, value: RequestHttpIntervalEnum.SECOND },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.minutes'); }, value: RequestHttpIntervalEnum.MINUTE },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgIotClient.energyDashboard.granularityHour'); }, value: RequestHttpIntervalEnum.HOUR },
];

/** 快捷日期范围的标签随语言更新，范围计算保持原值。 */
const datePickerShortcuts = computed(() => ({
  [editorT('bigscreenEditor.ui.pastHour')]: () => {
    const now = new Date();
    return [subHours(now, 1).getTime(), now.getTime()] as [number, number];
  },
  [editorT('bigscreenEditor.ui.past6Hours')]: () => {
    const now = new Date();
    return [subHours(now, 6).getTime(), now.getTime()] as [number, number];
  },
  [editorT('orgManage.memory.today')]: () => {
    const now = new Date();
    return [startOfDay(now).getTime(), endOfDay(now).getTime()] as [number, number];
  },
  [editorT('bigscreenEditor.ui.past3Days')]: () => {
    const now = new Date();
    return [startOfDay(subDays(now, 2)).getTime(), endOfDay(now).getTime()] as [number, number];
  },
  [editorT('bigscreenEditor.ui.past7Days')]: () => {
    const now = new Date();
    return [startOfDay(subDays(now, 6)).getTime(), endOfDay(now).getTime()] as [number, number];
  },
}));

const normalizeStringArray = (value?: null | string[]) => {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
};

const extractList = (response: any) => {
  const directList = response?.list;
  if (Array.isArray(directList)) return directList;
  const nestedList = response?.data?.list;
  if (Array.isArray(nestedList)) return nestedList;
  return [];
};

const normalizeOptionValue = (value: unknown) => String(value ?? '');

const sortSchemaOptionsForTemplate = (options: SchemaOption[]) => {
  if (!isTemplateChartMode.value || sourceModeModel.value !== 'category') return options;

  const suggested = getTemplateSuggestedDataIDs(cfg.value.chartMode, cfg.value.productCategoryCode);
  if (suggested.length === 0) return options;

  const sortedValues = sortSchemaValuesBySuggestedOrder(options.map((item) => item.value), suggested);
  const optionMap = new Map(options.map((item) => [item.value, item]));
  return sortedValues.map((value) => optionMap.get(value)!).filter(Boolean);
};

const applyTemplateDefaultDataIDs = () => {
  if (!isTemplateChartMode.value || sourceModeModel.value !== 'category') return;

  const suggested = getTemplateSuggestedDataIDs(cfg.value.chartMode, cfg.value.productCategoryCode);
  if (suggested.length === 0) return;

  const available = suggested.filter((value) => schemaOptions.value.some((item) => item.value === value));
  if (available.length > 0) {
    // available 非空时首项必存在，此守卫仅为类型收窄
    const nextValue = available[0];
    if (!nextValue) return;
    const currentValue = cfg.value.dataIDs?.[0];
    const isAutoValue = !!cfg.value.templateAutoField && currentValue === cfg.value.templateAutoField;
    const hasManualValue = !!currentValue && !isAutoValue;
    if (hasManualValue) return;
    cfg.value.dataIDs = [nextValue];
    cfg.value.templateAutoField = nextValue;
  }
};

const flattenAreaOptions = (list: any[]): AreaOption[] => {
  const flat: AreaOption[] = [];
  const walk = (items: any[]) => {
    for (const item of items) {
      flat.push({ label: item.areaName || item.name || item.areaID, value: normalizeOptionValue(item.areaID) });
      if (Array.isArray(item.children)) walk(item.children);
    }
  };
  walk(Array.isArray(list) ? list : []);
  return flat;
};

const getDefaultCustomTimeRange = (): [number, number] => {
  const now = Date.now();
  return [now - 3_600_000, now];
};

const aggregationRuleState = computed(() =>
  resolveIoTAggregationRuleState({
    customTimeRange: cfg.value.customTimeRange,
    logAggregationMode: cfg.value.logAggregationMode,
    logInterval: cfg.value.logInterval,
    logTimeRange: cfg.value.logTimeRange,
  }),
);
const aggregationModeOptions = computed(() => aggregationRuleState.value.modeOptions);
const dynamicAggIntervalOptions = computed(() => aggregationRuleState.value.intervalOptions);

function migrateLegacyConfig() {
  const current = cfg.value;
  if (!current) return;

  current.queryType ??= 'property';
  if (current.chartMode === 'ranking' || current.chartMode === 'share') {
    current.aggregateViewMode = current.chartMode;
    current.chartMode = 'aggregate';
  }
  current.chartMode ??= 'traditional';
  current.outputView ??= getDefaultOutputView(chartKey.value, current.queryType);
  current.mode ??= getDefaultPropertyMode(chartKey.value);
  current.logTimeRange ??= '1h';
  current.logAggregationMode ??= 'intraday';
  current.logInterval ??= '10m';
  current.aggFunc ??= 'last';
  current.productCategoryCode ??= '';

  if (!current.deviceNames?.length && current.deviceName) {
    current.deviceNames = [current.deviceName];
  }
  if (!current.dataIDs?.length && current.dataID) {
    current.dataIDs = [current.dataID];
  }
  if (!Array.isArray(current.deviceNames)) current.deviceNames = [];
  if (!Array.isArray(current.dataIDs)) current.dataIDs = [];
  if (!Array.isArray(current.areaIDs)) current.areaIDs = [];
  if (!Array.isArray(current.selectedFields)) current.selectedFields = [];

  if (['CapsuleChart', 'CapsuleCommon'].includes(normalizedChartKey.value)) {
    current.mode = 'latest';
    if (current.dataIDs.length > 1) {
      // 仅保留首项时 length>1 保证首项存在，此守卫仅为类型收窄
      const firstDataID = current.dataIDs[0];
      if (firstDataID) current.dataIDs = [firstDataID];
    }
  }

  if (current.chartMode === 'singleStat' && current.dataIDs.length > 1) {
    // 仅保留首项时 length>1 保证首项存在，此守卫仅为类型收窄
    const firstDataID = current.dataIDs[0];
    if (firstDataID) current.dataIDs = [firstDataID];
  }

  if (current.chartMode === 'aggregate' && (!current.groupBy || current.groupBy === 'none')) {
    current.groupBy = 'device';
  }

  if (current.chartMode && current.chartMode !== 'traditional' && !current.productID && !current.productCategoryCode) {
    current.productCategoryCode = productCategoryOptions.value[0]?.value ?? '';
  }

  if (current.chartMode && current.chartMode !== 'traditional' && !current.dataIDs?.length) {
    current.dataIDs = getTemplateSuggestedDataIDs(current.chartMode, current.productCategoryCode);
    current.templateAutoField = current.dataIDs?.[0];
  }
  if (current.chartMode === 'aggregate' && !current.aggregateViewMode) {
    current.aggregateViewMode = 'ranking';
  }
}

const loadAreas = async () => {
  loadingAreas.value = true;
  try {
    const res: any = await getUserAreaTree();
    areaOptions.value = flattenAreaOptions(extractList(res));
  } catch (error) {
    console.warn('[IoTDevice] 加载区域列表失败', error);
  } finally {
    loadingAreas.value = false;
  }
};

const loadProducts = async (selectedAreaIDs: string[] = cfg.value.areaIDs ?? []) => {
  loadingProducts.value = true;
  try {
    const normalizedAreaIDs = normalizeStringArray(selectedAreaIDs);
    const params: { areaID?: string; page: { page: number; size: number } } = {
      page: { page: 1, size: 1000 },
    };
    if (normalizedAreaIDs.length === 1) {
      params.areaID = normalizedAreaIDs[0];
    }
    let res = await getProductList(params);
    let list = extractList(res);

    // 多选区域时，部分账号在后端 areaID 过滤下可能查不到产品，这里回退到全量产品列表，
    // 设备层仍会基于区域做精确过滤，避免前端配置面板出现空产品列表。
    if (normalizedAreaIDs.length > 0 && list.length === 0) {
      res = await getProductList({ page: { page: 1, size: 1000 } });
      list = extractList(res);
    }

    productOptions.value = list.map((item: any) => ({
      label: item.productName ?? item.name ?? normalizeOptionValue(item.productID),
      value: normalizeOptionValue(item.productID),
    }));
  } catch (error) {
    console.error('[IoTDevice] 加载产品失败', error);
  } finally {
    loadingProducts.value = false;
  }
};

const loadProductCategories = async () => {
  try {
    const res: any = await getProductCategoryList();
    const list = Array.isArray(res?.list) ? res.list : (res?.data?.list ?? []);
    productCategoryOptions.value = await Promise.all(
      list.map(async (item: any) => {
        let hasOwnSchema = false;
        try {
          const schemaRes: any = await getProductCategorySchemaList({
            productCategoryID: item.id,
            withFather: false,
          });
          const identifiers = Array.isArray(schemaRes?.identifiers) ? schemaRes.identifiers : (schemaRes?.data?.identifiers ?? []);
          hasOwnSchema = identifiers.length > 0;
        } catch {
          hasOwnSchema = false;
        }

        return {
          hasOwnSchema,
          label: hasOwnSchema ? `${item.name}（${item.code}）` : editorT('bigscreenEditor.dynamic.message13', { name: String(item.name), code: String(item.code) }),
          value: normalizeOptionValue(item.code),
        } satisfies ProductCategoryOption;
      }),
    );
  } catch (error) {
    console.error('[IoTDevice] 加载产品品类失败', error);
    productCategoryOptions.value = [];
  }
};

const loadDevices = async (productID: string, searchQuery?: string, selectedAreaIDs: string[] = cfg.value.areaIDs ?? []) => {
  if (!productID) return;
  loadingDevices.value = true;
  try {
    const normalizedAreaIDs = normalizeStringArray(selectedAreaIDs);
    const params: {
      areaID?: string;
      areaIDs?: string[];
      deviceNameOrAlias?: string;
      page: { page: number; size: number };
      productID: string;
    } = {
      productID,
      page: { page: 1, size: 200 },
      ...(searchQuery ? { deviceNameOrAlias: searchQuery } : {}),
    };
    if (normalizedAreaIDs.length === 1) {
      params.areaID = normalizedAreaIDs[0];
    } else if (normalizedAreaIDs.length > 1) {
      params.areaIDs = normalizedAreaIDs;
    }

    const res = await getDeviceList(params);
    const list = [...extractList(res)];
    list.sort((a: any, b: any) => {
      const timeA = new Date(a.created_time || a.createdAt || a.createTime || 0).getTime();
      const timeB = new Date(b.created_time || b.createdAt || b.createTime || 0).getTime();
      return timeB - timeA;
    });

    deviceOptions.value = list.map((item: any) => {
      const alias = item.deviceAlias || item.deviceName;
      const deviceName = normalizeOptionValue(item.deviceName);
      return { label: alias || deviceName, value: deviceName };
    });
  } catch (error) {
    console.error('[IoTDevice] 加载设备失败', error);
  } finally {
    loadingDevices.value = false;
  }
};

const mapSchemaListToOptions = (list: any[]) => {
  const mappedOptions = list.map((item: any) => {
    let unit = '';
    try {
      const affordance = typeof item.affordance === 'string' ? JSON.parse(item.affordance || '{}') : item.affordance || {};
      unit = affordance?.define?.unit ?? '';
    } catch {
      unit = '';
    }
    return {
      label: `${item.name ?? item.identifier}（${item.identifier}）`,
      value: item.identifier,
      unit,
    };
  });
  schemaOptions.value = sortSchemaOptionsForTemplate(mappedOptions);

  const names: Record<string, string> = {};
  schemaOptions.value.forEach((item) => {
    names[item.value] = item.label.split('（')[0] || item.value;
  });
  cfg.value.dataIDNames = names;
  applyTemplateDefaultDataIDs();
};

const loadSchema = async (productID: string) => {
  if (!productID || !isPropertyQuery.value) {
    schemaOptions.value = [];
    loadingSchema.value = false;
    return;
  }
  loadingSchema.value = true;
  try {
    const res = await getProductSchema({ productID });
    const list = res?.data?.list ?? [];
    mapSchemaListToOptions(list);
  } catch (error) {
    console.error('[IoTDevice] 加载物模型失败', error);
    schemaOptions.value = [];
  } finally {
    loadingSchema.value = false;
  }
};

const loadCategorySchema = async (_productCategoryCode: string) => {
  if (!isPropertyQuery.value) {
    schemaOptions.value = [];
    categorySchemaStatus.value = '';
    loadingSchema.value = false;
    return;
  }
  loadingSchema.value = true;
  try {
    const res: any = await getCommonSchema({
      type: 1,
    });
    const list = Array.isArray(res?.list) ? res.list : (res?.data?.list ?? []);
    mapSchemaListToOptions(list);
    categorySchemaStatus.value = list.length > 0 ? '' : 'empty';
  } catch (error) {
    console.error('[IoTDevice] 加载品类物模型失败', error);
    schemaOptions.value = [];
    categorySchemaStatus.value = 'error';
  } finally {
    loadingSchema.value = false;
  }
};

const loadTemplateSchemaOptions = async () => {
  if (isTemplateChartMode.value && cfg.value.productCategoryCode && !cfg.value.productID) {
    await loadCategorySchema(cfg.value.productCategoryCode);
    return;
  }
  schemaOptions.value = [];
  categorySchemaStatus.value = '';
};

const loadTraditionalSchemaOptions = async () => {
  if (cfg.value.productID) {
    await loadSchema(cfg.value.productID);
    return;
  }
  schemaOptions.value = [];
  categorySchemaStatus.value = '';
};

const loadSchemaByCurrentSource = async () => {
  if (isTemplateChartMode.value) {
    await loadTemplateSchemaOptions();
    return;
  }

  await loadTraditionalSchemaOptions();
};

const loadDeviceInfoFields = async (productID: string, deviceName?: string) => {
  if (!productID || !deviceName || !isDeviceInfoQuery.value) {
    deviceMetricOptions.value = [];
    return;
  }

  try {
    const res: any = await getDeviceInfoOne({ deviceName, productID });
    const deviceInfo = res?.data?.device ?? (res as any)?.device ?? res?.data ?? {};
    deviceMetricOptions.value = Object.entries(deviceInfo)
      .filter(([, value]) => ['boolean', 'number'].includes(typeof value))
      .map(([field]) => ({ label: getIoTDeviceInfoFieldDisplayLabel(field), value: field }));
  } catch (error) {
    console.error('[IoTDevice] 加载设备信息字段失败', error);
    deviceMetricOptions.value = [];
  }
};
const resetSelectionAfterScopeChange = () => {
  cfg.value.productID = '';
  cfg.value.productCategoryCode = '';
  cfg.value.productCategoryID = undefined;
  cfg.value.deviceNames = [];
  cfg.value.dataIDs = [];
  cfg.value.dataIDNames = undefined;
  cfg.value.dataUnits = undefined;
  showMatching.value = false;
  previewResult.value = '';
  productOptions.value = [];
  deviceOptions.value = [];
  schemaOptions.value = [];
  deviceMetricOptions.value = [];
  cfg.value.selectedFields = [];
  loadingSchema.value = false;
};

const onAreaChange = async (value: null | string[]) => {
  cfg.value.areaIDs = normalizeStringArray(value);
  resetSelectionAfterScopeChange();
  await loadProducts(cfg.value.areaIDs);
};

const onProductChange = (value: string) => {
  cfg.value.productID = value ? normalizeOptionValue(value) : '';
  if (cfg.value.productID) {
    cfg.value.productCategoryCode = '';
    cfg.value.productCategoryID = undefined;
  }
  cfg.value.deviceNames = [];
  cfg.value.dataIDs = [];
  cfg.value.selectedFields = [];
  cfg.value.dataIDNames = undefined;
  cfg.value.dataUnits = undefined;
  previewResult.value = '';
  categorySchemaStatus.value = '';
  deviceOptions.value = [];
  schemaOptions.value = [];
  deviceMetricOptions.value = [];
  if (cfg.value.productID) {
    void loadDevices(cfg.value.productID, undefined, cfg.value.areaIDs);
    if (isPropertyQuery.value) {
      void loadSchema(cfg.value.productID);
    }
  }
};

const onCategoryChange = async (value: string) => {
  cfg.value.productCategoryCode = value ? normalizeOptionValue(value) : '';
  cfg.value.productCategoryID = undefined;
  cfg.value.productID = '';
  cfg.value.deviceNames = [];
  cfg.value.dataIDs = [];
  cfg.value.selectedFields = [];
  cfg.value.dataIDNames = undefined;
  cfg.value.dataUnits = undefined;
  previewResult.value = '';
  deviceOptions.value = [];
  schemaOptions.value = [];
  deviceMetricOptions.value = [];
  if (cfg.value.productCategoryCode) {
    await loadCategorySchema(cfg.value.productCategoryCode);
  }
};

watch(
  () => cfg.value.queryType,
  (nextQueryType, previousQueryType) => {
    const nextType = (nextQueryType ?? 'property') as IoTQueryType;
    const prevType = (previousQueryType ?? 'property') as IoTQueryType;
    if (nextType === prevType) return;

    const current = cfg.value;
    current.areaIDs = [];
    resetSelectionAfterScopeChange();
    current.mapping = undefined;
    current.outputView = getDefaultOutputView(chartKey.value, nextType);
    showMatching.value = false;
    previewResult.value = '';

    if (nextType !== 'property') {
      current.chartMode = 'traditional';
      current.mode = 'latest';
      current.aggFunc = 'last';
      current.logInterval = '10m';
      current.logTimeRange = '1h';
      current.customTimeRange = undefined;
    }

    if (nextType === 'deviceStatus') {
      return;
    }

    if (nextType === 'deviceInfo' && !isMultiDeviceInfoChart(chartKey.value) && current.deviceNames.length > 1) {
      // 仅保留首个设备时 length>1 保证首项存在，此守卫仅为类型收窄
      const firstDeviceName = current.deviceNames[0];
      if (firstDeviceName) current.deviceNames = [firstDeviceName];
    }

    if (nextType === 'deviceInfo') {
      if (!isMultiDeviceInfoChart(chartKey.value) && current.deviceNames.length > 0) {
        // 仅保留首个设备时 length>0 保证首项存在，此守卫仅为类型收窄
        const firstDeviceName = current.deviceNames[0];
        if (firstDeviceName) current.deviceNames = [firstDeviceName];
      }
      return;
    }

    if (nextType === 'property') {
      return;
    }
  },
);

watch(
  () => [cfg.value.productID, cfg.value.deviceNames?.[0], cfg.value.queryType] as const,
  ([productID, deviceName, queryType]) => {
    if ((queryType ?? 'property') === 'deviceInfo' && productID && deviceName) {
      void loadDeviceInfoFields(productID, deviceName);
      return;
    }
    if ((queryType ?? 'property') !== 'deviceInfo') {
      deviceMetricOptions.value = [];
    }
  },
  { immediate: true },
);

watch(
  () => cfg.value.outputView,
  (nextOutputView, previousOutputView) => {
    if (nextOutputView === previousOutputView) return;
    cfg.value.mapping = undefined;
    cfg.value.selectedFields = [];
    if (isTemplateChartMode.value) return;
    showMatching.value = false;
    previewResult.value = '';
  },
);

watch(
  () =>
    [
      cfg.value.queryType,
      cfg.value.outputView,
      cfg.value.productID,
      cfg.value.productCategoryCode,
      cfg.value.deviceNames?.[0] ?? '',
      cfg.value.deviceNames?.join(',') ?? '',
      cfg.value.selectedFields?.join(',') ?? '',
    ] as const,
  () => {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      const current = cfg.value;
      const queryType = (current.queryType ?? 'property') as IoTQueryType;

      if (queryType === 'deviceInfo') {
        if (!current.productID || !current.deviceNames?.length || !current.selectedFields?.length) return;
        await runPreview({ silent: true });
        return;
      }

      if (queryType === 'deviceStatus') {
        if (!current.selectedFields?.length) return;
        await runPreview({ silent: true });
        return;
      }
    }, 250);
  },
  { deep: true },
);

watch(
  () => [normalizedChartKey.value, cfg.value.queryType, cfg.value.outputView] as const,
  ([currentChartKey, queryType, outputView]) => {
    const currentType = (queryType ?? 'property') as IoTQueryType;
    if (!isQueryTypeSupported(currentChartKey, currentType)) {
      cfg.value.queryType = 'property';
      (window as any).$message?.warning(editorT('bigscreenEditor.ui.thisChartDoesNotSupportQueryTypeAnd'));
      return;
    }

    if (currentType !== 'property') {
      const nextOutputView = (outputView ?? getDefaultOutputView(currentChartKey, currentType)) as IoTOutputView;
      if (!isOutputViewSupported(currentChartKey, currentType, nextOutputView)) {
        cfg.value.outputView = getDefaultOutputView(currentChartKey, currentType);
        cfg.value.selectedFields = [];
      }
    }
  },
  { immediate: true },
);

watch(
  () => [normalizedChartKey.value, cfg.value.mode] as const,
  ([currentChartKey, mode]) => {
    const currentMode = (mode ?? 'latest') as IoTPropertyMode;
    if (isPropertyModeSupported(currentChartKey, currentMode)) return;
    cfg.value.mode = getDefaultPropertyMode(currentChartKey);
  },
  { immediate: true },
);

watch(
  () => [isSinglePropertySelectionChart.value, cfg.value.dataIDs] as const,
  ([isSingleSelect, dataIDs]) => {
    if (isSingleSelect && Array.isArray(dataIDs) && dataIDs.length > 1) {
      // 仅保留首项时 length>1 保证首项存在，此守卫仅为类型收窄
      const firstDataID = dataIDs[0];
      if (firstDataID) cfg.value.dataIDs = [firstDataID];
    }
  },
  { deep: true, immediate: true },
);
const runPreview = async (options?: { silent?: boolean }) => {
  const silent = !!options?.silent;
  const current = cfg.value;
  const queryType = (current.queryType ?? 'property') as IoTQueryType;
  const isTemplateMode = queryType === 'property' && !!current.chartMode;
  const messageApi = (window as any).$message;

  if (queryType === 'property' && !current.productID && !current.productCategoryCode) {
    messageApi?.warning(editorT('bigscreenEditor.ui.selectProductOrCategoryFirst'));
    return;
  }
  if (queryType === 'deviceInfo' && !current.deviceNames?.length) {
    messageApi?.warning(isMultiDeviceInfoMode.value ? editorT('bigscreenEditor.ui.selectAtLeastOneDevice') : editorT('iotApp.deviceDetail.selectDevice'));
    return;
  }
  if (queryType === 'deviceInfo' && !current.productID) {
    messageApi?.warning(editorT('bigscreenEditor.ui.selectProductBeforeQueryingDeviceInformation'));
    return;
  }
  if (queryType === 'deviceInfo' && !current.selectedFields?.length) {
    messageApi?.warning(editorT('bigscreenEditor.ui.selectDeviceInformationFieldsFirst'));
    return;
  }
  if (queryType === 'property' && !isTemplateMode && !current.deviceNames?.length) {
    messageApi?.warning(editorT('orgMall.devices.selectDeviceFirst'));
    return;
  }
  if (queryType === 'property' && !current.dataIDs?.length) {
    messageApi?.warning(editorT('bigscreenEditor.ui.selectPropertyField'));
    return;
  }
  if (queryType === 'deviceStatus' && !current.selectedFields?.length) {
    messageApi?.warning(editorT('bigscreenEditor.ui.selectDeviceStatusMetricsFirst'));
    return;
  }

  if (!silent) {
    loadingPreview.value = true;
    showMatching.value = false;
    previewResult.value = '';
  }

  try {
    const dataset = await buildIoTDataset(current, chartKey.value);
    if (targetData.value?.chartConfig?.chartFrame === ChartFrameEnum.COMPOSITE) {
      if (targetData.value?.chartConfig?.chartKey === 'VBorderDualChart') {
        targetData.value.option.dataset = dataset;
      } else {
        targetData.value.option.chartOption.dataset = dataset;
      }
    } else {
      assignPreviewDataset(dataset);
    }
    if (!silent) {
      previewResult.value = JSON.stringify(dataset, null, 2);
      showMatching.value = true;
    }
  } catch (error: any) {
    console.error('[IoTDevice] 预览失败', error);
    if (!silent) {
      previewResult.value = editorT('bigscreenEditor.dynamic.message14', { error: String(error?.message ?? error) });
    }
  } finally {
    if (!silent) {
      loadingPreview.value = false;
    }
  }
};

const onPreview = async () => {
  await runPreview();
};

const applyTemplatePreview = async () => {
  const current = cfg.value;
  if (!isTemplateChartMode.value || current.queryType !== 'property' || (!current.productID && !current.productCategoryCode) || !current.dataIDs?.length) {
    return;
  }

  try {
    const dataset = await buildIoTDataset(current, chartKey.value);
    if (targetData.value?.chartConfig?.chartFrame === ChartFrameEnum.COMPOSITE) {
      if (targetData.value?.chartConfig?.chartKey === 'VBorderDualChart') {
        targetData.value.option.dataset = dataset;
      } else {
        targetData.value.option.chartOption.dataset = dataset;
      }
    } else {
      assignPreviewDataset(dataset);
    }
  } catch (error) {
    console.error('[IoTDevice] 模板模式自动刷新失败', error);
  }
};

const triggerTemplatePreview = () => {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    void applyTemplatePreview();
  }, 250);
};

const updateTemplateField = <K extends 'aggFunc' | 'chartMode' | 'groupBy' | 'intervalUnit' | 'sortBy' | 'timeRange'>(
  field: K,
  value: (typeof cfg.value)[K],
) => {
  if (field === 'chartMode' && cfg.value[field] !== value) {
    resetSelectionAfterScopeChange();
  }
  (cfg.value[field] as (typeof cfg.value)[K]) = value;
  if (field === 'chartMode' && cfg.value.chartMode === 'aggregate') {
    cfg.value.groupBy = 'device';
    cfg.value.aggregateViewMode ||= 'ranking';
  } else if (
    field === 'groupBy' &&
    cfg.value.chartMode === 'aggregate' &&
    (!cfg.value.groupBy || cfg.value.groupBy === 'none')
  ) {
    cfg.value.groupBy = 'device';
  }
  if (field === 'chartMode') {
    void loadProducts(cfg.value.areaIDs);
    applyTemplateDefaultDataIDs();
  }
  triggerTemplatePreview();
};

const updateTemplateLimit = (value: null | number) => {
  cfg.value.limit = value ?? 10;
  triggerTemplatePreview();
};

const updateTemplateCustomTimeRange = (value: [number, number] | null) => {
  cfg.value.customTimeRange = value ?? undefined;
  triggerTemplatePreview();
};

const currentDataIDs = computed(() => {
  if (cfg.value.dataIDs?.length) return cfg.value.dataIDs;
  if (cfg.value.dataID) return [cfg.value.dataID];
  return [];
});

const syncSelectedUnits = (newIDs: string[]) => {
  const units: Record<string, string> = {};
  for (const id of newIDs) {
    const item = schemaOptions.value.find((option) => option.value === id);
    if (item?.unit) units[item.label || id] = item.unit;
  }
  cfg.value.dataUnits = Object.keys(units).length > 0 ? units : undefined;

  const targetOption = targetData.value?.option;
  const selected = newIDs.length === 1 ? schemaOptions.value.find((option) => option.value === newIDs[0]) : undefined;

  if (targetOption?.format) {
    if (selected?.unit) {
      const autoSuffix = ` ${selected.unit}`;
      targetOption.format.autoUnit = selected.unit;
      const currentSuffix = targetOption.format.suffix;
      if (!currentSuffix || currentSuffix === lastAutoSuffix.value) {
        targetOption.format.suffix = autoSuffix;
        lastAutoSuffix.value = autoSuffix;
      }
    } else {
      if (targetOption.format.suffix === lastAutoSuffix.value) {
        targetOption.format.suffix = '';
      }
      targetOption.format.autoUnit = '';
      lastAutoSuffix.value = '';
    }
  }

  if (targetOption && 'unit' in targetOption) {
    const pieOption = targetOption as typeof targetOption & {
      autoUnit?: string;
      percentMode?: boolean;
      unit?: string;
      unitAutoApplied?: boolean;
    };

    if (pieOption.percentMode) {
      if (pieOption.unitAutoApplied) {
        pieOption.unit = '';
      }
      pieOption.autoUnit = '';
      pieOption.unitAutoApplied = false;
      return;
    }

    if (selected?.unit) {
      const shouldApplyAutoUnit = pieOption.unitAutoApplied || !(pieOption.unit ?? '') || (pieOption.unit ?? '') === (pieOption.autoUnit ?? '');
      pieOption.autoUnit = selected.unit;
      if (shouldApplyAutoUnit) {
        pieOption.unit = selected.unit;
        pieOption.unitAutoApplied = true;
      }
      return;
    }

    if (pieOption.unitAutoApplied) {
      pieOption.unit = '';
    }
    pieOption.autoUnit = '';
    pieOption.unitAutoApplied = false;
  }
};

watch(
  () => [
    currentDataIDs.value.join(','),
    schemaOptions.value.map((item) => `${item.value}:${item.unit}`).join(','),
    String((targetData.value?.option as any)?.percentMode ?? ''),
  ],
  () => {
    syncSelectedUnits(currentDataIDs.value);
  },
  {
    immediate: true,
  },
);

watch(
  () => [
    cfg.value.chartMode,
    cfg.value.timeRange,
    cfg.value.intervalUnit,
    cfg.value.groupBy,
    cfg.value.logAggregationMode,
    cfg.value.logInterval,
    cfg.value.aggFunc,
    cfg.value.sortBy,
    cfg.value.limit,
    cfg.value.mode,
    cfg.value.logTimeRange,
    cfg.value.customTimeRange?.join(',') ?? '',
  ],
  () => {
    if (isTemplateChartMode.value) return;
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      const current = cfg.value;
      if (
        current.queryType === 'property' &&
        (current.productID || current.productCategoryCode) &&
        current.dataIDs?.length &&
        current.deviceNames?.length &&
        current.mode === 'log'
      ) {
        await runPreview({ silent: true });
      }
    }, 800);
  },
  { deep: true },
);

watch(
  () => [
    isTemplateChartMode.value,
    cfg.value.queryType,
    cfg.value.productID,
    cfg.value.productCategoryCode,
    cfg.value.dataIDs?.join(',') ?? '',
    cfg.value.areaIDs?.join(',') ?? '',
    cfg.value.deviceNames?.join(',') ?? '',
  ],
  () => {
    if (!isTemplateChartMode.value) return;
    void runPreview({ silent: true });
  },
  { deep: true },
);

watch(
  () => [cfg.value.logAggregationMode, cfg.value.logTimeRange, cfg.value.customTimeRange?.join(',') ?? ''] as const,
  () => {
    const { effectiveInterval, effectiveMode } = aggregationRuleState.value;
    if (cfg.value.logAggregationMode !== effectiveMode) {
      cfg.value.logAggregationMode = effectiveMode;
      return;
    }
    if (cfg.value.logInterval !== effectiveInterval) {
      cfg.value.logInterval = effectiveInterval;
    }
  },
  { immediate: true },
);

const reloadPanelOptions = async () => {
  migrateLegacyConfig();
  showMatching.value = false;
  previewResult.value = '';
  deviceOptions.value = [];
  schemaOptions.value = [];

  await Promise.all([loadAreas(), loadProducts(cfg.value.areaIDs), loadProductCategories()]);

  if (cfg.value.productID) {
    await loadDevices(cfg.value.productID, undefined, cfg.value.areaIDs);
    if (isPropertyQuery.value) {
      await loadTraditionalSchemaOptions();
    } else if (isDeviceInfoQuery.value && cfg.value.deviceNames?.length) {
      await loadDeviceInfoFields(cfg.value.productID, cfg.value.deviceNames[0]);
    }
    return;
  }

  if (isTemplateChartMode.value && cfg.value.productCategoryCode && isPropertyQuery.value) {
    await loadTemplateSchemaOptions();
  }
};

const assignPreviewDataset = (dataset: any) => {
  const chartKey = targetData.value?.chartConfig?.chartKey ?? targetData.value?.chartConfig?.key ?? '';

  if (dataset?._iotMeta && targetData.value?.chartConfig?.chartFrame === ChartFrameEnum.ECHARTS) {
    const { nextOption } = applyIoTDatasetToComponent({
      adapterType: targetData.value?.option?._simplifiedData?.adapterType,
      chartKey,
      currentOption: targetData.value.option as any,
      dataset,
      mapping: (cfg.value as any)?.mapping,
    });
    targetData.value.option = nextOption as any;
    return;
  }

  if (normalizedChartKey.value === 'TablesBasic') {
    targetData.value.option.dataset = normalizeDatasetForTablesBasic(dataset, targetData.value.option.dataset);
    return;
  }

  if (normalizedChartKey.value === 'TableScrollBoard') {
    const normalized = normalizeDatasetForTableScrollBoard(dataset);
    targetData.value.option.dataset = normalized.dataset;
    targetData.value.option.header = normalized.header;
    return;
  }

  if (normalizedChartKey.value === 'TableList') {
    targetData.value.option.dataset = normalizeDatasetForTableList(dataset);
    return;
  }

  targetData.value.option.dataset = dataset;
};

watch(
  () => targetData.value?.id,
  () => {
    if (!targetData.value?.request?.requestIoTDeviceConfig) return;
    void reloadPanelOptions();
  },
  { immediate: true },
);
</script>
<template>
  <n-space vertical :size="12" style="width: 100%">
    <n-space align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('platformManage.devops.queryType') }}</n-text>
      <n-select key="iot-query-type-select" v-model:value="queryTypeModel" :options="queryTypeOptions" size="small" style="min-width: 220px" />
    </n-space>
    <n-text v-if="queryTypeHint" depth="3" style="font-size: 12px">
      {{ queryTypeHint }}
    </n-text>

    <n-space v-if="isPropertyQuery" align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.dataMode') }}</n-text>
      <n-select
        :value="cfg.chartMode"
        :options="chartModeOptions"
        size="small"
        style="min-width: 220px"
        :placeholder="editorT('bigscreenEditor.ui.selectDataMode')"
        @update:value="(value: any) => updateTemplateField('chartMode', value)"
      />
      <FieldHint v-if="isTemplateChartMode" :text="dataModeHint" />
    </n-space>

    <n-space v-if="isPropertyQuery && isTemplateChartMode" align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.fieldSource') }}</n-text>
      <n-radio-group :value="sourceModeModel" size="small" @update:value="(value: 'category' | 'product') => (sourceModeModel = value)">
        <n-radio value="product">{{ editorT('bigscreenEditor.ui.byProduct') }}</n-radio>
        <n-radio value="category">{{ editorT('bigscreenEditor.ui.standardPropertyFields') }}</n-radio>
      </n-radio-group>
    </n-space>

    <n-space v-if="isPropertyQuery && !isTemplateChartMode" align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.dataMode') }}</n-text>
      <n-radio-group v-model:value="cfg.mode" size="small">
        <n-radio v-for="item in propertyModeOptions" :key="item.value" :value="item.value" :disabled="item.disabled">
          {{ item.label }}
        </n-radio>
      </n-radio-group>
    </n-space>
    <n-text v-if="isPropertyQuery && propertyModeHint" depth="3" style="font-size: 12px">
      {{ propertyModeHint }}
    </n-text>

    <n-space v-if="!isPropertyQuery" align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.outputView') }}</n-text>
      <n-select :key="`iot-output-view-${queryTypeModel}`" v-model:value="outputViewModel" :options="outputViewOptions" size="small" style="min-width: 220px" />
    </n-space>

    <template v-if="isDeviceInfoQuery">
      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.statisticScope') }}</n-text>
        <n-select
          key="iot-area-select-device-info"
          v-model:value="cfg.areaIDs"
          :options="areaOptions"
          :loading="loadingAreas"
          multiple
          filterable
          clearable
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.selectStatisticScopesMultipleSelection')"
          style="min-width: 220px"
          @update:value="onAreaChange"
        />
        <FieldHint :text="rangeHint" />
      </n-space>
      <n-text v-if="isMultiAreaMode" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.whenMultipleScopesAreSelectedAllVisibleProducts') }} </n-text>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.productPage.typeProduct') }}</n-text>
        <n-select
          key="iot-product-select-device-info"
          v-model:value="cfg.productID"
          :options="productOptions"
          :loading="loadingProducts"
          size="small"
          :placeholder="editorT('scene.ui.selectProduct')"
          filterable
          style="min-width: 180px"
          @update:value="onProductChange"
        />
      </n-space>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('orgManage.memory.entityDevice') }}</n-text>
        <n-select
          key="iot-device-select-device-info"
          v-model:value="deviceSelectorValue"
          :options="deviceOptions"
          :loading="loadingDevices"
          :disabled="!cfg.productID"
          :multiple="isMultiDeviceInfoMode"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.searchByDeviceNameOrAlias')"
          filterable
          remote
          style="min-width: 220px"
          @search="(query: string) => loadDevices(cfg.productID, query)"
        />
      </n-space>
      <n-text v-if="isMultiDeviceInfoMode" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.thisComponentSupportsInformationFromMultipleDevicesSelect') }} </n-text>
    </template>

    <template v-else-if="isPropertyQuery && isTemplateChartMode">
      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.schemaForm.rangeLabel') }}</n-text>
        <n-select
          key="iot-area-select-property-template"
          v-model:value="cfg.areaIDs"
          :options="areaOptions"
          :loading="loadingAreas"
          multiple
          filterable
          clearable
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.selectStatisticScopesMultipleSelection')"
          style="min-width: 220px"
          @update:value="onAreaChange"
        />
        <FieldHint :text="rangeHint" />
      </n-space>
      <n-text v-if="isMultiAreaMode" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.whenMultipleScopesAreSelectedAllVisibleProducts') }} </n-text>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.productPage.typeProduct') }}</n-text>
        <n-select
          key="iot-product-select-property-template"
          v-model:value="cfg.productID"
          :options="productOptions"
          :loading="loadingProducts"
          size="small"
          :disabled="sourceModeModel === 'category'"
          :placeholder="editorT('scene.ui.selectProduct')"
          filterable
          style="min-width: 180px"
          @update:value="onProductChange"
        />
        <FieldHint :text="templateProductHint" />
      </n-space>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.alarmRule.categoryLabel') }}</n-text>
        <n-select
          key="iot-category-select-property-template"
          :value="cfg.productCategoryCode || null"
          :options="productCategoryOptions"
          size="small"
          :disabled="sourceModeModel === 'product'"
          :placeholder="editorT('bigscreenEditor.ui.selectCategory')"
          filterable
          clearable
          style="min-width: 180px"
          @update:value="(value: any) => onCategoryChange(value || '')"
        />
        <FieldHint :text="templateCategoryHint" />
      </n-space>
    </template>

    <template v-else-if="isDeviceStatusQuery">
      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.statisticScope') }}</n-text>
        <n-select
          key="iot-area-select-device-status"
          v-model:value="cfg.areaIDs"
          :options="areaOptions"
          :loading="loadingAreas"
          multiple
          filterable
          clearable
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.selectStatisticScopesMultipleSelection')"
          style="min-width: 220px"
          @update:value="onAreaChange"
        />
        <FieldHint :text="rangeHint" />
      </n-space>
      <n-text v-if="isMultiAreaMode" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.whenMultipleScopesAreSelectedAllVisibleProducts') }} </n-text>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.productPage.typeProduct') }}</n-text>
        <n-select
          key="iot-product-select-device-status"
          v-model:value="cfg.productID"
          :options="productOptions"
          :loading="loadingProducts"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.selectProductOptional')"
          filterable
          style="min-width: 180px"
          @update:value="onProductChange"
        />
      </n-space>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('orgManage.memory.entityDevice') }}</n-text>
        <FieldHint :text="editorT('bigscreenEditor.ui.withoutDeviceSelectionStatusStatisticsIncludeAllDevices')" />
        <n-select
          key="iot-device-select-device-status"
          v-model:value="deviceSelectorValue"
          :options="deviceOptions"
          :loading="loadingDevices"
          :disabled="!cfg.productID"
          multiple
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.searchByDeviceNameOrAliasMultipleSelection')"
          filterable
          remote
          style="min-width: 220px"
          @search="(query: string) => loadDevices(cfg.productID, query)"
        />
      </n-space>
    </template>

    <template v-else>
      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.statisticScope') }}</n-text>
        <n-select
          key="iot-area-select-property-normal"
          v-model:value="cfg.areaIDs"
          :options="areaOptions"
          :loading="loadingAreas"
          multiple
          filterable
          clearable
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.selectStatisticScopesMultipleSelection')"
          style="min-width: 220px"
          @update:value="onAreaChange"
        />
        <FieldHint :text="rangeHint" />
      </n-space>
      <n-text v-if="isMultiAreaMode" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.whenMultipleScopesAreSelectedAllVisibleProducts') }} </n-text>

      <n-space align="center">
        <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.productPage.typeProduct') }}</n-text>
        <n-select
          key="iot-product-select-property-normal"
          v-model:value="cfg.productID"
          :options="productOptions"
          :loading="loadingProducts"
          size="small"
          :placeholder="editorT('scene.ui.selectProduct')"
          filterable
          style="min-width: 180px"
          @update:value="onProductChange"
        />
      </n-space>

        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('orgManage.memory.entityDevice') }}</n-text>
          <n-select
            key="iot-device-select-property-normal"
            v-model:value="deviceSelectorValue"
            :options="deviceOptions"
          :loading="loadingDevices"
          :disabled="!cfg.productID"
          :multiple="!isDeviceInfoQuery"
          size="small"
          :placeholder="editorT('bigscreenEditor.ui.searchByDeviceNameOrAliasMultipleSelection')"
          filterable
          remote
          style="min-width: 220px"
            @search="(query: string) => loadDevices(cfg.productID, query)"
          />
        </n-space>
    </template>

    <template v-if="showFieldSelection">
      <!-- selectedFields 可能为 undefined，兜底为空数组避免子组件空指针 -->
      <FieldSelector
        :model-value="cfg.selectedFields ?? []"
        :options="fieldSelectionOptions"
        :title="fieldSelectionTitle"
        :hint="fieldSelectionHint"
        :empty-text="isDeviceInfoQuery && cfg.productID && cfg.deviceNames?.length ? editorT('bigscreenEditor.ui.loadingDeviceInformationFields') : editorT('bigscreenEditor.ui.noAvailableFields')"
        compact
        trigger-width="180px"
        @update:model-value="(value) => (cfg.selectedFields = value)"
      />
    </template>

    <template v-if="isPropertyQuery">
      <div v-if="schemaOptions.length > 0 || loadingSchema || (isTemplateChartMode && sourceModeModel === 'category')">
        <FieldSelector
          v-model="cfg.dataIDs"
          :options="schemaOptions"
          :title="editorT('orgManage.flow.propertyTitle')"
          :hint="isTemplateChartMode ? templateFieldHint : ''"
          :multiple="!isSinglePropertySelectionChart"
          :searchable="isTemplateChartMode && sourceModeModel === 'category'"
          :search-placeholder="editorT('bigscreenEditor.ui.searchFieldNameIdentifierOrUnit')"
          :empty-text="cfg.productID || cfg.productCategoryCode ? editorT('bigscreenEditor.ui.noAvailableFields') : editorT('bigscreenEditor.ui.noAvailableFields')"
          :loading="loadingSchema"
          compact
          trigger-width="180px"
          @update:model-value="cfg.templateAutoField = undefined"
        />
      </div>
      <n-text v-else-if="loadingSchema" depth="3" style="font-size: 12px"> {{ editorT('bigscreenEditor.ui.loadingProperties') }} </n-text>
      <n-text v-if="isTemplateChartMode && sourceModeModel === 'category' && categorySchemaStatus === 'empty'" depth="3" style="font-size: 12px">
        {{ editorT('bigscreenEditor.ui.noPropertyFieldsWereFoundThisCategoryCheck') }}
      </n-text>
      <n-text v-if="isTemplateChartMode && sourceModeModel === 'category' && categorySchemaStatus === 'error'" depth="3" style="font-size: 12px">
        {{ editorT('bigscreenEditor.ui.failedLoadCategoryPropertiesCheckAPIConnectivityAnd') }}
      </n-text>

      <!-- TASK-045: 模板级聚合配置字段 -->
      <template v-if="isTemplateChartMode">
        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.deviceDetail.timeRange') }}</n-text>
          <n-select
            key="iot-template-time-range"
            :value="cfg.timeRange"
            :options="templateTimeRangeOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => updateTemplateField('timeRange', value)"
          />
        </n-space>

        <n-space v-if="cfg.timeRange === 'custom'" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('orgIotClient.deviceLogs.customTime') }}</n-text>
          <n-date-picker
            :value="cfg.customTimeRange"
            type="datetimerange"
            size="small"
            clearable
            :shortcuts="datePickerShortcuts"
            :default-value="getDefaultCustomTimeRange()"
            style="min-width: 360px"
            @update:value="(value: [number, number] | null) => updateTemplateCustomTimeRange(value)"
          />
        </n-space>

        <n-space v-if="isTrendMode" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.timeGranularity') }}</n-text>
          <n-select
            key="iot-template-interval-unit"
            :value="cfg.intervalUnit"
            :options="templateIntervalUnitOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => updateTemplateField('intervalUnit', value)"
          />
        </n-space>

        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.deviceDetail.aggFunc') }}</n-text>
          <n-select
            key="iot-template-agg-func"
            :value="cfg.aggFunc"
            :options="aggFuncOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => updateTemplateField('aggFunc', value)"
          />
        </n-space>

        <n-space v-if="isAggregateMode" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.displayMode') }}</n-text>
          <n-select
            key="iot-template-aggregate-view-mode"
            :value="cfg.aggregateViewMode || 'ranking'"
            :options="aggregateViewModeOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => (cfg.aggregateViewMode = value)"
          />
        </n-space>

        <n-space v-if="isAggregateMode" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.groupingDimension') }}</n-text>
          <n-select
            key="iot-template-group-by"
            :value="cfg.groupBy"
            :options="templateGroupByOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => updateTemplateField('groupBy', value)"
          />
        </n-space>

        <n-space v-if="isAggregateMode" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('orgManage.menuManage.sort') }}</n-text>
          <n-select
            key="iot-template-sort-by"
            :value="cfg.sortBy"
            :options="templateSortByOptions"
            size="small"
            style="min-width: 120px"
            @update:value="(value: any) => updateTemplateField('sortBy', value)"
          />
        </n-space>

        <n-space v-if="isAggregateMode" align="center">
          <n-text depth="3" style="min-width: 56px">TopN</n-text>
          <n-input-number :value="cfg.limit" size="small" :min="1" :max="100" style="width: 100px" @update:value="updateTemplateLimit" />
        </n-space>
      </template>

      <template v-if="!isTemplateChartMode && cfg.mode === 'log'">
        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.deviceDetail.aggFunc') }}</n-text>
          <n-select v-model:value="cfg.aggFunc" :options="aggFuncOptions" size="small" style="min-width: 120px" />
        </n-space>

        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('iotApp.deviceDetail.timeRange') }}</n-text>
          <n-select v-model:value="cfg.logTimeRange" :options="timeRangeOptions" size="small" style="min-width: 120px" />
        </n-space>

        <n-space v-if="cfg.logTimeRange === 'custom'" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('orgIotClient.deviceLogs.customTime') }}</n-text>
          <n-date-picker
            v-model:value="cfg.customTimeRange"
            type="datetimerange"
            size="small"
            clearable
            :shortcuts="datePickerShortcuts"
            :default-value="getDefaultCustomTimeRange()"
            style="min-width: 360px"
          />
        </n-space>

        <n-space align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.aggregationMethod') }}</n-text>
          <n-select v-model:value="cfg.logAggregationMode" :options="aggregationModeOptions" size="small" style="min-width: 120px" />
        </n-space>

        <n-space v-if="cfg.logAggregationMode !== 'week' && cfg.logAggregationMode !== 'month'" align="center">
          <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.aggregationInterval') }}</n-text>
          <n-select v-model:value="cfg.logInterval" :options="dynamicAggIntervalOptions" size="small" style="min-width: 120px" />
        </n-space>

        <n-text v-if="cfg.logAggregationMode === 'week' || cfg.logAggregationMode === 'month'" depth="3" style="font-size: 12px">
          {{ cfg.logAggregationMode === 'week' ? editorT('bigscreenEditor.ui.weeklyAggregationUsesCalendarWeeksSeparateAggregationInterval') : editorT('bigscreenEditor.ui.monthlyAggregationUsesCalendarMonthsSeparateAggregationInterval') }}
        </n-text>

        <n-text v-if="aggregationRuleState.correctionHint" depth="3" style="font-size: 12px">
          {{ aggregationRuleState.correctionHint }}
        </n-text>

        <n-text depth="3" style="font-size: 12px">
          {{ aggregationRuleState.dataSourceHint }}
        </n-text>

        <n-text
          v-if="aggregationRuleState.isOverLimit && dynamicAggIntervalOptions.length > 0 && dynamicAggIntervalOptions.every((item) => item.disabled)"
          depth="3"
          style="font-size: 12px"
        >
          {{ editorT('bigscreenEditor.ui.thisCombinationCreatesTooManyTimeBucketsShorten') }}
        </n-text>
      </template>
    </template>

    <n-space align="center">
      <n-text depth="3" style="min-width: 56px">{{ editorT('bigscreenEditor.ui.refreshInterval') }}</n-text>
      <n-input-number v-model:value="targetData.request.requestInterval" size="small" :min="1" :placeholder="editorT('bigscreenEditor.ui.leaveEmptyDisablePolling')" style="width: 100px" />
      <n-select v-model:value="targetData.request.requestIntervalUnit" :options="intervalUnitOptions" size="small" style="width: 60px" />
    </n-space>
    <n-text v-if="isRealtimePushMode" depth="3" style="font-size: 12px">
      {{ editorT('bigscreenEditor.ui.livePushModeDataUpdatesThroughWebSocketPolling') }}
    </n-text>
    <PreviewControls
      :loading-preview="loadingPreview"
      :preview-panel-visible="previewPanelVisible"
      :preview-result="previewResult"
      @preview="onPreview"
      @update:preview-panel-visible="(value) => (previewPanelVisible = value)"
    />
  </n-space>

  <ChartDataMatchingAndShow v-if="showMatching && !loadingPreview" :show="true" :ajax="true" />
</template>
