/** 文件说明：面板解析、账号范围缓存编排；离线只读缓存，命令不自动重放。 */
import { DevicePanelRepositoryImpl } from "../data/repositories/device-panel.repository.impl";
import type { IDevicePanelRepository } from "../domain/interfaces/device-panel.repository";
import type { DeviceControlModel } from "../domain/models/device-control.model";
import type { DevicePanelSnapshot } from "../domain/models/device-panel.model";
/** DevicePanelService 接受接口注入以测试断网、损坏包、撤销和跨账号行为。 */
export class DevicePanelService {
  constructor(
    private readonly repository: IDevicePanelRepository = new DevicePanelRepositoryImpl(),
  ) {}
  /** accountScope 返回当前账号的稳定隔离标识，仅宿主使用。 */
  accountScope() {
    return this.repository.accountScope();
  }
  /** authCloud 仅运行期读取当前账号凭据；设备快照与离线包不包含该返回值。 */
  authCloud(snapshot: DevicePanelSnapshot) {
    this.checkAccount(snapshot);
    return this.repository.auth();
  }
  /** requestApiCloud 在旧页面发起接口调用前再次核验账号，业务权限由后端判断。 */
  requestApiCloud(snapshot: DevicePanelSnapshot, path: string, data: Record<string, unknown>) {
    this.checkAccount(snapshot);
    return this.repository.requestApi(path, data);
  }
  /** load 联机解析优先；只有网络失败可恢复本账号校验后缓存，服务端明确默认时必须撤销旧解析。 */
  async load(
    productID: string,
    deviceName: string,
    platform: string,
    model: DeviceControlModel | null,
  ): Promise<{
    snapshot: DevicePanelSnapshot | null;
    offline: boolean;
    message: string;
  }> {
    const scope = this.repository.accountScope();
    let resolution;
    try {
      resolution = await this.repository.resolve(
        productID,
        deviceName,
        platform,
      );
    } catch (error: any) {
      // 业务拒绝/撤销不能当作断网。仅网络层错误允许读取已安装资源。
      if (typeof error?.code === "number") throw error;
      if (platform !== "appAndroid" && platform !== "appIos") throw error;
      const cached = await this.repository.cached(productID, deviceName);
      if (!cached) throw error;
      if (
        cached.accountScope !== scope ||
        cached.productID !== productID ||
        cached.deviceName !== deviceName ||
        this.repository.accountScope() !== scope
      )
        throw new Error("账号或设备已切换");
      return {
        snapshot: cached,
        offline: true,
        message: "正在使用已校验的离线资源；缓存数据仅供查看，控制设备需要联网",
      };
    }
    if (resolution.mode !== "panel") {
      await this.repository.invalidate(productID, deviceName);
      return {
        snapshot: null,
        offline: false,
        message: resolution.message || "当前使用系统默认面板",
      };
    }
    // 设备详情加载失败会保留旧状态；联机资源必须与本次设备模型一致，不能沿用上一台设备。
    if (
      !model ||
      model.device.productID !== productID ||
      model.device.deviceName !== deviceName
    )
      throw new Error("当前设备的有效物模型尚未加载");
    let snapshot: DevicePanelSnapshot = {
      accountScope: scope,
      productID,
      deviceName,
      resolution,
      controlModel: model,
      installedAt: 0,
      entryURL: resolution.entryURL,
    };
    let message = "";
    if (platform === "appAndroid" || platform === "appIos") {
      try {
        snapshot = await this.repository.install(snapshot);
      } catch (error: any) {
        const cached = await this.repository
          .cached(productID, deviceName)
          .catch(() => null);
        if (!cached || cached.resolution.packageHash !== resolution.packageHash)
          throw error;
        snapshot = cached;
        message = "本次下载失败，使用同一内容的已校验缓存";
      }
    }
    if (this.repository.accountScope() !== scope)
      throw new Error("账号已切换，请重新打开面板");
    return { snapshot, offline: false, message };
  }
  /** readCloud/commandCloud/executeCloud 只接受已解析快照的设备身份，不接收页面指定的其他设备。 */
  async readCloud(snapshot: DevicePanelSnapshot, ids: string[], onStatus?: (status: number) => void) {
    this.checkAccount(snapshot);
    const types = Object.fromEntries(snapshot.controlModel.thingModel.properties.map((field) => [field.identifier, field.define.type]));
    const values = onStatus
      ? await this.repository.read(snapshot.productID, snapshot.deviceName, ids, types, (status) => { this.checkAccount(snapshot); onStatus(status); })
      : await this.repository.read(snapshot.productID, snapshot.deviceName, ids, types);
    for (const id of ids) {
      const value = values[id] as { value: unknown } | undefined;
      if (
        snapshot.controlModel.thingModel.properties.find(
          (field) => field.identifier === id,
        )?.define.type === "bool" &&
        value
      ) {
        if (value.value === 1 || value.value === "1") value.value = true;
        else if (value.value === 0 || value.value === "0") value.value = false;
      }
    }
    return values;
  }
  commandCloud(
    snapshot: DevicePanelSnapshot,
    commandID: string,
    action: boolean,
  ) {
    this.checkAccount(snapshot);
    return this.repository.command(
      snapshot.productID,
      snapshot.deviceName,
      commandID,
      action,
    );
  }
  executeCloud(
    snapshot: DevicePanelSnapshot,
    method: string,
    params: Record<string, any>,
  ) {
    this.checkAccount(snapshot);
    if (method === "writeProperties")
      return this.repository.write(
        snapshot.productID,
        snapshot.deviceName,
        params.values,
      );
    if (method === "invokeAction")
      return this.repository.action(
        snapshot.productID,
        snapshot.deviceName,
        params.identifier,
        params.params,
      );
    throw new Error("未知面板操作");
  }
  /** checkAccount 在每次设备操作前检查登录范围，账号注销或切换后旧宿主失效。 */
  private checkAccount(snapshot: DevicePanelSnapshot) {
    if (this.repository.accountScope() !== snapshot.accountScope)
      throw new Error("账号已切换，请重新打开面板");
  }
}
export const devicePanelService = new DevicePanelService();
