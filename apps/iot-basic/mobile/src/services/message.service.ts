/** 用户消息服务：为消息中心提供列表、未读统计和已读能力。 */
import { MessageRepositoryImpl } from '../data/repositories/message.repository.impl';
import type { IMessageRepository } from '../domain/interfaces/message.repository';
import type { MessageRecordEntity } from '../domain/entities/message.entity';
import type { PageResult } from '../domain/models/page-state.model';

export class MessageService {
  constructor(private readonly repository: IMessageRepository = new MessageRepositoryImpl()) {}

  /** 获取一页当前账号消息。 */
  getList(page: number, size: number, isRead?: number): Promise<PageResult<MessageRecordEntity>> {
    return this.repository.getList({ page, size, isRead });
  }

  /** 将指定消息标记为已读。 */
  markRead(ids: string[]): Promise<void> {
    return this.repository.markRead(ids);
  }

  /** 获取当前账号未读总数。 */
  getStatistics(): Promise<{ totalUnread: number }> {
    return this.repository.getStatistics();
  }

  /** 将全部消息标记为已读。 */
  markAllRead(): Promise<void> {
    return this.repository.markAllRead();
  }
}

export const messageService = new MessageService();
