/** 用户消息仓储实现：调用用户自有消息接口，不读取管理员消息目录。 */
import { request } from '../../utils/request';
import type { IMessageRepository } from '../../domain/interfaces/message.repository';
import type { MessageRecordEntity } from '../../domain/entities/message.entity';
import type { PageParams, PageResult } from '../../domain/models/page-state.model';

function toMessageEntity(dto: Record<string, unknown>): MessageRecordEntity {
  const detail = (dto.message && typeof dto.message === 'object' ? dto.message : {}) as Record<string, unknown>;
  return {
    id: String(dto.id || ''),
    messageID: String(dto.messageID || detail.id || ''),
    group: String(dto.group || detail.group || ''),
    type: String(dto.type || detail.type || 'message'),
    notifyCode: String(detail.notifyCode || ''),
    notifyName: String(detail.notifyName || detail.subject || ''),
    subject: String(detail.subject || '系统消息'),
    body: String(detail.body || ''),
    priority: Number(detail.priority || 3),
    isRead: Number(dto.isRead || 2),
    isHandled: Number(dto.isHandled || 2),
    notifyTime: Number(detail.notifyTime || dto.createdTime || 0),
    createdTime: Number(dto.createdTime || detail.createdTime || 0),
  };
}

export class MessageRepositoryImpl implements IMessageRepository {
  /** 分页读取当前账号的消息收件箱。 */
  async getList(params: PageParams): Promise<PageResult<MessageRecordEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/message/get-list',
      data: { page: { page: params.page, size: params.size }, ...(params.isRead ? { isRead: params.isRead } : {}) },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(toMessageEntity);
    return { list, total: Number(resp.total || 0) };
  }

  /** 将指定消息标记为已读。 */
  async markRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await request({ url: '/api/v1/system/user/self/message/multi-is-read', data: { ids } });
  }

  /** 读取当前账号的未读消息数量。 */
  async getStatistics(): Promise<{ totalUnread: number }> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/user/self/message/statistics',
      data: {},
    });
    return { totalUnread: Number(resp.totalUnread || 0) };
  }

  /** 将当前账号的全部消息标记为已读。 */
  async markAllRead(): Promise<void> {
    await request({
      url: '/api/v1/system/user/self/message/mark-all-read',
      data: {},
    });
  }
}
