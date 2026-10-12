/**
 * ai-chat 消息流视图映射层
 *
 * 职责:将内部 SSE 事件结构(ChatMessage / AiToolEvent)转换为
 * ai-elements 组件(Message / Tool)渲染所需的视图数据。
 * 保持纯函数,便于单元测试;SSE 解析逻辑仍在 api.ts,不在此层处理。
 */

import type { AiToolEvent } from './api';

import type { DynamicToolUIPart } from '../ai-elements/types';

export type { AiToolEvent };

/** 工具入参 JSON 解析失败时的占位展示 */
const INVALID_ARGS_PLACEHOLDER = { parseError: true };

/**
 * 将结构化工具事件序列映射为 ai-elements Tool 组件的部件数组
 *
 * 规则:按 toolCallID 聚合,同一工具的多次事件合并为一个部件,
 * 部件状态取该工具最后一个事件的阶段(start→input-streaming、
 * execute→input-available、result→output-available)。
 * @param events 工具事件流(按发生顺序)
 * @returns 与事件顺序一致的部件数组
 */
export function toToolParts(events: AiToolEvent[]): DynamicToolUIPart[] {
  const stateByPhase: Record<AiToolEvent['phase'], DynamicToolUIPart['state']> = {
    start: 'input-streaming',
    execute: 'input-available',
    result: 'output-available',
  };
  const parts: DynamicToolUIPart[] = [];
  const indexByID = new Map<string, number>();

  for (const event of events) {
    let input: unknown;
    if (event.arguments) {
      try {
        input = JSON.parse(event.arguments);
      } catch {
        input = INVALID_ARGS_PLACEHOLDER;
      }
    }
    const idx = indexByID.get(event.toolCallID);
    if (idx === undefined) {
      indexByID.set(event.toolCallID, parts.length);
      parts.push({
        type: 'dynamic-tool',
        toolCallId: event.toolCallID,
        toolName: event.name,
        state: stateByPhase[event.phase]!,
        input,
        output: event.phase === 'result' ? event.result : undefined,
      });
    } else {
      const part = parts[idx]!;
      parts[idx] = {
        ...part,
        state: stateByPhase[event.phase] ?? part.state,
        input: event.arguments ? input : part.input,
        output: event.phase === 'result' ? event.result : part.output,
      };
    }
  }
  return parts;
}

/**
 * 拼接消息的文本内容(parts 中所有 text 片段)
 * @param contents 消息内容片段
 * @returns 纯文本;无文本内容时返回空串
 */
export function joinTextContents(
  contents: Array<{ type: string; text?: string }>,
): string {
  return (
    contents
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n') || ''
  );
}
