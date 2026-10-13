// 本文件提供 Java 后端可用的平台 HTTP 客户端，原始 JSON 响应保留大整数精度。
package com.unitedrhino.urkit;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** UrHttpClient 发送平台 JSON POST 请求并透传令牌、企业和项目上下文。 */
public final class UrHttpClient {
    private final URI baseUri;
    private final HttpClient transport;
    private final String token;

    /** 创建客户端；baseUrl 必须是无凭据的 HTTP(S) 根地址，token 是平台认证令牌。 */
    public UrHttpClient(String baseUrl, String token) {
        if (token == null || token.isBlank()) throw new IllegalArgumentException("token is required");
        this.baseUri = URI.create(baseUrl);
        if (!("http".equals(baseUri.getScheme()) || "https".equals(baseUri.getScheme()))
                || baseUri.getHost() == null || baseUri.getUserInfo() != null
                || baseUri.getRawQuery() != null || baseUri.getRawFragment() != null
                || (baseUri.getPath() != null && !baseUri.getPath().isEmpty() && !"/".equals(baseUri.getPath()))) {
            throw new IllegalArgumentException("baseUrl must be a credential-free HTTP(S) origin");
        }
        this.transport = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        this.token = token;
    }

    /** postJson 发送 JSON 字符串；返回原始响应，调用方可用 BigInteger/BigDecimal 解析数字。 */
    public String postJson(String path, String jsonBody, String tenantCode, String projectId)
            throws IOException, InterruptedException {
        return postJson(path, jsonBody, tenantCode, projectId, null);
    }

    /** postJson 发送包含可选 app-id 的平台请求，保持原始 JSON 响应。 */
    public String postJson(String path, String jsonBody, String tenantCode, String projectId, String appId)
            throws IOException, InterruptedException {
        if (path == null || !path.startsWith("/") || path.startsWith("//") || path.contains("?") || path.contains("#")) {
            throw new IllegalArgumentException("path must start with one slash");
        }
        if (jsonBody == null) throw new IllegalArgumentException("JSON body is required; use null explicitly");
        URI target = baseUri.resolve(path);
        if (!target.getScheme().equals(baseUri.getScheme()) || !target.getAuthority().equals(baseUri.getAuthority())) {
            throw new IllegalArgumentException("cross-origin API path");
        }
        HttpRequest.Builder request = HttpRequest.newBuilder(target)
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("ithings-token", token)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));
        if (tenantCode != null && !tenantCode.isBlank()) request.header("tenant-code", tenantCode);
        if (projectId != null && !projectId.isBlank()) request.header("project-id", projectId);
        if (appId != null && !appId.isBlank()) request.header("app-id", appId);
        HttpResponse<String> response = transport.send(request.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(response.statusCode(), response.body());
        }
        return response.body();
    }

    /** ApiException 表示平台返回的非成功状态，消息不包含令牌。 */
    public static final class ApiException extends IOException {
        private final int status;
        private final String responseBody;

        /** 保存 HTTP 状态及平台原始响应。 */
        public ApiException(int status, String responseBody) {
            super("platform API status " + status);
            this.status = status;
            this.responseBody = responseBody;
        }

        /** status 返回 HTTP 状态码。 */
        public int status() { return status; }

        /** responseBody 返回平台错误响应原文。 */
        public String responseBody() { return responseBody; }
    }
}
