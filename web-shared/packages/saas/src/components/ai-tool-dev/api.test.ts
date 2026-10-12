/**
 * 文件说明：AI 工具开发 SSE 事件解析测试。
 * 覆盖工具调用从开始到结果的实时详情透传。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toolDevStream } from './api';

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ accessToken: 'token' }),
}));

vi.mock('../../store/session', () => ({
  useSessionStore: () => ({ tenantCode: 'tenant' }),
}));

describe('toolDevStream 工具调用事件', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('透传调用入参、执行状态与返回结果', async () => {
    const chunks = [
      'data: {"sessionID":"s1","type":"tool_call_start","content":"{\\"toolCallID\\":\\"c1\\",\\"name\\":\\"read_file\\",\\"arguments\\":\\"{\\\\\\"path\\\\\\":\\\\\\"executor.js\\\\\\"}\\"}"}\n',
      'data: {"type":"tool_call_result","content":"{\\"toolCallID\\":\\"c1\\",\\"name\\":\\"read_file\\",\\"result\\":\\"{\\\\\\"content\\\\\\":\\\\\\"ok\\\\\\"}\\"}"}\n',
      'data: {"sessionID":"s1","done":true}\n',
    ];
    const reader = {
      read: vi.fn(async () => {
        const chunk = chunks.shift();
        return chunk ? { done: false, value: new TextEncoder().encode(chunk) } : { done: true, value: undefined };
      }),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        headers: { get: () => 'text/event-stream' },
        body: { getReader: () => reader },
      })),
    );

    const onToolEvent = vi.fn();
    const sessionID = await toolDevStream(
      { userInput: '生成工具', cloneID: '9007199254740997' },
      {
        onToken: vi.fn(),
        onTaskUpdate: vi.fn(),
        onTaskPlan: vi.fn(),
        onTaskUpdateEvent: vi.fn(),
        onThinking: vi.fn(),
        onFileChange: vi.fn(),
        onClarify: vi.fn(),
        onToolEvent,
        onDone: vi.fn(),
        onError: vi.fn(),
      },
    );

    expect(sessionID).toBe('s1');
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((fetchCall?.[1] as RequestInit | undefined)?.body))).toEqual(
      expect.objectContaining({ cloneID: '9007199254740997' }),
    );
    expect(onToolEvent).toHaveBeenNthCalledWith(1, {
      phase: 'start',
      toolCallID: 'c1',
      name: 'read_file',
      arguments: '{"path":"executor.js"}',
      result: undefined,
      isFrontend: undefined,
    });
    expect(onToolEvent).toHaveBeenNthCalledWith(2, {
      phase: 'result',
      toolCallID: 'c1',
      name: 'read_file',
      arguments: undefined,
      result: '{"content":"ok"}',
      isFrontend: undefined,
    });
  });

  it('SSE 未收到完成事件便断开时明确报错', async () => {
    const chunks = [
      'data: {"sessionID":"s1","type":"task_update","content":"{\\"taskId\\":\\"write-executor\\",\\"status\\":\\"in_progress\\",\\"label\\":\\"编写 executor.js\\"}"}\n',
    ];
    const reader = {
      read: vi.fn(async () => {
        const chunk = chunks.shift();
        return chunk ? { done: false, value: new TextEncoder().encode(chunk) } : { done: true, value: undefined };
      }),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        headers: { get: () => 'text/event-stream' },
        body: { getReader: () => reader },
      })),
    );

    const onDone = vi.fn();
    const onError = vi.fn();
    await expect(
      toolDevStream(
        { userInput: '生成工具' },
        {
          onToken: vi.fn(),
          onTaskUpdate: vi.fn(),
          onTaskPlan: vi.fn(),
          onTaskUpdateEvent: vi.fn(),
          onThinking: vi.fn(),
          onFileChange: vi.fn(),
          onClarify: vi.fn(),
          onDone,
          onError,
        },
      ),
    ).rejects.toThrow('AI 生成连接已中断');
    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
  });
});
