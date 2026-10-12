/**
 * SpeakerEmbedding 实体
 * 声纹特征向量，用于声纹识别匹配
 */
export interface SpeakerEmbeddingEntity {
  /** 声纹 ID */
  id: number;
  /** 租户编码 */
  tenantCode: string;
  /** 所属 Clone 组 ID */
  cloneGroupID: number;
  /** 说话人名称 */
  speakerName: string;
  /** 声纹特征向量（JSON 数组，192 维 float32） */
  embedding: string;
  /** 原始音频存储路径 */
  audioPath: string;
  /** 个性化提示词 */
  personaPrompt: string;
  /** 状态 1-启用 2-禁用 */
  status: number;
  /** 创建时间（Unix 秒） */
  createdTime: number;
  /** 更新时间（Unix 秒） */
  updatedTime: number;
}

/**
 * 创建空的 SpeakerEmbedding 实体
 */
export function createEmptySpeakerEmbedding(): SpeakerEmbeddingEntity {
  return {
    id: 0,
    tenantCode: '',
    cloneGroupID: 0,
    speakerName: '',
    embedding: '',
    audioPath: '',
    personaPrompt: '',
    status: 1,
    createdTime: 0,
    updatedTime: 0,
  };
}
