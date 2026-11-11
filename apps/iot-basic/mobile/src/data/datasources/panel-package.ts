/** 文件说明：完整面板包在内存中校验后才允许持久化，避免路径穿越、ZIP 炸弹及损坏资源进入运行目录。 */
import { strFromU8, strToU8, unzipSync } from "fflate";
import type { DevicePanelFile } from "../../domain/models/device-panel.model";
import { panelSHA256 } from "../../utils/panel-sha256";
/** decodePanelPackage 先检查中央目录上限，再解包核对所有清单项及规范化总摘要。 */
export function decodePanelPackage(
  bytes: Uint8Array,
  files: DevicePanelFile[],
  expectedHash: string,
): Record<string, Uint8Array> {
  if (
    bytes.length > 10 * 1024 * 1024 ||
    bytes.length < 22 ||
    files.length > 100 ||
    !files.length ||
    !/^[a-f0-9]{64}$/.test(expectedHash)
  )
    throw new Error("面板包大小、清单或摘要无效");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    view.getUint32(end, true) !== 0x06054b50
  )
    end--;
  if (
    end < Math.max(0, bytes.length - 65557) ||
    view.getUint32(end, true) !== 0x06054b50 ||
    view.getUint16(end + 4, true) !== 0 ||
    view.getUint16(end + 6, true) !== 0
  )
    throw new Error("不支持跨卷 ZIP");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true),
    total = 0;
  const names = new Set<string>();
  if (count !== files.length || count > 100)
    throw new Error("面板包条目与清单不一致");
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error("ZIP 中央目录损坏");
    const size = view.getUint32(offset + 24, true),
      nameSize = view.getUint16(offset + 28, true),
      extra = view.getUint16(offset + 30, true),
      comment = view.getUint16(offset + 32, true),
      flags = view.getUint16(offset + 8, true),
      method = view.getUint16(offset + 10, true);
    const name = strFromU8(bytes.subarray(offset + 46, offset + 46 + nameSize));
    total += size;
    const mode = view.getUint32(offset + 38, true) >>> 16,
      local = view.getUint32(offset + 42, true);
    if (
      (mode & 0xf000 && (mode & 0xf000) !== 0x8000) ||
      local + 30 > offset ||
      view.getUint32(local, true) !== 0x04034b50
    )
      throw new Error("ZIP 资源文件类型或本地目录无效");
    const localNameSize = view.getUint16(local + 26, true),
      localExtra = view.getUint16(local + 28, true);
    if (
      local +
        30 +
        localNameSize +
        localExtra +
        view.getUint32(offset + 20, true) >
        offset ||
      strFromU8(bytes.subarray(local + 30, local + 30 + localNameSize)) !==
        name ||
      view.getUint16(local + 8, true) !== method
    )
      throw new Error("ZIP 本地条目与中央目录不一致");
    if (
      total > 30 * 1024 * 1024 ||
      offset + 46 + nameSize + extra + comment > end ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      !safePanelPath(name) ||
      names.has(name)
    )
      throw new Error("ZIP 包含非法资源或超过大小限制");
    const expected = files.find((file) => file.path === name);
    if (!expected || expected.bytes !== size)
      throw new Error("ZIP 资源清单不匹配");
    names.add(name);
    offset += 46 + nameSize + extra + comment;
  }
  const decoded = unzipSync(bytes),
    fingerprint: string[] = [];
  for (const name of Object.keys(decoded).sort(compareUTF8)) {
    const data = decoded[name],
      expected = files.find((file) => file.path === name),
      hash = panelSHA256(data);
    if (!expected || expected.bytes !== data.length || expected.sha256 !== hash)
      throw new Error("面板文件摘要校验失败");
    fingerprint.push(
      `${strToU8(name).length}:${name}:${data.length}:${hash}\n`,
    );
  }
  if (
    Object.keys(decoded).length !== files.length ||
    panelSHA256(strToU8(fingerprint.join(""))) !== expectedHash
  )
    throw new Error("面板整体内容摘要不匹配");
  return decoded;
}
/** safePanelPath 拒绝编码路径、绝对路径及操作系统差异路径，资源最多八层。 */
export function safePanelPath(name: string): boolean {
  return (
    !!name &&
    name.split("/").length <= 8 &&
    !name.startsWith("/") &&
    !/[\\:%?#\x00-\x1f]/.test(name) &&
    name.split("/").every((part) => !!part && part !== "." && part !== "..")
  );
}

/** compareUTF8 与后端按 UTF-8 字节排序一致，中文及补充平面文件名不会得到不同摘要。 */
function compareUTF8(a: string, b: string) {
  const left = strToU8(a),
    right = strToU8(b);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}
