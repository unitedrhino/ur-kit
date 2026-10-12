import type {
  // 系列类型的定义后缀都为 SeriesOption
  BarSeriesOption,
  EffectScatterSeriesOption,
  LineSeriesOption,
  MapSeriesOption,
  SankeySeriesOption,
} from 'echarts/charts';
import type {
  DatasetComponentOption,
  DataZoomComponentOption,
  GeoComponentOption,
  GridComponentOption,
  PolarComponentOption,
  // 组件类型的定义后缀都为 ComponentOption
  TitleComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from 'echarts/components';
import type { ComposeOption } from 'echarts/core';

import { BarChart, EffectScatterChart, LineChart, MapChart, PieChart, RadarChart, SankeyChart, ScatterChart } from 'echarts/charts';
import {
  // 数据集组件
  DatasetComponent,
  DataZoomComponent,
  GeoComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  // 内置数据转换器组件 (filter, sort)
  TransformComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { registerMap } from 'echarts/core';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 扩展极坐标轴指示器类型定义
export interface PolarAxisPointerOption {
  angle?: {
    lineStyle?: {
      color?: string;
      type?: 'dashed' | 'dotted' | 'solid';
      width?: number;
    };
    show?: boolean;
  };
  radius?: {
    lineStyle?: {
      color?: string;
      type?: 'dashed' | 'dotted' | 'solid';
      width?: number;
    };
    show?: boolean;
  };
}

// 扩展的 TooltipOption 类型
export interface ExtendedTooltipOption extends TooltipComponentOption {
  axisPointer?: {
    axis?: 'angle' | 'auto' | 'radius' | 'x' | 'y';
    crossStyle?: any;
    lineStyle?: any;
    polarAxisPointer?: PolarAxisPointerOption;
    type?: 'cross' | 'line' | 'none' | 'shadow';
  };
}

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型
export type ECOption = ComposeOption<
  | BarSeriesOption
  | DatasetComponentOption
  | DataZoomComponentOption
  | EffectScatterSeriesOption
  | GeoComponentOption
  | GridComponentOption
  | LineSeriesOption
  | MapSeriesOption
  | PolarComponentOption
  | SankeySeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
>;

// 扩展的 ECharts Option 类型，支持极坐标轴指示器
export interface ExtendedECOption extends Omit<ECOption, 'tooltip'> {
  tooltip?: ExtendedTooltipOption;
}

// 注册必须的组件
echarts.use([
  TitleComponent,
  PieChart,
  RadarChart,
  TooltipComponent,
  GridComponent,
  GeoComponent,
  PolarComponent,
  DatasetComponent,
  DataZoomComponent,
  TransformComponent,
  BarChart,
  LineChart,
  MapChart,
  EffectScatterChart,
  ScatterChart,
  SankeyChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  LegendComponent,
  ToolboxComponent,
  VisualMapComponent,
  GraphicComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
]);

/** registerEchartsMap 统一通过插件入口注册 GeoJSON 地图，避免业务应用直接依赖 ECharts 深层入口。 */
export function registerEchartsMap(name: string, geoJSON: unknown) {
  registerMap(name, {
    geoJSON: geoJSON as never,
    specialAreas: {},
  });
}

export default echarts;
