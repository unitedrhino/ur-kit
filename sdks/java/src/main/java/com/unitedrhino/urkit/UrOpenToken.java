// 本文件用标准 HMAC-SHA256 签发平台访问令牌 JWT，供 Java 后端使用。
package com.unitedrhino.urkit;

import com.google.gson.JsonObject;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** UrOpenToken 签发 Core 可验证的短期 Bearer JWT。 */
public final class UrOpenToken {
    /** 禁止创建只包含静态签发能力的对象。 */
    private UrOpenToken() {}

    /** sign 使用访问密钥和显式到期时间生成 JWT；调用方应设置较短有效期。 */
    public static String sign(String tenantCode, String accessKey, String accessSecret, Instant expiresAt) {
        if (invalid(tenantCode) || invalid(accessKey) || invalid(accessSecret)
                || expiresAt == null || expiresAt.getEpochSecond() <= 0) {
            throw new IllegalArgumentException("invalid platform access token fields");
        }
        JsonObject header = new JsonObject();
        header.addProperty("alg", "HS256");
        header.addProperty("typ", "JWT");
        JsonObject claims = new JsonObject();
        claims.addProperty("accessKey", accessKey);
        claims.addProperty("exp", expiresAt.getEpochSecond());
        claims.addProperty("tenantCode", tenantCode);
        String message = encode(header.toString()) + "." + encode(claims.toString());
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(accessSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return message + "." + Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", exception);
        }
    }

    /** invalid 拒绝空白和意外首尾空格，避免签名凭据与平台保存值不同。 */
    private static boolean invalid(String value) {
        return value == null || value.isEmpty() || !value.strip().equals(value);
    }

    /** encode 使用不填充的 URL 安全 Base64 编码 JWT 片段。 */
    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
