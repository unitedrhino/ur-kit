/** 文件说明：将平台面板解析响应转换为领域值，统一账号范围与原生包缓存；UI 不直接请求平台。 */
import { strToU8 } from "fflate";
import { request } from "../../utils/request";
import { config } from "../../config";
import { getRequestContext } from "../../utils/request-context";
import { panelSHA256 } from "../../utils/panel-sha256";
import { localStorage } from "../datasources/local-storage.datasource";
import { PanelCacheDataSource } from "../datasources/panel-cache.datasource";
import type { IDevicePanelRepository } from "../../domain/interfaces/device-panel.repository";
import type {
  DevicePanelManifest,
  DevicePanelResolution,
  DevicePanelSnapshot,
} from "../../domain/models/device-panel.model";
/** DevicePanelRepositoryImpl 使用当前登录上下文，缓存目录不跨服务、企业或用户。 */
export class DevicePanelRepositoryImpl implements IDevicePanelRepository {
  constructor(private readonly cache = new PanelCacheDataSource()) {}
  /** auth 与现有移动请求层使用同一份登录信息，仅按本次调用返回，禁止保存到快照。 */
  async auth() {
    const token = String(uni.getStorageSync("token") || "");
    if (!token) throw Object.assign(new Error("请先登录"), { code: "SESSION_CLOSED" });
    const { tenantCode, projectID } = getRequestContext();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "app-id": config.appId,
      token,
    };
    if (tenantCode) headers["ithings-tenant-code"] = tenantCode;
    if (projectID) headers["ithings-project-id"] = projectID;
    return { baseURL: config.apiBaseUrl, headers };
  }
  /** requestApi 复用移动请求层的认证与响应解包，不接受外部域名或请求头替换。 */
  requestApi(path: string, data: Record<string, unknown>) {
    return request({ url: path, data, timeout: 8000 });
  }
  /** accountScope 返回稳定账号摘要，用户名相同但平台/企业不同仍是不同目录。 */
  accountScope(): string {
    const user = localStorage.get<{ userID: string }>("user");
    const context = getRequestContext();
    if (!user?.userID || !context.tenantCode)
      throw new Error("请先登录并选择企业");
    return panelSHA256(
      strToU8(`${config.apiBaseUrl}\n${context.tenantCode}\n${user.userID}`),
    );
  }
  /** resolve 只接受设备身份与目标终端，SDK 版本固定由宿主声明。 */
  async resolve(
    productID: string,
    deviceName: string,
    platform: string,
  ): Promise<DevicePanelResolution> {
    const raw = await request<Record<string, any>>({
      url: "/api/v1/things/panel/resolve",
      data: { productID, deviceName, platform, sdkVersion: "1.0.0" },
    });
    const entry = String(raw.entryURL || "");
    return {
      mode: raw.mode === "panel" ? "panel" : "builtin",
      reason: String(raw.reason || ""),
      message: String(raw.message || ""),
      panelID: String(raw.panelID || ""),
      packageHash: String(raw.packageHash || ""),
      entryURL: entry.startsWith("/")
        ? config.apiBaseUrl.replace(/\/$/, "") + entry
        : entry,
      assetExpiresAt: Number(raw.assetExpiresAt) || 0,
      manifest: raw.manifest as DevicePanelManifest | null,
      download: raw.download || null,
    };
  }
  /** install 交由原生存储校验并原子切换。 */
  install(snapshot: DevicePanelSnapshot) {
    return this.cache.install(snapshot);
  }
  /** cached 读取当前账号指定设备的校验后快照。 */
  cached(productID: string, deviceName: string) {
    return this.cache.cached(this.accountScope(), productID, deviceName);
  }
  /** invalidate 联机确认默认/撤销时清理缓存解析指针。 */
  invalidate(productID: string, deviceName: string) {
    return this.cache.invalidate(this.accountScope(), productID, deviceName);
  }
  /** read 按types中的有效物模型类型保留原生字符串，返回真实状态元数据；未知或异常质量不补值。 */
  async read(
    productID: string,
    deviceName: string,
    identifiers: string[],
    types?: Record<string, string>,
    onStatus?: (status: number) => void,
  ): Promise<Record<string, unknown>> {
    const raw = await request<Record<string, any>>({
      url: "/api/v1/things/device/info/get-one",
      data: {
        productID,
        deviceName,
        withProperties: identifiers,
        propertyIgnoreEmpty: true,
      },
    });
    // 状态与属性来自同一设备查询；缺失或无效状态不能当作在线或离线。
    if (Number.isInteger(raw.status) && raw.status >= 1 && raw.status <= 4)
      onStatus?.(raw.status);
    return Object.fromEntries(
      identifiers.map((id) => {
        const field = raw.withProperties?.[id];
        let value: unknown = field?.value ?? null;
        if (typeof value === "string" && types?.[id] !== "string") {
          try {
            value = JSON.parse(value);
          } catch {}
        }
        return [
          id,
          {
            value,
            timestamp: Number(field?.timestamp) || null,
            receivedTime: Number(field?.receivedTime) || null,
            quality: field?.quality || "UNKNOWN",
            source: "cloud",
          },
        ];
      }),
    );
  }
  /** write 只实时下发，不因设备离线改写云端影子或自动换本地通道重试。 */
  async write(
    productID: string,
    deviceName: string,
    values: Record<string, unknown>,
  ): Promise<string> {
    // 面板属性以设备上报为准；隐私控制保留回执触发停流的保护。
    const raw = await request<Record<string, any>>({
      url: "/api/v1/things/device/interact/property-control-send",
      data: {
        productID,
        deviceName,
        data: JSON.stringify(values),
        isAsync: true,
        shadowControl: 1,
        ...(!Object.prototype.hasOwnProperty.call(values, "privacyMode") ? { reportedStateOnly: true } : {}),
      },
    });
    if (!raw.msgToken) throw new Error("控制未返回命令标识");
    return String(raw.msgToken);
  }
  /** action 仅调用已声明下行行为，设备身份来自宿主。 */
  async action(
    productID: string,
    deviceName: string,
    identifier: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const raw = await request<Record<string, any>>({
      url: "/api/v1/things/device/interact/action-send",
      data: {
        productID,
        deviceName,
        actionID: identifier,
        inputParams: JSON.stringify(params),
        isAsync: true,
      },
    });
    if (!raw.msgToken) throw new Error("行为未返回命令标识");
    return String(raw.msgToken);
  }
  /** command 返回设备实际回执，尚无结果时原样抛出，交由有限轮询识别等待。 */
  async command(
    productID: string,
    deviceName: string,
    commandID: string,
    action: boolean,
  ): Promise<Record<string, unknown>> {
    const raw = await request<Record<string, any>>({
      url:
        "/api/v1/things/device/interact/" +
        (action ? "action-get-one" : "property-control-get-one"),
      data: { productID, deviceName, msgToken: commandID },
      expectedApiCodes: [100009],
    });
    let output: unknown = raw.outputParams ?? null;
    if (typeof output === "string") {
      try {
        output = JSON.parse(output);
      } catch {}
    }
    return {
      commandID,
      status: raw.code === 200 ? "succeeded" : "failed",
      code: raw.code,
      message: raw.msg,
      output,
    };
  }
}
