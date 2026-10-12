import { describe, expect, it, vi } from 'vitest';

import {
  addConversationMembers,
  callSignal,
  channelBind,
  channelBindGetList,
  channelBindSetMute,
  channelUnbind,
  createConversation,
  deleteMoment,
  disbandConversation,
  getConversation,
  getConversationByParticipants,
  getConversationList,
  getConversationMembers,
  getActiveCall,
  getMessageList,
  markRead,
  muteConversationMember,
  recallMessage,
  removeConversationMember,
  searchMessages,
  sendMessage,
  setConversationAdmin,
  transferConversationOwner,
  updateConversationSetting,
} from '../im';

// IM 接口封装统一走 @vben/api 生成的 CoreIm，测试 mock 生成的 SDK 函数，
// 断言调用参数与时间戳转换行为（URL 路径由生成代码保证，不在此重复断言）
// vi.hoisted 保证 mocks 在 vi.mock 工厂执行前完成初始化（避免 TDZ）
// coreImMocks 自身就是懒生成 Proxy：无论测试用例先取 mock 还是先调封装函数，
// 拿到的都是同一个 vi.fn 实例，避免属性首次访问顺序不同导致取到 undefined
const { coreImMocks } = vi.hoisted(() => {
  const mocks = {} as Record<string, ReturnType<typeof vi.fn>>;
  const coreImMocks = new Proxy(mocks, {
    get(target, prop: string) {
      return (target[prop] ??= vi.fn((req: unknown) => Promise.resolve(req ?? {})));
    },
  });
  return { coreImMocks };
});

vi.mock('@vben/api', () => ({ CoreIm: coreImMocks }));

