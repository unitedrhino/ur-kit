/** 文件说明：面板服务所需的平台解析、完整包缓存与本地已授权传输接口。 */
import type {
  DevicePanelResolution,
  DevicePanelSnapshot,
} from "../models/device-panel.model";
/** IDevicePanelRepository 封装认证请求及账号隔离缓存，不向 UI 公开 HTTP DTO。 */
export interface IDevicePanelRepository extends PanelCloudOperations {
  resolve(
    productID: string,
    deviceName: string,
    platform: string,
  ): Promise<DevicePanelResolution>;
  accountScope(): string;
  install(snapshot: DevicePanelSnapshot): Promise<DevicePanelSnapshot>;
  cached(
    productID: string,
    deviceName: string,
  ): Promise<DevicePanelSnapshot | null>;
  invalidate(productID: string, deviceName: string): Promise<void>;
}
/** PanelCloudOperations 保留真实属性元数据和异步设备回执，资源授权不替代控制鉴权。 */
export interface PanelCloudOperations {
  /** auth 返回运行期平台地址和认证头；不得持久化到设备面板快照。 */
  auth(): Promise<{ baseURL: string; headers: Record<string, string> }>;
  /** requestApi 调用平台现有 POST 接口，业务鉴权与错误语义由平台请求层保留。 */
  requestApi(path: string, data: Record<string, unknown>): Promise<unknown>;
  /** read 使用字段类型保留原始文本；onStatus 接收同次设备查询的有效状态。 */
  read(
    productID: string,
    deviceName: string,
    identifiers: string[],
    types?: Record<string, string>,
    onStatus?: (status: number) => void,
  ): Promise<Record<string, unknown>>;
  write(
    productID: string,
    deviceName: string,
    values: Record<string, unknown>,
  ): Promise<string>;
  action(
    productID: string,
    deviceName: string,
    identifier: string,
    params: Record<string, unknown>,
  ): Promise<string>;
  command(
    productID: string,
    deviceName: string,
    commandID: string,
    action: boolean,
  ): Promise<Record<string, unknown>>;
}
