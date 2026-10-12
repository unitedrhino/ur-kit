/**
 * IM 渠道绑定 REST API 薄封装（阶段 3：设备接入与渠道统一）。
 * 对应 imsvr 的 /api/v1/im/channel/*，底层统一调用 Swagger 生成的 CoreIm SDK。
 */
import { CoreIm } from '@vben/api';

/** 渠道端点绑定信息 */
export type ImChannelBindInfo = CoreIm.ImChannelBindInfo;

/** 绑定列表响应 */
export type ImChannelBindGetListResp = CoreIm.ImChannelBindGetListResp;

/** 绑定渠道端点（重复绑定幂等更新名称） */
export function channelBind(req: { channelId: string; channelName?: string; channelType: string }) {
  return CoreIm.postApiV1ImChannelBind(req);
}

/** 解绑渠道端点 */
export function channelUnbind(id: number) {
  return CoreIm.postApiV1ImChannelUnbind({ id });
}

/** 查询当前用户渠道绑定列表 */
export function channelBindGetList() {
  return CoreIm.postApiV1ImChannelGetList({});
}

/** 设置端点级免打扰 */
export function channelBindSetMute(id: number, isMuted: number) {
  return CoreIm.postApiV1ImChannelSetMute({ id, isMuted });
}
