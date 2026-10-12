/**
 * 文件说明：负责将通知记录页面筛选条件转换为后端列表接口参数。
 */
import type { ThingsApi } from '@vben/api';

/** NotifyRecordFilters 表示通知记录页面当前可编辑的筛选条件。 */
export interface NotifyRecordFilters {
  channel: string;
  createdEnd: string;
  createdStart: string;
  ruleName: string;
  status: string;
  targetName: string;
  timing: string;
}

/** createEmptyNotifyRecordFilters 创建通知记录筛选条件的初始值。 */
export function createEmptyNotifyRecordFilters(): NotifyRecordFilters {
  return {
    channel: '',
    createdEnd: '',
    createdStart: '',
    ruleName: '',
    status: '',
    targetName: '',
    timing: '',
  };
}

/** buildNotifyRecordListRequest 将页面筛选值转换为后端分页查询参数。 */
export function buildNotifyRecordListRequest(filters: NotifyRecordFilters, page: number, size: number): ThingsApi.AlarmNotifyRecordGetListReq {
  const request: ThingsApi.AlarmNotifyRecordGetListReq = {
    page: { page, size },
  };
  if (filters.status) request.status = [filters.status];
  if (filters.timing) request.timing = filters.timing;
  if (filters.channel) request.channel = [filters.channel];
  if (filters.ruleName.trim()) request.alarmName = filters.ruleName.trim();
  if (filters.targetName.trim()) request.targetName = filters.targetName.trim();

  const start = filters.createdStart ? new Date(filters.createdStart).getTime() : 0;
  const end = filters.createdEnd ? new Date(filters.createdEnd).getTime() : 0;
  if (start || end) {
    request.createdTimeRange = {
      ...(end ? { end } : {}),
      ...(start ? { start } : {}),
    };
  }
  return request;
}
