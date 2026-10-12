/**
 * 组织邀请来源生成与解析工具。
 * 移动端只消费后端生成的邀请码 code，不再把 tenantCode 当作自动加入凭据。
 * 控制台小程序启动只从公开参数 org-id 读取企业号。
 */

export type InviteSourceType = 'share_card' | 'share_timeline' | 'scene_qrcode' | 'clipboard' | 'url_scheme';

export interface TenantInviteSource {
  inviteCode: string;
  tenantCode: string;
  source: InviteSourceType;
}

const INVITE_PREFIX = '#ITHINGS_INVITE#';
const INVITE_SUFFIX = '#';
const INVITE_CODE_PARAM_KEY = 'code';
const PENDING_INVITE_CODE_KEY = 'pending_invite_code';
const PENDING_LAUNCH_TENANT_CODE_KEY = 'pending_launch_tenant_code';
const INVITE_CODE_SUFFIX_LENGTH = 11;
const INVITE_METHOD_SAMPLE_RE = /^[cep]$/i;
const LAUNCH_ORG_PARAM_KEY = 'org-id';
const LEGACY_COMMON_TENANT_CODE = 'common';

function normalizeInviteCode(code: string): string {
  return decodeURIComponent((code || '').trim());
}

/** 规范化小程序启动企业号，过滤旧版 common 占位值。 */
function normalizeLaunchTenantCode(code: string): string {
  const normalizedCode = decodeURIComponent((code || '').trim());
  return normalizedCode && normalizedCode !== LEGACY_COMMON_TENANT_CODE ? normalizedCode : '';
}

function buildInviteSource(inviteCode: string, source: InviteSourceType): TenantInviteSource | null {
  const normalizedCode = normalizeInviteCode(inviteCode);
  if (!normalizedCode) return null;
  return {
    inviteCode: normalizedCode,
    tenantCode: parseInviteTenantCode(normalizedCode),
    source,
  };
}

/** 从后端邀请码解析目标组织 code：tenantCode + method(1) + random(10)。 */
export function parseInviteTenantCode(code: string): string {
  const normalizedCode = normalizeInviteCode(code);
  if (normalizedCode.length <= INVITE_CODE_SUFFIX_LENGTH) return '';
  const methodSample = normalizedCode.slice(-INVITE_CODE_SUFFIX_LENGTH, -INVITE_CODE_SUFFIX_LENGTH + 1);
  if (!INVITE_METHOD_SAMPLE_RE.test(methodSample)) return '';
  return normalizedCode.slice(0, -INVITE_CODE_SUFFIX_LENGTH);
}

export function savePendingInviteCode(code: string): void {
  const normalizedCode = normalizeInviteCode(code);
  if (!normalizedCode) return;
  uni.setStorageSync(PENDING_INVITE_CODE_KEY, normalizedCode);
}

export function getPendingInviteCode(): string {
  return normalizeInviteCode(String(uni.getStorageSync(PENDING_INVITE_CODE_KEY) || ''));
}

export function clearPendingInviteCode(): void {
  uni.removeStorageSync(PENDING_INVITE_CODE_KEY);
}

/** 保存从控制台二维码携带来的待切换企业号。 */
export function savePendingLaunchTenantCode(code: string): void {
  const normalizedCode = normalizeLaunchTenantCode(code);
  if (!normalizedCode) return;
  uni.setStorageSync(PENDING_LAUNCH_TENANT_CODE_KEY, normalizedCode);
}

/** 读取控制台二维码携带来的待切换企业号。 */
export function getPendingLaunchTenantCode(): string {
  return normalizeLaunchTenantCode(String(uni.getStorageSync(PENDING_LAUNCH_TENANT_CODE_KEY) || ''));
}

/** 清除已处理或已失效的控制台启动企业号。 */
export function clearPendingLaunchTenantCode(): void {
  uni.removeStorageSync(PENDING_LAUNCH_TENANT_CODE_KEY);
}

