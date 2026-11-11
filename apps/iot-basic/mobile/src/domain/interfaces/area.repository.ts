/** 区域仓储合同，支持父级筛选和当前账号管理资格核验。 */
import type { AreaEntity } from '../entities/area.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IAreaRepository {
  /** canManage 核验项目负责人或本人的项目管理授权。 */
  canManage(projectID: string, userID: string): Promise<boolean>;
  getList(params: PageParams & { projectID: string; areaName?: string; parentAreaID?: string }): Promise<PageResult<AreaEntity>>;
  getOne(areaID: string): Promise<AreaEntity>;
  create(data: { projectID: string; parentAreaID?: string; areaName: string; areaImg?: string; desc?: string }): Promise<string>;
  update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void>;
  delete(areaID: string): Promise<void>;
}
