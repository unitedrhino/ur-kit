// 本文件通过平台用户与项目接口验证 Java HTTP/gRPC 服务的令牌与选择上下文。
package com.unitedrhino.urkit;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/** UrPlatformAuthenticator 只返回平台确认的企业成员及可选项目身份。 */
public final class UrPlatformAuthenticator implements UrMiddleware.ScopedAuthenticator {
    private final String baseUrl;

    /** 创建指向平台 HTTP(S) 根地址的认证器。 */
    public UrPlatformAuthenticator(String baseUrl) { this.baseUrl = baseUrl; }

    /** authenticate 核对令牌、企业成员和项目正授权，不信任外部身份头。 */
    @Override public UrMiddleware.Identity authenticate(String token, String tenantCode, String projectId, String appId) throws Exception {
        if (token == null || token.isBlank() || tenantCode == null || tenantCode.isBlank()) {
            throw new IllegalArgumentException("platform identity unavailable");
        }
        String tenant = tenantCode.trim();
        String project = projectId == null ? "" : projectId.trim();
        if (!project.isEmpty()) {
            try { if (Long.parseLong(project) <= 0) throw new NumberFormatException(); }
            catch (NumberFormatException invalid) { throw new IllegalArgumentException("invalid project selection"); }
        }
        UrHttpClient client = new UrHttpClient(baseUrl, token);
        JsonObject user = data(client.postJson("/api/v1/system/user/self/get-one", "{\"withTenant\":true}", tenant, null, appId));
        String userId = text(user, "userID");
        if (userId.isEmpty() || "0".equals(userId) || !member(user, tenant)) {
            throw new IllegalArgumentException("platform membership unavailable");
        }
        if (project.isEmpty()) return new UrMiddleware.Identity(userId, tenant, null);
        JsonObject projects = data(client.postJson("/api/v1/things/project/info/get-list",
                "{\"projectIDs\":[\"" + project + "\"]}", tenant, project, appId));
        if (!projectAllowed(projects, tenant, project)) {
            throw new IllegalArgumentException("platform project permission unavailable");
        }
        return new UrMiddleware.Identity(userId, tenant, project);
    }

    /** data 解析平台响应并拒绝缺失或失败的业务状态。 */
    private static JsonObject data(String raw) {
        JsonObject envelope = JsonParser.parseString(raw).getAsJsonObject();
        if (!envelope.has("code") || envelope.get("code").getAsInt() != 200 || !envelope.has("data") || !envelope.get("data").isJsonObject()) {
            throw new IllegalArgumentException("platform rejected identity");
        }
        return envelope.getAsJsonObject("data");
    }

    /** text 读取合同中的字符串 ID，保留其十进制表示。 */
    private static String text(JsonObject object, String key) {
        JsonElement value = object.get(key);
        return value == null || value.isJsonNull() ? "" : value.getAsString();
    }

    /** member 核对用户是否拥有当前企业的有效成员身份。 */
    private static boolean member(JsonObject user, String tenant) {
        JsonArray list = user.has("tenants") && user.get("tenants").isJsonArray() ? user.getAsJsonArray("tenants") : new JsonArray();
        for (JsonElement item : list) {
            JsonObject entry = item.getAsJsonObject();
            if (tenant.equals(text(entry, "tenantCode")) && entry.has("status") && entry.get("status").getAsInt() == 1) return true;
        }
        return false;
    }

    /** projectAllowed 核对项目标识、企业及平台返回的正授权。 */
    private static boolean projectAllowed(JsonObject projects, String tenant, String project) {
        JsonArray list = projects.has("list") && projects.get("list").isJsonArray() ? projects.getAsJsonArray("list") : new JsonArray();
        for (JsonElement item : list) {
            JsonObject entry = item.getAsJsonObject();
            if (project.equals(text(entry, "projectID")) && tenant.equals(text(entry, "tenantCode"))
                    && entry.has("myAuthType") && entry.get("myAuthType").getAsInt() > 0) return true;
        }
        return false;
    }
}
