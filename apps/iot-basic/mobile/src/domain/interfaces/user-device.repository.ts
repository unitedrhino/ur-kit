import type { DeviceEntity } from '../entities/device.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IUserDeviceRepository {
  getShareList(params: PageParams): Promise<PageResult<DeviceEntity>>;
  shareCreate(productID: string, deviceName: string, userID: string): Promise<void>;
  shareDelete(id: string): Promise<void>;
  getCollectList(params: PageParams): Promise<PageResult<DeviceEntity>>;
  collectCreate(productID: string, deviceName: string): Promise<void>;
  collectDelete(productID: string, deviceName: string): Promise<void>;
}
