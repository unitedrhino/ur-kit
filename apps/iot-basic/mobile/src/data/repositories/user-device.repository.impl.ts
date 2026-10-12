import { request } from '../../utils/request';
import type { IUserDeviceRepository } from '../../domain/interfaces/user-device.repository';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { PageResult, PageParams } from '../../domain/models/page-state.model';
import { DeviceMapper } from '../mappers/device.mapper';

export class UserDeviceRepositoryImpl implements IUserDeviceRepository {
  async getShareList(params: PageParams): Promise<PageResult<DeviceEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/user/device/share/get-list',
      data: { page: { page: params.page, size: params.size } },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(DeviceMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async shareCreate(productID: string, deviceName: string, userID: string): Promise<void> {
    await request({ url: '/api/v1/things/user/device/share/create', data: { productID, deviceName, userID } });
  }

  async shareDelete(id: string): Promise<void> {
    await request({ url: '/api/v1/things/user/device/share/delete', data: { id } });
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
    await request({ url: '/api/v1/things/user/device/collect/multi-create', data: { list: [{ productID, deviceName }] } });
  }

  async collectDelete(productID: string, deviceName: string): Promise<void> {
    await request({ url: '/api/v1/things/user/device/collect/delete', data: { productID, deviceName } });
  }
}
