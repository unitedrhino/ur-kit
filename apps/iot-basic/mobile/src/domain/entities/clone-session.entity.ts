export interface CloneSession {
  /** 会话唯一标识 */
  sessionID: string;
  /** 会话标题 */
  title?: string;
  /** 渠道 text/voice */
  channel?: string;
  /** 对话轮次 */
  turnCount?: number;
  /** 最后活跃时间 (Unix timestamp seconds) */
  lastActiveAt?: number;
  /** 状态 1-活跃 2-已结束 3-已归档 */
  status?: number;
  /** 创建时间 */
  createdTime?: number;
}
