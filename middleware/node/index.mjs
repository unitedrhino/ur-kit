// 本文件提供 Node HTTP 服务的可注入认证、权限与脱敏日志中间件。
import { readToken, stripUntrustedIdentityHeaders } from './identity.mjs';
export { createPlatformAuthenticator } from './platform.mjs';
export { protectUnaryRPC } from './rpc.mjs';

// protectHTTP 包装异步业务处理器；认证器必须验证令牌并返回可信身份。
export function protectHTTP(handler, { authenticate, authorize, resource, action, logger } = {}) {
  return async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    stripUntrustedIdentityHeaders(request.headers);
    const started = Date.now();
    try {
      const token = readToken(request.headers['ithings-token'], request.headers.token, request.headers.authorization);
      if (typeof authenticate !== 'function') return sendError(response, 500, 'auth_not_configured');
      if (!token) return sendError(response, 401, 'unauthorized');
      let identity;
      try {
        identity = await authenticate(request, token);
      } catch {
        return sendError(response, 401, 'unauthorized');
      }
      if (!identity?.userId || !identity?.tenantCode) return sendError(response, 401, 'unauthorized');
      if (resource) {
        if (typeof authorize !== 'function') return sendError(response, 403, 'forbidden');
        try {
          if (!(await authorize(request, identity, resource, action))) return sendError(response, 403, 'forbidden');
        } catch {
          return sendError(response, 403, 'forbidden');
        }
      }
      request.identity = { ...identity, accessToken: token };
      return await handler(request, response);
    } catch {
      return sendError(response, 500, 'internal_error');
    } finally {
      logger?.info?.({ method: request.method, path: request.url?.split('?')[0], durationMs: Date.now() - started }, 'http request');
    }
  };
}

// sendError 发送稳定错误码，不暴露认证器内部异常。
function sendError(response, status, code) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ code }));
}
