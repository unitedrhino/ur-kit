/**
 * SpeakerEmbedding 仓储实现
 */

import { request } from '../../utils/request';
import type { SpeakerEmbeddingEntity } from '../../domain/entities/speaker-embedding.entity';
import type {
  ISpeakerEmbeddingRepository,
  SpeakerEmbeddingListResult,
  CreateSpeakerEmbeddingParams,
} from '../../domain/interfaces/speaker-embedding.repository';

/** SPEAKER_SERVICE_DISABLED_CODE 表示后端声纹模型未启用时返回的系统错误码。 */
const SPEAKER_SERVICE_DISABLED_CODE = 100007;
/** SPEAKER_SERVICE_DISABLED_MESSAGE 用于精确识别声纹模型缺失的可预期配置分支。 */
const SPEAKER_SERVICE_DISABLED_MESSAGE = '声纹识别服务未启用，请检查模型配置';

/**
 * DTO 转实体
 */
function toEntity(dto: Record<string, unknown>): SpeakerEmbeddingEntity {
  return {
    id: Number(dto.id || 0),
    tenantCode: String(dto.tenantCode || ''),
    cloneGroupID: Number(dto.cloneGroupID || 0),
    speakerName: String(dto.speakerName || ''),
    embedding: String(dto.embedding || ''),
    audioPath: String(dto.audioPath || ''),
    personaPrompt: String(dto.personaPrompt || ''),
    status: Number(dto.status || 1),
    createdTime: Number(dto.createdTime || 0),
    updatedTime: Number(dto.updatedTime || 0),
  };
}

/**
 * SpeakerEmbedding 仓储实现
 */
export class SpeakerEmbeddingRepositoryImpl implements ISpeakerEmbeddingRepository {
  async getList(
    cloneGroupID: number,
    status?: number,
  ): Promise<SpeakerEmbeddingListResult> {
    const data: Record<string, unknown> = {
      cloneGroupID,
    };

    if (status !== undefined) {
      data.status = status;
    }

    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/speaker/embedding/get-list',
      data,
    });

    const list = ((resp.list || []) as Record<string, unknown>[]).map(toEntity);
    return {
      list,
      total: Number(resp.total || 0),
    };
  }

  async create(params: CreateSpeakerEmbeddingParams): Promise<number> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/speaker/embedding/create',
      data: {
        cloneGroupID: params.cloneGroupID,
        speakerName: params.speakerName,
        embedding: params.embedding,
        personaPrompt: params.personaPrompt || '',
        status: params.status || 1,
      },
    });

    return Number(resp.id || 0);
  }

  async delete(id: number): Promise<void> {
    await request({
      url: '/api/v1/ai/speaker/embedding/delete',
      data: { id },
    });
  }

  async extractEmbedding(
    audioBase64: string,
    sampleRate = 16000,
  ): Promise<number[]> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/ai/speaker/embedding/extract',
      data: {
        audioBase64,
        sampleRate,
      },
      expectedApiErrors: [
        {
          code: SPEAKER_SERVICE_DISABLED_CODE,
          message: SPEAKER_SERVICE_DISABLED_MESSAGE,
        },
      ],
    });

    return (resp.embedding || []) as number[];
  }
}
