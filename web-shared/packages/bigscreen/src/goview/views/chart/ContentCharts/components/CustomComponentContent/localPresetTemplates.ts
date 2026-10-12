/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { CreateComponentType } from '@/packages/index.type';

import type { EditorTemplatePayload } from './templateInstantiate';

import runningTimerCover from '@/assets/images/chart/decorates/BorderRunningTimer01.png';
import metricFlipperCover from '@/assets/images/chart/decorates/BorderRunningTimer02.png';
import deviceStatusCover from '@/assets/images/chart/decorates/ChartDataIoTDevice.png';
import PieCircleConfig from '@/packages/components/Charts/Pies/PieCircle/config';
import { createBorderContainerOption } from '@/packages/components/Charts/shared/decoratedChartOptions';
import FlipperNumberConfig from '@/packages/components/Decorates/Mores/FlipperNumber/config';
import TextCommonConfig from '@/packages/components/Informations/Texts/TextCommon/config';

export type LocalPresetTemplateItem = {
  category: string;
  content: EditorTemplatePayload;
  id: string;
  name: string;
  source: 'local';
  templateType: string;
  thumbnail: string;
};

const GROUP_WIDTH = 900;
const GROUP_HEIGHT = 140;
const TITLE_HEIGHT = 32;
const GROUP_PADDING = 10;
const DESIGN_WIDTH = GROUP_WIDTH - GROUP_PADDING * 2;
const DESIGN_HEIGHT = GROUP_HEIGHT - GROUP_PADDING * 2 - TITLE_HEIGHT;
const BODY_CENTER_Y = Math.round(DESIGN_HEIGHT / 2);

const DAY_FLIPPER_WIDTH = 160;
const HOUR_FLIPPER_WIDTH = 90;
const DAY_UNIT_WIDTH = 28;
const HOUR_UNIT_WIDTH = 42;
const GAP_DAY_TO_UNIT = 16;
const GAP_UNIT_TO_HOUR = 28;
const GAP_HOUR_TO_UNIT = 16;

const CONTENT_TOTAL_WIDTH = DAY_FLIPPER_WIDTH + GAP_DAY_TO_UNIT + DAY_UNIT_WIDTH + GAP_UNIT_TO_HOUR + HOUR_FLIPPER_WIDTH + GAP_HOUR_TO_UNIT + HOUR_UNIT_WIDTH;

const CONTENT_START_X = Math.round((DESIGN_WIDTH - CONTENT_TOTAL_WIDTH) / 2);
const DAY_FLIPPER_X = CONTENT_START_X;
const DAY_UNIT_X = DAY_FLIPPER_X + DAY_FLIPPER_WIDTH + GAP_DAY_TO_UNIT;
const HOUR_FLIPPER_X = DAY_UNIT_X + DAY_UNIT_WIDTH + GAP_UNIT_TO_HOUR;
const HOUR_UNIT_X = HOUR_FLIPPER_X + HOUR_FLIPPER_WIDTH + GAP_HOUR_TO_UNIT;

const DEVICE_STATUS_GROUP_WIDTH = 640;
const DEVICE_STATUS_GROUP_HEIGHT = 300;
const DEVICE_STATUS_PADDING = 18;
const DEVICE_STATUS_DESIGN_WIDTH = DEVICE_STATUS_GROUP_WIDTH - DEVICE_STATUS_PADDING * 2;
const DEVICE_STATUS_DESIGN_HEIGHT = DEVICE_STATUS_GROUP_HEIGHT - DEVICE_STATUS_PADDING * 2 - TITLE_HEIGHT;
const DEVICE_STATUS_COLUMN_WIDTH = 150;
const DEVICE_STATUS_COLUMN_GAP = 34;
const DEVICE_STATUS_COLUMNS_TOTAL_WIDTH = DEVICE_STATUS_COLUMN_WIDTH * 3 + DEVICE_STATUS_COLUMN_GAP * 2;
const DEVICE_STATUS_START_X = Math.round((DEVICE_STATUS_DESIGN_WIDTH - DEVICE_STATUS_COLUMNS_TOTAL_WIDTH) / 2);
const DEVICE_STATUS_RING_SIZE = 118;
const DEVICE_STATUS_RING_Y = 28;
const DEVICE_STATUS_COUNT_Y = 164;
const DEVICE_STATUS_LABEL_Y = 196;

