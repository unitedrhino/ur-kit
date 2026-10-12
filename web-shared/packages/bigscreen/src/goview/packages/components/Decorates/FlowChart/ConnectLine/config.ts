import type { CreateComponentType } from '@/packages/index.type';

import type { ConnectLinePathType } from './path';

import { PublicConfigClass } from '@/packages/public';
import cloneDeep from 'lodash/cloneDeep';

import { ConnectLineConfig } from './index';

export const option = {
  name: '',
  // 显式收窄为连接线路径类型，避免字面量拓宽成 string 后传参报错
  pathType: 'elbow' as ConnectLinePathType,
  points: [
    { x: 24, y: 60 },
    { x: 336, y: 60 },
  ],
  startPoint: { x: 24, y: 60 },
  endPoint: { x: 336, y: 60 },
  startAnchor: 'left',
  endAnchor: 'right',
  bendRatio: 0.5,
  cornerRadius: 80,
  lineWidth: 2,
  baseColor: '#4B5563',
  effectColor: '#3B82F6',
  selectedColor: '#60A5FA',
  dashLength: 18,
  gapLength: 72,
  arrow: 'none',
  arrowStyle: 'triangle',
  arrowSize: 10,
  startArrowColor: '#3B82F6',
  endArrowColor: '#3B82F6',
  pointRadius: 0,
  pointColor: '#3B82F6',
  animate: true,
  autoPlay: true,
  direction: 'forward',
  duration: 3,
  playCount: 'infinite',
  glow: false,
  glowColor: '#3B82F6',
  glowBlur: 6,
  shadow: false,
  shadowColor: '#111827',
  shadowBlur: 4,
  showLabel: false,
  labelText: '',
  labelColor: '#E5E7EB',
  labelBgColor: 'transparent',
  disabled: false,
  disabledColor: '#6B7280',
  disabledBgColor: '#111827',
  disabledTextColor: '#9CA3AF',
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  public override attr = {
    x: 0,
    y: 0,
    w: 360,
    h: 120,
    offsetX: 0,
    offsetY: 0,
    zIndex: -1,
  };
  public chartConfig = cloneDeep(ConnectLineConfig);
  public key = ConnectLineConfig.key;
  public option = cloneDeep(option);
}
