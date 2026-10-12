export interface NotifyConfigEntity {
  id: string;
  name: string;
  type: string;               // alarm / device-status / scene-trigger / system
  enabled: boolean;
  templateID: string;
}
