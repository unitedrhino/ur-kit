// 本文件用标准 HMAC-SHA256 签发平台访问令牌 JWT，供 Node 后端使用。
import { createHmac } from 'node:crypto';

// signOpenToken 使用访问密钥和显式到期时间生成平台 Bearer JWT。
export function signOpenToken({ tenantCode, accessKey, accessSecret, expiresAt }) {
  if ([tenantCode, accessKey, accessSecret].some((value) => typeof value !== 'string' || !value || value.trim() !== value)
      || !(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= 0) {
    throw new Error('invalid platform access token fields');
  }
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const message = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ accessKey, exp: Math.floor(expiresAt.getTime() / 1000), tenantCode })}`;
  return `${message}.${createHmac('sha256', accessSecret).update(message).digest('base64url')}`;
}
