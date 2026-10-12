/** 文件说明：使用真实 SSE 字节流验证工具结果不在网络解析层丢失。 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { forkChatSession, getChatProjectID, getChatSession, getChatSessions, resolveClarify, updateChatSession, uploadChatAttachment, userAiCompletionsStream } from './api';
import { toToolParts } from './stream-view';

const request = vi.hoisted(() => ({ post: vi.fn(), postSSE: vi.fn() }));
const project = vi.hoisted(() => ({ sidebarSelectorEnabled: false, currentProjectID: 'project-7', isProjectScopeEnabled: () => true }));
vi.mock('@vben/api', () => ({ requestClient: request, CoreAi: {
  postApiV1AiSessionWorkspaceGetList: (body: unknown, config: unknown) => request.post('/api/v1/ai/session/workspace/get-list', body, config),
  postApiV1AiSessionWorkspaceGetOne: (body: unknown, config: unknown) => request.post('/api/v1/ai/session/workspace/get-one', body, config),
  postApiV1AiSessionWorkspaceUpdate: (body: unknown, config: unknown) => request.post('/api/v1/ai/session/workspace/update', body, config),
  postApiV1AiSessionWorkspaceFork: (body: unknown, config: unknown) => request.post('/api/v1/ai/session/workspace/fork', body, config),
  postApiV1AiChatAttachmentUpload: (body: unknown, config: unknown) => request.post('/api/v1/ai/chat/attachment/upload', body, config), postApiV1AiChatToolResult: (body: unknown, config: unknown) => request.post('/api/v1/ai/chat/tool-result', body, config) } }));
vi.mock('@vben/stores', () => ({ useAccessStore: () => ({ accessToken: '' }), useProjectStore: () => project }));
vi.mock('../../store/session', () => ({ useSessionStore: () => ({ tenantCode: '' }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  request.postSSE.mockReset();
});

describe('项目范围识别', () => {
  it('项目详情路由不依赖侧边栏选择器', () => {
    expect(getChatProjectID('/iot/project-manage/info/369033994035472')).toBe('369033994035472');
    expect(getChatProjectID('/iot/project-manage/info/369033994035472?tab=device')).toBe('369033994035472');
    expect(getChatProjectID('/iot/device-manage/list')).toBe('');
  });
});

describe('工具返回 SSE', () => {
  it('通过统一请求层继承应用、账号和企业鉴权', async () => {
    request.postSSE.mockImplementation(async (_url, _body, options) => {
      options.onMessage('data: {"sessionID":"session","token":"已授权"}\n\n');
      options.onMessage('data: {"sessionID":"session","done":true}\n\n');
      options.onEnd();
    });
    const onToken = vi.fn();
    await expect(userAiCompletionsStream({ messages: [] }, onToken)).resolves.toBe('session');
    expect(request.postSSE).toHaveBeenCalledWith(
      '/api/v1/ai/user/completions',
      { messages: [], stream: true },
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    expect(onToken).toHaveBeenCalledWith('已授权');
  });

  it.each(['', '查询失败：请重试', JSON.stringify({ rows: [{ label: '温度', value: 0 }] })])('结果穿过分片网络流后保持不变 %#', async (result) => {
    // 按字节切片覆盖中文字符和 SSE 行恰好断开的情况。
    const bytes = new TextEncoder().encode([
      { sessionID: 'session', type: 'tool_call_execute', content: JSON.stringify({ toolCallID: 'tool', name: 'query', arguments: '{"page":1}' }) },
      { type: 'tool_call_result', content: JSON.stringify({ toolCallID: 'tool', name: 'query', result }) },
      { done: true },
    ].map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''));
    request.postSSE.mockImplementation(async (_url, _body, options) => {
      const decoder = new TextDecoder();
      for (let i = 0; i < bytes.length; i += 7) options.onMessage(decoder.decode(bytes.slice(i, i + 7), { stream: true }));
      options.onEnd();
    });
    const onEvent = vi.fn();
    expect(await userAiCompletionsStream({ messages: [] }, vi.fn(), undefined, undefined, onEvent)).toBe('session');
    expect(toToolParts(onEvent.mock.calls.map(([event]) => event))[0]).toMatchObject({ input: { page: 1 }, output: result });
  });
});

// 原有确认交互也必须携带当前项目，且不能把服务端拒绝误判为提交成功。
describe('确认交互范围', () => {
  it('沿用业务工具回传的权限头并传播失败', async () => {
    project.sidebarSelectorEnabled = true;
    request.post.mockRejectedValueOnce(new Error('SESSION_SCOPE_MISMATCH'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));
    try {
      await expect(resolveClarify('session', 'call', '确认')).rejects.toThrow('SESSION_SCOPE_MISMATCH');
      expect(request.post).toHaveBeenCalledWith('/api/v1/ai/chat/tool-result', expect.objectContaining({ sessionID: 'session', result: '确认' }), expect.objectContaining({ headers: { 'project-id': 'project-7' } }));
    } finally { project.sidebarSelectorEnabled = false; }
  });
});

// 上传必须走已生成的 multipart 接口，不能提前把 uploading 状态当作附件成功。
describe('私有上传契约', () => {
  it('保留文件、幂等键和取消信号，并验证登记完成', async () => {
    const file = new File(['1,2'], 'sample.csv', { type: 'text/csv' });
    const signal = new AbortController().signal;
    request.post.mockResolvedValueOnce({ artifactID: 'file-1', status: 'ready' });
    await expect(uploadChatAttachment(file, 'request-1', signal)).resolves.toMatchObject({ artifactID: 'file-1' });
    expect(request.post).toHaveBeenLastCalledWith('/api/v1/ai/chat/attachment/upload', { file, requestID: 'request-1' }, { signal, headers: { 'project-id': null, 'Content-Type': 'multipart/form-data' } });
    request.post.mockResolvedValueOnce({ artifactID: 'file-2', status: 'uploading' });
    await expect(uploadChatAttachment(file, 'request-2')).rejects.toThrow('附件登记失败');
  });
});


it('工作区列表、整理、分支与来源读取沿用当前项目认证及取消信号', async () => {
  project.sidebarSelectorEnabled = true;
  const signal = new AbortController().signal;
  request.post.mockResolvedValue({ session: { sessionID: 'source' } });
  await getChatSessions(2, signal, 'completed');
  expect(request.post).toHaveBeenLastCalledWith('/api/v1/ai/session/workspace/get-list', { completionState: 'completed', page: { page: 2, pageSize: 20 } }, { headers: { 'project-id': 'project-7' }, signal });
  await updateChatSession('source', { completionState: 'inProgress' }, signal);
  expect(request.post).toHaveBeenLastCalledWith('/api/v1/ai/session/workspace/update', { sessionID: 'source', completionState: 'inProgress' }, { headers: { 'project-id': 'project-7' }, signal });
  await forkChatSession('source', 'request-once', signal);
  expect(request.post).toHaveBeenLastCalledWith('/api/v1/ai/session/workspace/fork', { sessionID: 'source', requestID: 'request-once' }, { headers: { 'project-id': 'project-7' }, signal });
  expect(await getChatSession('source', signal)).toEqual({ sessionID: 'source' });
  project.sidebarSelectorEnabled = false;
  await getChatSessions(1, signal);
  expect(request.post).toHaveBeenLastCalledWith('/api/v1/ai/session/workspace/get-list', { completionState: undefined, page: { page: 1, pageSize: 20 } }, { headers: { 'project-id': null }, signal });
});
