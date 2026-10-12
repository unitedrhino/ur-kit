export interface DeviceGroupEntity {
  id: string;
  parentID: string;
  name: string;
  desc: string;
  tags: Record<string, string>;
  deviceCount: number;
  createdTime: number;
}
