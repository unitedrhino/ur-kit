// 本文件包装 JDK 不可修改的 HTTP 请求头，向业务处理器提供已过滤内部身份的视图。
package com.unitedrhino.urkit;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpPrincipal;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/** FilteredHttpExchange 保留原请求与响应行为，仅替换业务可见的请求头。 */
final class FilteredHttpExchange extends HttpExchange {
    private final HttpExchange delegate;
    private final Headers requestHeaders = new Headers();

    /** 从原请求复制普通头并删除客户端自报的平台内部身份。 */
    FilteredHttpExchange(HttpExchange delegate, List<String> untrustedNames) {
        this.delegate = delegate;
        delegate.getRequestHeaders().forEach((name, values) -> requestHeaders.put(name, new ArrayList<>(values)));
        for (String name : untrustedNames) requestHeaders.remove(name);
    }

    /** getRequestHeaders 返回已过滤的请求头副本。 */
    @Override public Headers getRequestHeaders() { return requestHeaders; }
    /** getResponseHeaders 保留实际响应头。 */
    @Override public Headers getResponseHeaders() { return delegate.getResponseHeaders(); }
    /** getRequestURI 保留原请求地址。 */
    @Override public URI getRequestURI() { return delegate.getRequestURI(); }
    /** getRequestMethod 保留原请求方法。 */
    @Override public String getRequestMethod() { return delegate.getRequestMethod(); }
    /** getHttpContext 保留原服务上下文。 */
    @Override public HttpContext getHttpContext() { return delegate.getHttpContext(); }
    /** close 关闭原交换对象。 */
    @Override public void close() { delegate.close(); }
    /** getRequestBody 保留原请求体。 */
    @Override public InputStream getRequestBody() { return delegate.getRequestBody(); }
    /** getResponseBody 保留原响应体。 */
    @Override public OutputStream getResponseBody() { return delegate.getResponseBody(); }
    /** sendResponseHeaders 发送原交换对象的响应状态。 */
    @Override public void sendResponseHeaders(int code, long length) throws IOException { delegate.sendResponseHeaders(code, length); }
    /** getRemoteAddress 保留客户端地址。 */
    @Override public InetSocketAddress getRemoteAddress() { return delegate.getRemoteAddress(); }
    /** getResponseCode 返回已发送的响应状态。 */
    @Override public int getResponseCode() { return delegate.getResponseCode(); }
    /** getLocalAddress 保留服务监听地址。 */
    @Override public InetSocketAddress getLocalAddress() { return delegate.getLocalAddress(); }
    /** getProtocol 保留请求协议。 */
    @Override public String getProtocol() { return delegate.getProtocol(); }
    /** getAttribute 从原交换对象读取已验证身份等属性。 */
    @Override public Object getAttribute(String name) { return delegate.getAttribute(name); }
    /** setAttribute 写入原交换对象的属性。 */
    @Override public void setAttribute(String name, Object value) { delegate.setAttribute(name, value); }
    /** setStreams 保留原交换对象的请求与响应流。 */
    @Override public void setStreams(InputStream input, OutputStream output) { delegate.setStreams(input, output); }
    /** getPrincipal 保留原交换对象的认证主体。 */
    @Override public HttpPrincipal getPrincipal() { return delegate.getPrincipal(); }
}
