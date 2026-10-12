import { AlarmRepositoryImpl } from '../data/repositories/alarm.repository.impl';
import type { IAlarmRepository } from '../domain/interfaces/alarm.repository';
import type { AlarmRecordEntity } from '../domain/entities/alarm.entity';
import type { AlarmFilterModel } from '../domain/models/alarm-filter.model';
import type { PageResult } from '../domain/models/page-state.model';

export class AlarmService {
  constructor(private readonly alarmRepo: IAlarmRepository = new AlarmRepositoryImpl()) {}

  async getRecordList(page: number, size: number, filter?: AlarmFilterModel): Promise<PageResult<AlarmRecordEntity>> {
    return this.alarmRepo.getRecordList({ page, size, ...filter });
  }
}

export const alarmService = new AlarmService();
