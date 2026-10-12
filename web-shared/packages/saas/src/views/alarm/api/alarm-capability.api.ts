/**
 * 文件说明：告警统一能力矩阵 API 封装。
 */
import { ThingsApi } from '@vben/api';

/** getAlarmCapability 获取后端当前实际支持的告警配置能力。 */
export async function getAlarmCapability() {
  // SDK 生成的 POST 接口要求必传 body，该接口后端不消费请求体，传空对象
  return await ThingsApi.postApiV1ThingsAlarmCapabilityGetOne({});
}
