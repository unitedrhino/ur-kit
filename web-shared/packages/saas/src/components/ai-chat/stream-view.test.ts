/** 文件说明：验证聊天消息与工具结果的视图映射，防止返回值被入参替代或丢失。 */
import { describe, expect, it } from 'vitest';

import { joinTextContents, toToolParts } from './stream-view';

describe('toToolParts', () => {
  it('工具结果保留真实返回值并继续保留原始入参', () => {
    const result = '{"summary":"查询到12个用户","rows":[{"count":12}]}';
    const parts = toToolParts([
      { phase: 'execute', toolCallID: 'query', name: 'query_users', arguments: '{"status":"enabled"}' },
      { phase: 'result', toolCallID: 'query', name: 'query_users', result },
    ]);
    expect(parts[0]).toMatchObject({ input: { status: 'enabled' }, output: result });
  });

  it.each(['', '查询失败：数据源不可用', '{"count":0}', 'x'.repeat(5000)])('仅有结果事件也完整保留返回值 %#', (result) => {
    expect(toToolParts([{ phase: 'result', toolCallID: 'only', name: 'query', result }])[0]?.output).toBe(result);
  });

  it('旧结果未携带返回值时不把入参误当结果', () => {
    expect(toToolParts([{ phase: 'result', toolCallID: 'old', name: 'query', arguments: '{"id":1}' }])[0]?.output).toBeUndefined();
  });

  it('空事件返回空数组', () => {
    expect(toToolParts([])).toEqual([]);
  });

  it('单工具三段事件按阶段演进状态', () => {
    const parts = toToolParts([
      { phase: 'start', toolCallID: 'call_1', name: 'get_device_list' },
      {
        phase: 'execute',
        toolCallID: 'call_1',
        name: 'get_device_list',
        arguments: '{"areaName":"门口"}',
      },
      { phase: 'result', toolCallID: 'call_1', name: 'get_device_list' },
    ]);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      type: 'dynamic-tool',
      toolCallId: 'call_1',
      toolName: 'get_device_list',
      state: 'output-available',
      input: { areaName: '门口' },
    });
  });

  it('按 toolCallID 聚合多次事件并保持工具顺序', () => {
    const parts = toToolParts([
      { phase: 'start', toolCallID: 'a', name: 'tool_a' },
      { phase: 'start', toolCallID: 'b', name: 'tool_b' },
      { phase: 'result', toolCallID: 'a', name: 'tool_a' },
      { phase: 'execute', toolCallID: 'b', name: 'tool_b', arguments: '{"k":1}' },
    ]);

    expect(parts).toHaveLength(2);
    expect(parts[0]!.toolCallId).toBe('a');
    expect(parts[0]!.state).toBe('output-available');
    expect(parts[1]!.toolCallId).toBe('b');
    // b 尚无 result,停留在 execute 阶段
    expect(parts[1]!.state).toBe('input-available');
  });

  it('非法 JSON 入参使用占位对象而不是抛错', () => {
    const parts = toToolParts([
      {
        phase: 'execute',
        toolCallID: 'bad',
        name: 'tool_x',
        arguments: '{not-json',
      },
    ]);

    expect(parts[0]!.input).toEqual({ parseError: true });
  });

  it('无入参的 execute 事件不携带 input', () => {
    const parts = toToolParts([
      { phase: 'execute', toolCallID: 'c', name: 'tool_c' },
    ]);

    expect(parts[0]!.input).toBeUndefined();
  });
});

describe('joinTextContents', () => {
  it('拼接所有 text 片段', () => {
    expect(
      joinTextContents([
        { type: 'text', text: '你好' },
        { type: 'image_url' },
        { type: 'text', text: '世界' },
      ]),
    ).toBe('你好\n世界');
  });

  it('无文本内容时返回空串', () => {
    expect(joinTextContents([{ type: 'image_url' }])).toBe('');
    expect(joinTextContents([])).toBe('');
  });
});
