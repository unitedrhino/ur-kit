// 本文件使用平台用户与项目接口验证 Node 服务收到的令牌和选择上下文。
import { createClient } from '../../sdks/node/index.mjs';

// createPlatformAuthenticator 返回可直接注入 protectHTTP/protectRPC 的可信认证器。
export function createPlatformAuthenticator({ baseUrl, fetchImpl = globalThis.fetch, timeoutMs = 5000 }) {
  return async (request, token) => {
    const header = (name) => String(request.headers?.[name] ?? request.metadata?.get(name)?.[0] ?? '').trim();
    const tenantCode = header('tenant-code');
    const projectId = header('project-id');
    if (!tenantCode || typeof token !== 'string' || !token.trim()) throw new Error('platform identity unavailable');
    if (projectId && (!/^[1-9]\d*$/.test(projectId) || BigInt(projectId) > 9223372036854775807n)) {
      throw new Error('invalid project selection');
    }
    const fetchWithoutRedirect = (url, options) => fetchImpl(url, { ...options, redirect: 'manual' });
    const client = createClient({ baseUrl, token, fetchImpl: fetchWithoutRedirect });
    const options = { tenantCode, appId: header('app-id'), signal: AbortSignal.timeout(timeoutMs) };
    const read = async (path, body, context = options) => {
      const raw = await client.post(path, body, context);
      const envelope = JSON.parse(raw);
      if (envelope?.code !== 200 || !envelope.data) throw new Error('platform rejected identity');
      return envelope.data;
    };
    const user = await read('/api/v1/system/user/self/get-one', { withTenant: true });
    if (typeof user.userID !== 'string' || !user.userID || user.userID === '0' || !Array.isArray(user.tenants) || !user.tenants.some((item) => item.tenantCode === tenantCode && item.status === 1)) {
      throw new Error('platform membership unavailable');
    }
    const identity = { userId: user.userID, tenantCode };
    if (!projectId) return identity;
    const projects = await read('/api/v1/things/project/info/get-list', { projectIDs: [projectId] }, { ...options, projectId });
    if (!Array.isArray(projects.list) || !projects.list.some((item) => item.projectID === projectId && item.tenantCode === tenantCode && item.myAuthType > 0)) {
      throw new Error('platform project permission unavailable');
    }
    return { ...identity, projectId };
  };
}
