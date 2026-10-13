// 本文件用本机模拟平台验证 Java 认证器的企业、项目与重定向边界。
package com.unitedrhino.urkit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

/** UrPlatformAuthenticatorTest 验证平台返回的身份范围进入 HTTP 业务处理器。 */
public class UrPlatformAuthenticatorTest {
    /** platformIdentityRoundTrip 覆盖有效成员、正授权、无权限和跨站重定向。 */
    @Test void platformIdentityRoundTrip() throws Exception {
        AtomicInteger authorization = new AtomicInteger(2);
        AtomicBoolean redirect = new AtomicBoolean(false);
        AtomicBoolean foreignCalled = new AtomicBoolean(false);
        HttpServer foreign = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        foreign.createContext("/", exchange -> {
            foreignCalled.set(true);
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        foreign.start();
        HttpServer platform = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        ExecutorService platformWorkers = Executors.newFixedThreadPool(4);
        platform.setExecutor(platformWorkers);
        platform.createContext("/api/v1/system/user/self/get-one", exchange -> {
            assertEquals("valid", exchange.getRequestHeaders().getFirst("ithings-token"));
            assertEquals("demo", exchange.getRequestHeaders().getFirst("tenant-code"));
            if (redirect.get()) {
                exchange.getResponseHeaders().set("Location", "http://127.0.0.1:" + foreign.getAddress().getPort() + "/");
                exchange.sendResponseHeaders(302, -1);
                exchange.close();
                return;
            }
            respond(exchange, "{\"code\":200,\"data\":{\"userID\":\"9007199254740993\",\"tenants\":[{\"tenantCode\":\"demo\",\"status\":1}]}}");
        });
        platform.createContext("/api/v1/things/project/info/get-list", exchange -> {
            assertEquals("101", exchange.getRequestHeaders().getFirst("project-id"));
            respond(exchange, "{\"code\":200,\"data\":{\"list\":[{\"projectID\":\"101\",\"tenantCode\":\"demo\",\"myAuthType\":" + authorization.get() + "}]}}");
        });
        platform.createContext("/ping", UrMiddleware.httpScoped(exchange -> {
            UrMiddleware.Identity identity = (UrMiddleware.Identity) exchange.getAttribute(UrMiddleware.HTTP_IDENTITY_ATTRIBUTE);
            respond(exchange, "{\"projectID\":\"" + identity.projectId() + "\"}");
        }, new UrPlatformAuthenticator("http://127.0.0.1:" + platform.getAddress().getPort()),
                null, null, null));
        platform.start();
        try {
            String origin = "http://127.0.0.1:" + platform.getAddress().getPort();
            UrPlatformAuthenticator auth = new UrPlatformAuthenticator(origin);
            assertEquals("9007199254740993", auth.authenticate("valid", "demo", null, null).userId());
            assertEquals("101", auth.authenticate("valid", "demo", "101", null).projectId());
            HttpRequest request = HttpRequest.newBuilder(URI.create(origin + "/ping"))
                    .header("token", "valid").header("tenant-code", "demo").header("project-id", "101")
                    .POST(HttpRequest.BodyPublishers.ofString("{}")).build();
            assertEquals(200, HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).statusCode());
            authorization.set(0);
            assertThrows(IllegalArgumentException.class, () -> auth.authenticate("valid", "demo", "101", null));
            redirect.set(true);
            assertThrows(UrHttpClient.ApiException.class, () -> auth.authenticate("valid", "demo", "101", null));
            assertEquals(false, foreignCalled.get());
        } finally {
            platform.stop(0);
            platformWorkers.shutdownNow();
            foreign.stop(0);
        }
    }

    /** respond 输出平台 JSON 响应，避免测试使用真实环境或凭据。 */
    private static void respond(com.sun.net.httpserver.HttpExchange exchange, String body) throws java.io.IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, data.length);
        try (var output = exchange.getResponseBody()) { output.write(data); }
    }
}
