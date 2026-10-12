/**
 * CloneGroup 实体
 * Clone 组，绑定到 AgentGroup，包含 TTS 配置和声纹组
 */
export interface CloneGroupEntity {
  /** Clone 组 ID */
  id: number;
  /** 租户编码 */
  tenantCode: string;
  /** 关联 AgentGroup ID */
  agentGroupID: number;
  /** 第三方业务ID（如 projectID） */
  thirdID: string;
  /** Clone 组编码 */
  code: string;
  /** Clone 组名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 组级 TTS 配置 ID */
  ttsConfigID: string;
  /** 是否默认组 1-是 2-否 */
  isDefault: number;
  /** 状态 1-启用 2-禁用 */
  status: number;
  /** 创建时间（Unix 秒） */
  createdTime: number;
  /** 更新时间（Unix 秒） */
  updatedTime: number;
}

/**
 * 创建空的 CloneGroup 实体
 */
export function createEmptyCloneGroup(): CloneGroupEntity {
  return {
    id: 0,
    tenantCode: '',
    agentGroupID: 0,
    thirdID: '',
    code: '',
    name: '',
    description: '',
    ttsConfigID: '',
    isDefault: 2,
    status: 1,
    createdTime: 0,
    updatedTime: 0,
  };
}
