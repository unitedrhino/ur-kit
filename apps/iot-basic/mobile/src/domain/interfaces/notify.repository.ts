import type { NotifyConfigEntity } from '../entities/notify-config.entity';

export interface INotifyRepository {
  getConfigs(): Promise<NotifyConfigEntity[]>;
  updateConfig(id: string, enabled: boolean): Promise<void>;
}
