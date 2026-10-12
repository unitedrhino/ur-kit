import cloneDeep from 'lodash/cloneDeep';

import type { CreateComponentType } from '@/packages/index.type';
import { PublicConfigClass, echartOptionProfixHandle } from '@/packages/public';

import { DialConfig } from './index';

export const includes = [];

const option = {
  backgroundColor: '#0E1327',
  dataset: 70,
  unit: '',
  displayDecimals: 2,
  autoScale: false,
  series: [
    {
      type: 'gauge',
      data: [
        {
          value: 70,
          itemStyle: {
            color: '#2AF4FF',
          },
        },
      ],
      min: 0,
      max: 100,
      splitNumber: 10,
      center: ['50%', '55%'],
      radius: '80%',
      axisLine: {
        lineStyle: {
          color: [
            [0, 'rgba(0,212,230,0.5)'],
            [1, 'rgba(28,128,245,0)'],
          ],
          width: 170,
        },
      },
      axisLabel: {
        color: '#eee',
        fontSize: 14,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      detail: {
        show: false,
        color: '#2AF4FF',
        fontSize: 24,
        formatter: '',
      },
      pointer: {
        length: '80%',
        width: 4,
      },
      animationDuration: 2000,
    },
    {
      name: '外部刻度',
      type: 'gauge',
      min: 0,
      max: 100,
      splitNumber: 10,
      center: ['50%', '55%'],
      radius: '90%',
      axisLine: {
        show: true,
        lineStyle: {
          width: 25,
          color: [
            [0, '#1369E380'],
            [1, '#1369E380'],
          ],
        },
      },
      axisLabel: {
        show: false,
      },
      axisTick: {
        splitNumber: 5,
        lineStyle: {
          color: '#42E5FB',
          width: 2,
        },
      },
      splitLine: {
        length: 15,
        lineStyle: {
          color: '#42E5FB',
        },
      },
    },
  ],
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key: string = DialConfig.key;
  public chartConfig = cloneDeep(DialConfig);
  public option = echartOptionProfixHandle(option, includes);
}
