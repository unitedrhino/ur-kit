/**
 * 文件说明：告警通知记录 V2 API 封装
 */
import { ThingsApi } from '@vben/api';

export async function getAlarmNotifyRecordList(params: ThingsApi.AlarmNotifyRecordGetListReq) {
  return await ThingsApi.postApiV1ThingsAlarmNotifyRecordGetList(params);
}

export async function resendAlarmNotifyRecord(id: string) {
  await ThingsApi.postApiV1ThingsAlarmNotifyRecordResend({ id });
}
