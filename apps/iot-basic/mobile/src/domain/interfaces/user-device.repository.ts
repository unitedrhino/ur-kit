import type { DeviceEntity } from '../entities/device.entity';
import type { DeviceShareEntity, DeviceShareUser } from '../entities/device-share.entity';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface IUserDeviceRepository {
  getShareList(params: PageParams, device?: { productID?: string; deviceName?: string }): Promise<PageResult<DeviceShareEntity>>;
  searchShareUser(account: string, device: { productID: string; deviceName: string }): Promise<DeviceShareUser | null>;
  shareCreate(data: {
    productID: string;
    deviceName: string;
    sharedUserID: string;
    authType: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<string>;
  shareUpdate(data: {
    id: string;
    authType?: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<void>;
  shareDelete(id: string): Promise<void>;
  shareBatchDelete(ids: string[], projectID?: string): Promise<void>;
  getCollectList(params: PageParams): Promise<PageResult<DeviceEntity>>;
  collectCreate(productID: string, deviceName: string): Promise<void>;
  collectDelete(productID: string, deviceName: string): Promise<void>;
}
