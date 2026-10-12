import type { DeviceEntity } from '../entities/device.entity';
import type { GeoPoint } from '../models/location.model';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface DeviceListParams extends PageParams {
  groupID?: string;
  productID?: string;
  deviceName?: string;
  status?: number;
}

export interface DeviceBindTokenInfo {
  token: string;
  status: number;
}

export interface IDeviceRepository {
  getList(params: DeviceListParams): Promise<PageResult<DeviceEntity>>;
  getOne(productID: string, deviceName: string): Promise<DeviceEntity>;
  createBindToken(): Promise<DeviceBindTokenInfo>;
  getBindTokenStatus(token: string): Promise<DeviceBindTokenInfo>;
  bind(productID: string, deviceName: string, token?: string): Promise<void>;
  unbind(productID: string, deviceName: string): Promise<void>;
  update(data: DeviceUpdateData): Promise<void>;
}

/** 设备信息更新数据，仅更新传入的字段。productID + deviceName 必填用于定位。 */
export interface DeviceUpdateData {
  productID: string;
  deviceName: string;
  deviceAlias?: string;
  areaID?: string;
  address?: string;
  position?: GeoPoint;
  desc?: string;
  tags?: Record<string, string>;
}
