/** 告警事件列表筛选条件，对应 /api/v1/things/alarm/event/get-list 请求参数 */
export interface AlarmFilterModel {
  level?: string;         // remind / minor / major / critical
  status?: string[];      // normal / alarmActive / acked / shielded
  productID?: string;
  deviceName?: string;
  startTime?: number;     // 触发时间范围起点（毫秒时间戳）
  endTime?: number;       // 触发时间范围终点（毫秒时间戳）
}
