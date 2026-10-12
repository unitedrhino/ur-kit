import type { Component } from 'vue';

import DefaultMapping from './DefaultMapping.vue';
import GraphMapping from './GraphMapping.vue';
import HeatmapMapping from './HeatmapMapping.vue';
import MapMapping from './MapMapping.vue';
import RadarMapping from './RadarMapping.vue';
import SankeyMapping from './SankeyMapping.vue';
import ScatterMapping from './ScatterMapping.vue';
import TreeMapping from './TreeMapping.vue';

type MappingType = 'default' | 'graph' | 'heatmap' | 'map' | 'radar' | 'sankey' | 'scatter' | 'tree';

const CHART_KEY_TO_MAPPING_TYPE: Record<string, MappingType> = {
  BarCommon: 'default',
  BarCrossrange: 'default',
  Graph: 'graph',
  Heatmap: 'heatmap',
  LineCommon: 'default',
  LineGradients: 'default',
  MapBase: 'map',
  Radar: 'radar',
  Sankey: 'sankey',
  ScatterCommon: 'scatter',
  ScatterLogarithmicRegression: 'scatter',
  TreeMap: 'tree',
  VBarCommon: 'default',
  VBarCrossrange: 'default',
  VGraph: 'graph',
  VHeatmap: 'heatmap',
  VLineCommon: 'default',
  VLineGradients: 'default',
  VMapBase: 'map',
  VRadar: 'radar',
  VSankey: 'sankey',
  VScatterCommon: 'scatter',
  VScatterLogarithmicRegression: 'scatter',
  VTreeMap: 'tree',
};

const ADAPTER_TYPE_TO_MAPPING_TYPE: Record<string, MappingType> = {
  bar: 'default',
  default: 'default',
  graph: 'graph',
  heatmap: 'heatmap',
  line: 'default',
  map: 'map',
  radar: 'radar',
  sankey: 'sankey',
  scatter: 'scatter',
  tree: 'tree',
};

const MAPPING_COMPONENTS: Record<MappingType, Component> = {
  default: DefaultMapping,
  graph: GraphMapping,
  heatmap: HeatmapMapping,
  map: MapMapping,
  radar: RadarMapping,
  sankey: SankeyMapping,
  scatter: ScatterMapping,
  tree: TreeMapping,
};

export const resolveMappingType = (chartKey: string, adapterType?: string): MappingType => {
  const fromAdapter = adapterType ? ADAPTER_TYPE_TO_MAPPING_TYPE[String(adapterType).toLowerCase()] : undefined;
  if (fromAdapter) return fromAdapter;
  return CHART_KEY_TO_MAPPING_TYPE[chartKey] ?? 'default';
};

export const resolveMappingComponent = (chartKey: string, adapterType?: string): Component => {
  const mappingType = resolveMappingType(chartKey, adapterType);
  return MAPPING_COMPONENTS[mappingType] ?? DefaultMapping;
};
