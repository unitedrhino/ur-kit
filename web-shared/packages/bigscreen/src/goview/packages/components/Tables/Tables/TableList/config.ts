import type { CreateComponentType } from '@/packages/index.type'

import { createBorderContainerOption } from '@/packages/components/Charts/shared/decoratedChartOptions'
import { PublicConfigClass } from '@/packages/public'
import cloneDeep from 'lodash/cloneDeep'

import dataJson from './data.json'
import { TableListConfig } from './index'

export const option = {
  dataset: dataJson,
  rowNum: 5,
  waitTime: 2,
  unit: '',
  autoUnit: '',
  displayDecimals: 0,
  sort: true,
  containerType: 'none',
  borderKey: 'Border01',
  borderOption: createBorderContainerOption('Border01'),
  padding: 16,
  color: '#1370fb',
  textColor: '#CDD2F8FF',
  borderColor: '#1370fb80',
  carousel: 'single',
  indexFontSize: 12,
  leftFontSize: 12,
  rightFontSize: 12,
  valueFormatter(item: { value: any }, options?: { displayDecimals?: number }) {
    const digits = Math.max(0, Number(options?.displayDecimals ?? 0));
    const value = Number(item.value ?? 0);
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : item.value;
  },
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = TableListConfig.key
  public chartConfig = cloneDeep(TableListConfig)
  public option = cloneDeep(option)
}
