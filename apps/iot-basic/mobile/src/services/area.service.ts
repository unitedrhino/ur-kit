/** 区域业务服务，透传项目层级与变更请求至正式仓储。 */
import { AreaRepositoryImpl } from '../data/repositories/area.repository.impl';
import type { IAreaRepository } from '../domain/interfaces/area.repository';
import type { AreaEntity } from '../domain/entities/area.entity';
import type { PageResult } from '../domain/models/page-state.model';

export class AreaService {
  constructor(private readonly areaRepo: IAreaRepository = new AreaRepositoryImpl()) {}

  /** getList 按项目、父级与名称读取分页区域。 */
  async getList(projectID: string, page: number, size: number, areaName?: string, parentAreaID?: string): Promise<PageResult<AreaEntity>> {
    return this.areaRepo.getList({ page, size, projectID, areaName, parentAreaID });
  }

  /** canManage 验证当前用户是否能变更区域。 */
  async canManage(projectID: string, userID: string): Promise<boolean> { return this.areaRepo.canManage(projectID, userID); }

  async getOne(areaID: string): Promise<AreaEntity> {
    return this.areaRepo.getOne(areaID);
  }

  /** create 在目标项目及父级下新建区域，返回字符串区域ID。 */
  async create(data: { projectID: string; parentAreaID?: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    return this.areaRepo.create(data);
  }

  /** update 更新区域名称或图标，保留页面未编辑的后端资料。 */
  async update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    return this.areaRepo.update(data);
  }

  async delete(areaID: string): Promise<void> {
    return this.areaRepo.delete(areaID);
  }
}

export const areaService = new AreaService();
