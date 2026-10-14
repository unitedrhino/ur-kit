// 本文件统一列出客户端不能自报的平台内部身份字段。

// untrustedIdentityHeaders 只包含平台认证后注入的身份，不包含令牌或项目选择头。
export const untrustedIdentityHeaders = [
  'ithings-user',
  'ithings-user-role',
  'ithings-tenant-code',
  'ithings-project-id',
  'ithings-meta',
  'ithings-set-token',
];

// stripUntrustedIdentityHeaders 从 Node HTTP 请求头删除大小写不同的伪造身份。
export function stripUntrustedIdentityHeaders(headers) {
  for (const name of Object.keys(headers)) {
    if (untrustedIdentityHeaders.includes(name.toLowerCase())) delete headers[name];
  }
}

// readToken 按平台既有优先级读取令牌，拒绝数组、二进制或非 Bearer 授权值。
export function readToken(primary, secondary, authorization) {
  for (const value of [primary, secondary]) {
    if (value == null || value === '') continue;
    return typeof value === 'string' ? value.trim() : null;
  }
  if (typeof authorization !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}
