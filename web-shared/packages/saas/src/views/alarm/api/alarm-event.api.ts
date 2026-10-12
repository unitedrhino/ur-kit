/**
 * 文件说明：告警事件 V2 API 封装
 */
import { ThingsApi } from '@vben/api';

export async function getAlarmEventList(params: ThingsApi.AlarmEventGetListReq) {
  return await ThingsApi.postApiV1ThingsAlarmEventGetList(params);
}

export async function getAlarmEventOne(id: string) {
  return await ThingsApi.postApiV1ThingsAlarmEventGetOne({ id });
}

// 前端操作文案到后端动作枚举的映射
const dealActionMap: Record<string, string> = {
  确认告警: 'ack',
  屏蔽告警: 'shield',
  解除屏蔽: 'unshield',
};

export async function dealAlarmEvent(id: string, action: string, remark?: string) {
  await ThingsApi.postApiV1ThingsAlarmEventDeal({
    eventID: id,
    action: dealActionMap[action] || action,
    remark,
  } as unknown as ThingsApi.AlarmEventDealReq);
}

export async function falseAlarmEvent(id: string, reason: string, reasonType?: string) {
  await ThingsApi.postApiV1ThingsAlarmEventFalseAlarm({
    eventID: id,
    reason,
    reasonType: reasonType ?? 'other',
  } as unknown as ThingsApi.AlarmEventFalseAlarmReq);
}

export async function getAlarmEventStat(params: ThingsApi.AlarmEventStatReq) {
  return await ThingsApi.postApiV1ThingsAlarmEventStat(params);
}
