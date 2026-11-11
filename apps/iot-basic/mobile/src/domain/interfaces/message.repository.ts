import type { MessageRecordEntity } from '../entities/message.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

/** 用户消息仓储：封装当前账号的消息列表、统计和已读操作。 */
export interface IMessageRepository {
  getList(params: PageParams): Promise<PageResult<MessageRecordEntity>>;
  getStatistics(): Promise<{ totalUnread: number }>;
  markRead(ids: string[]): Promise<void>;
  markAllRead(): Promise<void>;
}
