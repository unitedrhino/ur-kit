/** 设备分享链接服务：令牌由后端签发与校验，设备授权仅在接收确认后写入。 */
import { request } from '../utils/request';
import { getRequestContext } from '../utils/request-context';
import { DeviceInteractRepositoryImpl } from '../data/repositories/device-interact.repository.impl';
import type { ThingModelSchema } from '../domain/models/device-control.model';

/** ShareLinkDevice 是接受页面所需的最小设备身份。 */
export interface ShareLinkDevice { productID: string; deviceName: string; deviceAlias?: string; productName?: string; productImg?: string; }
/** SharePermissionGroup 与后端既有物模型和系统功能权限对应。 */
export type SharePermissionGroup = 'baseControl' | 'deviceSetting' | 'ota' | 'deviceTiming' | 'hubLog';
/** ShareLinkOptions 保存分享权限与可选的本地截止日期和时间。 */
export interface ShareLinkOptions { authType: 1 | 2; groups: SharePermissionGroup[]; expDate: string; expTime: string; }
/** ShareLinkDetail 是接收者确认前读取的设备和授权摘要。 */
export interface ShareLinkDetail { devices: ShareLinkDevice[]; authType: number; schemaPerm: Record<string, {perm:number}>; accessPerm: Record<string, {perm:number}>; expTime: number; }
/** shareExpiry 将本地日期时间转成毫秒，拒绝无效或已过期的授权。 */
export function shareExpiry(options: ShareLinkOptions, now = Date.now()): number {
  if (!options.expDate) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.expDate) || !/^\d{2}:\d{2}$/.test(options.expTime)) throw new Error('请选择有效的截止日期和时间');
  const value = new Date(`${options.expDate}T${options.expTime}:00`).getTime();
  if (!Number.isFinite(value) || value <= now) throw new Error('授权截止时间必须晚于当前时间');
  return value;
}
/** sharePermissions 仅展开选中分组中的真实物模型标识，避免授予其他系统功能。 */
export function sharePermissions(model: ThingModelSchema, groups: SharePermissionGroup[]): {schemaPerm: Record<string,{perm:number}>; accessPerm: Record<string,{perm:number}>} {
  const schemaPerm: Record<string,{perm:number}> = {}; const accessPerm: Record<string,{perm:number}> = {};
  for (const group of ['baseControl','deviceSetting'] as const) {
    if (!groups.includes(group)) continue;
    let count = 0;
    for (const item of model.properties) if ((item.funcGroup === 2) === (group === 'deviceSetting')) { schemaPerm[item.identifier] = {perm:item.mode === 'r' ? 3 : 2}; count++; }
    for (const item of model.actions) if (item.dir === 'down' && (item.funcGroup === 2) === (group === 'deviceSetting')) { schemaPerm[item.identifier] = {perm:2}; count++; }
    if (!count) throw new Error(group === 'baseControl' ? '该设备没有可分享的基础控制功能' : '该设备没有可分享的设备设置功能');
  }
  if (groups.includes('deviceSetting')) accessPerm.deviceSetting = {perm:2};
  for (const key of ['ota','deviceTiming','hubLog'] as const) if (groups.includes(key)) accessPerm[key] = {perm:2};
  return {schemaPerm, accessPerm};
}
/** resolveShareOptions 为账号分享和链接分享生成一致的权限与毫秒截止时间。 */
export async function resolveShareOptions(device: ShareLinkDevice, options: ShareLinkOptions, modelRepo: Pick<DeviceInteractRepositoryImpl,'getThingModel'> = new DeviceInteractRepositoryImpl()): Promise<{schemaPerm: Record<string,{perm:number}>; accessPerm: Record<string,{perm:number}>; expTime: number}> {
  const expTime = shareExpiry(options);
  let schemaPerm: Record<string,{perm:number}> = {}; let accessPerm: Record<string,{perm:number}> = {};
  if (options.authType === 2) {
    if (!options.groups.length) throw new Error('请至少选择一项分享权限');
    const needsModel = options.groups.includes('baseControl') || options.groups.includes('deviceSetting');
    const model = needsModel ? await modelRepo.getThingModel(device.productID, device.deviceName) : {properties:[], actions:[], events:[]};
    ({schemaPerm, accessPerm} = sharePermissions(model, options.groups));
  }
  return {schemaPerm, accessPerm, expTime};
}
/** 按所选权限生成令牌；授权到期使用毫秒，链接有效期由后端单独控制。 */
export async function createDeviceShareLink(device: ShareLinkDevice, options: ShareLinkOptions, modelRepo: Pick<DeviceInteractRepositoryImpl,'getThingModel'> = new DeviceInteractRepositoryImpl(), useBy = ''): Promise<string> {
  const {schemaPerm, accessPerm, expTime} = await resolveShareOptions(device, options, modelRepo);
  const data: Record<string, unknown> = { devices: [{ productID: device.productID, deviceName: device.deviceName }], authType: options.authType, schemaPerm, accessPerm, expTime };
  if (useBy) data.useBy = useBy;
  const result = await request<{ shareToken?: string }>({ url: '/api/v1/things/user/device/share/batch-create', data });
  if (!result.shareToken) throw new Error('未能生成分享链接');
  return result.shareToken;
}
/** 读取有效分享设备和权限摘要，供接收者确认。 */
export async function getDeviceShareLink(token: string): Promise<ShareLinkDetail> {
  const result = await request<Partial<ShareLinkDetail>>({ url: '/api/v1/things/user/device/share/batch-get-list', omitProjectContext: true, data: { shareToken: token } });
  return { devices: result.devices || [], authType: Number(result.authType || 0), schemaPerm: result.schemaPerm || {}, accessPerm: result.accessPerm || {}, expTime: Number(result.expTime || 0) };
}
/** 接收用户明确选择的设备，空列表不发起授权请求。 */
export async function acceptDeviceShareLink(token: string, devices: ShareLinkDevice[]): Promise<void> {
  if (!devices.length) throw new Error('请至少选择一台设备');
  await request({ url: '/api/v1/things/user/device/share/batch-accept', omitProjectContext: true, data: { shareToken: token, devices: devices.map(({productID, deviceName}) => ({productID, deviceName})) } });
}
/** revokeDeviceShareToken 撤销本账号创建的分享凭证。 */
export async function revokeDeviceShareToken(token: string): Promise<void> {
  try { await request({url:'/api/v1/things/user/device/share/batch-delete-token', data:{shareToken:token}}); }
  catch (error) {
    // 轮换期间凭证可能已自然过期；只有服务端明确确认无效才允许关闭。
    const status = await request<{valid:boolean}>({url:'/api/v1/things/user/device/share/token/check', omitProjectContext:true, data:{shareToken:token}});
    if (status.valid !== false) throw error;
  }
}
/** encodeDeviceShareQr 只编码当前短时凭证及组织提示，不包含设备权限详情。 */
export function encodeDeviceShareQr(token: string): string {
  return `lianxi-device-share:v1:${encodeURIComponent(token)}:${encodeURIComponent(getRequestContext().tenantCode)}`;
}
/** parseDeviceShareQr 严格识别本应用的分享二维码，其他二维码仍走原绑定逻辑。 */
export function parseDeviceShareQr(raw: string): {token: string; tenant: string} | null {
  const match = /^lianxi-device-share:v1:([a-zA-Z0-9-]+):([a-zA-Z0-9_.%-]+)$/.exec(raw.trim());
  if (!match) return null;
  try { const token = decodeURIComponent(match[1]); const tenant = decodeURIComponent(match[2]); return token && tenant ? {token,tenant} : null; } catch { return null; }
}
/** MiniShareRuntime 表示微信小程序自身的公开身份与运行版本。 */
export interface MiniShareRuntime { appId: string; envVersion: 'develop' | 'trial' | 'release' }
/** 获取实际运行的小程序身份；浏览器无此能力。 */
export function getMiniShareRuntime(): MiniShareRuntime | null {
  // #ifdef MP-WEIXIN
  try {
    if (typeof wx === 'undefined') return null;
    const info = uni.getAccountInfoSync().miniProgram;
    if (!info?.appId || !['develop', 'trial', 'release'].includes(info.envVersion)) return null;
    return { appId: info.appId, envVersion: info.envVersion };
  } catch { return null; }
  // #endif
  return null;
}
/** 服务端签发微信 URL Link，校验应用配置与来源小程序一致。 */
export async function createMiniShareUrl(token: string, runtime: MiniShareRuntime | null = getMiniShareRuntime()): Promise<string> {
  const tenant = getRequestContext().tenantCode;
  if (runtime) {
    const app = await request<{wxMiniConfig?: {appID?: string}}>({url:'/api/v1/system/app/core/get-one', omitProjectContext:true, data:{id:'700'}});
    if (!app.wxMiniConfig?.appID || app.wxMiniConfig.appID !== runtime.appId) throw new Error('当前小程序的分享配置不可用');
  }
  const query = `deviceShareToken=${encodeURIComponent(token)}&shareTenant=${encodeURIComponent(tenant)}`;
  const response = await request<{urlLink?: string}>({url:'/api/v1/system/app/info/wx-mini/get-url-link', omitProjectContext:true, data:{appID:'700', query, envVersion:runtime?.envVersion || 'release'}});
  const url = response.urlLink || '';
  if (!/^https:\/\/wxaurl\.cn\/[a-zA-Z0-9_-]+$/.test(url)) throw new Error('微信链接不可用');
  return url;
}
/** 构造同源 H5 分享地址；原生端由构建配置明确提供 H5 地址。 */
export function buildDeviceShareUrl(token: string, miniUrl = '', fromMini = false): string {
  let base = String(import.meta.env.VITE_SHARE_LANDING_URL || '').trim();
  // #ifdef H5
  if (!base && typeof window !== 'undefined') base = window.location.origin + window.location.pathname;
  // #endif
  if (!/^https?:\/\//.test(base)) throw new Error('暂未配置分享链接地址');
  const tenant = getRequestContext().tenantCode;
  if (!tenant) throw new Error('请先选择所属组织');
  // 微信 URL Link 固定一小时有效，提前一分钟收起入口。
  const wx = miniUrl ? `&miniUrl=${encodeURIComponent(miniUrl)}&miniUntil=${Date.now() + 59 * 60 * 1000}` : '';
  const source = fromMini ? '&fromMini=1' : '';
  return `${base.replace(/#.*$/, '')}#/packageDevice/pages/share-accept/index?shareToken=${encodeURIComponent(token)}&shareTenant=${encodeURIComponent(tenant)}${source}${wx}`;
}
