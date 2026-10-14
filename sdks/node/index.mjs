// 本文件提供 Node.js 平台 HTTP 客户端，ID 保持 JSON 原始字面值。

// createClient 创建带令牌的平台客户端；大整数响应保留为原始文本供合同层解析。
export function createClient({ baseUrl, token, fetchImpl = globalThis.fetch }) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('platform token is required');
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
      const headers = { 'content-type': 'application/json', 'ithings-token': token };
      if (tenantCode) headers['tenant-code'] = tenantCode;
      if (projectId) headers['project-id'] = String(projectId);
      if (appId != null && appId !== '') headers['app-id'] = String(appId);
      const response = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal, redirect: 'manual' });
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
