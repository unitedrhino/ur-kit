/**
 * 文件说明：客户端调试桥的实例标识、短期日志上传与会话一次授权的诊断动作。
 * 会话由 Agent 的 SSE 连接驱动；此处只保存内存状态，不持久化远端日志。
 */
import { config } from '../config';
import { clientDebugControls } from '../utils/client-debug-controls';
import { authProvider } from '../providers/auth.provider';
import { deviceListProvider } from '../providers/device-list.provider';
import { eventBus } from '../utils/event-bus';
import { getRequestContext } from '../utils/request-context';
import { logger, setLogListener, type LogEntry } from '../utils/logger';

/** DebugNotice 是现有 user.notify WebSocket 通道中的调试指令。 */
interface DebugNotice {
  type: 'client-debug';
  kind: 'start' | 'lease' | 'stop' | 'control-request' | 'command';
  sessionID: string;
  clientInstanceID: string;
  filter?: { levels?: string[]; names?: string[] };
  expiresAt?: string;
  commandID?: string;
  action?: string;
  args?: Record<string, unknown>;
}

/** DebugEvent 是上传给平台的一条有名称的脱敏日志。 */
interface DebugEvent {
  seq: number;
  time: string;
  name: string;
  level: string;
  message: string;
  data?: Record<string, unknown>;
}

/** DebugSession 仅保存当前运行中的会话控制信息。 */
interface DebugSession {
  id: string;
  filter: { levels: string[]; names: string[] };
  expiresAt: number;
  lastLease: number;
  controlGranted: boolean;
  /** controlPending 防止同一会话重复打开授权弹窗。 */
  controlPending: boolean;
  /** commands 防止重复命令在会话内重复执行。 */
  commands: Set<string>;
}

/** INSTANCE_KEY 是用户可复制的稳定实例 ID 的本地存储键。 */
const INSTANCE_KEY = 'client_debug_instance_id_v1';
/** MAX_BATCH 限制一次上传的日志条数。 */
const MAX_BATCH = 10;
/** LEASE_TIMEOUT 在 Agent 信号中断后及时停止客户端上传。 */
const LEASE_TIMEOUT = 25000;

/** ClientDebugService 管理一个客户端实例上的至多一个调试会话。 */
class ClientDebugService {
  private instanceID = '';
  private session: DebugSession | null = null;
  private queue: DebugEvent[] = [];
  private seq = 0;
  private flushing = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();
  private initialized = false;

