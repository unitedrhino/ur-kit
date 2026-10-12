import { request } from '../../utils/request';
import type { INotifyRepository } from '../../domain/interfaces/notify.repository';
import type { NotifyConfigEntity } from '../../domain/entities/notify-config.entity';

export class NotifyRepositoryImpl implements INotifyRepository {
  async getConfigs(): Promise<NotifyConfigEntity[]> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/system/notify/config/get-list',
    });
    return ((resp.list || []) as Record<string, unknown>[]).map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || ''),
      type: String(item.type || ''),
      enabled: Boolean(item.enabled),
      templateID: String(item.templateID || ''),
    }));
  }

  async updateConfig(id: string, enabled: boolean): Promise<void> {
    await request({ url: '/api/v1/system/notify/config/update', data: { id, enabled } });
  }
}
