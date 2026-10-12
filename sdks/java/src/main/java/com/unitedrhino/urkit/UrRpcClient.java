// 本文件提供 Java 后端使用生成的 gRPC 方法描述符调用平台的客户端。
package com.unitedrhino.urkit;

import io.grpc.CallOptions;
import io.grpc.Channel;
import io.grpc.ClientCall;
import io.grpc.ClientInterceptor;
import io.grpc.ClientInterceptors;
import io.grpc.ForwardingClientCall;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Metadata;
import io.grpc.MethodDescriptor;
import io.grpc.stub.ClientCalls;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

/** UrRpcClient 为平台生成的 gRPC 描述符附加令牌与项目上下文。 */
public final class UrRpcClient implements AutoCloseable {
    private static final Metadata.Key<String> TOKEN = Metadata.Key.of("ithings-token", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> TENANT = Metadata.Key.of("tenant-code", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> PROJECT = Metadata.Key.of("project-id", Metadata.ASCII_STRING_MARSHALLER);
    private final ManagedChannel channel;
    private final Channel authenticated;

    /** 创建客户端；target 是 gRPC 地址，token 是平台令牌，useTls 控制传输加密。 */
    public UrRpcClient(String target, String token, String tenantCode, String projectId, boolean useTls) {
        if (target == null || target.isBlank() || token == null || token.isBlank()) {
            throw new IllegalArgumentException("target and token are required");
        }
        ManagedChannelBuilder<?> builder = ManagedChannelBuilder.forTarget(target);
        channel = useTls ? builder.useTransportSecurity().build() : builder.usePlaintext().build();
        authenticated = ClientInterceptors.intercept(channel, new AuthInterceptor(token, tenantCode, projectId));
    }

    /** channel 返回带认证元数据的 Channel，可交给生成的异步或阻塞 Stub。 */
    public Channel channel() { return authenticated; }

    /** unary 调用生成的 unary 方法描述符，返回生成的响应对象。 */
    public <Request, Response> Response unary(MethodDescriptor<Request, Response> method, Request request) {
        return ClientCalls.blockingUnaryCall(authenticated, method, CallOptions.DEFAULT, request);
    }

    /** close 关闭连接并等待短时间回收资源。 */
    @Override public void close() {
        channel.shutdown();
        try { channel.awaitTermination(5, TimeUnit.SECONDS); }
        catch (InterruptedException exception) { Thread.currentThread().interrupt(); channel.shutdownNow(); }
    }

    /** AuthInterceptor 只添加可信客户端上下文，不从不可信业务字段读取令牌。 */
    private static final class AuthInterceptor implements ClientInterceptor {
        private final String token;
        private final String tenantCode;
        private final String projectId;

        /** 保存要发送的身份和项目上下文。 */
        private AuthInterceptor(String token, String tenantCode, String projectId) {
            this.token = Objects.requireNonNull(token);
            this.tenantCode = tenantCode;
            this.projectId = projectId;
        }

        /** interceptCall 在每个 RPC 调用开始时写入认证元数据。 */
        @Override public <Request, Response> ClientCall<Request, Response> interceptCall(
                MethodDescriptor<Request, Response> method, CallOptions options, Channel next) {
            return new ForwardingClientCall.SimpleForwardingClientCall<>(next.newCall(method, options)) {
                /** start 写入平台令牌及非空上下文。 */
                @Override public void start(Listener<Response> listener, Metadata headers) {
                    headers.put(TOKEN, token);
                    if (tenantCode != null && !tenantCode.isBlank()) headers.put(TENANT, tenantCode);
                    if (projectId != null && !projectId.isBlank()) headers.put(PROJECT, projectId);
                    super.start(listener, headers);
                }
            };
        }
    }
}
