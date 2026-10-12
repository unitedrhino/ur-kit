/**
 * AI 场景辅助：从后端流式接收的结构化补丁定义。
 *
 * 为了让后端（自然语言 → LLM）产出稳定、好写的 JSON，这里使用「宽松」版本的
 * TriggerDraft/ActionDraft/...：uid 由前端 applyPatch 时补齐，内部任何子字段都
 * 允许为空。applyPatch 会把它们合并进 useSceneDraft 暴露的结构里。
 */

import type {
  ActionDraft,
  ConditionTermDraft,
  RangeDraft,
  TriggerDraft,
} from '../types';

/** 省略 uid 字段（LLM 不必关心 uid） */
export type PartialTrigger = Omit<TriggerDraft, 'uid'> & { uid?: string };
export type PartialAction = Omit<ActionDraft, 'uid'> & { uid?: string };
export type PartialCondition = Omit<ConditionTermDraft, 'uid'> & {
  uid?: string;
};
export type PartialRange = Omit<RangeDraft, 'uid'> & { uid?: string };

/**
 * 场景补丁。
 * - mode='merge'   （默认）：在现有 draft 之后追加
 * - mode='replace' ：替换对应数组（仅替换 patch 中显式出现的字段）
 */
export interface ScenePatch {
  mode?: 'merge' | 'replace';
  name?: string;
  desc?: string;
  triggers?: PartialTrigger[];
  actions?: PartialAction[];
  conditions?: PartialCondition[];
  validRanges?: PartialRange[];
  invalidRanges?: PartialRange[];
}

/** 对话消息中附带的 tool 调用记录（Phase 3-C：展示"AI 正在查设备列表…"等） */
export interface AiToolCall {
  name: string;
  status: 'running' | 'done' | 'error';
  input?: unknown;
  output?: unknown;
}

/** 对话消息 */
export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** 仅 assistant 消息有：本条消息关联的 tool 调用链 */
  toolCalls?: AiToolCall[];
}

/** SSE 事件（与 ai-server 约定） */
export type AiStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'patch'; patch: ScenePatch }
  | {
      type: 'tool';
      phase: 'start' | 'end';
      name: string;
      input?: unknown;
      output?: unknown;
    }
  | { type: 'done' }
  | { type: 'error'; message: string };
