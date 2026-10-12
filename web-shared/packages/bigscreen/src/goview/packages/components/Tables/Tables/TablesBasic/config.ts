import type { CreateComponentType } from '@/packages/index.type'

import { createBorderContainerOption } from '@/packages/components/Charts/shared/decoratedChartOptions'
import { PublicConfigClass } from '@/packages/public'
import { chartInitConfig } from '@/settings/designSetting'
import cloneDeep from 'lodash/cloneDeep'

import dataJson from './data.json'
import { TablesBasicConfig } from './index'

const { dimensions, source } = dataJson

export const option = {
  dataset: { dimensions, source },
  pagination: {
    page: 1,
    pageSize: 5,
  },
  containerType: 'none',
  borderKey: 'Border01',
  borderOption: createBorderContainerOption('Border01'),
  padding: 16,
  align: 'center',
  displayDecimals: 0,
  style: {
    border: 'on',
    singleColumn: 'off',
    singleLine: 'off',
    bottomBordered: 'on',
    striped: 'on',
    fontSize: 16,
    borderWidth: 0,
    borderColor: 'black',
    borderStyle: 'solid',
  },
  inputShow: 'none',
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = TablesBasicConfig.key
  public override attr = { ...chartInitConfig, w: 600, h: 300, zIndex: -1 }
  public chartConfig = cloneDeep(TablesBasicConfig)
  public option = cloneDeep(option)
}
