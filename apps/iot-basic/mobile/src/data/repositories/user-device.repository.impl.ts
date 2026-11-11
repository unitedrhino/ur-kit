/** 用户设备仓储，支持单设备和本人全局分享管理。 */
import { request } from '../../utils/request';
import type { IUserDeviceRepository } from '../../domain/interfaces/user-device.repository';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { DeviceShareEntity, DeviceShareUser } from '../../domain/entities/device-share.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { DeviceMapper } from '../mappers/device.mapper';
import { DeviceShareMapper } from '../mappers/device-share.mapper';

export class UserDeviceRepositoryImpl implements IUserDeviceRepository {
  /** getShareList 分页查询单设备或当前账号发出的跨项目分享。 */
  async getShareList(params: PageParams, device?: { productID?: string; deviceName?: string }): Promise<PageResult<DeviceShareEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/user/device/share/get-list',
      omitProjectContext: !device,
      data: {
        page: { page: params.page, size: params.size },
        device: device?.productID || device?.deviceName ? device : undefined,
        withUser: true,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(DeviceShareMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async searchShareUser(account: string, device: { productID: string; deviceName: string }): Promise<DeviceShareUser | null> {
    try {
      const resp = await request<Record<string, unknown>>({
        url: '/api/v1/things/user/device/share/user-search',
        data: { account, device },
      });
      if (!resp.userID) return null;
      return DeviceShareMapper.toUser(resp) || null;
    } catch {
      return null;
    }
  }

  async shareCreate(data: {
    productID: string;
    deviceName: string;
    sharedUserID: string;
    authType: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/user/device/share/create',
      data: {
        device: { productID: data.productID, deviceName: data.deviceName },
        sharedUserID: data.sharedUserID,
        authType: data.authType,
        schemaPerm: data.schemaPerm,
        accessPerm: data.accessPerm,
        expTime: data.expTime || undefined,
      },
    });
    return String(resp.id || '');
  }

  async shareUpdate(data: {
    id: string;
    authType?: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<void> {
    await request({ url: '/api/v1/things/user/device/share/update', data });
  }

  /** shareDelete 按分享记录撤销授权，不继承旧项目选择。 */
  async shareDelete(id: string): Promise<void> {
    await request({ url: '/api/v1/things/user/device/share/delete', omitProjectContext: true, data: { id } });
  }

  async shareBatchDelete(ids: string[], projectID?: string): Promise<void> {
    await request({
      url: '/api/v1/things/user/device/share/batch-delete',
      data: { ids, projectID: projectID || undefined },
    });
  }

  async getCollectList(params: PageParams): Promise<PageResult<DeviceEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/user/device/collect/get-list',
      data: { page: { page: params.page, size: params.size } },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(DeviceMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async collectCreate(productID: string, deviceName: string): Promise<void> {
    await request({
      url: '/api/v1/things/user/device/collect/batch-create',
      data: { devices: [{ productID, deviceName }] },
    });
  }

  async collectDelete(productID: string, deviceName: string): Promise<void> {
    await request({
      url: '/api/v1/things/user/device/collect/batch-delete',
      data: { devices: [{ productID, deviceName }] },
    });
  }
}
