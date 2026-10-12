import { CoreApi } from '@vben/api';

export const Api = {
  /**
   * 查询用户消息列表
   */
  async list(params: CoreApi.UserMessageGetListReq) {
    return await CoreApi.postApiV1SystemUserSelfMessageGetList(params);
  },

  // 用户消息批量已读
  async multiIsRead(params: CoreApi.IDList) {
    return await CoreApi.postApiV1SystemUserSelfMessageMultiIsRead(params);
  },
};
