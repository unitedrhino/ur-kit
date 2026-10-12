/**
 * IM 音视频通话 REST API 封装
 *
 * 对应 imsvr 的 /api/v1/im/call/*，请求统一走 Swagger 生成的 CoreIm SDK；
 * 本文件只保留领域枚举与 payload JSON 归一。
 */
import { CoreIm } from '@vben/api';

/** 通话类型：语音 / 视频 */
export type ImCallType = 'video' | 'voice';

/** 通话范围：单聊 / 群聊 */
export type ImCallScope = 'group' | 'single';

/**
 * 上行信令类型（客户端 → 服务端）
 * 与 imsvr proto CallSignalReq.type 一一对应
 */
export type ImCallSignalType =
  | 'call_accept'
  | 'call_cancel'
  | 'call_end'
  | 'call_heartbeat'
  | 'call_invite'
  | 'call_reject'
  | 'device_call_end'
  | 'device_call_invite'
  | 'group_invite'
  | 'group_join'
  | 'group_leave'
  | 'media_state';

/**
 * 下行通话事件（服务端 → 客户端，经 WS im.push.call.signal 推送）
 * invite/created/accept/reject/cancel/end 为 1:1 通话控制；
 * timeout 振铃超时、busy 忙线、peer.timeout 对端断线；
 * group.* / peer.* 为群通话事件；media_state 为静音/关摄像头同步
 */
export type ImCallEvent =
  | 'accept'
  | 'busy'
  | 'cancel'
  | 'created'
  | 'end'
  | 'group.invite'
  | 'group.roster'
  | 'group.state'
  | 'invite'
  | 'media_state'
  | 'peer.joined'
  | 'peer.left'
  | 'peer.timeout'
  | 'reject'
  | 'timeout';

/** 通话结束原因（与后端 EndReason 六值一致） */
export type ImCallEndReason = 'busy' | 'canceled' | 'completed' | 'failed' | 'no_answer' | 'rejected';

/** 通话信令请求（上行） */
export interface ImCallSignalReq {
  /** 信令类型，决定语义 */
  type: ImCallSignalType;
  /** 通话 ID（invite 时由服务端生成返回，后续信令必带） */
  callId?: string;
  /** 通话类型：voice / video */
  callType?: ImCallType;
  /** 关联 IM 会话 ID */
  conversationId?: number;
  /** 1:1 被叫 participant_id */
  calleeId?: string;
  /** 群通话邀请名单（participant_id 列表） */
  members?: string[];
  /** media_state 定向目标（空=对端/全员） */
  to?: string;
  /** 扩展内容（media_state 的 mute/video 状态 JSON、device_call_invite 的 SDP offer 字符串） */
  payload?: Record<string, any> | string;
}

/** 群通话参与者信息（roster / group.state 名单项） */
export interface ImCallParticipant {
  /** 参与者用户 ID */
  userId: string;
  /** 该参与者的 ZLM 流 ID（缺失时按 call_{callId}_{userId} 推导） */
  streamId?: string;
}

/** 通话信令响应（下行，REST 回执） */
export interface ImCallSignalResp {
  /** 通话 ID */
  callId?: string;
  /** 通话状态：inviting / connected / ended... */
  state?: string;
  /** 对应下行事件名 */
  event?: ImCallEvent | string;
  /** 下行 payload（JSON 字符串或对象，含 members、streamId、duration 等） */
  payload?: Record<string, any> | string;
  /** 服务端需推送的用户（ apisvr 内部使用，前端无需消费） */
  notifyUserIds?: number[];
  /** 当前用户的 ZLM 推流地址（accept/join 时返回） */
  zlmPushUrl?: string;
  /** ZLM HTTP 地址（前端 play 用） */
  zlmServer?: string;
}

/** 查询进行中通话响应 */
export interface ImCallActiveResp {
  /** 是否有进行中的通话 */
  active?: boolean;
  /** 通话 ID */
  callId?: string;
  /** 通话类型 */
  callType?: ImCallType;
  /** 当前参与者 userId 列表 */
  participantIds?: string[];
}

/**
 * 发送通话信令（上行统一入口）
 * @param req 信令请求
 */
export function callSignal(req: ImCallSignalReq) {
  const payload = typeof req.payload === 'string' ? req.payload : req.payload === undefined ? undefined : JSON.stringify(req.payload);
  return CoreIm.postApiV1ImCallSignal({ ...req, payload });
}

/**
 * 查询指定会话进行中的通话（进入群聊时补拉横幅状态）
 * @param conversationId 会话 ID
 */
export function getActiveCall(conversationId: number) {
  return CoreIm.getApiV1ImCallActive({ conversationId });
}
