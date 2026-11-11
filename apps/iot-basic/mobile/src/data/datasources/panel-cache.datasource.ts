/** 文件说明：Android/iOS 私有目录中的完整面板安装；先校验 ZIP 与每个文件，再解压并切换快照，失败保留旧包。 */
import { strToU8, strFromU8 } from "fflate";
import type { DevicePanelSnapshot } from "../../domain/models/device-panel.model";
import { decodePanelPackage } from "./panel-package";
import { panelSHA256 } from "../../utils/panel-sha256";
import { localStorage } from "./local-storage.datasource";
declare const plus: any;
/** nativeReady 限制只有实际 5+ App 可使用本机资源安装，H5 不冒充持久化成功。 */
function nativeReady() {
  if (typeof plus === "undefined" || !plus.io || !plus.zip)
    throw new Error("当前宿主不支持原生离线包");
}
/** resolveEntry 读取 App 私有目录对象，不接收 HTML 面板传入的路径。 */
const resolveEntry = (url: string) =>
  new Promise<any>((resolve, reject) =>
    plus.io.resolveLocalFileSystemURL(url, resolve, reject),
  );
/** readBytes 用 5+ 文件读取器保留完整二进制内容，不能用 UTF-8 文本替代 ZIP。 */
async function readBytes(url: string): Promise<Uint8Array> {
  const entry = await resolveEntry(url);
  return new Promise((resolve, reject) =>
    entry.file((file: any) => {
      const reader = new plus.io.FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const raw = String(reader.result),
          index = raw.indexOf(",");
        if (index < 0) {
          reject(new Error("无法读取面板包字节"));
          return;
        }
        resolve(new Uint8Array(uni.base64ToArrayBuffer(raw.slice(index + 1))));
      };
      reader.readAsDataURL(file);
    }, reject),
  );
}
/** packageKey 在账号目录内再按真实产品设备隔离解析快照。 */
function packageKey(scope: string, productID: string, deviceName: string) {
  return `panel:${scope}:${panelSHA256(strToU8(`${productID}\n${deviceName}`))}`;
}
/** PanelCacheDataSource 管理新目录写入与已有快照校验；不储存 token、密钥或本地控制授权。 */
export class PanelCacheDataSource {
  /** install 安装校验后的完整 ZIP，最后一步才更新本地快照指针。 */
  async install(snapshot: DevicePanelSnapshot): Promise<DevicePanelSnapshot> {
    nativeReady();
    // 相同内容先复验并复用已有目录，避免每次打开都下载和累积资源；属性快照仍刷新为本次联机数据。
    const cached = await this.cached(
      snapshot.accountScope,
      snapshot.productID,
      snapshot.deviceName,
    ).catch(() => null);
    if (cached?.resolution.packageHash === snapshot.resolution.packageHash) {
      const reused = {
        ...snapshot,
        resolution: {
          ...snapshot.resolution,
          entryURL: "",
          download: cached.resolution.download,
        },
        installedAt: cached.installedAt,
        entryURL: cached.entryURL,
      };
      localStorage.set(
        packageKey(
          snapshot.accountScope,
          snapshot.productID,
          snapshot.deviceName,
        ),
        reused,
      );
      return reused;
    }
    const download = snapshot.resolution.download;
    if (
      !download ||
      !download.url ||
      download.compressedBytes > 10 * 1024 * 1024 ||
      download.totalBytes > 30 * 1024 * 1024
    )
      throw new Error("面板完整包元数据不可用");
    const temporary = await new Promise<string>((resolve, reject) =>
      uni.downloadFile({
        url: download.url,
        success: (result) =>
          result.statusCode === 200
            ? resolve(result.tempFilePath)
            : reject(new Error("完整包下载失败")),
        fail: reject,
      }),
    );
    const bytes = await readBytes(temporary);
    if (bytes.length !== download.compressedBytes)
      throw new Error("下载包字节数不匹配");
    const decoded = decodePanelPackage(
      bytes,
      download.files,
      snapshot.resolution.packageHash,
    );
    const html = decoded["index.html"];
    if (!html || !strFromU8(html).includes('id="ur-panel-csp"'))
      throw new Error("离线包缺少运行资源限制");
    const fs = await new Promise<any>((resolve, reject) =>
      plus.io.requestFileSystem(plus.io.PRIVATE_DOC, resolve, reject),
    );
    const packages = await new Promise<any>((resolve, reject) =>
      fs.root.getDirectory("device-panels", { create: true }, resolve, reject),
    );
    const parent = await new Promise<any>((resolve, reject) =>
      packages.getDirectory(
        snapshot.accountScope,
        { create: true },
        resolve,
        reject,
      ),
    );
    const temporaryName = `${snapshot.resolution.packageHash}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let directory: any;
    try {
      directory = await new Promise<any>((resolve, reject) =>
        parent.getDirectory(
          temporaryName,
          { create: true, exclusive: true },
          resolve,
          reject,
        ),
      );
      await new Promise<void>((resolve, reject) =>
        plus.zip.decompress(temporary, directory.toLocalURL(), resolve, reject),
      );
      const archive = await resolveEntry(temporary);
      await new Promise((resolve, reject) =>
        archive.copyTo(directory, "package.zip", resolve, reject),
      );
      const installed = {
        ...snapshot,
        resolution: {
          ...snapshot.resolution,
          entryURL: "",
          download: { ...download, url: "" },
        },
        installedAt: Date.now(),
        entryURL: directory.toLocalURL() + "index.html",
      };
      localStorage.set(
        packageKey(
          snapshot.accountScope,
          snapshot.productID,
          snapshot.deviceName,
        ),
        installed,
      );
      return installed;
    } catch (error) {
      if (directory)
        directory.removeRecursively(
          () => {},
          () => {},
        );
      throw error;
    }
  }
  /** cached 冷启动先重新校验原包和逐个运行文件，损坏缓存不获得运行入口。 */
  async cached(
    scope: string,
    productID: string,
    deviceName: string,
  ): Promise<DevicePanelSnapshot | null> {
    nativeReady();
    const key = packageKey(scope, productID, deviceName),
      snapshot = localStorage.get<DevicePanelSnapshot>(key);
    if (!snapshot) return null;
    if (
      snapshot.accountScope !== scope ||
      snapshot.productID !== productID ||
      snapshot.deviceName !== deviceName ||
      !snapshot.entryURL.includes(`/device-panels/${scope}/`)
    )
      throw new Error("离线面板账号或设备不匹配");
    const base = snapshot.entryURL.slice(0, -"index.html".length),
      files = snapshot.resolution.download?.files;
    if (!files) throw new Error("离线包校验清单缺失");
    decodePanelPackage(
      await readBytes(base + "package.zip"),
      files,
      snapshot.resolution.packageHash,
    );
    for (const item of files) {
      const content = await readBytes(base + item.path);
      if (content.length !== item.bytes || panelSHA256(content) !== item.sha256)
        throw new Error("离线面板文件损坏");
    }
    return snapshot;
  }
  /** invalidate 清除已知设备的解析指针，联机撤销/改回默认后不再恢复旧面板。 */
  async invalidate(
    scope: string,
    productID: string,
    deviceName: string,
  ): Promise<void> {
    localStorage.remove(packageKey(scope, productID, deviceName));
  }
}
