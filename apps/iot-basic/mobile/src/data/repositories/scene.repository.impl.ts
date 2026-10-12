import { request } from '../../utils/request';
import type { ISceneRepository } from '../../domain/interfaces/scene.repository';
import type { SceneEntity, SceneLogEntity } from '../../domain/entities/scene.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { SceneMapper } from '../mappers/scene.mapper';

/** 场景信息接口当前正式前缀，后端已将 rule/scene/info 标记为弃用。 */
const SCENE_INFO_API = '/api/v1/things/scene/info';
/** 场景执行日志接口当前正式前缀。 */
const SCENE_LOG_API = '/api/v1/things/scene/log';

export class SceneRepositoryImpl implements ISceneRepository {
  async getList(params: PageParams & { status?: number }): Promise<PageResult<SceneEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: `${SCENE_INFO_API}/get-list`,
      data: {
        page: { page: params.page, size: params.size },
        status: params.status,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(SceneMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getOne(id: string): Promise<SceneEntity> {
    const resp = await request<Record<string, unknown>>({
      url: `${SCENE_INFO_API}/get-one`,
      data: { id },
    });
    return SceneMapper.toEntity(resp);
  }

  async create(data: Partial<SceneEntity>): Promise<string> {
    const dto = SceneMapper.toDTO(data);
    const resp = await request<Record<string, unknown>>({
      url: `${SCENE_INFO_API}/create`,
      data: dto,
    });
    return String(resp.id || '');
  }

  async update(data: Partial<SceneEntity>): Promise<void> {
    const dto = SceneMapper.toDTO(data);
    await request({ url: `${SCENE_INFO_API}/update`, data: dto });
  }

  async delete(id: string): Promise<void> {
    await request({ url: `${SCENE_INFO_API}/delete`, data: { id } });
  }

  async manualTrigger(id: string): Promise<void> {
    await request({ url: `${SCENE_INFO_API}/manually-trigger`, data: { id } });
  }

  async updateStatus(id: string, status: number): Promise<void> {
    await request({
      url: `${SCENE_INFO_API}/update`,
      data: { id, status },
    });
  }

  async getLogList(params: PageParams & { sceneID: string }): Promise<PageResult<SceneLogEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: `${SCENE_LOG_API}/get-list`,
      data: {
        page: { page: params.page, size: params.size },
        sceneID: params.sceneID,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(SceneMapper.toLogEntity);
    return { list, total: Number(resp.total || 0) };
  }
}
