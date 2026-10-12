/**
 * 文件说明：告警规则 V2 API 封装
 * 统一调用 ThingsApi 的 alarm/info 相关接口。
 */
import { ThingsApi } from '@vben/api';

/**
 * 获取告警规则分页列表
 * @param params 列表查询参数
 * @returns 后端返回的 data（含 list / total）
 */
export async function getAlarmInfoList(params: ThingsApi.AlarmInfoGetListReq) {
  return await ThingsApi.postApiV1ThingsAlarmInfoGetList(params);
}

/**
 * 获取告警规则详情
 * @param id 规则 ID
 * @returns 后端返回的 data（AlarmInfo）
 */
export async function getAlarmInfoOne(id: string) {
  return await ThingsApi.postApiV1ThingsAlarmInfoGetOne({ id });
}

/**
 * 创建告警规则
 * @param data 创建请求体
 * @returns 后端返回的 data（含 id）
 */
export async function createAlarmInfo(data: ThingsApi.AlarmInfoCreateReq) {
  return await ThingsApi.postApiV1ThingsAlarmInfoCreate(data);
}

/**
 * 更新告警规则
 * @param data 更新请求体
 */
export async function updateAlarmInfo(data: ThingsApi.AlarmInfoUpdateReq) {
  await ThingsApi.postApiV1ThingsAlarmInfoUpdate(data);
}

/**
 * 删除告警规则
 * @param id 规则 ID
 */
export async function deleteAlarmInfo(id: string) {
  await ThingsApi.postApiV1ThingsAlarmInfoDelete({ id });
}

/**
 * 更新告警规则状态（启用/停用）
 * @param id 规则 ID
 * @param status 状态：1 启用，2 停用
 */
export async function updateAlarmInfoStatus(id: string, status: number) {
  await ThingsApi.postApiV1ThingsAlarmInfoStatusUpdate({
    id,
    status,
  });
}

/**
 * 手动触发评估
 * @param id 规则 ID
 */
export async function evaluateAlarmInfo(id: string) {
  await ThingsApi.postApiV1ThingsAlarmInfoEvaluateTrigger({
    alarmIDs: id ? [Number(id)] : [],
  });
}
