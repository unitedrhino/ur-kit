import type { SceneEntity, SceneLogEntity } from '../entities/scene.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface ISceneRepository {
  getList(params: PageParams & { status?: number }): Promise<PageResult<SceneEntity>>;
  getOne(id: string): Promise<SceneEntity>;
  create(data: Partial<SceneEntity>): Promise<string>;
  update(data: Partial<SceneEntity>): Promise<void>;
  delete(id: string): Promise<void>;
  manualTrigger(id: string): Promise<void>;
  updateStatus(id: string, status: number): Promise<void>;
  getLogList(params: PageParams & { sceneID: string }): Promise<PageResult<SceneLogEntity>>;
}