describe('IM API 封装（基于 swagger 生成的 CoreIm）', () => {
  it('callSignal 应调用 CoreIm 并序列化对象 payload', async () => {
    await callSignal({
      callId: 'call-1',
      payload: { muted: true, videoOff: false },
      type: 'media_state',
    });
    expect(coreImMocks.postApiV1ImCallSignal).toHaveBeenCalledWith({
      callId: 'call-1',
      payload: '{"muted":true,"videoOff":false}',
      type: 'media_state',
    });
  });

  it('getActiveCall 应调用生成的 GET 接口', async () => {
    await getActiveCall(8);
    expect(coreImMocks.getApiV1ImCallActive).toHaveBeenCalledWith({ conversationId: 8 });
  });

  it('渠道绑定薄封装应全部调用 CoreIm', async () => {
    await channelBind({ channelId: 'p1:d1', channelName: '设备1', channelType: 'device' });
    await channelBindGetList();
    await channelBindSetMute(3, 1);
    await channelUnbind(3);

    expect(coreImMocks.postApiV1ImChannelBind).toHaveBeenCalledWith({
      channelId: 'p1:d1',
      channelName: '设备1',
      channelType: 'device',
    });
    expect(coreImMocks.postApiV1ImChannelGetList).toHaveBeenCalledWith({});
    expect(coreImMocks.postApiV1ImChannelSetMute).toHaveBeenCalledWith({ id: 3, isMuted: 1 });
    expect(coreImMocks.postApiV1ImChannelUnbind).toHaveBeenCalledWith({ id: 3 });
  });

  it('getConversationList 应调用 ConversationGetList 并转换时间戳', async () => {
    const mock = coreImMocks.postApiV1ImConversationGetList!;
    mock.mockResolvedValueOnce({
      list: [{ id: 8, createdTime: 1700000000, lastMsgTime: 1700000100, updatedTime: 1700000200 }],
      total: 1,
    });
    const res = await getConversationList(1, 20);
    expect(mock).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(res.list[0]!.createdTime).toBe(1700000000000);
    expect(res.list[0]!.lastMsgTime).toBe(1700000100000);
    expect(res.list[0]!.updatedTime).toBe(1700000200000);
  });

  it('getConversation 应调用 ConversationGet 并将秒时间戳转为毫秒', async () => {
    const mock = coreImMocks.postApiV1ImConversationGet!;
    mock.mockResolvedValueOnce({
      info: {
        id: 8,
        name: '测试会话',
        createdTime: 1700000000,
        lastMsgTime: 1700000100,
        updatedTime: 1700000200,
      },
    });
    const res = await getConversation(8);
    expect(mock).toHaveBeenCalledWith({ conversationId: 8 });
    expect(res.info.createdTime).toBe(1700000000000);
    expect(res.info.lastMsgTime).toBe(1700000100000);
    expect(res.info.updatedTime).toBe(1700000200000);
  });

  it('getConversationByParticipants 应调用 ConversationGetByParticipants', async () => {
    await getConversationByParticipants(1001, 1002);
    expect(coreImMocks.postApiV1ImConversationGetByParticipants).toHaveBeenCalledWith({
      userID1: 1001,
      userID2: 1002,
    });
  });

  it('createConversation 应调用 ConversationCreate', async () => {
    const participants = [{ id: '1001', type: 'user' }];
    await createConversation('single', participants, 'test');
    expect(coreImMocks.postApiV1ImConversationCreate).toHaveBeenCalledWith({
      type: 'single',
      name: 'test',
      participants,
    });
  });

  it('getMessageList 应调用 ChatlogGetList 并转换时间戳', async () => {
    const mock = coreImMocks.postApiV1ImChatlogGetList!;
    mock.mockResolvedValueOnce({
      list: [{ id: 1, sendTime: 1700000000 }],
      total: 1,
    });
    const res = await getMessageList(8, 1, 20);
    expect(mock).toHaveBeenCalledWith({ conversationId: 8, page: 1, pageSize: 20 });
    expect(res.list[0]!.sendTime).toBe(1700000000000);
    expect(res.list[0]!.readCount).toBe(0);
  });

  it('sendMessage 应调用 MessageSend', async () => {
    await sendMessage(8, 'hello', 'client-id', '{}', 'text');
    expect(coreImMocks.postApiV1ImMessageSend).toHaveBeenCalledWith({
      clientMsgId: 'client-id',
      content: 'hello',
      conversationId: 8,
      extra: '{}',
      isAtAll: 0,
      mentionUserIDs: [],
      msgType: 'text',
    });
  });

  it('sendMessage 携带 isAtAll=1 应调用 MessageSend', async () => {
    await sendMessage(8, 'hello', 'client-id', '{}', 'text', 1);
    expect(coreImMocks.postApiV1ImMessageSend).toHaveBeenCalledWith({
      clientMsgId: 'client-id',
      content: 'hello',
      conversationId: 8,
      extra: '{}',
      isAtAll: 1,
      mentionUserIDs: [],
      msgType: 'text',
    });
  });

  it('markRead 应调用 ChatlogMarkRead', async () => {
    await markRead(8, 12);
    expect(coreImMocks.postApiV1ImChatlogMarkRead).toHaveBeenCalledWith({
      conversationId: 8,
      readSeq: 12,
    });
  });

  it('recallMessage 应调用 MessageRecall', async () => {
    await recallMessage(8, 12);
    expect(coreImMocks.postApiV1ImMessageRecall).toHaveBeenCalledWith({
      conversationId: 8,
      msgId: 12,
    });
  });

  it('addConversationMembers 应调用 ConversationAddMembers', async () => {
    const participants = [{ id: '1003', type: 'user' }];
    await addConversationMembers(8, participants);
    expect(coreImMocks.postApiV1ImConversationAddMembers).toHaveBeenCalledWith({
      conversationId: 8,
      participants,
    });
  });

  it('removeConversationMember 应调用 ConversationRemoveMember', async () => {
    await removeConversationMember(8, 'user', '1003');
    expect(coreImMocks.postApiV1ImConversationRemoveMember).toHaveBeenCalledWith({
      conversationId: 8,
      participantType: 'user',
      participantId: '1003',
    });
  });

  it('transferConversationOwner 应调用 ConversationTransferOwner', async () => {
    await transferConversationOwner(8, 1004);
    expect(coreImMocks.postApiV1ImConversationTransferOwner).toHaveBeenCalledWith({
      conversationId: 8,
      newOwnerID: 1004,
    });
  });

  it('updateConversationSetting 应调用 ConversationUpdateSetting 并补 -1 默认值', async () => {
    await updateConversationSetting(8, { isPinned: 1, isMuted: 0 });
    expect(coreImMocks.postApiV1ImConversationUpdateSetting).toHaveBeenCalledWith({
      conversationId: 8,
      isPinned: 1,
      isMuted: 0,
      isDeleted: -1,
    });
  });

  it('searchMessages 应调用 ChatlogSearch', async () => {
    await searchMessages('hello', undefined, 1, 20);
    expect(coreImMocks.postApiV1ImChatlogSearch).toHaveBeenCalledWith({
      keyword: 'hello',
      conversationId: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('searchMessages 传入 conversationId 应包含在请求体中', async () => {
    await searchMessages('hello', 8, 1, 10);
    expect(coreImMocks.postApiV1ImChatlogSearch).toHaveBeenCalledWith({
      keyword: 'hello',
      conversationId: 8,
      page: 1,
      pageSize: 10,
    });
  });

  it('muteConversationMember 应调用 ConversationMuteMember', async () => {
    await muteConversationMember(8, 'user', '1003', 1);
    expect(coreImMocks.postApiV1ImConversationMuteMember).toHaveBeenCalledWith({
      conversationId: 8,
      participantType: 'user',
      participantId: '1003',
      isMuted: 1,
    });
  });

  it('disbandConversation 应调用 ConversationDisband', async () => {
    await disbandConversation(8);
    expect(coreImMocks.postApiV1ImConversationDisband).toHaveBeenCalledWith({
      conversationId: 8,
    });
  });

  it('setConversationAdmin 应调用 ConversationSetAdmin', async () => {
    await setConversationAdmin(8, 'user', '1003', 1);
    expect(coreImMocks.postApiV1ImConversationSetAdmin).toHaveBeenCalledWith({
      conversationId: 8,
      participantType: 'user',
      participantId: '1003',
      isAdmin: 1,
    });
  });

  it('getConversationMembers 应调用 ConversationGetMembers', async () => {
    await getConversationMembers(8);
    expect(coreImMocks.postApiV1ImConversationGetMembers).toHaveBeenCalledWith({
      conversationId: 8,
    });
  });

  it('deleteMoment 应调用 MomentDelete', async () => {
    await deleteMoment(1001);
    expect(coreImMocks.postApiV1ImMomentDelete).toHaveBeenCalledWith({ id: 1001 });
  });
});
