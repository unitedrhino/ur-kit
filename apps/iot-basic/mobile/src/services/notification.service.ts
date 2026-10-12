import { NotifyRepositoryImpl } from '../data/repositories/notify.repository.impl';
import { subscribeMsgDataSource } from '../data/datasources/subscribe-msg.datasource';
import type { INotifyRepository } from '../domain/interfaces/notify.repository';
import type { NotifyConfigEntity } from '../domain/entities/notify-config.entity';

export class NotificationService {
  constructor(private readonly notifyRepo: INotifyRepository = new NotifyRepositoryImpl()) {}

  async getConfigs(): Promise<NotifyConfigEntity[]> {
    return this.notifyRepo.getConfigs();
  }

  async updateConfig(id: string, enabled: boolean): Promise<void> {
    return this.notifyRepo.updateConfig(id, enabled);
  }

  async requestSubscribe(configs: NotifyConfigEntity[]): Promise<Record<string, string>> {
    const templateIds = configs.filter((c) => c.enabled && c.templateID).map((c) => c.templateID);
    if (templateIds.length === 0) return {};
    return subscribeMsgDataSource.requestSubscribe(templateIds);
  }
}

export const notificationService = new NotificationService();
