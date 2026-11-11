/** 设备仓储：按后端权限查询设备，并使用精确共享列表标记收到的分享。 */
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
import { getRequestContext } from '../../utils/request-context';

function toBindTokenInfo(resp: Record<string, unknown>): DeviceBindTokenInfo {
  return {
    token: String(resp.token || resp.bindToken || ''),
    status: Number(resp.status || 0),
  };
}

export class DeviceRepositoryImpl implements IDeviceRepository {
  /** getList 分页查询设备；仅将跨项目收到的分享标记为共享，当前项目本属设备不重复标记。 */
  async getList(params: DeviceListParams): Promise<PageResult<DeviceEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/get-list',
      omitProjectContext: params.sharedOnly === true || !!params.projectID,
      header: params.projectID && !params.sharedOnly ? { 'ithings-project-id': params.projectID } : undefined,
      data: {
        page: { page: params.page, size: params.size },
        // 负责人项目由小程序显式要求合并分享；H5 不传该字段，保持现有查询行为。
        withShared: params.sharedOnly ? 2 : params.includeShared ? 1 : 0,
        areaID: params.areaID,
        areaIDs: params.areaIDs,
        groupID: params.groupID,
        productID: params.productID,
        deviceName: params.deviceName,
        status: params.status,
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(DeviceMapper.toEntity);
    if (params.sharedOnly) {
      return { list: list.map((device) => ({ ...device, isShared: true })), total: Number(resp.total || 0) };
    }
    if (!list.length) return { list, total: Number(resp.total || 0) };
    // 只校验当前页设备，不按项目不同推断，也不下载全部分享记录。
    const received = await request<{ list?: Array<{ productID: string; deviceName: string }> }>({
      url: '/api/v1/things/device/info/get-list',
      omitProjectContext: true,
      data: { withShared: 2, devices: list.map(({ productID, deviceName }) => ({ productID, deviceName })), page: { page: 1, size: params.size } },
    });
    // 同名设备必须同时匹配产品，避免跨产品误标共享。
    const sharedKeys = new Set((received.list || []).map((device) => JSON.stringify([device.productID, device.deviceName])));
    // 设备已经归属于当前项目时，项目本身的设备身份优先，不显示重复的分享标识；跨项目合并进来的设备才显示共享 Logo。
    const currentProjectID = String(params.projectID || getRequestContext().projectID || '');
    return {
      list: list.map((device) => ({
        ...device,
        isShared: sharedKeys.has(JSON.stringify([device.productID, device.deviceName]))
          && (!currentProjectID || String(device.projectID || '') !== currentProjectID),
      })),
      total: Number(resp.total || 0),
    };
  }

  /** getOne 查询详情并确认当前账号是否通过设备分享获得访问权，供页面禁止二次分享。 */
  async getOne(productID: string, deviceName: string): Promise<DeviceEntity> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/info/get-one',
      data: { productID, deviceName },
    });
    // 详情不能沿用列表中可能缺失的分享标识，独立进入详情时也必须按实际关系确认。
    const received = await request<{ list?: Array<{ productID: string; deviceName: string }> }>({
      url: '/api/v1/things/device/info/get-list',
      omitProjectContext: true,
      data: { withShared: 2, devices: [{ productID, deviceName }], page: { page: 1, size: 1 } },
    });
    const currentProjectID = String(getRequestContext().projectID || '');
    return {
      ...DeviceMapper.toEntity(resp),
      isShared: (!currentProjectID || String(resp.projectID || '') !== currentProjectID)
        && (received.list || []).some((device) => device.productID === productID && device.deviceName === deviceName),
    };
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
