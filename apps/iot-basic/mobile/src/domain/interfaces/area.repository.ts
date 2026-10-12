import type { AreaEntity } from '../entities/area.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IAreaRepository {
  getList(params: PageParams & { projectID: string; areaName?: string }): Promise<PageResult<AreaEntity>>;
  getOne(areaID: string): Promise<AreaEntity>;
  create(data: { projectID: string; areaName: string; areaImg?: string; desc?: string }): Promise<string>;
  update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void>;
  delete(areaID: string): Promise<void>;
}
