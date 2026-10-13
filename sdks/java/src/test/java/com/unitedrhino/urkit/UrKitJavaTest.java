// 本文件验证 Java HTTP、gRPC 客户端与服务端身份中间件的实际请求。
package com.unitedrhino.urkit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpServer;
import com.google.protobuf.StringValue;
import dm.DeviceManageGrpc;
import dm.DeviceManageOuterClass;
import io.grpc.MethodDescriptor;
import io.grpc.Metadata;
import io.grpc.ClientInterceptors;
import io.grpc.CallOptions;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.ServerInterceptors;
import io.grpc.ServerCall;
import io.grpc.ServerCallHandler;
import io.grpc.ServerInterceptor;
import io.grpc.ServerServiceDefinition;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.ServerCalls;
import io.grpc.stub.ClientCalls;
import io.grpc.stub.MetadataUtils;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

/** UrKitJavaTest 用本机服务验证令牌转发、权限和可信上下文。 */
public class UrKitJavaTest {
    /** 生成消息类可以用 protobuf 编解码器构建可调用的 gRPC 方法描述符。 */
    @Test void generatedMessageDescriptor() {
        MethodDescriptor<StringValue, StringValue> method = UrProtoMethods.unary(
                "dm.DeviceManage/deviceInfoGetOne", StringValue.getDefaultInstance(), StringValue.getDefaultInstance());
        assertEquals("dm.DeviceManage/deviceInfoGetOne", method.getFullMethodName());
        assertEquals("demo", method.getRequestMarshaller()
                .parse(method.getRequestMarshaller().stream(StringValue.of("demo"))).getValue());
        assertThrows(IllegalArgumentException.class, () -> UrProtoMethods.unary(
                "invalid", StringValue.getDefaultInstance(), StringValue.getDefaultInstance()));
    }
    /** 生成的强类型服务 Stub 通过认证 Channel 调用固定合同中的设备方法。 */
    @Test void generatedServiceStubRoundTrip() throws Exception {
        ServerServiceDefinition service = ServerServiceDefinition.builder(DeviceManageGrpc.SERVICE_NAME)
                .addMethod(DeviceManageGrpc.getDeviceInfoGetOneMethod(), ServerCalls.asyncUnaryCall((request, observer) -> {
                    assertEquals("9007199254740993", UrMiddleware.IDENTITY.get().userId());
                    observer.onNext(DeviceManageOuterClass.DeviceInfo.newBuilder()
                            .setDeviceName(request.getDeviceName()).build());
                    observer.onCompleted();
                })).build();
        Server server = ServerBuilder.forPort(0).addService(ServerInterceptors.intercept(service,
                UrMiddleware.rpcScoped((token, tenant, project, app) -> "good".equals(token) && "acme".equals(tenant) && "p1".equals(project)
                        ? new UrMiddleware.Identity("9007199254740993", tenant, project) : null,
                        (identity, resource, action) -> true, "device", "read"))).build().start();
        try (UrRpcClient client = new UrRpcClient("127.0.0.1:" + server.getPort(), "good", "acme", "p1", false)) {
            var request = DeviceManageOuterClass.DeviceInfoGetOneReq.newBuilder().setDeviceName("sensor-1").build();
            assertEquals("sensor-1", DeviceManageGrpc.newBlockingStub(client.channel())
                    .deviceInfoGetOne(request).getDeviceName());
        } finally { server.shutdownNow(); }
    }
    /** HTTP 客户端调用受保护路由，并检查错误码与安全头。 */
    @Test void httpRoundTrip() throws Exception {
        Path fixturePath = Path.of("..", "conformance", "http-response.json");
        if (!Files.exists(fixturePath)) fixturePath = Path.of("sdks", "conformance", "http-response.json");
        byte[] fixture = Files.readAllBytes(fixturePath);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/fixture", exchange -> {
            exchange.sendResponseHeaders(200, fixture.length);
            try (var output = exchange.getResponseBody()) { output.write(fixture); }
        });
        server.createContext("/api/ping", UrMiddleware.http(exchange -> {
            UrMiddleware.Identity identity = (UrMiddleware.Identity) exchange.getAttribute(UrMiddleware.HTTP_IDENTITY_ATTRIBUTE);
            for (String name : new String[] {"ithings-user", "ithings-user-role", "ithings-tenant-code", "ithings-project-id", "ithings-meta", "ithings-set-token"}) {
                assertEquals(null, exchange.getRequestHeaders().getFirst(name));
            }
            byte[] body = ("{\"userId\":\"" + identity.userId() + "\",\"appId\":\""
                    + exchange.getRequestHeaders().getFirst("app-id") + "\"}").getBytes(StandardCharsets.UTF_8);
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
            assertTrue(new UrHttpClient(origin, "good").postJson("/api/ping", "{}", "acme", "p1", "7")
                    .contains("\"appId\":\"7\""));
            String conformance = new UrHttpClient(origin, "good").postJson("/api/fixture", "null", "acme", "p1");
            assertEquals(new String(fixture, StandardCharsets.UTF_8), conformance);
            assertTrue(conformance.contains("\"id\":9007199254740993"));
            assertTrue(conformance.contains("\"nullable\":null"));
            assertTrue(conformance.contains("\"receivedTime\":1760000000123"));
            assertThrows(IllegalArgumentException.class, () -> new UrHttpClient(origin, " "));
            assertThrows(IllegalArgumentException.class, () -> new UrHttpClient("http://user:pass@127.0.0.1", "good"));
            assertThrows(IllegalArgumentException.class, () -> new UrHttpClient(origin + "/root", "good"));
            assertThrows(IllegalArgumentException.class, () -> new UrHttpClient(origin + "/?key=value", "good"));
            assertThrows(IllegalArgumentException.class,
                    () -> new UrHttpClient(origin, "good").postJson("/api/fixture?x=1", "{}", null, null));
            assertThrows(IllegalArgumentException.class,
                    () -> new UrHttpClient(origin, "good").postJson("/api/fixture", null, null, null));
            HttpRequest webRequest = HttpRequest.newBuilder(URI.create(origin + "/api/ping"))
                    .header("token", "good").header("ithings-user", "forged")
                    .header("ithings-user-role", "admin").header("ithings-tenant-code", "other")
                    .header("ithings-project-id", "999").header("ithings-meta", "forged")
                    .header("ithings-set-token", "forged")
                    .POST(HttpRequest.BodyPublishers.ofString("{}")).build();
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
        AtomicReference<String> seenAppId = new AtomicReference<>();
        ServerInterceptor appInspector = new ServerInterceptor() {
            /** interceptCall 读取测试请求的应用上下文，再交给身份中间件。 */
            @Override public <Request, Response> ServerCall.Listener<Request> interceptCall(
                    ServerCall<Request, Response> call, Metadata headers, ServerCallHandler<Request, Response> next) {
                seenAppId.set(headers.get(Metadata.Key.of("app-id", Metadata.ASCII_STRING_MARSHALLER)));
                for (String name : new String[] {"ithings-user", "ithings-user-role", "ithings-tenant-code", "ithings-project-id", "ithings-meta", "ithings-set-token"}) {
                    assertEquals(null, headers.get(Metadata.Key.of(name, Metadata.ASCII_STRING_MARSHALLER)));
                }
                return next.startCall(call, headers);
            }
        };
        MethodDescriptor<String, String> method = MethodDescriptor.<String, String>newBuilder()
                .setType(MethodDescriptor.MethodType.UNARY).setFullMethodName("test.Echo/Say")
                .setRequestMarshaller(new StringMarshaller()).setResponseMarshaller(new StringMarshaller()).build();
        ServerServiceDefinition service = ServerServiceDefinition.builder("test.Echo")
                .addMethod(method, ServerCalls.asyncUnaryCall((request, observer) -> {
                    observer.onNext(UrMiddleware.IDENTITY.get().userId() + ":" + request);
                    observer.onCompleted();
                })).build();
        Server server = ServerBuilder.forPort(0).addService(ServerInterceptors.intercept(service, appInspector,
                UrMiddleware.rpc(token -> "good".equals(token)
                        ? new UrMiddleware.Identity("9007199254740993", "acme", "p1") : null,
                        (identity, resource, action) -> true, "device", "read"))).build().start();
        try {
            String target = "127.0.0.1:" + server.getPort();
            try (UrRpcClient client = new UrRpcClient(target, "good", "acme", "p1", false)) {
                assertEquals("9007199254740993:hello", client.unary(method, "hello"));
            }
            try (UrRpcClient client = new UrRpcClient(target, "good", "acme", "p1", "7", false)) {
                assertEquals("9007199254740993:app", client.unary(method, "app"));
                assertEquals("7", seenAppId.get());
                Metadata forged = new Metadata();
                for (String name : new String[] {"ithings-user", "ithings-user-role", "ithings-tenant-code", "ithings-project-id", "ithings-meta", "ithings-set-token"}) {
                    forged.put(Metadata.Key.of(name, Metadata.ASCII_STRING_MARSHALLER), "forged");
                }
                assertEquals("9007199254740993:filtered", ClientCalls.blockingUnaryCall(
                        ClientInterceptors.intercept(client.channel(), MetadataUtils.newAttachHeadersInterceptor(forged)),
                        method, CallOptions.DEFAULT, "filtered"));
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
