import cloneDeep from 'lodash/cloneDeep';

import type { CreateComponentType } from '@/packages/index.type';
import { PublicConfigClass } from '@/packages/public';
import { chartInitConfig } from '@/settings/designSetting';

import { ProcessConfig } from './index';

export const types = [
  { label: '线形', value: 'line' },
  { label: '圆形', value: 'circle' },
  { label: '仪表盘', value: 'dashboard' },
];

export const indicatorPlacements = [
  { label: '内部', value: 'inside' },
  { label: '外部', value: 'outside' },
];

export const option = {
  dataset: 36,
  percentMode: true,
  maxValue: 100,
  unit: '',
  autoUnit: '',
  unitAutoApplied: false,
  // shapes[2] 固定存在，兜底仅为满足 noUncheckedIndexedAccess（运行时不会命中）
  type: types[2]?.value ?? 'dashboard',
  processing: true,
  color: '#4992FFFF',
  railColor: '#3e3e3f',
  displayDecimals: 2,
  indicatorTextSize: 34,
  indicatorPlacement: 'outside',
  indicatorTextColor: '#FFFFFFFF',
  offsetDegree: 0,
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = ProcessConfig.key;
  public override attr = { ...chartInitConfig, h: 500, zIndex: -1 };
  public chartConfig = cloneDeep(ProcessConfig);
  // _simplifiedData 运行时由 encapsulate 注入到 option 上（IoT 映射元数据），静态声明以满足结构化消费
  public option: typeof option & {
    _simplifiedData?: {
      mappings?: {
        value?: string;
        y?: string | string[];
      };
    };
  } = cloneDeep(option);
}
