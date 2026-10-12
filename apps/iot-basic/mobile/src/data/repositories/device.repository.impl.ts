import { request } from '../../utils/request';
import type {
  DeviceBindTokenInfo,
  DeviceUpdateData,
  IDeviceRepository,
  DeviceListParams,
} from '../../domain/interfaces/device.repository';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { PageResult } from '../../domain/models/page-state.model';
import { DeviceMapper } from '../mappers/device.mapper';

function toBindTokenInfo(resp: Record<string, unknown>): DeviceBindTokenInfo {
  return {
    token: String(resp.token || resp.bindToken || ''),
    status: Number(resp.status || 0),
  };
}

export class DeviceRepositoryImpl implements IDeviceRepository {
  async getList(params: DeviceListParams): Promise<PageResult<DeviceEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/get-list',
      data: {
        page: { page: params.page, size: params.size },
        groupID: params.groupID,
        productID: params.productID,
        deviceName: params.deviceName,
        status: params.status,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(DeviceMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  async getOne(productID: string, deviceName: string): Promise<DeviceEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/get-one',
      data: { productID, deviceName },
    });
    return DeviceMapper.toEntity(resp);
  }

  async createBindToken(): Promise<DeviceBindTokenInfo> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/bind/token/create',
      data: {},
    });
    return toBindTokenInfo(resp);
  }

  async getBindTokenStatus(token: string): Promise<DeviceBindTokenInfo> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/bind/token/get-one',
      data: { token },
    });
    return toBindTokenInfo(resp);
  }

  async bind(productID: string, deviceName: string, token?: string): Promise<void> {
    await request({
      url: '/api/v1/things/device/info/bind',
      data: {
        device: { productID, deviceName },
        token,
      },
    });
  }

  async unbind(productID: string, deviceName: string): Promise<void> {
    await request({ url: '/api/v1/things/device/info/unbind', data: { productID, deviceName } });
  }

  async update(data: DeviceUpdateData): Promise<void> {
    const payload: Record<string, unknown> = {
      productID: data.productID,
      deviceName: data.deviceName,
    };
    if (data.deviceAlias !== undefined) payload.deviceAlias = data.deviceAlias;
    if (data.areaID !== undefined) payload.areaID = data.areaID;
    if (data.address !== undefined) payload.address = data.address;
    if (data.position !== undefined) payload.position = data.position;
    if (data.desc !== undefined) payload.desc = data.desc;
    if (data.tags !== undefined) payload.tags = data.tags;
    await request({ url: '/api/v1/things/device/info/update', data: payload });
  }
}
