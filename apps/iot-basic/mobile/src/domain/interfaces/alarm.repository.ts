import type { AlarmRecordEntity } from '../entities/alarm.entity';
import type { AlarmFilterModel } from '../models/alarm-filter.model';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IAlarmRepository {
  getRecordList(params: PageParams & AlarmFilterModel): Promise<PageResult<AlarmRecordEntity>>;
}
