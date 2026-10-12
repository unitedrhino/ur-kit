export interface CloneSessionMessage {
  /** 轮次序号 */
  turnIndex?: number;
  /** 用户输入 */
  userInput?: string;
  /** AI 回复 */
  aiResponse?: string;
  /** 摘要 */
  summary?: string;
  /** 关键主题（JSON 字符串） */
  keyTopics?: string;
}
