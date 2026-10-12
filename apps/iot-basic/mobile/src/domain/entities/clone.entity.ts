/**
 * Clone 实体
 * 数字分身 / 智能体实例，绑定到 Agent 并属于某个 CloneGroup
 */
export interface CloneEntity {
  /** 分身 ID */
  id: number;
  /** 租户编码 */
  tenantCode: string;
  /** 关联 Agent ID */
  agentID: number;
  /** 所属 CloneGroup ID */
  cloneGroupID: number;
  /** 分身编码 */
  code: string;
  /** 分身名称 */
  name: string;
  /** 描述 */
  desc: string;
  /** 人设补充提示词 */
  personaPrompt: string;
  /** 扩展元数据（JSON 字符串） */
  metadata: string;
  /** 状态 1-启用 2-禁用 */
  status: number;
  /** 创建时间（Unix 秒） */
  createdTime: number;
  /** 更新时间（Unix 秒） */
  updatedTime: number;
}

/**
 * 创建空的 Clone 实体
 */
export function createEmptyClone(): CloneEntity {
  return {
    id: 0,
    tenantCode: '',
    agentID: 0,
    cloneGroupID: 0,
    code: '',
    name: '',
    desc: '',
    personaPrompt: '',
    metadata: '',
    status: 1,
    createdTime: 0,
    updatedTime: 0,
  };
}
