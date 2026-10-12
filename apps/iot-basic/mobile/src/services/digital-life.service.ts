/**
 * 数字生命管理服务
 * 处理 CloneGroup、Clone、SpeakerEmbedding 相关的业务逻辑
 */

import type { CloneEntity } from '../domain/entities/clone.entity';
import type { CloneGroupEntity } from '../domain/entities/clone-group.entity';
import type { SpeakerEmbeddingEntity } from '../domain/entities/speaker-embedding.entity';
import type { ICloneGroupRepository } from '../domain/interfaces/clone-group.repository';
import type { ICloneRepository } from '../domain/interfaces/clone.repository';
import type { ISpeakerEmbeddingRepository } from '../domain/interfaces/speaker-embedding.repository';
import { CloneGroupRepositoryImpl } from '../data/repositories/clone-group.repository.impl';
import { CloneRepositoryImpl } from '../data/repositories/clone.repository.impl';
import { SpeakerEmbeddingRepositoryImpl } from '../data/repositories/speaker-embedding.repository.impl';

/**
 * 数字生命管理服务
 */
export class DigitalLifeService {
  constructor(
    private readonly cloneGroupRepo: ICloneGroupRepository = new CloneGroupRepositoryImpl(),
    private readonly cloneRepo: ICloneRepository = new CloneRepositoryImpl(),
    private readonly speakerRepo: ISpeakerEmbeddingRepository = new SpeakerEmbeddingRepositoryImpl(),
  ) {}

  /**
   * 根据项目 ID 获取 CloneGroup
   * @param projectID 项目 ID
   * @returns CloneGroup 或 null
   */
  async getCloneGroupByProjectID(projectID: number): Promise<CloneGroupEntity | null> {
    if (!projectID) return null;

    const result = await this.cloneGroupRepo.getList({
      thirdID: String(projectID),
      status: 1,
    });

    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * 获取 Clone 列表
   * @param cloneGroupID Clone 组 ID
   */
  async getClones(cloneGroupID: number): Promise<CloneEntity[]> {
    if (!cloneGroupID) return [];

    const result = await this.cloneRepo.getList({
      cloneGroupID,
      status: 1,
    });
    return result.list;
  }

  /**
   * 获取声纹列表
   * @param cloneGroupID Clone 组 ID
   */
  async getSpeakers(cloneGroupID: number): Promise<SpeakerEmbeddingEntity[]> {
    if (!cloneGroupID) return [];

    const result = await this.speakerRepo.getList(cloneGroupID, 1);
    return result.list;
  }

  /**
   * 提取声纹特征
   * @param audioBase64 Base64 编码的音频数据
   * @returns 声纹特征向量
   */
  async extractEmbedding(audioBase64: string): Promise<number[]> {
    if (!audioBase64) {
      throw new Error('音频数据不能为空');
    }
    return this.speakerRepo.extractEmbedding(audioBase64, 16000);
  }

  /**
   * 创建声纹记录
   * @param cloneGroupID Clone 组 ID
   * @param speakerName 说话人名称
   * @param audioBase64 Base64 编码的音频数据
   * @returns 创建的声纹 ID
   */
  async createSpeaker(
    cloneGroupID: number,
    speakerName: string,
    audioBase64: string,
  ): Promise<number> {
    // 参数校验
    if (!cloneGroupID) {
      throw new Error('CloneGroupID 不能为空');
    }
    if (!speakerName.trim()) {
      throw new Error('说话人名称不能为空');
    }
    if (!audioBase64) {
      throw new Error('音频数据不能为空');
    }

    // 1. 提取声纹特征
    const embedding = await this.extractEmbedding(audioBase64);

    if (!embedding || embedding.length === 0) {
      throw new Error('声纹特征提取失败');
    }

    // 2. 保存声纹记录
    const id = await this.speakerRepo.create({
      cloneGroupID,
      speakerName: speakerName.trim(),
      embedding: JSON.stringify(embedding),
      status: 1,
    });

    return id;
  }

  /**
   * 删除声纹记录
   * @param id 声纹 ID
   */
  async deleteSpeaker(id: number): Promise<void> {
    if (!id) {
      throw new Error('声纹 ID 不能为空');
    }
    await this.speakerRepo.delete(id);
  }
}

/**
 * 创建 DigitalLifeService 实例
 */
export function createDigitalLifeService(): DigitalLifeService {
  return new DigitalLifeService();
}
