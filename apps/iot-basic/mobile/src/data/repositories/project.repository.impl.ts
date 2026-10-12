/** 客户端项目仓储：列表只展示本人负责或明确加入的项目，不继承管理端全量视图。 */
import { request } from '../../utils/request';
import type { IProjectRepository, ProjectCreateData, ProjectUpdateData } from '../../domain/interfaces/project.repository';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { ProjectMapper } from '../mappers/project.mapper';

export class ProjectRepositoryImpl implements IProjectRepository {
  /** visibleProjectIDs 分页取得本人负责和直接授权的项目；任何查询失败均不回退全量。 */
  private async visibleProjectIDs(): Promise<string[]> {
    const user = await request<{ userID: string }>({ url: '/api/v1/system/user/self/get-one', data: {} });
    if (!user.userID || String(user.userID) === '0') throw new Error('请重新登录');
    const userID = String(user.userID);
    const ids = new Set<string>();
    // 两类来源各自分页，最终交由项目接口应用名称、状态和分页，避免过滤后总数错误。
    for (const owned of [true, false]) {
      for (let page = 1; ; page++) {
        if (page > 200) throw new Error('项目数量较多，请联系管理员');
        const result = await request<{ total: number; list: Array<{ projectID: string; adminUserID?: string; targetID?: string; authType?: number }> }>({
          url: owned ? '/api/v1/things/project/info/get-list' : '/api/v1/things/data/project/get-list',
          omitProjectContext: true,
          data: { ...(owned ? { adminUserID: userID } : { targetType: 'user', targetID: userID }), page: { page, size: 100 } },
        });
        const items = result.list ?? [];
        for (const item of items) {
          const belongs = owned ? String(item.adminUserID) === userID
            : String(item.targetID) === userID && [1, 2, 3, 4].includes(Number(item.authType));
          if (belongs && item.projectID && String(item.projectID) !== '0') ids.add(String(item.projectID));
        }
        if (!items.length || page * 100 >= Number(result.total)) break;
      }
    }
    return [...ids];
  }

  /** getList 仅分页查询本人项目集合；空集合直接返回，禁止空过滤退回所有项目。 */
  async getList(params: PageParams & { projectName?: string; status?: number }): Promise<PageResult<ProjectEntity>> {
    const projectIDs = await this.visibleProjectIDs();
    if (!projectIDs.length) return { list: [], total: 0 };
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/project/info/get-list',
      omitProjectContext: true,
      data: {
        page: { page: params.page, size: params.size },
        projectName: params.projectName || undefined,
        status: params.status || undefined,
        projectIDs,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(ProjectMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getOne(projectID: string): Promise<ProjectEntity> {
    if (!(await this.visibleProjectIDs()).includes(projectID)) throw new Error('你尚未加入该项目');
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/project/info/get-one',
      data: { projectID },
    });
    return ProjectMapper.toEntity(resp);
  }

  async create(data: ProjectCreateData): Promise<string> {
    const payload: Record<string, unknown> = {
      projectName: data.projectName,
    };
    if (data.desc !== undefined) payload.desc = data.desc;
    if (data.address !== undefined) payload.address = data.address;
    if (data.position !== undefined) payload.position = data.position;
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/project/info/create',
      data: payload,
    });
    return String(resp.projectID || '');
  }

  async update(data: ProjectUpdateData): Promise<void> {
    const payload: Record<string, unknown> = {
      projectID: data.projectID,
    };
    if (data.projectName !== undefined) payload.projectName = data.projectName;
    if (data.desc !== undefined) payload.desc = data.desc;
    if (data.address !== undefined) payload.address = data.address;
    if (data.position !== undefined) payload.position = data.position;
    if (data.status !== undefined) payload.status = data.status;
    await request({
      url: '/api/v1/things/project/info/update',
      data: payload,
    });
  }

  async delete(projectID: string): Promise<void> {
    await request({
      url: '/api/v1/things/project/info/delete',
      data: { projectID },
    });
  }
}
