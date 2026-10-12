import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { EmbedPageConfig } from './index'
import type { GltfNodeInfo, NodeBinding } from '@/packages/components/Decorates/Three/GlTFModel/types'
import cloneDeep from 'lodash/cloneDeep'

/**
 * 内嵌页面组件配置
 *
 * option 字段说明：
 * - url：场景页地址（用户自研的完整 3D 场景单页，iframe sandbox="allow-scripts" 嵌入）
 * - parsedNodes：场景页上报锚点（ur-scene:anchors）的快照，结构与 GlTFModel 一致，
 *   右侧节点绑定面板据此还原点位树（type 固定记为 Anchor，uuid 恒为空串）
 * - selectedNodePath：编辑态当前选中锚点路径（绑定面板树与场景页高亮联动，发布端忽略）
 * - nodeBindings：锚点位数据绑定表（设备物模型属性，结构复用 GlTFModel 的 NodeBinding）
 * - nodeDescs：锚点业务描述表（path → 描述，场景页 anchors.desc 首次上报时回写）
 */
export const option = {
  url: '',
  parsedNodes: [] as GltfNodeInfo[],
  selectedNodePath: '',
  nodeBindings: [] as NodeBinding[],
  /** 锚点业务描述表：path → 描述，与 GlTFModel 的 nodeDescs 语义一致 */
  nodeDescs: {} as Record<string, string>,
  /** 数据面板左栏宽度（px） */
  panelTreeWidth: 168
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = EmbedPageConfig.key
  public override attr = { ...chartInitConfig, w: 800, h: 600, zIndex: -1 }
  public chartConfig = cloneDeep(EmbedPageConfig)
  public option = cloneDeep(option)
}
