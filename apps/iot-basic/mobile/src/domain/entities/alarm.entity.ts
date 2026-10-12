/** 告警事件实体，对应新告警接口 /api/v1/things/alarm/event/* 返回的 AlarmEvent */
export interface AlarmRecordEntity {
  id: string;
  alarmID: string;        // 告警规则ID
  alarmName: string;      // 告警规则名
  targetName: string;     // 目标展示名
  productID: string;
  deviceName: string;
  level: number;          // 1=提醒(remind) 2=次要(minor) 3=重要(major) 4=紧急(critical)
  status: string;         // normal / alarmActive / acked / shielded
  triggerValue: string;   // 触发值
  triggerContent: string; // 触发内容
  triggerCount: number;   // 触发次数
  firstTriggerTime: number;
  lastTriggerTime: number;
  createdTime: number;
  updatedTime: number;
  isFalseAlarm: boolean;  // 是否误报
}
