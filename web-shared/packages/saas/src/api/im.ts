import { CoreAi, CoreIm } from '@vben/api';

/**
 * IM 模块 REST API 封装
 *
 * 接口调用一律走 `@vben/api` 由 swagger 自动生成的 `CoreIm.*` 函数，
 * 本文件只保留三类薄封装：
 * 1. 类型别名/扩展：复用生成的 models，补充后端未返回的展示字段；
 * 2. 时间戳归一：后端返回 Unix 秒，前端统一转毫秒；
 * 3. 参数默认值归一：避免调用方重复处理空数组、占位值。
 *
 * 禁止在此手写 requestClient 调用后端接口（见 apps/AGENTS.md API 代码生成规范）。
 */

// 音视频通话接口保留在独立文件维护领域枚举与 payload 归一，底层调用生成的 CoreIm SDK。
export { callSignal, getActiveCall } from './im-call';

// 渠道绑定接口保留薄封装，底层调用生成的 CoreIm SDK。
export { channelBind, channelBindGetList, channelBindSetMute, channelUnbind } from './im-channel';
export type { ImChannelBindGetListResp, ImChannelBindInfo } from './im-channel';
export type {
  ImCallActiveResp,
  ImCallEndReason,
  ImCallEvent,
  ImCallParticipant,
  ImCallScope,
  ImCallSignalReq,
  ImCallSignalResp,
  ImCallSignalType,
  ImCallType,
} from './im-call';

/** 会话参与者 */
export type ImParticipant = CoreIm.ImParticipant;

/** 会话信息 */
export type ImConversationInfo = CoreIm.ImConversationInfo;

/** 会话成员信息 */
export type ImConversationMemberInfo = CoreIm.ImConversationMemberInfo;

/** 消息信息（senderName 为展示用扩展字段；readCount 由列表封装统一归一为必有值） */
export interface ImMessageInfo extends CoreIm.ImMessageInfo {
  /** 发送者名称（用于搜索结果等展示） */
  senderName?: string;
  /** 已读人数（列表封装统一 `?? 0` 归一，调用方按必有值使用） */
  readCount: number;
}

/** 将后端 Unix 秒时间戳统一转换为毫秒 */
function toMs(sec: number | null | undefined): number {
  return sec ? sec * 1000 : 0;
}

/** 朋友圈媒体 */
export type ImMomentMedia = CoreIm.ImMomentMedia;

/** 朋友圈动态信息 */
export type ImMomentInfo = CoreIm.ImMomentInfo;

/** 朋友圈评论信息 */
export type ImMomentCommentInfo = CoreIm.ImMomentCommentInfo;

/**
 * 获取会话列表
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getConversationList(page = 1, pageSize = 20) {
  return CoreIm.postApiV1ImConversationGetList({ page, pageSize }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((c) => ({
      ...c,
      createdTime: toMs(c.createdTime),
      lastMsgTime: toMs(c.lastMsgTime),
      updatedTime: toMs(c.updatedTime),
    })),
  }));
}

/**
 * 获取会话详情
 * @param conversationId 会话 ID
 */
export function getConversation(conversationId: number) {
  return CoreIm.postApiV1ImConversationGet({ conversationId }).then((res) => ({
    ...res,
    info: res.info
      ? {
          ...res.info,
          createdTime: toMs(res.info.createdTime),
          lastMsgTime: toMs(res.info.lastMsgTime),
          updatedTime: toMs(res.info.updatedTime),
        }
      : res.info,
  }));
}

/**
 * 按两个参与者查询单聊会话
 * @param userID1 参与者 1
 * @param userID2 参与者 2
 */
export function getConversationByParticipants(userID1: number, userID2: number) {
  return CoreIm.postApiV1ImConversationGetByParticipants({ userID1, userID2 });
}

/**
 * 创建会话
 * @param type 会话类型
 * @param participants 参与者列表
 * @param name 群名称（可选）
 */
export function createConversation(type: string, participants: ImParticipant[], name?: string) {
  return CoreIm.postApiV1ImConversationCreate({
    type,
    name,
    participants,
  });
}

/**
 * 邀请成员加入群聊
 * @param conversationId 会话 ID
 * @param participants 待邀请参与者列表
 */
