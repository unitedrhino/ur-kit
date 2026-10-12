import type { AlarmRecordEntity } from '../../domain/entities/alarm.entity';

export class AlarmMapper {
  /** 后端事件 level 为 remind/minor/major/critical 字符串，前端实体统一转数字（1~4） */
  private static levelToNumber(level: unknown): number {
    switch (level) {
      case 'remind':
        return 1;
      case 'minor':
        return 2;
      case 'major':
        return 3;
      case 'critical':
        return 4;
      default:
        return 1;
    }
  }

  static toRecordEntity(dto: Record<string, unknown>): AlarmRecordEntity {
    return {
      id: String(dto.id || ''),
      alarmID: String(dto.alarmID || ''),
      alarmName: String(dto.alarmName || ''),
      targetName: String(dto.targetName || ''),
      productID: String(dto.productID || ''),
      deviceName: String(dto.deviceName || ''),
      level: AlarmMapper.levelToNumber(dto.level),
      status: String(dto.status || ''),
      triggerValue: String(dto.triggerValue || ''),
      triggerContent: String(dto.triggerContent || ''),
      triggerCount: Number(dto.triggerCount || 0),
      firstTriggerTime: Number(dto.firstTriggerTime || 0),
      lastTriggerTime: Number(dto.lastTriggerTime || 0),
      createdTime: Number(dto.createdTime || 0),
      updatedTime: Number(dto.updatedTime || 0),
      isFalseAlarm: Boolean(dto.falseAlarm),
    };
  }
}
