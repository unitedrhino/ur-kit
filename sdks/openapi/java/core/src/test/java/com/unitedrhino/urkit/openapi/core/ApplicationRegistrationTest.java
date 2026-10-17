// 本文件通过本机 HTTP 服务验证 Java 注册客户端的路径、令牌与无损 ID 合同。
package com.unitedrhino.urkit.openapi.core;

import com.sun.net.httpserver.HttpServer;
import com.unitedrhino.urkit.openapi.core.api.SystemAppInfoApi;
import com.unitedrhino.urkit.openapi.core.client.ApiClient;
import com.unitedrhino.urkit.openapi.core.model.AppInfo;
import com.unitedrhino.urkit.openapi.core.model.AppMenuBatchImportReq;
import com.unitedrhino.urkit.openapi.core.model.MenuInfo;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// ApplicationRegistrationTest 检查强类型客户端的实际 HTTP 序列化合同。
public class ApplicationRegistrationTest {
    // preservesStringIDs 核验应用、菜单及根节点标识始终为 JSON 字符串。
    @Test
    public void preservesStringIDs() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> token = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/system/app/info/batch-import", exchange -> {
            token.set(exchange.getRequestHeaders().getFirst("ithings-token"));
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"code\":200,\"data\":{\"id\":\"9007199254740993\"}}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var out = exchange.getResponseBody()) { out.write(response); }
        });
        server.start();
        try {
            ApiClient client = new ApiClient().setHost("127.0.0.1").setPort(server.getAddress().getPort())
                .setRequestInterceptor(request -> request.header("ithings-token", "bootstrap-admin"));
            AppMenuBatchImportReq request = new AppMenuBatchImportReq()
                .app(new AppInfo().id("9007199254740993"))
                .menus(List.of(new MenuInfo().id("9007199254740994").appID("9007199254740993").parentID("1")));
            new SystemAppInfoApi(client).postApiV1SystemAppInfoBatchImport(request);
            assertEquals("bootstrap-admin", token.get());
            assertTrue(body.get().contains("\"id\":\"9007199254740993\""));
            assertTrue(body.get().contains("\"appID\":\"9007199254740993\""));
            assertTrue(body.get().contains("\"parentID\":\"1\""));
        } finally { server.stop(0); }
    }
}