const METRIC_GROUP_WIDTH = 640;
const METRIC_GROUP_HEIGHT = 260;
const METRIC_PADDING = 18;
const METRIC_DESIGN_WIDTH = METRIC_GROUP_WIDTH - METRIC_PADDING * 2;
const METRIC_DESIGN_HEIGHT = METRIC_GROUP_HEIGHT - METRIC_PADDING * 2 - TITLE_HEIGHT;
const METRIC_MAIN_FLIPPER_WIDTH = 222;
const METRIC_MAIN_FLIPPER_HEIGHT = 62;
const METRIC_MAIN_UNIT_WIDTH = 54;
const METRIC_MAIN_TOTAL_WIDTH = METRIC_MAIN_FLIPPER_WIDTH + METRIC_MAIN_UNIT_WIDTH + 10;
const METRIC_MAIN_START_X = Math.round((METRIC_DESIGN_WIDTH - METRIC_MAIN_TOTAL_WIDTH) / 2);
const METRIC_MAIN_Y = 38;
const METRIC_SUB_ITEM_WIDTH = 150;
const METRIC_SUB_ITEM_GAP = 26;
const METRIC_SUB_TOTAL_WIDTH = METRIC_SUB_ITEM_WIDTH * 3 + METRIC_SUB_ITEM_GAP * 2;
const METRIC_SUB_START_X = Math.round((METRIC_DESIGN_WIDTH - METRIC_SUB_TOTAL_WIDTH) / 2);
const METRIC_SUB_LABEL_Y = 136;
const METRIC_SUB_VALUE_Y = 164;

const presetStyles = {
  filterShow: false,
  hueRotate: 0,
  saturate: 1,
  contrast: 1,
  brightness: 1,
  opacity: 1,
  rotateZ: 0,
  rotateX: 0,
  rotateY: 0,
  skewX: 0,
  skewY: 0,
  blendMode: 'normal',
  animations: [],
};

const createDayFlipper = () => {
  const component = new FlipperNumberConfig() as unknown as CreateComponentType;
  component.attr.w = DAY_FLIPPER_WIDTH;
  component.attr.h = 60;
  component.attr.x = DAY_FLIPPER_X;
  component.attr.y = BODY_CENTER_Y - component.attr.h / 2 + 12;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = 0;
  component.option.flipperLength = 4;
  component.option.flipperWidth = 28;
  component.option.flipperHeight = 46;
  component.option.flipperGap = 6;
  return component;
};

const createHourFlipper = () => {
  const component = new FlipperNumberConfig() as unknown as CreateComponentType;
  component.attr.w = HOUR_FLIPPER_WIDTH;
  component.attr.h = 60;
  component.attr.x = HOUR_FLIPPER_X;
  component.attr.y = BODY_CENTER_Y - component.attr.h / 2 + 12;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = 0;
  component.option.flipperLength = 2;
  component.option.flipperWidth = 28;
  component.option.flipperHeight = 46;
  component.option.flipperGap = 6;
  return component;
};

const createDayUnitText = () => {
  const component = new TextCommonConfig() as unknown as CreateComponentType;
  component.attr.w = DAY_UNIT_WIDTH;
  component.attr.h = 24;
  component.attr.x = DAY_UNIT_X;
  component.attr.y = BODY_CENTER_Y - component.attr.h / 2 + 24;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = editorT('orgManage.flow.unitDay');
  component.option.fontSize = 16;
  component.option.fontColor = '#4A9EF8FF';
  component.option.paddingX = 0;
  component.option.paddingY = 0;
  component.option.textAlign = 'center';
  return component;
};

const createHourUnitText = () => {
  const component = new TextCommonConfig() as unknown as CreateComponentType;
  component.attr.w = HOUR_UNIT_WIDTH;
  component.attr.h = 24;
  component.attr.x = HOUR_UNIT_X;
  component.attr.y = BODY_CENTER_Y - component.attr.h / 2 + 24;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = editorT('orgManage.flow.unitHour');
  component.option.fontSize = 16;
  component.option.fontColor = '#4A9EF8FF';
  component.option.paddingX = 0;
  component.option.paddingY = 0;
  component.option.textAlign = 'center';
  return component;
};

const createTextComponent = ({
  backgroundColor = '#00000000',
  color,
  fontSize,
  h,
  text,
  w,
  x,
  y,
}: {
  backgroundColor?: string;
  color: string;
  fontSize: number;
  h: number;
  text: string;
  w: number;
  x: number;
  y: number;
}) => {
  const component = new TextCommonConfig() as unknown as CreateComponentType;
  component.attr.w = w;
  component.attr.h = h;
  component.attr.x = x;
  component.attr.y = y;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = text;
  component.option.fontSize = fontSize;
  component.option.fontColor = color;
  component.option.paddingX = 0;
  component.option.paddingY = 0;
  component.option.textAlign = 'center';
  component.option.backgroundColor = backgroundColor;
  return component;
};

