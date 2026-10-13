// 本文件把生成的 protobuf 消息类组装成 Java gRPC 方法描述符。
package com.unitedrhino.urkit;

import com.google.protobuf.Message;
import io.grpc.MethodDescriptor;
import io.grpc.protobuf.ProtoUtils;

/** UrProtoMethods 让生成消息类可直接配合 UrRpcClient 调用平台 RPC。 */
public final class UrProtoMethods {
    /** 工具类不创建实例。 */
    private UrProtoMethods() {}

    /** unary 以 proto service/method 全名和请求、响应默认实例创建一元方法描述符。 */
    public static <Request extends Message, Response extends Message>
            MethodDescriptor<Request, Response> unary(String fullMethod,
                                                      Request requestDefault, Response responseDefault) {
        if (fullMethod == null || MethodDescriptor.extractFullServiceName(fullMethod) == null) {
            throw new IllegalArgumentException("fullMethod must be service/method");
        }
        return MethodDescriptor.<Request, Response>newBuilder()
                .setType(MethodDescriptor.MethodType.UNARY)
                .setFullMethodName(fullMethod)
                .setRequestMarshaller(ProtoUtils.marshaller(requestDefault))
                .setResponseMarshaller(ProtoUtils.marshaller(responseDefault))
                .build();
    }
}
