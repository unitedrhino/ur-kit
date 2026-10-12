/**
 * 文件说明：验证告警规则新增与编辑模式的页面状态。
 */
import { describe, expect, it } from 'vitest';

import { getAlarmRuleEditorState } from '../useAlarmRuleEditor';

describe('useAlarmRuleEditor', () => {
  it('新增模式应显示新增标题并按顺序解锁步骤', () => {
    expect(getAlarmRuleEditorState()).toEqual({
      maxVisitedStep: 1,
      title: '新增告警规则',
    });
  });

  it('编辑模式应显示编辑标题并开放全部步骤', () => {
    expect(getAlarmRuleEditorState('4')).toEqual({
      maxVisitedStep: 4,
      title: '编辑告警规则',
    });
  });
});
