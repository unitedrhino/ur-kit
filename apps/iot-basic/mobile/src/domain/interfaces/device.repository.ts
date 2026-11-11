/** 设备仓储合同：设备查询、绑定及资料更新，区分项目设备和收到的分享。 */
import type { DeviceEntity } from '../entities/device.entity';
import type { GeoPoint } from '../models/location.model';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface DeviceListParams extends PageParams {
  /** sharedOnly 只查询当前账号收到的设备分享，不使用当前项目请求头。 */
  sharedOnly?: boolean;
  /** includeShared 仅由微信小程序在负责人项目中启用，合并当前账号收到的共享设备。 */
  includeShared?: boolean;
  /** projectID 显式指定要查询的项目；空值使用当前项目。 */
  projectID?: string;
  /** areaID 只查询指定区域的设备，不包含子区域。 */
  areaID?: string;
  /** areaIDs 查询指定区域集合，ID 保持字符串精度。 */
  areaIDs?: string[];
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

/** IDeviceNetworkRepository 重新核验设备真实项目归属及当前用户的网络管理权限。 */
export interface IDeviceNetworkRepository {
  /** authorize 仅按设备身份查询，返回是否允许管理网络；查询失败应拒绝入口。 */
  authorize(target: Pick<DeviceEntity, 'productID' | 'deviceName'>): Promise<{ allowed: boolean }>;
}