const createStatusRing = (columnIndex: number, color: string) => {
  const component = new PieCircleConfig() as unknown as CreateComponentType;
  const columnX = DEVICE_STATUS_START_X + columnIndex * (DEVICE_STATUS_COLUMN_WIDTH + DEVICE_STATUS_COLUMN_GAP);
  component.attr.w = DEVICE_STATUS_RING_SIZE;
  component.attr.h = DEVICE_STATUS_RING_SIZE;
  component.attr.x = columnX + Math.round((DEVICE_STATUS_COLUMN_WIDTH - DEVICE_STATUS_RING_SIZE) / 2);
  component.attr.y = DEVICE_STATUS_RING_Y;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.tooltip.show = false;
  // PieCircle 初始 option 运行时必含 legend/title（见 PieCircle/config.ts），交叉断言收窄主题类型的可选字段并补充 text
  const ringOption = component.option as CreateComponentType['option'] & {
    legend: { show: boolean };
    title: { text: string; textStyle: { color: string; fontSize: number } };
  };
  ringOption.legend.show = false;
  component.option.dataset = 0;
  ringOption.title.text = '0%';
  ringOption.title.textStyle.color = '#F4FFF9';
  ringOption.title.textStyle.fontSize = 26;
  component.option.series[0].radius = ['72%', '84%'];
  component.option.series[0].color = [`${color}55`, 'transparent'];
  component.option.series[0].data[0].value[0] = 0;
  component.option.series[0].data[0].itemStyle.color = color;
  component.option.series[0].data[0].itemStyle.shadowColor = color;
  component.option.series[0].data[0].itemStyle.shadowBlur = 8;
  component.option.series[0].data[1].value[0] = 100;
  component.option.series[0].data[1].itemStyle.color = '#06120FFF';
  return component;
};

const createStatusCountText = (columnIndex: number) => {
  const columnX = DEVICE_STATUS_START_X + columnIndex * (DEVICE_STATUS_COLUMN_WIDTH + DEVICE_STATUS_COLUMN_GAP);
  return createTextComponent({
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return editorT('bigscreenEditor.ui.0Devices'); },
    color: '#4A9EF8FF',
    fontSize: 18,
    w: DEVICE_STATUS_COLUMN_WIDTH,
    h: 28,
    x: columnX,
    y: DEVICE_STATUS_COUNT_Y,
  });
};

const createStatusLabelText = (columnIndex: number, label: string) => {
  const columnX = DEVICE_STATUS_START_X + columnIndex * (DEVICE_STATUS_COLUMN_WIDTH + DEVICE_STATUS_COLUMN_GAP);
  return createTextComponent({
    text: label,
    color: '#C9D7E6FF',
    fontSize: 16,
    w: DEVICE_STATUS_COLUMN_WIDTH,
    h: 26,
    x: columnX,
    y: DEVICE_STATUS_LABEL_Y,
  });
};

const createDeviceStatusChildren = () => [
  createStatusRing(0, '#31D78AFF'),
  createStatusCountText(0),
  createStatusLabelText(0, editorT('orgManage.renewal.statusNormal')),
  createStatusRing(1, '#8AAAFBFF'),
  createStatusCountText(1),
  createStatusLabelText(1, editorT('iotApp.productPage.offline')),
  createStatusRing(2, '#F5A623FF'),
  createStatusCountText(2),
  createStatusLabelText(2, editorT('orgManage.memory.entityAlarm')),
];

const createMetricMainFlipper = () => {
  const component = new FlipperNumberConfig() as unknown as CreateComponentType;
  component.attr.w = METRIC_MAIN_FLIPPER_WIDTH;
  component.attr.h = METRIC_MAIN_FLIPPER_HEIGHT;
  component.attr.x = METRIC_MAIN_START_X;
  component.attr.y = METRIC_MAIN_Y;
  component.attr.offsetX = 0;
  component.attr.offsetY = 0;
  component.option.dataset = 0;
  component.option.flipperLength = 5;
  component.option.flipperWidth = 32;
  component.option.flipperHeight = 48;
  component.option.flipperGap = 6;
  return component;
};

const createMetricMainUnit = () =>
  createTextComponent({
    text: 'kW',
    color: '#4A9EF8FF',
    fontSize: 20,
    w: METRIC_MAIN_UNIT_WIDTH,
    h: 28,
    x: METRIC_MAIN_START_X + METRIC_MAIN_FLIPPER_WIDTH + 10,
    y: METRIC_MAIN_Y + 22,
  });

