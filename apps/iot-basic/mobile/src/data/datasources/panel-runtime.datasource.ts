/** 文件说明：5+ App 固定可信壳的原生窗口适配；面板 WebView 禁止 5+ 注入，外部 URL 消息不可直接取得设备能力。 */
import type { DevicePanelEvent } from "../../domain/models/device-panel.model";
declare const plus: any;
/** NativePanelConfiguration 初始化仅含清单、模型与可见上下文，认证另经运行期getAuth读取。 */
export interface NativePanelConfiguration {
  entryURL: string;
  requirements: unknown[];
  context: Record<string, unknown>;
  model: Record<string, unknown>;
}
/** NativePanelHandle 管理当前设备窗口、事件与销毁，不提供任意 evalJS 给 HTML。 */
export interface NativePanelHandle {
  dispose(): void;
  publish(event: DevicePanelEvent): void;
}
/** openNativePanel 在当前详情页附加可信宿主，运行期间所有调用固定到传入闭包，不能替换设备。 */
export function openNativePanel(
  config: NativePanelConfiguration,
  call: (method: string, params: Record<string, any>) => Promise<unknown>,
): NativePanelHandle {
  if (typeof plus === "undefined" || !plus.webview)
    throw new Error("当前平台不支持原生面板窗口");
  const pages = getCurrentPages(),
    page = pages[pages.length - 1] as any,
    parent = page?.$getAppWebview?.();
  if (!parent) throw new Error("未取得面板所属原生页面");
  const top = (uni.getSystemInfoSync().statusBarHeight || 0) + 44;
  const view = plus.webview.create(
    "_www/static/device-panel/runtime.html",
    `ur-device-panel-${Date.now()}`,
    {
      top: `${top}px`,
      bottom: "0px",
      plusrequire: "none",
      uniNView: {},
      popGesture: "none",
    },
  );
  let nonce = "",
    closed = false;
  // 页面握手前只保留最新连接信息，不缓存设备属性、命令或认证。
  let pendingConnection: DevicePanelEvent | null = null;
  const completed = new Map<
    string,
    { fingerprint: string; response: Promise<Record<string, unknown>> }
  >();
  /** reply 只向固定可信壳发送结构化关联响应，永不执行面板传入的脚本片段。 */
  const reply = (method: string, data: unknown) => {
    if (!closed)
      view.evalJS(
        `window.${method}(${JSON.stringify(data)
          .replace(/\u2028/g, "\\u2028")
          .replace(/\u2029/g, "\\u2029")})`,
      );
  };
  view.overrideUrlLoading(
    { mode: "reject", match: ".*" },
    async (event: any) => {
      if (closed || typeof event.url !== "string") return;
      if (event.url.startsWith("urpanel://ready?nonce=")) {
        const proposed = event.url.slice("urpanel://ready?nonce=".length);
        if (nonce || !/^[a-f0-9]{32}$/.test(proposed)) return;
        nonce = proposed;
        reply("__urPanelStart", { ...config, nonce });
        if (pendingConnection) {
          reply("__urPanelEvent", { nonce, event: pendingConnection });
          pendingConnection = null;
        }
        return;
      }
      if (
        !nonce ||
        !event.url.startsWith("urpanel://call?data=") ||
        event.url.length > 196608
      )
        return;
      let message: any;
      try {
        message = JSON.parse(
          decodeURIComponent(event.url.slice("urpanel://call?data=".length)),
        );
      } catch {
        return;
      }
      if (
        message?.protocol !== "ur-panel-native/v1" ||
        message.nonce !== nonce ||
        typeof message.id !== "string" ||
        message.id.length > 128 ||
        !["openSettings", "getAuth", "request", "readProperties", "writeProperties", "invokeAction"].includes(
          message.method,
        ) ||
        !message.params ||
        typeof message.params !== "object" ||
        Array.isArray(message.params) ||
        (message.method === "openSettings" && Object.keys(message.params).length !== 0)
      )
        return;
      const fingerprint = JSON.stringify([message.method, message.params]),
        prior = completed.get(message.id);
      if (prior && prior.fingerprint !== fingerprint) return;
      if (completed.size >= 1000 && !prior) return;
      const response =
        prior?.response ||
        Promise.resolve()
          .then(() => call(message.method, message.params))
          .then(
            (result) => ({ id: message.id, nonce, ok: true, result }),
            (error: any) => ({
              id: message.id,
              nonce,
              ok: false,
              error: {
                code: error.code || "INVALID_PARAMS",
                message: error.message || "设备操作失败",
              },
            }),
          );
      if (!prior) completed.set(message.id, { fingerprint, response });
      reply("__urPanelReply", await response);
    },
  );
  parent.append(view);
  return {
    dispose() {
      if (closed) return;
      closed = true;
      completed.clear();
      pendingConnection = null;
      view.close("none");
    },
    publish(event) {
      if (closed) return;
      if (nonce) reply("__urPanelEvent", { nonce, event });
      else if (event.topic === "connection")
        pendingConnection = { ...event, data: { ...pendingConnection?.data, ...event.data } };
    },
  };
}
