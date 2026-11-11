/** 用户消息实体：对应当前用户消息接口返回的收件箱记录和消息详情。 */
export interface MessageRecordEntity {
  id: string;
  messageID: string;
  group: string;
  type: string;
  notifyCode: string;
  notifyName: string;
  subject: string;
  body: string;
  priority: number;
  isRead: number;
  isHandled: number;
  notifyTime: number;
  createdTime: number;
}