  /** init 安装 WS 与 logger 入口，避免重复监听。 */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.instanceID = this.loadInstanceID();
    eventBus.on('ws:user.notify', (notice) => this.onNotice(notice as DebugNotice));
    eventBus.on('auth:logout', () => this.end(false));
    eventBus.on('ws:disconnected', () => this.end(false));
    setLogListener((entry) => this.onLog(entry));
    this.timer = setInterval(() => {
      if (this.session && (Date.now() > this.session.expiresAt || Date.now() - this.session.lastLease > LEASE_TIMEOUT)) {
        this.end(false);
      } else {
        void this.flush();
      }
    }, 1000);
  }

  /** getInstanceID 返回用户可告知 Agent 的稳定实例标识。 */
  getInstanceID(): string { return this.instanceID || this.loadInstanceID(); }

  /** isActive 返回当前实例是否正在向 Agent 提交日志。 */
  isActive(): boolean { return !!this.session; }

  /** isControlling 供页面持续展示有效操控状态和取消入口。 */
  isControlling(): boolean {
    const session = this.session;
    return !!session?.controlGranted && Date.now() <= session.expiresAt
      && Date.now() - session.lastLease <= LEASE_TIMEOUT;
  }

  /** subscribe 让设置页响应会话状态变化。 */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** stop 允许客户端用户随时撤销本次会话。 */
  stop(): void {
    const id = this.session?.id;
    this.end(false);
    if (id) void this.post({ sessionID: id, kind: 'stop' });
  }

  /** loadInstanceID 恢复或创建当前安装实例的标识。 */
  private loadInstanceID(): string {
    try {
      const stored = String(uni.getStorageSync(INSTANCE_KEY) || '');
      if (/^[a-z0-9-]{16,64}$/i.test(stored)) return stored;
    } catch { /* 存储不可用时仅在本次运行中使用。 */ }
    const created = `uni-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    try { uni.setStorageSync(INSTANCE_KEY, created); } catch { /* 保持当前运行可用。 */ }
    return created;
  }

  /** onNotice 只处理发给当前实例和当前会话的 WebSocket 通知。 */
  private onNotice(value: DebugNotice): void {
    if (!value || value.type !== 'client-debug' || value.clientInstanceID !== this.getInstanceID()) return;
    if (value.kind === 'start') {
      if (this.session) this.end(false);
      this.session = {
        id: value.sessionID,
        filter: { levels: value.filter?.levels || ['warn', 'error'], names: value.filter?.names || ['*'] },
        expiresAt: Math.min(Date.now() + 30 * 60000, Date.parse(value.expiresAt || '') || Date.now() + 30 * 60000),
        lastLease: Date.now(),
        controlGranted: false,
        controlPending: false,
        commands: new Set(),
      };
      this.queue = [];
      this.seq = 0;
      this.listeners.forEach((listener) => listener());
      void this.post({ sessionID: value.sessionID, kind: 'ack' });
      return;
    }
    if (!this.session || this.session.id !== value.sessionID) return;
    if (value.kind === 'stop') { this.end(false); return; }
    if (value.kind === 'lease') { this.session.lastLease = Date.now(); return; }
    if (value.kind === 'control-request') { void this.requestControl(); return; }
    if (value.kind === 'command') void this.executeCommand(value);
  }

  /** onLog 在本地完成名称和级别过滤，并对待上传队列设上限。 */
  private onLog(entry: LogEntry): void {
    const session = this.session;
    if (!session || Date.now() > session.expiresAt || Date.now() - session.lastLease > LEASE_TIMEOUT) return;
    const name = entry.name || entry.scope;
    if (!session.filter.levels.includes(entry.level)) return;
    if (!session.filter.names.some((pattern) => pattern === name || !/^ble\..*\.raw$/.test(name) && (pattern === '*' || pattern.endsWith('.*') && name.startsWith(pattern.slice(0, -1))))) return;
    const data = entry.data === undefined ? undefined : { value: entry.data };
    this.queue.push({ seq: ++this.seq, time: entry.time, name, level: entry.level, message: entry.message, data });
    if (this.queue.length > 200) this.queue.splice(0, this.queue.length - 200);
    if (this.queue.length >= MAX_BATCH) void this.flush();
  }

  /** flush 将一批新日志送到平台，失败时停止会话避免无限重试。 */
  private async flush(): Promise<void> {
    if (!this.session || this.flushing || this.queue.length === 0) return;
    this.flushing = true;
    // 上传回调可能晚于重新授权；只允许结束创建这批日志的原会话对象。
    const session = this.session;
    const id = session.id;
    const events = this.queue.splice(0, MAX_BATCH);
    try {
      const ok = await this.post({ sessionID: id, kind: 'logs', batchID: `${this.getInstanceID()}-${events[0].seq}`, events });
      if (!ok && this.session === session) this.end(false);
    } finally {
      this.flushing = false;
      if (this.queue.length >= MAX_BATCH) void this.flush();
    }
  }

  /** post 使用独立 uni.request，不经过会写日志的业务请求封装。 */
  private post(body: Record<string, unknown>): Promise<boolean> {
    const user = authProvider.getState().user;
    if (!user?.token) return Promise.resolve(false);
    const { tenantCode, projectID } = getRequestContext();
    const header: Record<string, string> = {
      token: user.token,
      'app-id': config.appId,
      'device-id': this.getInstanceID(),
      'content-type': 'application/json',
    };
    if (tenantCode) header['ithings-tenant-code'] = tenantCode;
    if (projectID) header['ithings-project-id'] = projectID;
    return new Promise((resolve) => {
      uni.request({
        url: `${config.apiBaseUrl}/api/v1/system/client-debug/message`,
        method: 'POST', data: body, header,
        success: (response) => {
          const data = response.data as { code?: number } | undefined;
          resolve(response.statusCode >= 200 && response.statusCode < 300 && data?.code === 200);
        },
        fail: () => resolve(false),
      });
    });
  }

  /** requestControl 展示操控授权弹窗，并把用户决定回传 Agent。 */
  private requestControl(): Promise<void> {
    // 授权仅属于弹窗打开时的会话，迟到确认不能转授给替换后的会话。
    const session = this.session;
    if (!session || Date.now() > session.expiresAt || Date.now() - session.lastLease > LEASE_TIMEOUT) return Promise.resolve();
    if (session.controlGranted) {
      void this.post({ sessionID: session.id, kind: 'control.grant' });
      return Promise.resolve();
    }
    if (session.controlPending) return Promise.resolve();
    session.controlPending = true;
    return new Promise((resolve) => {
      uni.showModal({
        title: '远程调试操控',
        content: '允许 AI 在本次会话内读取状态、点击已开放的页面控件并填写配网表单吗？不开放删除或解绑，系统权限仍需你确认。后续不再弹窗，可随时点击远程控制标识取消。',
        success: (result) => {
          session.controlPending = false;
          if (this.session === session && Date.now() <= session.expiresAt && Date.now() - session.lastLease <= LEASE_TIMEOUT) {
            session.controlGranted = !!result.confirm;
            this.listeners.forEach((listener) => listener());
            void this.post({ sessionID: session.id, kind: result.confirm ? 'control.grant' : 'control.deny' });
          }
          resolve();
        },
        fail: () => { session.controlPending = false; resolve(); },
      });
    });
  }

  /** executeCommand 在一次授权范围内执行白名单动作，每次仍检查租约与去重。 */
  private executeCommand(notice: DebugNotice): void {
    const session = this.session;
    if (!session || !notice.commandID) return;
    if (!this.isControlling()) {
      void this.post({ sessionID: session.id, kind: 'result', commandID: notice.commandID, status: 'denied' });
      return;
    }
    const title = { 'app.snapshot': '读取应用状态', 'app.navigate': '打开页面', 'device-list.refresh': '刷新设备列表',
      'ui.inspect': '读取页面控件', 'ui.tap': '点击页面控件', 'ui.input': '填写页面输入' }[notice.action || ''];
    if (!title) {
      void this.post({ sessionID: session.id, kind: 'result', commandID: notice.commandID, status: 'unsupported' });
      return;
    }
    if (session.commands.has(notice.commandID)) return;
    // 达到上限后撤销会话，避免长会话无限增长或清空去重集合后重放旧指令。
    if (session.commands.size >= 1000) { this.stop(); return; }
    session.commands.add(notice.commandID);
    void this.performAction(notice).then((data) => {
      if (this.session !== session || !this.isControlling()) return;
      void this.post({ sessionID: session.id, kind: 'result', commandID: notice.commandID, status: 'ok', data });
    }).catch((error) => {
      if (this.session !== session || !this.isControlling()) return;
      // 控件异常可能包含表单输入，不透传任意异常正文。
      const message = notice.action?.startsWith('ui.') ? '页面控件操作失败，请重新读取当前页面' : String(error);
      void this.post({ sessionID: session.id, kind: 'result', commandID: notice.commandID, status: 'error', data: { message } });
    });
  }

  /** performAction 执行已确认的诊断动作并返回脱敏状态。 */
  private async performAction(notice: DebugNotice): Promise<Record<string, unknown>> {
    if (notice.action === 'ui.inspect') return clientDebugControls.inspect(getCurrentPages().at(-1)?.route || '');
    if (notice.action === 'ui.tap' || notice.action === 'ui.input') {
      return clientDebugControls.execute(notice.action, notice.args || {}, getCurrentPages().at(-1)?.route || '', () => this.isControlling());
    }
    if (notice.action === 'app.snapshot') {
      const auth = authProvider.getState();
      const devices = deviceListProvider.getState();
      const page = getCurrentPages().at(-1)?.route || '';
      return { loggedIn: auth.loggedIn, sessionConfirmed: auth.sessionConfirmed, deviceCount: devices.list.length,
        page, controls: clientDebugControls.status(page) };
    }
    if (notice.action === 'device-list.refresh') {
      await deviceListProvider.loadFirst();
      return { deviceCount: deviceListProvider.getState().list.length };
    }
    const path = String(notice.args?.path || '');
    if (!['/pages/home/index', '/packageUser/pages/settings/index'].includes(path)) throw new Error('页面未在诊断白名单内');
    await new Promise<void>((resolve, reject) => {
      // 原生导航未返回回调时也必须给出失败回执，不能把命令一直留在“已受理”。
      const timeout = setTimeout(() => reject(new Error('页面导航超时，请读取应用状态')), 5000);
      const callbacks = { url: path, success: () => { clearTimeout(timeout); resolve(); },
        fail: (error: unknown) => { clearTimeout(timeout); reject(error); } };
      if (path === '/pages/home/index') uni.switchTab(callbacks);
      else uni.navigateTo(callbacks);
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    const currentPage = `/${getCurrentPages().at(-1)?.route || ''}`;
    if (currentPage !== path) throw new Error(`页面跳转后被导航守卫重定向至 ${currentPage}`);
    return { page: currentPage };
  }

  /** end 撤销内存会话并清空未发送队列。 */
  private end(notify: boolean): void {
    if (!this.session) return;
    const id = this.session.id;
    this.session = null;
    clientDebugControls.invalidate();
    this.queue = [];
    this.listeners.forEach((listener) => listener());
    if (notify) void this.post({ sessionID: id, kind: 'stop' });
  }
}

/** clientDebugService 是应用进程内唯一的调试会话入口。 */
export const clientDebugService = new ClientDebugService();
