import type { CreateComponentGroupType } from '@/packages/index.type'
import { ChartFrameEnum } from '@/packages/index.type'
import { PublicGroupConfigClass } from '@/packages/public/publicConfig'
import { borderDefaultOptions, defaultTitleConfig } from '../../../Decorates/BorderCharts/borderConstants'

export default class BorderContainerConfig extends PublicGroupConfigClass implements CreateComponentGroupType {
  public override attr = { w: 400, h: 300, x: 0, y: 0, offsetX: 0, offsetY: 0, zIndex: -1 }
  public override chartConfig = {
    key: 'BorderContainer',
    chartKey: 'group',
    conKey: 'VEnhancedGroupConfig',
    category: 'Container',
    categoryName: '容器/排版',
    package: 'Presets',
    chartFrame: ChartFrameEnum.COMMON,
    title: '空白边框容器',
    image: 'border01.png',
  }
  public override key = 'BorderContainer'
  public override groupList: CreateComponentGroupType['groupList'] = []
  public override option = {
    containerType: 'border' as const,
    borderKey: 'Border01',
    borderOption: {
      // Border01 工厂固定存在，?. 仅为满足索引类型（noUncheckedIndexedAccess）
      ...(borderDefaultOptions['Border01']?.() ?? {}),
      borderTitle: { ...defaultTitleConfig },
    },
    padding: 16,
    designWidth: 400,
    designHeight: 300,
  }
}
