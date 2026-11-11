/** 文件说明：移动面板运行态编排；UI 仅依赖 Provider，云端运行与离线只读缓存分开且不自动重放命令。 */
import { deviceDetailProvider } from "./device-detail.provider";
import { devicePanelService } from "../services/device-panel.service";
import type { DevicePanelService } from "../services/device-panel.service";
import type {
  DevicePanelSnapshot,
  DevicePanelEvent,
} from "../domain/models/device-panel.model";
import type {
  PanelAdapter,
  PanelModel,
} from "../utils/device-panel/bridge";
import { panelRuntimeService } from "../services/panel-runtime.service";
import { validateApiRequest } from "../utils/device-panel/bridge";
import type { NativePanelHandle } from "../services/panel-runtime.service";
/** PanelState 是可见运行状态；原生窗口与定时器不暴露给面板代码。 */
export interface PanelState {
  loading: boolean;
  message: string;
  error: string;
  offline: boolean;
  snapshot: DevicePanelSnapshot | null;
  transport: "cloud" | "cache";
}
/** DevicePanelProvider 为每个页面创建独立运行生命周期。 */
export class DevicePanelProvider {
  private state: PanelState = {
    loading: false,
    message: "",
    error: "",
    offline: false,
    snapshot: null,
    transport: "cloud",
  };
  private listeners = new Set<(state: PanelState) => void>();
  private cleanup: (() => void) | null = null;
  private native: NativePanelHandle | null = null;
  private generation = 0;
  private platform = "h5";
  constructor(
    private readonly service: DevicePanelService = devicePanelService,
    /** navigateSettings 由当前页面提供，目标身份只取已校验快照，不能由HTML覆盖。 */
    private readonly navigateSettings?: (identity: { productID: string; deviceName: string }) => Promise<void>,
  ) {}
  /** subscribe/getState 统一 UI 状态订阅，不让页面直接读取数据源。 */
  subscribe(listener: (state: PanelState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }
  getState() {
    return this.state;
  }
  private update(next: Partial<PanelState>) {
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener(this.state));
  }
  /** load 联机解析当前设备，App 网络中断时按账号恢复已校验快照。 */
  async load(productID: string, deviceName: string, platform: string) {
    this.stop();
    this.platform = platform;
    const generation = ++this.generation;
    this.update({ loading: true, error: "", snapshot: null });
    try {
      if (!["web", "h5", "appAndroid", "appIos"].includes(platform)) {
        this.update({
          message:
            "当前小程序宿主暂不支持自定义 HTML 面板，请使用设备原生页面。",
          loading: false,
        });
        return;
      }
      let model = deviceDetailProvider.getState().controlModel;
      if (
        model?.device.productID !== productID ||
        model?.device.deviceName !== deviceName
      ) {
        await deviceDetailProvider.load(productID, deviceName);
        model = deviceDetailProvider.getState().controlModel;
      }
      const loaded = await this.service.load(
        productID,
        deviceName,
        platform,
        model,
      );
      if (generation !== this.generation) return;
      this.update({
        loading: false,
        snapshot: loaded.snapshot,
        offline: loaded.offline,
        message: loaded.message,
        transport: loaded.offline ? "cache" : "cloud",
      });
    } catch (error: any) {
      if (generation === this.generation)
        this.update({ loading: false, error: error.message || "面板加载失败" });
    }
  }
  /** createAdapter 只按固定快照提供能力和状态；不使用清单替代真实物模型。 */
  createAdapter(): PanelAdapter {
    this.stop();
    const snapshot = this.state.snapshot;
    if (!snapshot?.resolution.manifest) throw new Error("自定义面板不可用");
    const currentGeneration = this.generation,
      transport = this.state.transport,
      offline = this.state.offline,
      listeners = new Set<(event: DevicePanelEvent) => void>(),
      timers = new Set<ReturnType<typeof setTimeout>>();
    let closed = false,
      polling = false;
    // 设备状态与云端连通是两回事；缓存模式不能使用过期的在线状态。
    let deviceOnline = !offline && snapshot.controlModel.device.status === 2;
    // 修订号确保查询开始后收到的实时推送不会被迟到的查询结果覆盖。
    let statusRevision = 0;
    const currentDevice = deviceDetailProvider.getState?.().device;
    if (currentDevice?.productID === snapshot.productID && currentDevice.deviceName === snapshot.deviceName)
      deviceOnline = !offline && currentDevice.status === 2;
    const requirements = snapshot.resolution.manifest.requirements,
      model: PanelModel = {
        properties: snapshot.controlModel.thingModel.properties.map(
          (field) => ({
            ...field.define,
            identifier: field.identifier,
            type: field.define.type,
            mode: field.mode,
            available: true,
          }),
        ),
        actions: snapshot.controlModel.thingModel.actions
          .filter((action) => action.dir === "down")
          .map((action) => ({
            identifier: action.identifier,
            available: true,
            input: Object.fromEntries(
              action.input.map((param) => [param.identifier, param.define]),
            ),
          })),
      };
    const valid = () => {
      if (
        closed ||
        this.generation !== currentGeneration ||
        this.service.accountScope() !== snapshot.accountScope
      )
        throw new Error("面板会话已关闭");
    };
    const emit = (event: DevicePanelEvent) => {
      if (!closed) listeners.forEach((listener) => listener(event));
    };
    // 详情页负责隔离设备上下线推送；此处仅转发当前设备并在关闭时取消订阅。
    const unsubscribeDevice = deviceDetailProvider.subscribe?.((state) => {
      const device = state.device;
      if (closed || offline || device?.productID !== snapshot.productID || device.deviceName !== snapshot.deviceName) return;
      statusRevision++;
      const next = device.status === 2;
      if (next !== deviceOnline) {
        deviceOnline = next;
        emit({ topic: "connection", data: { deviceOnline } });
      }
    });
    const schedule = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!closed) fn();
      }, ms);
      timers.add(timer);
    };
    const read = async (ids: string[]) => {
      valid();
      if (transport === "cache") {
        return Object.fromEntries(
          ids.map((id) => {
            const field = snapshot.controlModel.properties.find(
              (item) => item.identifier === id,
            );
            return [
              id,
              {
                value: field?.value ?? null,
                timestamp: field?.timestamp || null,
                receivedTime: null,
                quality: "STALE",
                source: "cache",
              },
            ];
          }),
        );
      }
      const revision = statusRevision;
      return this.service.readCloud(snapshot, ids, (status) => {
        if (closed || revision !== statusRevision) return;
        statusRevision++;
        const next = status === 2;
        if (next !== deviceOnline) {
          deviceOnline = next;
          emit({ topic: "connection", data: { deviceOnline } });
        }
      });
    };
    /** track 有限等待实际回执；网络失败或超时不会被当成设备确认成功。 */
    const track = (commandID: string, action: boolean) => {
      const deadline = Date.now() + 30000;
      const query = async () => {
        if (closed) return;
        try {
          valid();
          emit({
            topic: "command",
            data: await this.service.commandCloud(snapshot, commandID, action),
          });
        } catch {
          if (Date.now() < deadline) schedule(query, 1000);
          else
            emit({
              topic: "command",
              data: {
                commandID,
                status: "timeout",
                message: "等待回执超时，执行结果未知",
              },
            });
        }
      };
      schedule(query, 500);
    };
    const execute = async (method: string, params: Record<string, any>) => {
      valid();
      if (transport === "cache")
        throw Object.assign(new Error("离线缓存仅供查看，控制设备需要联网"), {
          code: "UNSUPPORTED_CAPABILITY",
        });
      // 面板可直接调用 SDK；除界面禁用外，宿主也必须拒绝当前离线设备的下发。
      if (!deviceOnline)
        throw Object.assign(new Error("设备离线，暂时无法控制"), {
          code: "UNSUPPORTED_CAPABILITY",
        });
      const commandID = await this.service.executeCloud(
        snapshot,
        method,
        params,
      );
      track(commandID, method === "invokeAction");
      return { commandID, status: "accepted", source: "cloud" };
    };
    const poll = async () => {
      if (
        closed ||
        !listeners.size ||
        polling ||
        offline ||
        transport === "cache"
      )
        return;
      polling = true;
      try {
        emit({
          topic: "property",
          data: (await read(
            model.properties.map((field) => field.identifier),
          )) as Record<string, unknown>,
        });
        emit({ topic: "connection", data: { cloud: { connected: true }, deviceOnline } });
      } catch {
        emit({ topic: "connection", data: { cloud: { connected: false } } });
      } finally {
        polling = false;
        if (listeners.size) schedule(poll, 3000);
      }
    };
    const dispose = () => {
      if (closed) return;
      closed = true;
      unsubscribeDevice?.();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      listeners.clear();
    };
    this.cleanup = dispose;
    return {
      context: {
        mode: transport,
        transport,
        panelID: snapshot.resolution.panelID,
        packageHash: snapshot.resolution.packageHash,
        platform: this.platform,
        deviceID: snapshot.controlModel.device.id,
        productID: snapshot.productID,
        deviceName: snapshot.deviceName,
        capabilities: {
          settings: { available: !!this.navigateSettings && !offline },
          cloud: { available: !offline },
          api: { available: !offline && transport !== "cache" },
          ble: { available: false, reason: "本轮暂不支持蓝牙控制" },
          offlineCache: { available: !!snapshot.installedAt },
        },
      },
      model,
      openSettings: this.navigateSettings && !offline ? async () => {
        valid();
        await this.navigateSettings!({ productID: snapshot.productID, deviceName: snapshot.deviceName });
      } : undefined,
      getAuth: async () => {
        valid();
        if (transport === "cache")
          throw Object.assign(new Error("离线缓存不提供登录凭据"), { code: "UNSUPPORTED_CAPABILITY" });
        return this.service.authCloud(snapshot);
      },
      request: async (params) => {
        valid();
        validateApiRequest(params);
        if (transport === "cache")
          throw Object.assign(new Error("离线缓存无法调用平台接口"), { code: "UNSUPPORTED_CAPABILITY" });
        return this.service.requestApiCloud(snapshot, params.path, params.data || {});
      },
      readProperties: read,
      writeProperties: (values, options) => execute("writeProperties", { values, ...options }),
      invokeAction: (identifier, params) =>
        execute("invokeAction", { identifier, params }),
      subscribe(topics, callback) {
        const filtered = (event: DevicePanelEvent) => {
          if (topics.includes(event.topic)) callback(event);
        };
        listeners.add(filtered);
        if (topics.includes("connection")) callback({ topic: "connection", data: { deviceOnline } });
        void poll();
        return () => {
          listeners.delete(filtered);
        };
      },
      dispose,
    };
  }
  /** openNative 由当前原生页面挂载固定可信壳，不允许 HTML 启动其他 WebView。 */
  openNative() {
    const adapter = this.createAdapter(),
      snapshot = this.state.snapshot;
    if (!snapshot?.resolution.manifest) return;
    this.native = panelRuntimeService.open(
      {
        entryURL: snapshot.entryURL,
        requirements: snapshot.resolution.manifest.requirements,
        context: adapter.context,
        model: adapter.model as unknown as Record<string, unknown>,
      },
      async (method, params) => {
        if (method === "openSettings") {
          if (!adapter.openSettings) throw Object.assign(new Error("当前宿主不支持设备设置"), { code: "UNSUPPORTED_CAPABILITY" });
          return adapter.openSettings();
        }
        if (method === "getAuth") return adapter.getAuth?.();
        if (method === "request") return adapter.request?.(params as any);
        if (method === "readProperties")
          return adapter.readProperties(params.identifiers);
        if (method === "writeProperties")
          return adapter.writeProperties(params.values, params.completion === "receipt" ? { completion: "receipt" } : undefined);
        if (method === "invokeAction")
          return adapter.invokeAction(params.identifier, params.params);
        throw new Error("未知面板方法");
      },
    );
    const unsubscribe = adapter.subscribe(
      ["property", "connection", "command"],
      (event) => this.native?.publish(event),
    );
    const old = this.cleanup;
    this.cleanup = () => {
      unsubscribe();
      old?.();
    };
  }
  /** stop 清理当前消息、窗口与事件，重新运行仍保留已解析快照供新会话使用。 */
  stop() {
    this.native?.dispose();
    this.native = null;
    this.cleanup?.();
    this.cleanup = null;
  }
  /** clear 在退出、切设备或注销时撤销全部本页运行态。 */
  clear() {
    this.generation++;
    this.stop();
    this.update({ snapshot: null, loading: false });
  }
}
