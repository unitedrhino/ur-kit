// 本文件验证 Java HTTP、gRPC 客户端与服务端身份中间件的实际请求。
package com.unitedrhino.urkit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpServer;
import io.grpc.MethodDescriptor;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.ServerInterceptors;
import io.grpc.ServerServiceDefinition;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.ServerCalls;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

/** UrKitJavaTest 用本机服务验证令牌转发、权限和可信上下文。 */
public class UrKitJavaTest {
    /** HTTP 客户端调用受保护路由，并检查错误码与安全头。 */
    @Test void httpRoundTrip() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/ping", UrMiddleware.http(exchange -> {
            UrMiddleware.Identity identity = (UrMiddleware.Identity) exchange.getAttribute(UrMiddleware.HTTP_IDENTITY_ATTRIBUTE);
            byte[] body = ("{\"userId\":\"" + identity.userId() + "\"}").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) { output.write(body); }
        }, token -> "good".equals(token) ? new UrMiddleware.Identity("9007199254740993", "acme", "p1") : null,
                (identity, resource, action) -> "read".equals(action), "device", "read"));
        server.createContext("/api/denied", UrMiddleware.http(exchange -> {
            throw new AssertionError("无权限时不应调用业务处理器");
        }, token -> new UrMiddleware.Identity("9007199254740993", "acme", "p1"),
                (identity, resource, action) -> false, "device", "write"));
        server.start();
        try {
            String origin = "http://127.0.0.1:" + server.getAddress().getPort();
            assertTrue(new UrHttpClient(origin, "good").postJson("/api/ping", "{}", "acme", "p1")
                    .contains("9007199254740993"));
            HttpRequest webRequest = HttpRequest.newBuilder(URI.create(origin + "/api/ping"))
                    .header("token", "good").POST(HttpRequest.BodyPublishers.ofString("{}")).build();
            assertEquals(200, HttpClient.newHttpClient().send(webRequest,
                    HttpResponse.BodyHandlers.ofString()).statusCode());
            assertEquals(401, assertThrows(UrHttpClient.ApiException.class,
                    () -> new UrHttpClient(origin, "bad").postJson("/api/ping", "{}", null, null)).status());
            assertEquals(403, assertThrows(UrHttpClient.ApiException.class,
                    () -> new UrHttpClient(origin, "good").postJson("/api/denied", "{}", null, null)).status());
        } finally { server.stop(0); }
    }

    /** RPC 客户端使用服务方法描述符，并经中间件取得可信身份。 */
    @Test void rpcRoundTrip() throws Exception {
        MethodDescriptor<String, String> method = MethodDescriptor.<String, String>newBuilder()
                .setType(MethodDescriptor.MethodType.UNARY).setFullMethodName("test.Echo/Say")
                .setRequestMarshaller(new StringMarshaller()).setResponseMarshaller(new StringMarshaller()).build();
        ServerServiceDefinition service = ServerServiceDefinition.builder("test.Echo")
                .addMethod(method, ServerCalls.asyncUnaryCall((request, observer) -> {
                    observer.onNext(UrMiddleware.IDENTITY.get().userId() + ":" + request);
                    observer.onCompleted();
                })).build();
        Server server = ServerBuilder.forPort(0).addService(ServerInterceptors.intercept(service,
                UrMiddleware.rpc(token -> "good".equals(token)
                        ? new UrMiddleware.Identity("9007199254740993", "acme", "p1") : null,
                        (identity, resource, action) -> true, "device", "read"))).build().start();
        try {
            String target = "127.0.0.1:" + server.getPort();
            try (UrRpcClient client = new UrRpcClient(target, "good", "acme", "p1", false)) {
                assertEquals("9007199254740993:hello", client.unary(method, "hello"));
            }
            try (UrRpcClient client = new UrRpcClient(target, "bad", null, null, false)) {
                assertEquals(Status.Code.UNAUTHENTICATED, assertThrows(StatusRuntimeException.class,
                        () -> client.unary(method, "hello")).getStatus().getCode());
            }
        } finally { server.shutdownNow(); }
    }

    /** StringMarshaller 仅为本机 RPC 测试提供简单字符串编解码。 */
    private static final class StringMarshaller implements MethodDescriptor.Marshaller<String> {
        /** stream 把测试请求编码成 UTF-8。 */
        @Override public java.io.InputStream stream(String value) {
            return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
        }
        /** parse 从流还原测试字符串。 */
        @Override public String parse(java.io.InputStream stream) {
            try { return new String(stream.readAllBytes(), StandardCharsets.UTF_8); }
            catch (IOException exception) { throw new IllegalStateException(exception); }
        }
    }
}