export function addConversationMembers(conversationId: number, participants: ImParticipant[]) {
  return CoreIm.postApiV1ImConversationAddMembers({ conversationId, participants });
}

/**
 * 移除/退出群聊成员
 * @param conversationId 会话 ID
 * @param participantType 成员类型
 * @param participantId 成员 ID
 */
export function removeConversationMember(conversationId: number, participantType: string, participantId: string) {
  return CoreIm.postApiV1ImConversationRemoveMember({
    conversationId,
    participantType,
    participantId,
  }).then(() => undefined);
}

/**
 * 转让群聊群主
 * @param conversationId 会话 ID
 * @param newOwnerID 新群主用户 ID
 */
export function transferConversationOwner(conversationId: number, newOwnerID: number) {
  return CoreIm.postApiV1ImConversationTransferOwner({
    conversationId,
    newOwnerID,
  }).then(() => undefined);
}

/**
 * 禁言/取消禁言群聊成员
 * @param conversationId 会话 ID
 * @param participantType 成员类型
 * @param participantId 成员 ID
 * @param isMuted 是否禁言：0-取消禁言 1-禁言
 */
export function muteConversationMember(conversationId: number, participantType: string, participantId: string, isMuted: number) {
  return CoreIm.postApiV1ImConversationMuteMember({
    conversationId,
    participantType,
    participantId,
    isMuted,
  }).then(() => undefined);
}

/**
 * 解散群聊
 * @param conversationId 会话 ID
 */
export function disbandConversation(conversationId: number) {
  return CoreIm.postApiV1ImConversationDisband({ conversationId }).then(() => undefined);
}

/**
 * 设置/取消设置群聊管理员
 * @param conversationId 会话 ID
 * @param participantType 成员类型
 * @param participantId 成员 ID
 * @param isAdmin 是否设为管理员：0-取消 1-设置
 */
export function setConversationAdmin(conversationId: number, participantType: string, participantId: string, isAdmin: number) {
  return CoreIm.postApiV1ImConversationSetAdmin({
    conversationId,
    participantType,
    participantId,
    isAdmin,
  }).then(() => undefined);
}

/**
 * 获取会话成员列表
 * @param conversationId 会话 ID
 */
export function getConversationMembers(conversationId: number) {
  return CoreIm.postApiV1ImConversationGetMembers({ conversationId });
}

/**
 * 更新会话设置（置顶/免打扰/删除）
 * @param conversationId 会话 ID
 * @param settings 设置项：isPinned / isMuted / isDeleted，-1 表示不更新
 */
export function updateConversationSetting(
  conversationId: number,
  settings: {
    isDeleted?: number;
    isMuted?: number;
    isPinned?: number;
  },
) {
  return CoreIm.postApiV1ImConversationUpdateSetting({
    conversationId,
    isPinned: settings.isPinned ?? -1,
    isMuted: settings.isMuted ?? -1,
    isDeleted: settings.isDeleted ?? -1,
  }).then(() => undefined);
}

/**
 * 搜索聊天记录
 * @param keyword 搜索关键词
 * @param conversationId 会话 ID（可选，不传则搜索全部会话）
 * @param page 页码
 * @param pageSize 每页数量
 */
export function searchMessages(keyword: string, conversationId?: number, page = 1, pageSize = 20) {
  return CoreIm.postApiV1ImChatlogSearch({
    keyword,
    conversationId: conversationId ?? 0,
    page,
    pageSize,
  }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((m) => ({
      ...m,
      readCount: (m as any).readCount ?? 0,
      sendTime: toMs(m.sendTime),
    })),
  }));
}

/**
 * 获取消息列表
 * @param conversationId 会话 ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getMessageList(conversationId: number, page = 1, pageSize = 20) {
  return CoreIm.postApiV1ImChatlogGetList({ conversationId, page, pageSize }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((m) => ({
      ...m,
      readCount: (m as any).readCount ?? 0,
      sendTime: toMs(m.sendTime),
    })),
  }));
}

/**
 * 按游标增量同步会话消息（对齐 WuKongIM message/sync 思路，见 22 号评估文档行动项 1）
 * @param conversationId 会话 ID
 * @param lastSeq 本地已同步的最大消息序号，0 表示全量
 * @param limit 单次拉取上限
 */
