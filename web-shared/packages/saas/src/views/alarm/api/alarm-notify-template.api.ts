/**
 * 文件说明：通知内容模板 V2 API 封装
 */
import { ThingsApi } from '@vben/api';

export async function getNotifyTemplateList(params: ThingsApi.AlarmNotifyTemplateGetListReq) {
  return await ThingsApi.postApiV1ThingsAlarmNotifyTemplateGetList(params);
}

export async function getNotifyTemplateOne(id: string) {
  return await ThingsApi.postApiV1ThingsAlarmNotifyTemplateGetOne({ id });
}

export async function createNotifyTemplate(data: ThingsApi.AlarmNotifyTemplateCreateReq) {
  return await ThingsApi.postApiV1ThingsAlarmNotifyTemplateCreate(data);
}

export async function updateNotifyTemplate(data: ThingsApi.AlarmNotifyTemplateUpdateReq) {
  await ThingsApi.postApiV1ThingsAlarmNotifyTemplateUpdate(data);
}

export async function deleteNotifyTemplate(id: string) {
  await ThingsApi.postApiV1ThingsAlarmNotifyTemplateDelete({ id });
}

export async function testSendNotifyTemplate(id: string, timing: string = 'trigger') {
  await ThingsApi.postApiV1ThingsAlarmNotifyTemplateTestSend({ id, timing });
}
