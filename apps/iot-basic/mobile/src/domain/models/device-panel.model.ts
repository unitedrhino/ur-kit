/** 文件说明：跨终端设备面板领域合同，缓存元数据不包含主账号凭据或蓝牙密钥。 */
import type { DeviceControlModel } from "./device-control.model";
/** DevicePanelManifest 声明内容版本、终端和真实物模型能力，不定义 UI 组件树。 */
export interface DevicePanelManifest {
  formatVersion: number;
  name: string;
  entry: string;
  sdkVersion: string;
  requirements: Array<{
    kind: string;
    identifier: string;
    required: boolean;
    access?: string;
    define?: Record<string, unknown>;
    input?: Record<string, unknown>;
  }>;
}
/** DevicePanelFile 为完整包的可信摘要项，只有校验成功才允许落入运行目录。 */
export interface DevicePanelFile {
  path: string;
  bytes: number;
  sha256: string;
}
/** DevicePanelResolution 是同一账号与真实设备的解析快照。 */
export interface DevicePanelResolution {
  mode: "panel" | "builtin";
  reason: string;
  message: string;
  panelID: string;
  packageHash: string;
  entryURL: string;
  /** assetExpiresAt 为联机资源授权到期毫秒，返回页面时到期应重新解析；本地包不受此期限控制。 */
  assetExpiresAt?: number;
  manifest: DevicePanelManifest | null;
  download: {
    url: string;
    files: DevicePanelFile[];
    compressedBytes: number;
    totalBytes: number;
  } | null;
}
/** DevicePanelSnapshot 只缓存已确认设备的资源和模型；本地控制授权由传输层另行校验。 */
export interface DevicePanelSnapshot {
  accountScope: string;
  productID: string;
  deviceName: string;
  resolution: DevicePanelResolution;
  controlModel: DeviceControlModel;
  installedAt: number;
  entryURL: string;
}
/** DevicePanelEvent 使用单设备主题并保留真实质量、来源与命令状态。 */
export interface DevicePanelEvent {
  topic: "property" | "connection" | "command";
  data: Record<string, unknown>;
  timestamp?: number;
}
