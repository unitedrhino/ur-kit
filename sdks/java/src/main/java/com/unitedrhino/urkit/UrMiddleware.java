// 本文件提供 Java HTTP 与 gRPC 服务可复用的身份、权限和错误中间件。
package com.unitedrhino.urkit;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import io.grpc.Context;
import io.grpc.Contexts;
import io.grpc.Metadata;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.Status;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.logging.Logger;

/** UrMiddleware 验证令牌后向业务处理器提供可信身份。 */
public final class UrMiddleware {
    /** IDENTITY 是 gRPC 业务处理器取得经验证身份的上下文键。 */
    public static final Context.Key<Identity> IDENTITY = Context.key("ur-identity");
    /** HTTP_IDENTITY_ATTRIBUTE 是 HTTP 业务处理器取得身份的属性名。 */
    public static final String HTTP_IDENTITY_ATTRIBUTE = "ur.identity";
    private static final Metadata.Key<String> TOKEN = Metadata.Key.of("ithings-token", Metadata.ASCII_STRING_MARSHALLER);
    /** TOKEN_ALIAS 对应平台 Web 客户端使用的 token 请求头。 */
    private static final Metadata.Key<String> TOKEN_ALIAS = Metadata.Key.of("token", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> AUTHORIZATION = Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
    /** INTERNAL_IDENTITY_HEADERS 是只有平台认证后才能写入的元数据字段。 */
    private static final List<String> INTERNAL_IDENTITY_HEADERS = List.of(
            "ithings-user", "ithings-user-role", "ithings-tenant-code",
            "ithings-project-id", "ithings-meta", "ithings-set-token");
    private static final Logger LOGGER = Logger.getLogger(UrMiddleware.class.getName());

    /** Identity 保存验证器返回的平台身份，不接收客户端自报身份。 */
    public record Identity(String userId, String tenantCode, String projectId) {
        /** 确保核心身份字段有效。 */
        public Identity {
            if (userId == null || userId.isBlank() || tenantCode == null || tenantCode.isBlank()) {
                throw new IllegalArgumentException("invalid identity");
            }
        }
    }

    /** Authenticator 用令牌查询可信身份，验证失败时抛出异常或返回 null。 */
    @FunctionalInterface public interface Authenticator {
        /** authenticate 验证令牌并返回可信身份。 */
        Identity authenticate(String token) throws Exception;
    }

    /** Authorizer 根据可信身份判断能否执行资源动作。 */
    @FunctionalInterface public interface Authorizer {
        /** allow 返回指定身份对资源动作是否有权访问。 */
        boolean allow(Identity identity, String resource, String action);
    }

    /** 本工具类只提供静态中间件工厂。 */
    private UrMiddleware() {}

    /** http 为业务处理器补安全头、认证、权限和不含令牌的日志。 */
    public static HttpHandler http(HttpHandler next, Authenticator authenticate,
                                   Authorizer authorize, String resource, String action) {
        Objects.requireNonNull(next);
        return exchange -> {
            long started = System.nanoTime();
            exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
            exchange.getResponseHeaders().set("X-Frame-Options", "DENY");
            exchange.getResponseHeaders().set("Referrer-Policy", "strict-origin-when-cross-origin");
            try {
                if (authenticate == null) { error(exchange, 500, "auth_not_configured"); return; }
                String token = token(exchange.getRequestHeaders().getFirst("ithings-token"),
                                     exchange.getRequestHeaders().getFirst("token"),
                                     exchange.getRequestHeaders().getFirst("Authorization"));
                if (token == null) { error(exchange, 401, "unauthorized"); return; }
                Identity identity;
                try { identity = authenticate.authenticate(token); }
                catch (Exception ignored) { error(exchange, 401, "unauthorized"); return; }
                if (identity == null) { error(exchange, 401, "unauthorized"); return; }
                if (resource != null && !resource.isBlank() &&
                    (authorize == null || !authorize.allow(identity, resource, action))) {
                    error(exchange, 403, "forbidden"); return;
                }
                exchange.setAttribute(HTTP_IDENTITY_ATTRIBUTE, identity);
                next.handle(new FilteredHttpExchange(exchange, INTERNAL_IDENTITY_HEADERS));
            } finally {
                LOGGER.info(() -> "http request method=" + exchange.getRequestMethod()
                        + " path=" + exchange.getRequestURI().getPath()
                        + " duration_ms=" + (System.nanoTime() - started) / 1_000_000);
            }
        };
    }

    /** rpc 为 unary 与 streaming gRPC 调用提供同样的身份和权限检查。 */
    public static ServerInterceptor rpc(Authenticator authenticate, Authorizer authorize,
                                         String resource, String action) {
        return new ServerInterceptor() {
            /** interceptCall 拒绝缺失或无效令牌，并把验证身份写入 gRPC Context。 */
            @Override public <Request, Response> ServerCall.Listener<Request> interceptCall(
                    ServerCall<Request, Response> call, Metadata headers,
                    ServerCallHandler<Request, Response> next) {
                long started = System.nanoTime();
                try {
                    if (authenticate == null) return reject(call, Status.INTERNAL.withDescription("auth_not_configured"));
                    String provided = token(headers.get(TOKEN), headers.get(TOKEN_ALIAS), headers.get(AUTHORIZATION));
                    if (provided == null) return reject(call, Status.UNAUTHENTICATED.withDescription("unauthorized"));
                    Identity identity;
                    try { identity = authenticate.authenticate(provided); }
                    catch (Exception ignored) { return reject(call, Status.UNAUTHENTICATED.withDescription("unauthorized")); }
                    if (identity == null) return reject(call, Status.UNAUTHENTICATED.withDescription("unauthorized"));
                    if (resource != null && !resource.isBlank() &&
                        (authorize == null || !authorize.allow(identity, resource, action))) {
                        return reject(call, Status.PERMISSION_DENIED.withDescription("forbidden"));
                    }
                    stripRpcIdentity(headers);
                    return Contexts.interceptCall(Context.current().withValue(IDENTITY, identity), call, headers, next);
                } finally {
                    LOGGER.info(() -> "rpc request method=" + call.getMethodDescriptor().getFullMethodName()
                            + " duration_ms=" + (System.nanoTime() - started) / 1_000_000);
                }
            }
        };
    }

    /** stripRpcIdentity 删除客户端或转发层携带的内部身份元数据。 */
    static void stripRpcIdentity(Metadata headers) {
        for (String name : INTERNAL_IDENTITY_HEADERS) {
            headers.removeAll(Metadata.Key.of(name, Metadata.ASCII_STRING_MARSHALLER));
        }
    }

    /** token 读取平台令牌或 Bearer 令牌，不接受自报用户头。 */
    private static String token(String platformToken, String platformAlias, String authorization) {
        if (platformToken != null && !platformToken.isBlank()) return platformToken.trim();
        if (platformAlias != null && !platformAlias.isBlank()) return platformAlias.trim();
        if (authorization != null && authorization.startsWith("Bearer ") && authorization.length() > 7) {
            return authorization.substring(7).trim();
        }
        return null;
    }

    /** error 输出固定 JSON 错误码，避免泄露认证器异常。 */
    private static void error(HttpExchange exchange, int status, String code) throws IOException {
        byte[] body = ("{\"code\":\"" + code + "\"}").getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.length);
        try (var output = exchange.getResponseBody()) { output.write(body); }
    }

    /** reject 拒绝 gRPC 请求并返回空监听器。 */
    private static <Request, Response> ServerCall.Listener<Request> reject(
            ServerCall<Request, Response> call, Status status) {
        call.close(status, new Metadata());
        return new ServerCall.Listener<>() {};
    }
}
