// 本文件提供 Node gRPC 一元服务方法的认证与权限包装。
import grpc from '@grpc/grpc-js';

// protectUnaryRPC 在调用业务处理器前验证令牌并过滤外部伪造身份元数据。
export function protectUnaryRPC(handler, { authenticate, authorize, resource, action, logger } = {}) {
  return async (call, callback) => {
    const started = Date.now();
    const token = call.metadata.get('ithings-token')[0];
    call.metadata.remove('ithings-user');
    try {
      if (typeof authenticate !== 'function') return callback(rpcError(grpc.status.INTERNAL, 'auth_not_configured'));
      if (!token) return callback(rpcError(grpc.status.UNAUTHENTICATED, 'unauthorized'));
      let identity;
      try {
        identity = await authenticate(call, token);
      } catch {
        return callback(rpcError(grpc.status.UNAUTHENTICATED, 'unauthorized'));
      }
      if (!identity?.userId || !identity?.tenantCode) return callback(rpcError(grpc.status.UNAUTHENTICATED, 'unauthorized'));
      if (resource) {
        if (typeof authorize !== 'function') return callback(rpcError(grpc.status.PERMISSION_DENIED, 'forbidden'));
        try {
          if (!(await authorize(call, identity, resource, action))) return callback(rpcError(grpc.status.PERMISSION_DENIED, 'forbidden'));
        } catch {
          return callback(rpcError(grpc.status.PERMISSION_DENIED, 'forbidden'));
        }
      }
      call.identity = { ...identity, accessToken: token };
      return handler(call, callback);
    } catch {
      return callback(rpcError(grpc.status.INTERNAL, 'internal_error'));
    } finally {
      logger?.info?.({ durationMs: Date.now() - started }, 'rpc request');
    }
  };
}

// rpcError 创建稳定 gRPC 错误码且不包含认证细节。
function rpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