const createMetricSubItem = (index: number, label: string, value: string, color: string) => {
  const x = METRIC_SUB_START_X + index * (METRIC_SUB_ITEM_WIDTH + METRIC_SUB_ITEM_GAP);
  return [
    createTextComponent({
      text: label,
      color: '#AFC8FFFF',
      fontSize: 15,
      w: METRIC_SUB_ITEM_WIDTH,
      h: 24,
      x,
      y: METRIC_SUB_LABEL_Y,
    }),
    createTextComponent({
      text: value,
      color,
      fontSize: 24,
      w: METRIC_SUB_ITEM_WIDTH,
      h: 32,
      x,
      y: METRIC_SUB_VALUE_Y,
    }),
  ];
};

const createMetricFlipperChildren = () => [
  createMetricMainFlipper(),
  createMetricMainUnit(),
  ...createMetricSubItem(0, editorT('orgManage.flow.propMax'), '0', '#31D78AFF'),
  ...createMetricSubItem(1, editorT('orgManage.flow.propMin'), '0', '#8AAAFBFF'),
  ...createMetricSubItem(2, editorT('iotApp.deviceDetail.avgValue'), '0', '#F5A623FF'),
];

const createSystemUptimePresetTemplate = (): LocalPresetTemplateItem => {
  const borderOption = createBorderContainerOption('Border04', editorT('bigscreenEditor.ui.totalRuntime'));
  borderOption.borderTitleWidth = 220;
  borderOption.borderTitleHeight = TITLE_HEIGHT;

  return {
    id: 'local-preset-system-uptime-shell',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.totalRuntime'); },
    category: 'Metrics',
    source: 'local',
    templateType: 'group_template',
    thumbnail: runningTimerCover,
    content: {
      type: 'group_template',
      version: 3,
      attr: {
        w: GROUP_WIDTH,
        h: GROUP_HEIGHT,
      },
      containerType: 'border',
      option: {
        containerType: 'border',
        borderKey: 'Border04',
        borderOption,
        padding: GROUP_PADDING,
        designWidth: DESIGN_WIDTH,
        designHeight: DESIGN_HEIGHT,
      },
      styles: { ...presetStyles },
      thumbnail: runningTimerCover,
      groupList: [createDayFlipper(), createHourFlipper(), createDayUnitText(), createHourUnitText()],
    },
  };
};

const createDeviceStatusPresetTemplate = (): LocalPresetTemplateItem => {
  const borderOption = createBorderContainerOption('Border04', editorT('iotApp.productPage.deviceStatus'));
  borderOption.borderTitleWidth = 220;
  borderOption.borderTitleHeight = TITLE_HEIGHT;

  return {
    id: 'local-preset-iot-device-status-shell',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.deviceStatusStatistics'); },
    category: 'Status',
    source: 'local',
    templateType: 'group_template',
    thumbnail: deviceStatusCover,
    content: {
      type: 'group_template',
      version: 3,
      attr: {
        w: DEVICE_STATUS_GROUP_WIDTH,
        h: DEVICE_STATUS_GROUP_HEIGHT,
      },
      containerType: 'border',
      option: {
        containerType: 'border',
        borderKey: 'Border04',
        borderOption,
        padding: DEVICE_STATUS_PADDING,
        designWidth: DEVICE_STATUS_DESIGN_WIDTH,
        designHeight: DEVICE_STATUS_DESIGN_HEIGHT,
      },
      styles: { ...presetStyles },
      thumbnail: deviceStatusCover,
      groupList: createDeviceStatusChildren(),
    },
  };
};

const createMetricFlipperPresetTemplate = (): LocalPresetTemplateItem => {
  const borderOption = createBorderContainerOption('Border04', editorT('bigscreenEditor.ui.metricFlipCard'));
  borderOption.borderTitleWidth = 220;
  borderOption.borderTitleHeight = TITLE_HEIGHT;

  return {
    id: 'local-preset-iot-metric-flipper-shell',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get name() { return editorT('bigscreenEditor.ui.metricFlipCard'); },
    category: 'Metrics',
    source: 'local',
    templateType: 'group_template',
    thumbnail: metricFlipperCover,
    content: {
      type: 'group_template',
      version: 3,
      attr: {
        w: METRIC_GROUP_WIDTH,
        h: METRIC_GROUP_HEIGHT,
      },
      containerType: 'border',
      option: {
        containerType: 'border',
        borderKey: 'Border04',
        borderOption,
        padding: METRIC_PADDING,
        designWidth: METRIC_DESIGN_WIDTH,
        designHeight: METRIC_DESIGN_HEIGHT,
      },
      styles: { ...presetStyles },
      thumbnail: metricFlipperCover,
      groupList: createMetricFlipperChildren(),
    },
  };
};

export const localPresetTemplates: LocalPresetTemplateItem[] = [
  createSystemUptimePresetTemplate(),
  createDeviceStatusPresetTemplate(),
  createMetricFlipperPresetTemplate(),
];
