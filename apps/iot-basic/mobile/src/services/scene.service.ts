import { SceneRepositoryImpl } from '../data/repositories/scene.repository.impl';
import type { ISceneRepository } from '../domain/interfaces/scene.repository';
import type { SceneEntity, SceneLogEntity } from '../domain/entities/scene.entity';
import type { SceneTrigger } from '../domain/models/scene-trigger.model';
import type { SceneAction } from '../domain/models/scene-action.model';
import type { PageResult } from '../domain/models/page-state.model';

export class SceneService {
  constructor(private readonly sceneRepo: ISceneRepository = new SceneRepositoryImpl()) {}

  async getList(page: number, size: number, status?: number): Promise<PageResult<SceneEntity>> {
    return this.sceneRepo.getList({ page, size, status });
  }

  async getDetail(id: string): Promise<SceneEntity> {
    return this.sceneRepo.getOne(id);
  }

  async create(data: Partial<SceneEntity>): Promise<string> {
    return this.sceneRepo.create(data);
  }

  async update(data: Partial<SceneEntity>): Promise<void> {
    return this.sceneRepo.update(data);
  }

  async delete(id: string): Promise<void> {
    return this.sceneRepo.delete(id);
  }

  async manualTrigger(id: string): Promise<void> {
    return this.sceneRepo.manualTrigger(id);
  }

  async updateStatus(id: string, status: number): Promise<void> {
    return this.sceneRepo.updateStatus(id, status);
  }

  async getLogList(sceneID: string, page: number, size: number): Promise<PageResult<SceneLogEntity>> {
    return this.sceneRepo.getLogList({ page, size, sceneID });
  }

  validateScene(data: Partial<SceneEntity>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || !data.name.trim()) {
      errors.push('场景名称不能为空');
    }

    if (data.deviceMode === 'single') {
      if (!data.productID) {
        errors.push('单设备模式下必须选择产品');
      }
      if (!data.deviceName) {
        errors.push('单设备模式下必须选择设备');
      }
    }

    if (data.type === 'auto') {
      if (!data.triggers || data.triggers.length === 0) {
        errors.push('自动化场景必须设置至少一个触发条件');
      }
    }

    if (!data.actions || data.actions.length === 0) {
      errors.push('必须设置至少一个执行动作');
    }

    // 多设备模式下，设备类动作必须指定 productID+deviceName
    if (data.deviceMode !== 'single' && data.actions) {
      const invalidIdx = data.actions.findIndex(
        (a) => a.type === 'device' && a.device && (!a.device.productID || !a.device.deviceName),
      );
      if (invalidIdx >= 0) {
        errors.push(`第 ${invalidIdx + 1} 个设备动作未选择产品或设备`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const sceneService = new SceneService();
