/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
export type IoTQueryType = 'deviceInfo' | 'deviceStatus' | 'property';
export type IoTOutputView = 'distribution' | 'fields';
export type IoTPropertyMode = 'latest' | 'log';

// ── TASK-045 新增：图表模式与分组维度 ──
export type IoTChartMode = 'aggregate' | 'singleStat' | 'traditional' | 'trend';
export type IoTGroupBy = 'none' | 'area' | 'device';

export function isSingleStatChartMode(chartMode?: string) {
  return chartMode === 'singleStat';
}

export function isTrendChartMode(chartMode?: string) {
  return chartMode === 'trend';
}

export function isRankingChartMode(chartMode?: string) {
  return chartMode === 'aggregate';
}

const lineChartKeys = new Set(['LineCommon', 'LineGradients', 'LineGradientSingle', 'LineLinearSingle']);
const pieChartKeys = new Set(['PieCircle', 'PieCommon']);
const barChartKeys = new Set(['BarCommon', 'BarCrossrange', 'BarLine']);
const capsuleChartKeys = new Set(['CapsuleChart', 'CapsuleCommon']);
const textChartKeys = new Set(['TextCommon', 'FlipperNumber']);
const deviceInfoChartKeys = new Set(['TablesBasic', 'TableList']);
const openListChartKeys = new Set(['TablesBasic', 'TableScrollBoard']);
const rankListChartKeys = new Set(['TableList']);
const radarChartKeys = new Set(['Radar']);
const progressChartKeys = new Set(['Process', 'WaterPolo']);
const singleValueChartKeys = new Set(['TextCommon', 'FlipperNumber', 'Number', 'PieCircle', 'Process', 'WaterPolo', 'Dial', 'CountDown']);

export function normalizeChartKey(chartKey = '') {
  const key = chartKey;
  return key.startsWith('V') ? key.slice(1) : key;
}

export function isSingleValueChart(chartKey?: string) {
  const normalizedKey = normalizeChartKey(chartKey);
  return singleValueChartKeys.has(normalizedKey);
}

export function isMultiDeviceInfoChart(chartKey?: string) {
  const normalizedKey = normalizeChartKey(chartKey);
  return normalizedKey === 'TablesBasic' || normalizedKey === 'TableList';
}

export function getDefaultOutputView(chartKey: string | undefined, queryType: IoTQueryType): IoTOutputView {
  if (queryType === 'deviceInfo') return 'fields';
  if (queryType !== 'deviceStatus') return 'distribution';
  return 'fields';
}

export function getDefaultPropertyMode(chartKey: string | undefined): IoTPropertyMode {
  const normalizedKey = normalizeChartKey(chartKey);
  if (lineChartKeys.has(normalizedKey)) return 'log';
  if (capsuleChartKeys.has(normalizedKey)) return 'latest';
  return 'latest';
}

export function isQueryTypeSupported(chartKey: string | undefined, queryType: IoTQueryType) {
  const normalizedKey = normalizeChartKey(chartKey);
  if (!normalizedKey || queryType === 'property') return true;

  if (lineChartKeys.has(normalizedKey)) {
    return false;
  }

  if (pieChartKeys.has(normalizedKey)) {
    return queryType === 'deviceStatus';
  }

  if (deviceInfoChartKeys.has(normalizedKey)) {
    return true;
  }

  if (textChartKeys.has(normalizedKey) || openListChartKeys.has(normalizedKey) || rankListChartKeys.has(normalizedKey) || barChartKeys.has(normalizedKey)) {
    if (rankListChartKeys.has(normalizedKey)) {
      return queryType === 'deviceInfo';
    }
    return queryType !== 'deviceInfo';
  }

  if (radarChartKeys.has(normalizedKey)) {
    return queryType === 'deviceStatus';
  }

  if (progressChartKeys.has(normalizedKey)) {
    return queryType !== 'deviceInfo';
  }

  return true;
}

export function isOutputViewSupported(chartKey: string | undefined, queryType: IoTQueryType, outputView: IoTOutputView) {
  const normalizedKey = normalizeChartKey(chartKey);
  if (!normalizedKey || queryType === 'property') return true;

  if (queryType === 'deviceInfo') {
    return outputView === 'fields';
  }

  if (queryType === 'deviceStatus') {
    if (lineChartKeys.has(normalizedKey)) return false;
    return outputView === 'fields';
  }

  return true;
}

export function isPropertyModeSupported(chartKey: string | undefined, mode: IoTPropertyMode) {
  const normalizedKey = normalizeChartKey(chartKey);
  if (!normalizedKey) return true;

  if (lineChartKeys.has(normalizedKey)) {
    return mode === 'log';
  }

  if (pieChartKeys.has(normalizedKey)) {
    return mode === 'latest';
  }

  if (capsuleChartKeys.has(normalizedKey)) {
    return mode === 'latest';
  }

  if (normalizedKey === 'TableList') {
    return true;
  }

  return true;
}

export function getQueryTypeHint(chartKey?: string) {
  const normalizedKey = normalizeChartKey(chartKey);
  if (!normalizedKey) return '';

  if (lineChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.lineChartsSupportOnlyHistoricalPropertyDataDevice');
  }

  if (pieChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.pieChartsShowSnapshotProportionsAndSupportProperty');
  }

  if (textChartKeys.has(normalizedKey)) {
    if (normalizedKey === 'TextCommon') {
      return editorT('bigscreenEditor.ui.textComponentsShowSingleItemAndSupportDevice');
    }
    return editorT('bigscreenEditor.ui.flipCardsShowSingleNumericValueDeviceInformation');
  }

  if (radarChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.radarChartsCompareMultipleNumericDimensionsDeviceInformation');
  }

  if (rankListChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.scrollingListsDisplayDeviceInformationFieldsAndSupport');
  }

  if (openListChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.listComponentsSupportPropertyDataDeviceInformationFields');
  }

  if (barChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.barChartsCompareNumericCategoriesDeviceInformationDisabled');
  }

  if (capsuleChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.capsuleBarChartsCompareOrRankLatestValues');
  }

  if (progressChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.progressAndLiquidFillChartsShowSingleRatio');
  }

  return '';
}

export function getPropertyModeHint(chartKey?: string) {
  const normalizedKey = normalizeChartKey(chartKey);
  if (!normalizedKey) return '';

  if (lineChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.latestPropertyValueHasOnlyOnePointAnd');
  }

  if (pieChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.historicalPropertyDataTimeSeriesAndUnsuitablePie');
  }

  if (capsuleChartKeys.has(normalizedKey)) {
    return editorT('bigscreenEditor.ui.capsuleBarChartsSupportOnlyLatestPropertyValues');
  }

  return '';
}
