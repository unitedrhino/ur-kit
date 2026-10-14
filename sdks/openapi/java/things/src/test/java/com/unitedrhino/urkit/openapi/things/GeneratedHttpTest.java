package com.unitedrhino.urkit.openapi.things;

import com.sun.net.httpserver.HttpServer;
import com.unitedrhino.urkit.openapi.things.api.ThingsAlarmInfoApi;
import com.unitedrhino.urkit.openapi.things.api.ThingsProjectAlarmSourceApi;
import com.unitedrhino.urkit.openapi.things.client.ApiClient;
import com.unitedrhino.urkit.openapi.things.model.AlarmEvaluateTriggerReq;
import com.unitedrhino.urkit.openapi.things.model.ProjectAlarmSourceSetReq;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 验证生成的 Java HTTP 客户端以字符串发送大整数 ID 和认证头。 */
class GeneratedHttpTest {
    /** 使用本机 HTTP 服务检查请求合同，避免依赖外部平台。 */
    @Test
    void alarmStringIDsRemainExact() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/things/alarm/info/evaluate-trigger", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        server.start();
        try {
            ApiClient client = new ApiClient()
                .setHost("127.0.0.1")
                .setPort(server.getAddress().getPort())
                .setRequestInterceptor(request -> request.header("Authorization", "Bearer local-token"));
            new ThingsAlarmInfoApi(client).postApiV1ThingsAlarmInfoEvaluateTrigger(
                new AlarmEvaluateTriggerReq().addAlarmIDStringsItem("9007199254740993"));
            assertEquals("Bearer local-token", authorization.get());
            assertTrue(body.get().contains("\"9007199254740993\""), body.get());
        } finally {
            server.stop(0);
        }
    }

    /** 核对结构来源接口发送字符串项目 ID、等级和认证头。 */
    @Test
    void projectAlarmSourceUsesStringProjectID() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> authorization = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/things/project/alarm-source/structure-set", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"code\":200,\"data\":{\"alarmStatus\":5}}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        server.start();
        try {
            ApiClient client = new ApiClient()
                .setHost("127.0.0.1")
                .setPort(server.getAddress().getPort())
                .setRequestInterceptor(request -> request.header("Authorization", "Bearer service-token"));
            var result = new ThingsProjectAlarmSourceApi(client).postApiV1ThingsProjectAlarmSourceStructureSet(
                new ProjectAlarmSourceSetReq().projectID("9007199254740993").level(4L));
            assertEquals("Bearer service-token", authorization.get());
            assertTrue(body.get().contains("\"projectID\":\"9007199254740993\""), body.get());
            assertTrue(body.get().contains("\"level\":4"), body.get());
            assertEquals(5L, result.getData().getAlarmStatus());
        } finally {
            server.stop(0);
        }
    }
}
