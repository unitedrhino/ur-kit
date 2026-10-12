import type { SpeakerEmbeddingEntity } from '../entities/speaker-embedding.entity';

/**
 * SpeakerEmbedding 仓储接口
 */
export interface ISpeakerEmbeddingRepository {
  /**
   * 获取声纹列表
   * @param cloneGroupID Clone 组 ID
   * @param status 状态过滤
   */
  getList(cloneGroupID: number, status?: number): Promise<SpeakerEmbeddingListResult>;

  /**
   * 创建声纹记录
   * @param data 声纹数据
   */
  create(data: CreateSpeakerEmbeddingParams): Promise<number>;

  /**
   * 删除声纹记录
   * @param id 声纹 ID
   */
  delete(id: number): Promise<void>;

  /**
   * 提取声纹特征
   * @param audioBase64 Base64 编码的音频数据
   * @param sampleRate 采样率
   */
  extractEmbedding(audioBase64: string, sampleRate?: number): Promise<number[]>;
}

/**
 * 声纹列表结果
 */
export interface SpeakerEmbeddingListResult {
  list: SpeakerEmbeddingEntity[];
  total: number;
}

/**
 * 创建声纹参数
 */
export interface CreateSpeakerEmbeddingParams {
  /** 所属 Clone 组 ID */
  cloneGroupID: number;
  /** 说话人名称 */
  speakerName: string;
  /** 声纹特征向量（JSON 字符串） */
  embedding: string;
  /** 个性化提示词 */
  personaPrompt?: string;
  /** 状态 */
  status?: number;
}
