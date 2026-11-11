/** 区域仓储：按项目及父级隔离查询，并保留名称搜索的完整分页语义。 */
import { request } from '../../utils/request';
import type { IAreaRepository } from '../../domain/interfaces/area.repository';
import type { AreaEntity } from '../../domain/entities/area.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { AreaMapper } from '../mappers/area.mapper';

export class AreaRepositoryImpl implements IAreaRepository {
  /** canManage 仅在后端确认负责人或本人项目管理授权后开放区域变更。 */
  async canManage(projectID: string, userID: string): Promise<boolean> {
    if (!projectID || !userID) return false;
    const project = await request<{ projectID: string; adminUserID: string }>({ url: '/api/v1/things/project/info/get-one', omitProjectContext: true, data: { projectID } });
    if (String(project.projectID) !== projectID) return false;
    if (String(project.adminUserID) === userID) return true;
    const members = await request<{ list?: Array<{ projectID: string; targetID: string; authType: number }> }>({ url: '/api/v1/things/data/project/get-list', omitProjectContext: true, data: { projectID, targetType: 'user', targetID: userID, page: { page: 1, size: 1 } } });
    return (members.list || []).some(item => String(item.projectID) === projectID && String(item.targetID) === userID && Number(item.authType) === 1);
  }

  /** getList 按层级读取区域；后端无名称过滤参数时，先完整筛选再做本地分页，避免漏掉其他页的匹配项。 */
  async getList(params: PageParams & { projectID: string; areaName?: string; parentAreaID?: string }): Promise<PageResult<AreaEntity>> {
    const query = async (page: number, size: number) => request<{ list?: Record<string, unknown>[]; total?: number }>({
      url: '/api/v1/things/area/info/get-list', omitProjectContext: true,
      data: { page: { page, size }, projectID: params.projectID, parentAreaID: params.parentAreaID || undefined },
    });
    if (!params.areaName?.trim()) {
      const response = await query(params.page, params.size);
      return { list: (response.list || []).map(AreaMapper.toEntity), total: Number(response.total || 0) };
    }
    const all: AreaEntity[] = [];
    for (let page = 1; ; page++) {
      if (page > 200) throw new Error('区域数量较多，请缩小查询范围');
      const response = await query(page, 100);
      const list = (response.list || []).map(AreaMapper.toEntity);
      all.push(...list);
      if (!list.length || page * 100 >= Number(response.total || 0)) break;
    }
    const matches = all.filter(item => item.areaName.toLowerCase().includes(params.areaName!.trim().toLowerCase()));
    return { list: matches.slice((params.page - 1) * params.size, params.page * params.size), total: matches.length };
  }

  async getOne(areaID: string): Promise<AreaEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/area/info/get-one',
      data: { areaID },
    });
    return AreaMapper.toEntity(resp);
  }

  /** create 在目标项目及父级下新建区域，返回字符串区域ID。 */
  async create(data: { projectID: string; parentAreaID?: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/area/info/create',
      // 图标名是客户端元数据，不放进必须为图片地址的 areaImg，保持旧客户端兼容。
      data: data.areaImg && /^(tabler|ur):/.test(data.areaImg)
        ? { ...data, areaImg: undefined, tags: { clientIcon: data.areaImg } } : data,
    });
    return String(resp.areaID || '');
  }

  /** update 更新区域名称或图标，保留页面未编辑的后端资料。 */
  async update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    // 区域更新接口对空图片/配置文件执行清空，先读回并保留不由本页面编辑的字段。
    const current = await request<Record<string, unknown>>({ url: '/api/v1/things/area/info/get-one', data: { areaID: data.areaID } });
    const icon = data.areaImg && /^(tabler|ur):/.test(data.areaImg) ? data.areaImg : undefined;
    await request({
      url: '/api/v1/things/area/info/update',
      data: {
        ...data,
        areaImg: (icon || data.areaImg === undefined) ? current.areaImg : data.areaImg,
        configFile: current.configFile,
        tags: icon ? { ...(current.tags as Record<string, string> || {}), clientIcon: icon } : current.tags,
      },
    });
  }

  async delete(areaID: string): Promise<void> {
    await request({
      url: '/api/v1/things/area/info/delete',
      data: { areaID },
    });
  }
}
