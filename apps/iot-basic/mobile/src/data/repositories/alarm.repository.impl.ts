import { request } from '../../utils/request';
import type { IAlarmRepository } from '../../domain/interfaces/alarm.repository';
import type { AlarmRecordEntity } from '../../domain/entities/alarm.entity';
import type { AlarmFilterModel } from '../../domain/models/alarm-filter.model';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { AlarmMapper } from '../mappers/alarm.mapper';

export class AlarmRepositoryImpl implements IAlarmRepository {
  /** 查询告警事件列表，对应新接口 /api/v1/things/alarm/event/get-list */
  async getRecordList(params: PageParams & AlarmFilterModel): Promise<PageResult<AlarmRecordEntity>> {
    const triggerTimeRange =
      params.startTime || params.endTime
        ? {
            ...(params.startTime ? { start: params.startTime } : {}),
            ...(params.endTime ? { end: params.endTime } : {}),
          }
        : undefined;
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/alarm/event/get-list',
      data: {
        page: { page: params.page, size: params.size },
        level: params.level ? [params.level] : undefined,
        status: params.status,
        productID: params.productID,
        deviceName: params.deviceName,
        triggerTimeRange,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(AlarmMapper.toRecordEntity);
    return { list, total: Number(resp.total || 0) };
  }
}
