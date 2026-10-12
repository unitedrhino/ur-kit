/**
 * AI 元素组件的最小类型定义
 *
 * 原 ai-elements-vue 组件依赖 Vercel AI SDK(`ai` 包)的消息/工具部件类型,
 * 本项目对话协议为自定义 SSE 事件流,为避免引入完整 SDK,
 * 此处仅本地化定义组件渲染所需的类型子集,由映射层将内部事件转换为这些类型。
 */

/** 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** 消息体(组件仅使用角色字段区分气泡方向与样式) */
export interface UIMessage {
  id: string;
  role: MessageRole;
  parts: Array<ToolUIPart | DynamicToolUIPart | unknown>;
}

/** 工具调用状态 */
export type ToolCallState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/** 静态注册工具的调用部件 */
export interface ToolUIPart {
  /** 部件类型:静态工具为 'tool-<name>' */
  type: string;
  toolCallId: string;
  state: ToolCallState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

/** 动态工具的调用部件(结构与静态工具一致,额外携带工具名) */
export interface DynamicToolUIPart extends ToolUIPart {
  /** 工具名(动态工具没有静态 type 命名,单独携带) */
  toolName?: string;
}