/** 生成分享卡片路径（含后端邀请码 code）。 */
export function createSharePath(
  basePath: string,
  inviteCode: string,
  extra?: Record<string, string>,
): string {
  const params: Record<string, string> = { [INVITE_CODE_PARAM_KEY]: inviteCode, ...extra };
  const search = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${basePath}?${search}`;
}

/** 生成朋友圈分享 query（含后端邀请码 code）。 */
export function createTimelineQuery(
  inviteCode: string,
  extra?: Record<string, string>,
): string {
  const params: Record<string, string> = { [INVITE_CODE_PARAM_KEY]: inviteCode, ...extra };
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/** 生成小程序码 scene 值（由平台后台携带后端邀请码）。 */
export function createQRCodeScene(inviteCode: string): string {
  return `${INVITE_CODE_PARAM_KEY}=${encodeURIComponent(inviteCode)}`;
}

/** 生成剪贴板邀请码。 */
export function createInviteCode(inviteCode: string, tenantName?: string): string {
  const display = tenantName ? `邀请你加入「${tenantName}」` : '邀请你加入组织';
  return `${display} ${INVITE_PREFIX}${INVITE_CODE_PARAM_KEY}=${inviteCode}${INVITE_SUFFIX}`;
}

/** 生成 URL Scheme query（供后端生成 scheme 时使用）。 */
export function createSchemeQuery(
  inviteCode: string,
  path?: string,
): Record<string, string> {
  return {
    path: path || '/pages/home/index',
    query: `${INVITE_CODE_PARAM_KEY}=${encodeURIComponent(inviteCode)}`,
  };
}

export function parseInviteFromOptions(options: Record<string, string>): TenantInviteSource | null {
  return buildInviteSource(options[INVITE_CODE_PARAM_KEY] || '', 'share_card');
}

export function parseInviteFromScene(scene: string): TenantInviteSource | null {
  if (!scene) return null;
  const decoded = decodeURIComponent(scene);
  const regex = new RegExp(`${INVITE_CODE_PARAM_KEY}=([^&]+)`);
  const match = decoded.match(regex);
  return match ? buildInviteSource(match[1], 'scene_qrcode') : null;
}

export function parseInviteFromLaunchOptions(
  options: Record<string, string>,
): TenantInviteSource | null {
  return parseInviteFromOptions(options) || parseInviteFromScene(options.scene);
}

/** 从 URL Scheme query 或小程序码 scene 中解析控制台透传的企业 code。 */
export function parseLaunchTenantCode(options: Record<string, string>): string {
  const code = normalizeLaunchTenantCode(options[LAUNCH_ORG_PARAM_KEY] || '');
  if (code) return code;

  const scene = options.scene ? decodeURIComponent(options.scene) : '';
  if (!scene) return '';
  const regex = new RegExp(`(?:^|&)${LAUNCH_ORG_PARAM_KEY}=([^&]+)`);
  const match = scene.match(regex);
  return normalizeLaunchTenantCode(match?.[1] || '');
}

export async function parseInviteFromClipboard(): Promise<TenantInviteSource | null> {
  try {
    const res = await new Promise<WechatMiniprogram.GetClipboardDataSuccessCallbackOption>(
      (resolve, reject) => {
        uni.getClipboardData({ success: (r) => resolve(r as WechatMiniprogram.GetClipboardDataSuccessCallbackOption), fail: (e) => reject(e) });
      },
    );
    const data = res.data;
    if (!data) return null;
    const regex = new RegExp(
      INVITE_PREFIX.replace(/#/g, '\\#') +
      INVITE_CODE_PARAM_KEY +
      '=([^#]+)' +
      INVITE_SUFFIX.replace(/#/g, '\\#'),
    );
    const match = data.match(regex);
    if (match) {
      uni.setClipboardData({ data: '' });
      return buildInviteSource(match[1], 'clipboard');
    }
  } catch {
    /* 用户拒绝剪贴板权限，静默失败 */
  }
  return null;
}
