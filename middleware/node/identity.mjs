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
