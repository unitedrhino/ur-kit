/**
 * 文件说明：触发条件模板 V2 API 封装
 */
import { ThingsApi } from '@vben/api';

export async function getConditionTemplateList(params: ThingsApi.AlarmConditionTemplateGetListReq) {
  return await ThingsApi.postApiV1ThingsAlarmConditionTemplateGetList(params);
}

export async function getConditionTemplateOne(id: string) {
  return await ThingsApi.postApiV1ThingsAlarmConditionTemplateGetOne({ id });
}

export async function createConditionTemplate(data: ThingsApi.AlarmConditionTemplateCreateReq) {
  return await ThingsApi.postApiV1ThingsAlarmConditionTemplateCreate(data);
}

export async function updateConditionTemplate(data: ThingsApi.AlarmConditionTemplateUpdateReq) {
  await ThingsApi.postApiV1ThingsAlarmConditionTemplateUpdate(data);
}

export async function deleteConditionTemplate(id: string) {
  await ThingsApi.postApiV1ThingsAlarmConditionTemplateDelete({ id });
}