export function syncMessages(conversationId: number, lastSeq = 0, limit = 100) {
  return CoreIm.postApiV1ImChatlogSync({ conversationId, lastSeq, limit }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((m) => ({
      ...m,
      readCount: (m as any).readCount ?? 0,
      sendTime: toMs(m.sendTime),
    })),
  }));
}

/**
 * 发送消息
 * @param conversationId 会话 ID
 * @param content 消息内容
 * @param clientMsgId 客户端消息 ID
 * @param extra 扩展字段
 * @param msgType 消息类型
 * @param isAtAll 是否 @全体成员
 * @param mentionUserIDs 提及用户 ID 列表
 */
export function sendMessage(
  conversationId: number,
  content: string,
  clientMsgId?: string,
  extra?: string,
  msgType = 'text',
  isAtAll: number = 0,
  mentionUserIDs: number[] = [],
) {
  return CoreIm.postApiV1ImMessageSend({
    clientMsgId,
    content,
    conversationId,
    extra,
    msgType,
    isAtAll,
    mentionUserIDs,
  });
}

/**
 * 标记会话已读
 * @param conversationId 会话 ID
 * @param readSeq 已读 Seq（可选）
 */
export function markRead(conversationId: number, readSeq?: number) {
  return CoreIm.postApiV1ImChatlogMarkRead({ conversationId, readSeq }).then(() => undefined);
}

/**
 * 撤回消息
 * @param conversationId 会话 ID
 * @param msgId 消息 ID
 */
export function recallMessage(conversationId: number, msgId: number) {
  return CoreIm.postApiV1ImMessageRecall({ conversationId, msgId }).then(() => undefined);
}

/**
 * 获取朋友圈动态列表
 * @param page 页码
 * @param pageSize 每页数量
 * @param filterUserID 按发布人过滤（可选）
 * @param filterProjectID 按项目过滤（可选）
 */
export function getMomentList(page = 1, pageSize = 20, filterUserID?: number, filterProjectID?: number) {
  return CoreIm.postApiV1ImMomentList({
    filterProjectID,
    filterUserID,
    page,
    pageSize,
  }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((m) => ({
      ...m,
      createdTime: toMs(m.createdTime),
      updatedTime: toMs(m.updatedTime),
    })),
  }));
}

/**
 * 发布朋友圈动态
 * @param params 动态参数
 */
export function createMoment(params: {
  content: string;
  mediaList?: ImMomentMedia[];
  mentionUserIDs?: number[];
  projectIDs?: number[];
  visibility?: number;
  visibleUserIDs?: number[];
}) {
  return CoreIm.postApiV1ImMomentCreate({
    content: params.content,
    mediaList: params.mediaList ?? [],
    mentionUserIDs: params.mentionUserIDs ?? [],
    projectIDs: params.projectIDs ?? [],
    visibility: params.visibility ?? 0,
    visibleUserIDs: params.visibleUserIDs ?? [],
  });
}

/**
 * 获取动态详情
 * @param id 动态 ID
 */
export function getMomentDetail(id: number) {
  return CoreIm.postApiV1ImMomentGet({ id }).then((res) => ({
    ...res,
    comments: (res.comments ?? []).map((c) => ({
      ...c,
      createdTime: toMs(c.createdTime),
      updatedTime: toMs(c.updatedTime),
    })),
    info: res.info
      ? {
          ...res.info,
          createdTime: toMs(res.info.createdTime),
          updatedTime: toMs(res.info.updatedTime),
        }
      : res.info,
  }));
}

/**
 * 点赞动态
 * @param id 动态 ID
 */
export function likeMoment(id: number) {
  return CoreIm.postApiV1ImMomentLike({ id });
}

/**
 * 取消点赞动态
 * @param id 动态 ID
 */
export function unlikeMoment(id: number) {
  return CoreIm.postApiV1ImMomentUnlike({ id });
}

/**
 * 发表评论
 * @param id 动态 ID
 * @param content 评论内容
 * @param mentionUserIDs 提及用户 ID 列表
 */
