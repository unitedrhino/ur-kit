import { AreaRepositoryImpl } from '../data/repositories/area.repository.impl';
import type { IAreaRepository } from '../domain/interfaces/area.repository';
import type { AreaEntity } from '../domain/entities/area.entity';
import type { PageResult } from '../domain/models/page-state.model';

export class AreaService {
  constructor(private readonly areaRepo: IAreaRepository = new AreaRepositoryImpl()) {}

  async getList(projectID: string, page: number, size: number, areaName?: string): Promise<PageResult<AreaEntity>> {
    return this.areaRepo.getList({ page, size, projectID, areaName });
  }

  async getOne(areaID: string): Promise<AreaEntity> {
    return this.areaRepo.getOne(areaID);
  }

  async create(data: { projectID: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    return this.areaRepo.create(data);
  }

  async update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    return this.areaRepo.update(data);
  }

  async delete(areaID: string): Promise<void> {
    return this.areaRepo.delete(areaID);
  }
}

export const areaService = new AreaService();
