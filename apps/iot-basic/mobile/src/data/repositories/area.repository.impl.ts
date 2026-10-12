import { request } from '../../utils/request';
import type { IAreaRepository } from '../../domain/interfaces/area.repository';
import type { AreaEntity } from '../../domain/entities/area.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { AreaMapper } from '../mappers/area.mapper';

export class AreaRepositoryImpl implements IAreaRepository {
  async getList(params: PageParams & { projectID: string; areaName?: string }): Promise<PageResult<AreaEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/area/info/get-list',
      data: {
        page: { page: params.page, size: params.size },
        projectID: params.projectID,
      },
    });
    let list = ((resp.list || []) as Record<string, unknown>[]).map(AreaMapper.toEntity);
    if (params.areaName) {
      const keyword = params.areaName.toLowerCase();
      list = list.filter((a) => a.areaName.toLowerCase().includes(keyword));
    }
    return { list, total: Number(resp.total || list.length) };
  }

  async getOne(areaID: string): Promise<AreaEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/area/info/get-one',
      data: { areaID },
    });
    return AreaMapper.toEntity(resp);
  }

  async create(data: { projectID: string; areaName: string; areaImg?: string; desc?: string }): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/area/info/create',
      data,
    });
    return String(resp.areaID || '');
  }

  async update(data: { areaID: string; areaName?: string; areaImg?: string; desc?: string }): Promise<void> {
    await request({
      url: '/api/v1/things/area/info/update',
      data,
    });
  }

  async delete(areaID: string): Promise<void> {
    await request({
      url: '/api/v1/things/area/info/delete',
      data: { areaID },
    });
  }
}
