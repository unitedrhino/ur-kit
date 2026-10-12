/**
 * 文件说明：告警等级文案应用级覆盖的单元测试。
 * 验证 setAlarmLevelLabels 的覆盖生效、默认值隔离（未覆盖应用保持默认文案）
 * 与 levelLabel/AlarmLevelList 的联动。
 */
import { describe, expect, it } from 'vitest';

import {
  AlarmLevelList,
  getAlarmLevelLabelOverride,
  levelLabel,
  setAlarmLevelLabels,
} from '../alarm-v2.types';

describe('setAlarmLevelLabels', () => {
  it('覆盖后 AlarmLevelList 与 levelLabel 同步生效', () => {
    setAlarmLevelLabels({
      critical: '红色预警',
      major: '橙色预警',
      minor: '黄色预警',
      remind: '蓝色预警',
    });
    expect(levelLabel('remind')).toBe('蓝色预警');
    expect(levelLabel('minor')).toBe('黄色预警');
    expect(levelLabel('major')).toBe('橙色预警');
    expect(levelLabel('critical')).toBe('红色预警');
    expect(AlarmLevelList.find((i) => i.value === 'remind')?.label).toBe('蓝色预警');
    expect(getAlarmLevelLabelOverride('critical')).toBe('红色预警');
    // value/颜色/等级数值不受覆盖影响
    expect(AlarmLevelList.find((i) => i.value === 'remind')?.color).toBe('#1677ff');
    expect(AlarmLevelList.find((i) => i.value === 'critical')?.levelValue).toBe(4);
  });

  it('部分覆盖只影响传入的等级', () => {
    setAlarmLevelLabels({ remind: '蓝色' });
    expect(levelLabel('remind')).toBe('蓝色');
    expect(levelLabel('minor')).toBe('黄色预警');
    // 恢复为结构监测应用的最终口径，避免影响其他用例
    setAlarmLevelLabels({ remind: '蓝色预警' });
    expect(levelLabel('remind')).toBe('蓝色预警');
  });

  it('覆盖表的语义色/数值字段保持不变', () => {
    expect(AlarmLevelList.map((i) => i.color)).toEqual(['#1677ff', '#faad14', '#fa8c16', '#f5222d']);
    expect(AlarmLevelList.map((i) => i.levelValue)).toEqual([1, 2, 3, 4]);
  });
});
