/**
 * 3D 模型组件（GLTF/GLB）类型定义
 *
 * 定义模型解析节点快照、节点级数据绑定与触发动作的数据结构。
 * 绑定配置存入大屏 JSON（chartConfig.option.nodeBindings），随大屏持久化。
 */

/** GLTF 模型解析出的节点信息快照（用于节点树展示与跨会话目标匹配） */
export interface GltfNodeInfo {
  /** three Object3D uuid（仅当前加载会话内稳定） */
  uuid: string
  /** 节点名称（未命名节点记为 (unnamed)） */
  name: string
  /** 层级路径，格式 `Scene/父名/子名`（模型重导出后仍相对稳定，作为跨会话匹配主键） */
  path: string
  /** three 对象类型（Mesh/Group 等） */
  type: string
}

/** 颜色规则：按枚举值或数值区间映射颜色（按序匹配，命中即用） */
export interface BindingColorRule {
  /** 匹配模式：enum=字符串值精确匹配；range=数值区间（含边界） */
  mode: 'enum' | 'range'
  /** mode=enum 时匹配的字符串值 */
  enumValue?: string
  /** mode=range 时区间下界（含） */
  min?: number
  /** mode=range 时区间上界（含） */
  max?: number
  /** 命中后的颜色（hex，如 #ff4d4f） */
  color: string
}

/** 节点绑定动作：实时属性值驱动节点的视觉反馈方式 */
export interface BindingAction {
  /** 动作类型：color=按规则变色；visible=按规则显隐；label=节点上方数值标签；motion=属性值驱动位姿 */
  type: 'color' | 'visible' | 'label' | 'motion'
  /** color 动作的映射规则列表 */
  colorRules?: BindingColorRule[]
  /** color 动作：无值/未命中时使用的颜色（空表示保持原色） */
  defaultColor?: string
  /** visible 动作判定模式：bool=字符串值集合；threshold=数值下界 */
  visibleMode?: 'bool' | 'threshold'
  /** visible bool 模式：命中集合视为显示，否则隐藏 */
  visibleTrueValues?: string[]
  /** visible threshold 模式：值 ≥ visibleMin 显示，否则隐藏 */
  visibleMin?: number
  /** label 动作：标签前缀（缺省用属性名） */
  labelText?: string
  /** motion 动作：驱动轴——px/py/pz=沿 X/Y/Z 位移（单位米×factor）；rx/ry/rz=绕 X/Y/Z 旋转（单位度×factor） */
  axis?: 'px' | 'py' | 'pz' | 'rx' | 'ry' | 'rz'
  /** motion 动作：系数，属性值 × 系数 = 位移(米) 或 旋转角度(度) */
  factor?: number
}

/** 单个模型节点的数据绑定：设备物模型属性 + 触发动作（节点级，支持跨产品/跨设备） */
export interface NodeBinding {
  /** three Object3D uuid（同会话精确匹配） */
  nodeID: string
  /** 层级路径（模型重载后降级匹配主键） */
  nodePath: string
  /** 节点名冗余存储（兜底匹配与展示） */
  nodeName: string
  /** 产品 ID */
  productID: string
  /** 产品名冗余（展示用） */
  productName?: string
  /** 设备名 */
  deviceName: string
  /** 物模型属性标识符 */
  dataID: string
  /** 属性名冗余（展示用） */
  dataName?: string
  /** 属性单位（标签展示用） */
  dataUnit?: string
  /** 触发动作 */
  action: BindingAction
}

/** 绑定与实时值的配对（数据链路把消息匹配到绑定后交给渲染端应用） */
export interface BindingValue {
  binding: NodeBinding
  /** 属性最新值（原始类型，可能是 number/string/boolean） */
  value: unknown
}
