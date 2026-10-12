/**
 * 文件说明：StepShell 步骤向导外壳的公共类型。
 */

/** 单个步骤的标题与辅助说明。 */
export interface StepShellStep {
  /** 步骤辅助描述，如「选择数据来源和设备范围」。 */
  description: string;
  /** 步骤标题，如「监控什么」。 */
  title: string;
}

/** 步骤在步骤条中的状态。 */
export type StepShellState = 'complete' | 'error' | 'pending';
