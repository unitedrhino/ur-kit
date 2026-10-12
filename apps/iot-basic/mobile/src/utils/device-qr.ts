/**
 * 解析设备二维码字符串，兼容老 wechat-mini-app 的格式：
 *   &tp=1&pid=xxx&dn=xxx   或   tp=1&&pid=xxx&&dn=xxx
 * - 去掉前导 `&`
 * - 优先按 `&&` 拆分，单分隔符时按 `&` 拆分
 * - 字段映射：pid -> productID, dn -> deviceName
 *
 * 返回 null 表示二维码缺少必要字段。
 */
export interface DeviceQrPayload {
  productID: string;
  deviceName: string;
}

export function parseDeviceQr(raw: string): DeviceQrPayload | null {
  if (!raw) return null;
  let str = raw.trim();
  if (str.charAt(0) === '&') str = str.substring(1);

  let parts = str.split('&&');
  if (parts.length === 1) parts = str.split('&');

  const map: Record<string, string> = {};
  for (const seg of parts) {
    if (!seg) continue;
    const idx = seg.indexOf('=');
    if (idx <= 0) continue;
    const k = seg.substring(0, idx);
    const v = seg.substring(idx + 1);
    map[k] = v;
  }

  const productID = map.pid || map.productID || '';
  const deviceName = map.dn || map.deviceName || '';
  if (!productID || !deviceName) return null;
  return { productID, deviceName };
}
