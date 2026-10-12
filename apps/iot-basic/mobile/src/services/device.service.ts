import { DeviceRepositoryImpl } from '../data/repositories/device.repository.impl';
import { ProductRepositoryImpl } from '../data/repositories/product.repository.impl';
import type { DeviceEntity } from '../domain/entities/device.entity';
import type {
  IDeviceRepository,
  DeviceBindTokenInfo,
  DeviceListParams,
  DeviceUpdateData,
} from '../domain/interfaces/device.repository';
import type { IProductRepository } from '../domain/interfaces/product.repository';
import type { PageResult } from '../domain/models/page-state.model';
import { isApiError } from '../utils/request';

/** 后端业务码：设备已被他人绑定。 */
const BIND_OWNED_BY_OTHER_CODE = 2000007;
/** 弱绑定（bindLevel=3）解绑后等待云端状态同步的延迟，与配网链路保持一致。 */
const REBIND_AFTER_UNBIND_DELAY_MS = 800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DeviceService {
  constructor(
    private readonly deviceRepo: IDeviceRepository = new DeviceRepositoryImpl(),
    private readonly productRepo: IProductRepository = new ProductRepositoryImpl(),
  ) {}

  async getList(params: DeviceListParams): Promise<PageResult<DeviceEntity>> {
    return this.deviceRepo.getList(params);
  }

  async getDetail(productID: string, deviceName: string): Promise<DeviceEntity> {
    return this.deviceRepo.getOne(productID, deviceName);
  }

  async createBindToken(): Promise<DeviceBindTokenInfo> {
    return this.deviceRepo.createBindToken();
  }

  async getBindTokenStatus(token: string): Promise<DeviceBindTokenInfo> {
    return this.deviceRepo.getBindTokenStatus(token);
  }

  async bind(productID: string, deviceName: string, token?: string): Promise<void> {
    await this.deviceRepo.bind(productID, deviceName, token);
  }

  /**
   * 扫码/手动绑定入口：调用 bind，遇到 code=2000007（已被他人绑定）时按 bindLevel 处理：
   * - level=3 弱绑定：自动 unbind + 等待 800ms + 重新 bind
   * - level=1/2：抛出「设备已被他人绑定」错误
   * 其它错误原样抛出。
   */
  async bindWithLevelHandling(productID: string, deviceName: string): Promise<void> {
    try {
      await this.deviceRepo.bind(productID, deviceName);
      return;
    } catch (error) {
      if (!isApiError(error) || error.code !== BIND_OWNED_BY_OTHER_CODE) {
        throw error;
      }
      const level = await this.getProductBindLevel(productID);
      if (level === 3) {
        await this.deviceRepo.unbind(productID, deviceName);
        await delay(REBIND_AFTER_UNBIND_DELAY_MS);
        await this.deviceRepo.bind(productID, deviceName);
        return;
      }
      throw new Error('设备已被他人绑定');
    }
  }

  async unbind(productID: string, deviceName: string): Promise<void> {
    await this.deviceRepo.unbind(productID, deviceName);
  }

  /** 更新设备信息（部分字段更新）。 */
  async update(data: DeviceUpdateData): Promise<void> {
    await this.deviceRepo.update(data);
  }

  /** 删除设备 = 解绑当前用户与设备的关系。 */
  async delete(productID: string, deviceName: string): Promise<void> {
    await this.deviceRepo.unbind(productID, deviceName);
  }

  async getProductInfo(productID: string) {
    return this.productRepo.getOne(productID);
  }

  /**
   * 读取产品的绑定等级（1=强 / 2=中 / 3=弱），失败时降级为 1（强绑定，最保守）。
   */
  async getProductBindLevel(productID: string): Promise<number> {
    try {
      const info = await this.productRepo.getOne(productID);
      return Number(info.bindLevel) || 1;
    } catch {
      return 1;
    }
  }
}

export const deviceService = new DeviceService();
