/**
 * wechat-login-relay 定义微信开放平台固定回调地址与受控回跳目标。
 */

/** 微信开放平台后台已登记的固定扫码登录回调入口。 */
export const wxOpenCallbackUri = 'https://bak.ykhl.vip/wx-open/callback';

/** WxLoginTargetKey 表示回调中转页允许回跳的前端环境。 */
export type WxLoginTargetKey = 'local' | 'prod';

/** resolveWxLoginTargetKey 将当前域名映射为回调中转页认可的目标标识。 */
export function resolveWxLoginTargetKey(hostname: string): WxLoginTargetKey {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local';
  if (hostname === 'iot-client.ykhl.vip') return 'prod';
  throw new Error('当前域名未配置微信登录回调');
}

/** createWxLoginState 将受控目标标识写入一次性 state，避免传递任意回跳地址。 */
export function createWxLoginState(hostname: string, nonce: string): string {
  return `${resolveWxLoginTargetKey(hostname)}.${nonce}`;
}