export function createMomentComment(id: number, content: string, mentionUserIDs?: number[]) {
  return CoreIm.postApiV1ImMomentCommentCreate({
    content: { content, mentionUserIDs: mentionUserIDs ?? [] },
    id,
  });
}

/**
 * 删除朋友圈动态
 * @param id 动态 ID
 */
export function deleteMoment(id: number) {
  return CoreIm.postApiV1ImMomentDelete({ id }).then(() => undefined);
}

/** 好友信息（含用户资料） */
export type ImFriendInfo = CoreIm.ImFriendInfo;

/** 好友申请信息（含双方用户资料） */
export type ImFriendRequestInfo = CoreIm.ImFriendRequestInfo;

/**
 * 发起好友申请
 * @param recvUserID 被申请人用户 ID
 * @param reqMsg 申请留言
 */
export function applyFriend(recvUserID: number, reqMsg?: string) {
  return CoreIm.postApiV1ImFriendApply({ recvUserID, reqMsg: reqMsg ?? '' });
}

/**
 * 处理好友申请
 * @param requestID 申请记录 ID
 * @param handleResult 处理结果：1-同意 2-拒绝 3-忽略
 * @param handleMsg 处理留言
 */
export function handleFriendRequest(requestID: number, handleResult: number, handleMsg?: string) {
  return CoreIm.postApiV1ImFriendHandle({
    handleMsg: handleMsg ?? '',
    handleResult,
    requestID,
  }).then(() => undefined);
}

/**
 * 删除好友（双向删除）
 * @param friendUserID 好友用户 ID
 */
export function deleteFriend(friendUserID: number) {
  return CoreIm.postApiV1ImFriendDelete({ friendUserID }).then(() => undefined);
}

/**
 * 获取好友列表
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getFriendList(page = 1, pageSize = 200) {
  return CoreIm.postApiV1ImFriendGetList({ page, pageSize }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((f) => ({
      ...f,
      createdTime: toMs(f.createdTime),
    })),
  }));
}

/**
 * 获取好友申请列表
 * @param direction 方向：0-我收到的 1-我发起的
 * @param handleResult 处理结果过滤：-1-全部 0-待处理 1-同意 2-拒绝 3-忽略
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getFriendRequestList(direction = 0, handleResult = -1, page = 1, pageSize = 50) {
  return CoreIm.postApiV1ImFriendRequestGetList({
    direction,
    handleResult,
    page,
    pageSize,
  }).then((res) => ({
    ...res,
    list: (res.list ?? []).map((r) => ({
      ...r,
      createdTime: toMs(r.createdTime),
      updatedTime: toMs(r.updatedTime),
    })),
  }));
}

/**
 * 创建当前用户与指定 AI 分身（Clone）的单聊会话（已存在时复用）
 * @param cloneId AI 分身 ID
 */
export function createAIConversation(cloneId: number) {
  return CoreIm.postApiV1ImConversationCreateAi({ cloneId });
}

/** AI 分身信息（供通讯录/发起会话展示） */
export interface ImCloneInfo {
  /** 分身 ID */
  id: number;
  /** 分身名称 */
  name: string;
  /** 描述 */
  desc?: string;
  /** 状态：1 启用 2 禁用 */
  status?: number;
  /** 所属 CloneGroup ID（0=未分组） */
  cloneGroupID?: number;
  /** 所属 CloneGroup 名称 */
  cloneGroupName?: string;
}

/**
 * 查询当前租户可用的 AI 分身列表（启用状态）
 * @param page 页码
 * @param pageSize 每页大小
 */
export async function getCloneList(page = 1, pageSize = 50): Promise<{ list: ImCloneInfo[]; total: number }> {
  const resp: any = await CoreAi.postApiV1AiCloneGetList({ page: { page, pageSize } });
  const list = (resp?.list ?? []).map((c: any) => ({
    id: Number(c.id ?? 0),
    name: c.name ?? '',
    desc: c.desc ?? '',
    status: c.status,
    cloneGroupID: Number(c.cloneGroupID ?? 0),
    cloneGroupName: c.cloneGroupName ?? '',
  }));
  return { list, total: Number(resp?.total ?? list.length) };
}
