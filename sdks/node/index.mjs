// 本文件提供 Node.js 平台 HTTP 客户端，ID 保持 JSON 原始字面值。
import { headerID } from './id.mjs';
import { signOpenToken } from './open-token.mjs';

export { signOpenToken };

// encodeBody 在序列化前检查嵌套数值，避免不安全整数被 JSON.stringify 静默舍入。
function encodeBody(body) {
  return JSON.stringify(body, (_key, value) => {
    if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
      throw new Error('JSON 数字必须是有限值，整数必须是安全整数；大整数 ID 请使用十进制字符串');
    }
    return value;
  });
}

// createClient 创建带令牌的平台客户端；大整数响应保留为原始文本供合同层解析。
export function createClient({ baseUrl, token, bearerToken, fetchImpl = globalThis.fetch }) {
  const hasToken = typeof token === 'string' && Boolean(token.trim());
  const hasBearer = typeof bearerToken === 'string' && Boolean(bearerToken.trim());
  if (hasToken === hasBearer) throw new Error('exactly one platform token is required');
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('invalid platform URL');
  }
  return {
    async post(path, body, { signal, tenantCode, projectId, appId } = {}) {
      if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || /[?#]/.test(path)) throw new Error('invalid API path');
      if (body === undefined) throw new Error('JSON body is required; use null explicitly');
      const url = new URL(path, base);
      if (url.origin !== base.origin) throw new Error('cross-origin API path');
      const headers = { 'content-type': 'application/json' };
      if (hasBearer) headers.authorization = `Bearer ${bearerToken}`;
      else headers['ithings-token'] = token;
      if (tenantCode) headers['tenant-code'] = tenantCode;
      if (projectId) headers['project-id'] = headerID(projectId);
      if (appId != null && appId !== '') headers['app-id'] = headerID(appId);
      const response = await fetchImpl(url, { method: 'POST', headers, body: encodeBody(body), signal, redirect: 'manual' });
      const raw = await response.text();
      if (!response.ok) {
        const error = new Error(`platform API status ${response.status}`);
        error.status = response.status;
        error.body = raw;
        throw error;
      }
      return raw;
    },
  };
}
