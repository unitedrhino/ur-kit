/**
 * 文件说明：统一计算告警规则新增与编辑模式的页面状态。
 */

/** AlarmRuleEditorState 描述编辑页的标题和步骤开放范围。 */
export interface AlarmRuleEditorState {
  /** 当前可直接访问的最大步骤。 */
  maxVisitedStep: number;
  /** 当前 Tab 标题。 */
  title: string;
}

/** getAlarmRuleEditorState 根据规则 ID 返回页面模式状态。 */
export function getAlarmRuleEditorState(ruleId?: string): AlarmRuleEditorState {
  const isEditing = Boolean(ruleId);
  return {
    maxVisitedStep: isEditing ? 4 : 1,
    title: isEditing ? '编辑告警规则' : '新增告警规则',
  };
}
