import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { GlTFModelConfig } from './index'
import type { GltfNodeInfo, NodeBinding } from './types'
import cloneDeep from 'lodash/cloneDeep'

/**
 * 3D 模型组件配置
 *
 * option 字段说明：
 * - modelUrl：GLB 模型文件地址（core 通用上传接口返回的 fileUri 或手动外链）
 * - modelAssetId/modelAssetName：登记到 view 资产库后的资源信息（用于资产库回显）
 * - parsedNodes：模型解析节点快照（加载成功后回写，右侧节点树据此还原树形）
 * - selectedNodePath：编辑态当前选中节点路径（画布拾取与右侧树面板联动，发布端忽略）
 * - autoRotate/bgTransparent：场景展示选项
 * - nodeBindings：节点级数据绑定表（设备物模型属性 → 触发动作）
 */
export const option = {
  modelUrl: '',
  modelAssetId: undefined as undefined | string,
  modelAssetName: undefined as undefined | string,
  parsedNodes: [] as GltfNodeInfo[],
  selectedNodePath: '',
  autoRotate: false,
  bgTransparent: true,
  nodeBindings: [] as NodeBinding[],
  /** 节点业务描述表：path → 描述（如 "J1 底座回转"），用户在数据面板编辑后持久化 */
  nodeDescs: {} as Record<string, string>,
  /** 保存的视角（相机位置与观察目标），发布端按此展示模型默认位置 */
  cameraState: undefined as undefined | { camera: number[]; target: number[] },
  /** 数据面板左栏宽度（px） */
  panelTreeWidth: 168,
  /** 保存视角请求标记（时间戳），canvas 监听后把当前视角写入 cameraState */
  saveViewToken: 0,
  /** 进入全屏视角调整模式请求标记（时间戳），canvas 监听后切全屏交互 */
  viewEditToken: 0
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = GlTFModelConfig.key
  public override attr = { ...chartInitConfig, w: 600, h: 400, zIndex: -1 }
  public chartConfig = cloneDeep(GlTFModelConfig)
  public option = cloneDeep(option)
}
