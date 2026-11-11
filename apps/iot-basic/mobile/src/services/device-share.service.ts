/** 设备分享服务，按实际物模型展开基础控制授权。 */
import { DeviceInteractRepositoryImpl } from '../data/repositories/device-interact.repository.impl';
import type { IDeviceInteractRepository } from '../domain/interfaces/device-interact.repository';
import { buildBasicControlPermissions } from '../domain/models/device-share-permission.model';
import { UserDeviceRepositoryImpl } from '../data/repositories/user-device.repository.impl';
import type { DeviceShareEntity, DeviceShareUser } from '../domain/entities/device-share.entity';
import type { PageResult } from '../domain/models/page-state.model';

const deviceShareRepo = new UserDeviceRepositoryImpl();

/**
 * 设备分享服务，负责把页面输入转换成后端分享合同并统一处理过期时间。
 */
export class DeviceShareService {
  /** constructor 注入物模型读取接口，默认使用当前端的正式仓储。 */
  constructor(private readonly modelRepo: Pick<IDeviceInteractRepository, 'getThingModel'> = new DeviceInteractRepositoryImpl()) {}
  /** 分页读取指定设备的分享关系列表。 */
  async getList(page: number, size: number, productID?: string, deviceName?: string): Promise<PageResult<DeviceShareEntity>> {
    return deviceShareRepo.getShareList(
      { page, size },
      productID || deviceName ? { productID, deviceName } : undefined,
    );
  }

  /** 按账号精准搜索可被分享的用户。 */
  async searchUser(account: string, productID: string, deviceName: string): Promise<DeviceShareUser | null> {
    return deviceShareRepo.searchShareUser(account.trim(), { productID, deviceName });
  }

  /** 创建设备分享关系。expTime 使用毫秒时间戳字符串。 */
  async create(data: {
    productID: string;
    deviceName: string;
    sharedUserID: string;
    authType: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<string> {
    if (data.authType === 2 && data.schemaPerm === undefined) {
      // 基础控制是页面分组，必须展开成后端识别的功能标识，禁止用 baseControl 作为权限键。
      const model = await this.modelRepo.getThingModel(data.productID);
      const schemaPerm = buildBasicControlPermissions(model);
      if (!Object.keys(schemaPerm).length) throw new Error('该设备暂无可授权的基础功能');
      return deviceShareRepo.shareCreate({ ...data, schemaPerm });
    }
    return deviceShareRepo.shareCreate(data);
  }

  /** 更新设备分享权限和有效期。 */
  async update(data: {
    id: string;
    authType?: number;
    schemaPerm?: Record<string, { perm: number }>;
    accessPerm?: Record<string, { perm: number }>;
    expTime?: string;
  }): Promise<void> {
    return deviceShareRepo.shareUpdate(data);
  }

  /** 撤销单条设备分享。 */
  async remove(id: string): Promise<void> {
    return deviceShareRepo.shareDelete(id);
  }

  /** 批量撤销设备分享。 */
  async removeMany(ids: string[], projectID?: string): Promise<void> {
    return deviceShareRepo.shareBatchDelete(ids, projectID);
  }
}

export const deviceShareService = new DeviceShareService();
