/** 项目邀请服务：负责二维码凭证编码、摘要查询、接受与撤销。 */
import { request } from '../utils/request';

export interface ProjectInviteArea {
  areaID: string;
  isAuthChildren: number;
  areaName?: string;
}

export interface ProjectInviteSummary {
  valid: boolean;
  projectID: string;
  projectName: string;
  sharerName: string;
  authType: number;
  areas: ProjectInviteArea[];
  expiresAt: number;
}

export interface ProjectInviteCreateResult {
  inviteToken: string;
  expiresAt: number;
}

const QR_PREFIX = 'lianxi-project-invite:v1:';

/** 创建项目邀请凭证，只有项目负责人可成功调用。 */
export async function createProjectInvite(projectID: string, authType: number, areas: ProjectInviteArea[] = []): Promise<ProjectInviteCreateResult> {
  const result = await request<Record<string, unknown>>({
    url: '/api/v1/things/data/project/invite/create',
    data: { projectID, authType, areas },
  });
  return { inviteToken: String(result.inviteToken || ''), expiresAt: Number(result.expiresAt || 0) };
}

/** 查询二维码摘要；该接口不写入项目成员关系。 */
export async function checkProjectInvite(inviteToken: string): Promise<ProjectInviteSummary> {
  const result = await request<Record<string, unknown>>({
    url: '/api/v1/things/data/project/invite/check',
    omitProjectContext: true,
    data: { inviteToken },
  });
  return {
    valid: result.valid === true,
    projectID: String(result.projectID || ''),
    projectName: String(result.projectName || ''),
    sharerName: String(result.sharerName || ''),
    authType: Number(result.authType || 0),
    areas: Array.isArray(result.areas) ? (result.areas as Record<string, unknown>[]).map((item) => ({
      areaID: String(item.areaID || ''),
      isAuthChildren: Number(item.isAuthChildren || 2),
      areaName: typeof item.areaName === 'string' ? item.areaName : undefined,
    })) : [],
    expiresAt: Number(result.expiresAt || 0),
  };
}

/** 接受项目邀请，服务端负责幂等写入项目和区域权限。 */
export async function acceptProjectInvite(inviteToken: string): Promise<{ projectID: string; projectName: string }> {
  const result = await request<Record<string, unknown>>({
    url: '/api/v1/things/data/project/invite/accept',
    omitProjectContext: true,
    data: { inviteToken },
  });
  return { projectID: String(result.projectID || ''), projectName: String(result.projectName || '') };
}

/** 撤销项目邀请，关闭二维码弹窗不会调用该方法。 */
export async function revokeProjectInvite(inviteToken: string): Promise<void> {
  await request({
    url: '/api/v1/things/data/project/invite/revoke',
    data: { inviteToken },
  });
}

/** 将项目邀请凭证编码为小程序扫码可识别的短文本。 */
export function encodeProjectInviteQr(inviteToken: string): string {
  return `${QR_PREFIX}${encodeURIComponent(inviteToken)}`;
}

/** 解析项目邀请二维码，同时兼容分享链接中的 inviteToken 查询参数。 */
export function parseProjectInviteQr(raw: string): { token: string } | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (value.startsWith(QR_PREFIX)) {
    const token = decodeURIComponent(value.slice(QR_PREFIX.length));
    return token ? { token } : null;
  }
  try {
    const url = new URL(value);
    const token = url.searchParams.get('inviteToken') || url.searchParams.get('projectInviteToken');
    return token ? { token } : null;
  } catch {
    const match = value.match(/[?&](?:inviteToken|projectInviteToken)=([^&#]+)/);
    return match?.[1] ? { token: decodeURIComponent(match[1]) } : null;
  }
}
