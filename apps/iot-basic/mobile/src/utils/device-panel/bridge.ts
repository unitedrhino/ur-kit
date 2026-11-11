/** 文件说明：面板宿主消息桥；源自 SaaS 95abe467ba 的共享实现，保留单设备语义方法与当前登录身份接口调用。 */

/** PanelAuth 返回当前平台地址与认证请求头；只在运行期读取，不写入面板包或离线缓存。 */
export interface PanelAuth {
  baseURL: string;
  headers: Record<string, string>;
}
/** PanelApiRequest 描述平台现有 POST 接口；业务参数原样传递，权限由后端校验。 */
export interface PanelApiRequest {
  data?: Record<string, unknown>;
  path: string;
}

/** PanelRequirement 描述包声明的能力，运行时只授予与有效模型和权限的交集。 */
export interface PanelRequirement {
  access?: string;
  define?: Record<string, unknown>;
  identifier: string;
  input?: Record<string, unknown>;
  kind: string;
  required: boolean;
}
/** PanelModel 描述当前设备实际可用的语义模型。 */
export interface PanelModel {
  actions: Array<{ [key: string]: unknown; available?: boolean; identifier: string }>;
  properties: Array<{ [key: string]: unknown; available?: boolean; identifier: string; mode: string; type: string }>;
}
/** PanelEvent 是已按当前设备隔离的属性、连接或命令更新。 */
export interface PanelEvent {
  data: Record<string, unknown>;
  timestamp?: number;
  topic: 'command' | 'connection' | 'property';
}
/** PanelAdapter 由宿主实现；语义操作固定当前设备，平台接口按当前登录身份独立鉴权。 */
export interface PanelAdapter {
  context: Record<string, unknown>;
  dispose?(): void;
  getAuth?(): Promise<PanelAuth>;
  invokeAction(identifier: string, params: Record<string, unknown>): Promise<unknown>;
  model: PanelModel;
  /** openSettings 只打开宿主固定的当前设备设置，不接受网页传入身份或URL。 */
  openSettings?(): Promise<void> | void;
  readProperties(identifiers: string[]): Promise<unknown>;
  request?(params: PanelApiRequest): Promise<unknown>;
  subscribe(topics: string[], callback: (event: PanelEvent) => void): () => void;
  /** completion 为 receipt 时只按设备回执确认命令；状态仍以设备上报为准。 */
  writeProperties(values: Record<string, unknown>, options?: { completion: 'receipt' }): Promise<unknown>;
}
/** bridgeError 保留语义错误，浏览器 RPC 与原生桥使用相同含义。 */
export function bridgeError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}
/** validateApiRequest 仅接受平台相对接口路径和对象参数，避免凭据被附加到外部地址。 */
export function validateApiRequest(params: PanelApiRequest) {
  requestObject(params);
  onlyKeys(params as unknown as Record<string, unknown>, ['path', 'data']);
  if (typeof params.path !== 'string' || !/^\/api\/v1\/[\w-]+(?:\/[\w-]+)*$/.test(params.path))
    throw bridgeError('INVALID_PARAMS', '请使用 /api/v1/ 开头的平台接口路径');
  if (params.data !== undefined) requestObject(params.data);
}
/** requestObject 限定消息为普通对象，拒绝数组、空值和超大载荷。 */
function requestObject(value: unknown): asserts value is Record<string, any> {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') throw bridgeError('INVALID_PARAMS', '请求参数必须是对象');
}
/** onlyKeys 校验每种SDK方法的外层参数，语义操作不得夹带其他设备身份。 */
function onlyKeys(params: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(params).some((key) => !allowed.includes(key))) throw bridgeError('INVALID_PARAMS', '包含未支持的参数');
}
/** messageID 使用浏览器安全随机源，兼容非 HTTPS 的隔离 KVM 测试入口。 */
export function messageID() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
/** scopedModel 从有效模型裁剪声明能力，不因包要求写入就提升原用户权限。 */
function scopedModel(adapter: PanelAdapter, requirements: PanelRequirement[]): PanelModel {
  return {
    properties: requirements
      .filter((item) => item.kind === 'property')
      .map((item) => ({
        ...adapter.model.properties.find((field) => field.identifier === item.identifier),
        identifier: item.identifier,
        type: adapter.model.properties.find((field) => field.identifier === item.identifier)?.type || String(item.define?.type || ''),
        mode: adapter.model.properties.find((field) => field.identifier === item.identifier)?.mode || 'r',
        available: adapter.model.properties.some(
          (field) => field.identifier === item.identifier && field.available !== false && matchesRequirement(item, field),
        ),
        panelAccess: item.access,
      })),
    actions: requirements
      .filter((item) => item.kind === 'action')
      .map((item) => ({
        ...adapter.model.actions.find((field) => field.identifier === item.identifier),
        identifier: item.identifier,
        available: adapter.model.actions.some((field) => field.identifier === item.identifier && field.available !== false && matchesRequirement(item, field)),
      })),
  };
}
/** attachPanelBridge 只接受指定 iframe 的一次初始化，后续使用独立端口与会话 ID；返回幂等销毁函数。 */
export function attachPanelBridge(frame: HTMLIFrameElement, adapter: PanelAdapter, requirements: PanelRequirement[], onError?: (message: string) => void) {
  /** session 与频道固定到本次 iframe 生命周期，切换设备必须重新装配。 */
  const completed = new Map<string, { fingerprint: string; response: Promise<Record<string, unknown>> }>();
  const model = scopedModel(adapter, requirements);
  const sessionID = messageID();
  const subscriptions = new Map<string, () => void>();
  let disposed = false;
  let port: MessagePort | undefined;
  /** send 转普通可克隆 JSON，Vue proxy 不直接跨线程传递。 */
  const send = (message: Record<string, unknown>) => {
    try {
      if (!disposed && port)
        // JSON 序列化刻意剥离 Vue Proxy，并统一协议中不支持的值。
        // eslint-disable-next-line unicorn/prefer-structured-clone
        port.postMessage(JSON.parse(JSON.stringify({ protocol: 'ur-panel/v1', sessionID, ...message })));
    } catch {
      onError?.('面板响应无法序列化');
    }
  };
  /** dispatch 保留原有模型校验；显式接口调用沿用当前账号权限，不受标量模型格式限制。 */
  const dispatch = async (method: string, params: Record<string, any>) => {
    requestObject(params);
    switch (method) {
      case 'getAuth': {
        onlyKeys(params, []);
        if (!adapter.getAuth) throw bridgeError('UNSUPPORTED_CAPABILITY', '当前宿主未提供认证信息');
        return adapter.getAuth();
      }
      case 'getContext': {
        onlyKeys(params, []);
        return {
          ...adapter.context,
          capabilities: {
            ...(adapter.context.capabilities as Record<string, unknown> | undefined),
            settings: { available: !!adapter.openSettings },
          },
        };
      }
      case 'getThingModel': {
        onlyKeys(params, []);
        return model;
      }
      case 'invokeAction': {
        onlyKeys(params, ['identifier', 'params']);
        const action = model.actions.find((item) => item.identifier === params.identifier && item.available !== false);
        if (!action) throw bridgeError('FORBIDDEN', '行为未声明或不可用');
        requestObject(params.params);
        const inputs = (action.input || {}) as Record<string, any>;
        if (Object.keys(params.params).some((key) => !hasOwn(inputs, key)) || Object.keys(inputs).some((key) => !hasOwn(params.params, key)))
          throw bridgeError('INVALID_PARAMS', '行为输入参数不匹配');
        for (const [key, value] of Object.entries(params.params)) validateValue(inputs[key], value);
        return adapter.invokeAction(params.identifier, params.params);
      }
      case 'openSettings': {
        onlyKeys(params, []);
        if (!adapter.openSettings) throw bridgeError('UNSUPPORTED_CAPABILITY', '当前宿主不支持设备设置');
        await adapter.openSettings();
        return { opened: true };
      }
      case 'readProperties': {
        onlyKeys(params, ['identifiers']);
        const ids = params.identifiers ?? model.properties.filter((field) => field.available !== false).map((field) => field.identifier);
        if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !model.properties.some((field) => field.identifier === id)))
          throw bridgeError('INVALID_PARAMS', '未知或未声明的属性');
        if (ids.some((id) => model.properties.find((field) => field.identifier === id)?.available === false))
          throw bridgeError('UNSUPPORTED_CAPABILITY', '属性不可用');
        const values = await adapter.readProperties(ids);
        requestObject(values);
        return Object.fromEntries(Object.entries(values).filter(([key]) => ids.includes(key)));
      }
      case 'request': {
        validateApiRequest(params as PanelApiRequest);
        if (!adapter.request) throw bridgeError('UNSUPPORTED_CAPABILITY', '当前宿主未提供平台接口调用');
        return adapter.request(params as PanelApiRequest);
      }
      case 'subscribe': {
        onlyKeys(params, ['topics']);
        if (!Array.isArray(params.topics) || params.topics.some((topic) => !['command', 'connection', 'property'].includes(topic)))
          throw bridgeError('INVALID_PARAMS', '订阅主题无效');
        const subscriptionID = messageID();
        subscriptions.set(
          subscriptionID,
          adapter.subscribe(params.topics, (event) => {
            if (!params.topics.includes(event.topic)) return;
            const data =
              event.topic === 'property'
                ? Object.fromEntries(
                    Object.entries(event.data).filter(([key]) => model.properties.some((field) => field.identifier === key && field.available !== false)),
                  )
                : event.data;
            send({ type: 'event', subscriptionID, topic: event.topic, data, timestamp: event.timestamp ?? Date.now() });
          }),
        );
        return { subscriptionID };
      }
      case 'unsubscribe': {
        onlyKeys(params, ['subscriptionID']);
        subscriptions.get(params.subscriptionID)?.();
        subscriptions.delete(params.subscriptionID);
        return {};
      }
      case 'writeProperties': {
        onlyKeys(params, ['values', 'completion']);
        if (params.completion !== undefined && params.completion !== 'receipt') throw bridgeError('INVALID_PARAMS', '命令完成方式无效');
        requestObject(params.values);
        if (Object.keys(params.values).length === 0) throw bridgeError('INVALID_PARAMS', '写入值不能为空');
        for (const [id, value] of Object.entries(params.values)) {
          const field = model.properties.find((field) => field.identifier === id);
          if (!field || field.available === false || field.mode !== 'rw' || field.panelAccess !== 'write')
            throw bridgeError('FORBIDDEN', '属性未声明写入或当前不可写');
          validatePropertyValue(field, value);
        }
        return params.completion === 'receipt' ? adapter.writeProperties(params.values, { completion: 'receipt' }) : adapter.writeProperties(params.values);
      }
      default: {
        throw bridgeError('UNSUPPORTED_CAPABILITY', '未知的面板方法');
      }
    }
  };
  /** onRequest 关联请求并缓存同 ID 结果，重复控制消息不能再次下发；坏参数只拒绝本次请求。 */
  const onRequest = async (event: MessageEvent) => {
    const message = event.data;
    if (
      disposed ||
      !message ||
      message.protocol !== 'ur-panel/v1' ||
      message.sessionID !== sessionID ||
      message.type !== 'request' ||
      typeof message.id !== 'string'
    )
      return;
    let serialized: string;
    try {
      serialized = JSON.stringify(message);
    } catch {
      send({ type: 'response', id: message.id, ok: false, error: { code: 'INVALID_PARAMS', message: '请求必须可序列化' } });
      return;
    }
    if (serialized.length > 65_536 || message.id.length > 128 || (completed.size >= 1000 && !completed.has(message.id))) {
      send({ type: 'response', id: message.id, ok: false, error: { code: 'INVALID_PARAMS', message: '请求大小或数量超限，请重新进入面板' } });
      return;
    }
    const fingerprint = JSON.stringify([message.method, message.params]);
    const prior = completed.get(message.id);
    if (prior && prior.fingerprint !== fingerprint) {
      send({ type: 'response', id: message.id, ok: false, error: { code: 'INVALID_PARAMS', message: '请求 ID 已用于其他参数' } });
      return;
    }
    const response =
      prior?.response ??
      Promise.resolve()
        .then(() => dispatch(message.method, message.params ?? {}))
        .then(
          (result) => ({ type: 'response', id: message.id, ok: true, result }),
          (error: any) => ({
            type: 'response',
            id: message.id,
            ok: false,
            error: { code: error.code || 'INVALID_PARAMS', message: error.message || '面板操作失败' },
          }),
        );
    if (!prior) completed.set(message.id, { fingerprint, response });
    send(await response);
  };
  /** ready 先验证 iframe Window，再转移专用端口；origin=null 不能独立作为信任依据。 */
  const ready = (event: MessageEvent) => {
    if (disposed || port || event.source !== frame.contentWindow || event.data?.protocol !== 'ur-panel/v1' || event.data.type !== 'ready') return;
    const channel = new MessageChannel();
    port = channel.port1;
    port.addEventListener('message', onRequest);
    port.start();
    frame.contentWindow?.postMessage({ protocol: 'ur-panel/v1', type: 'init', sessionID, context: adapter.context }, '*', [channel.port2]);
    clearTimeout(timer);
  };
  /** timer 只诊断初始化，不让超时触发自动控制。 */
  const timer = setTimeout(() => {
    if (!port && !disposed) onError?.('面板 SDK 初始化超时');
  }, 5000);
  window.addEventListener('message', ready);
  return () => {
    if (disposed) return;
    send({ type: 'close' });
    disposed = true;
    clearTimeout(timer);
    window.removeEventListener('message', ready);
    for (const cleanup of subscriptions.values()) cleanup();
    subscriptions.clear();
    completed.clear();
    port?.close();
    adapter.dispose?.();
  };
}

/** validateValue 按行为输入物模型递归校验值，拒绝未声明的字段、数组元素与数据类型。 */
function validateValue(define: Record<string, any>, value: unknown) {
  try {
    validateDefineValue(define, value);
  } catch {
    throw bridgeError('INVALID_PARAMS', '行为输入值不符合实际物模型');
  }
}

/** validatePropertyValue 校验当前设备物模型的完整属性定义后再交给宿主下发。 */
function validatePropertyValue(define: Record<string, any>, value: unknown) {
  try {
    validateDefineValue(define, value);
  } catch {
    throw bridgeError('INVALID_PARAMS', '属性值不符合实际物模型');
  }
}

/** validateDefineValue 递归支持联犀标量、结构体、数组与矩阵定义；不推断涂鸦 raw 的私有编码。 */
function validateDefineValue(define: Record<string, any>, value: unknown): void {
  const type = define?.type;
  if (type === 'bool' && typeof value === 'boolean') return;
  if (type === 'string' && typeof value === 'string') {
    const maxLength = Number(define.maxLen ?? define.max);
    if (Number.isFinite(maxLength) && value.length > maxLength) throw new Error('字符串超长');
    return;
  }
  if (type === 'enum' && ['number', 'string'].includes(typeof value) && hasOwn((define.mapping || define.values || {}) as object, String(value))) return;
  if (['float', 'int', 'timestamp'].includes(type) && typeof value === 'number' && Number.isFinite(value)) {
    if (type !== 'float' && !Number.isSafeInteger(value)) throw new Error('整数类型无效');
    const max = Number(define.max);
    const min = Number(define.min);
    if (
      (define.min !== undefined && define.min !== null && Number.isFinite(min) && value < min) ||
      (define.max !== undefined && define.max !== null && Number.isFinite(max) && value > max)
    )
      throw new Error('数值超出范围');
    return;
  }
  if (type === 'struct') {
    requestObject(value);
    if (!Array.isArray(define.specs)) throw new Error('结构体缺少字段定义');
    const specs = new Map<string, Record<string, any>>();
    for (const item of define.specs) {
      const identifier = item?.identifier;
      const memberDefine = item?.dataType || item?.define;
      if (typeof identifier !== 'string' || !memberDefine || specs.has(identifier)) throw new Error('结构体字段定义无效');
      specs.set(identifier, memberDefine);
    }
    for (const [key, memberValue] of Object.entries(value)) {
      const memberDefine = specs.get(key);
      if (!memberDefine) throw new Error('结构体包含未声明字段');
      validateDefineValue(memberDefine, memberValue);
    }
    return;
  }
  if (type === 'array' || type === 'matrix') {
    if (!Array.isArray(value) || value.length === 0 || !define.arrayInfo || typeof define.arrayInfo !== 'object') throw new Error('数组定义或值无效');
    const maxLength = Number(define.max);
    if (Number.isFinite(maxLength) && maxLength >= 0 && value.length > maxLength) throw new Error('数组超长');
    for (const item of value) validateDefineValue(define.arrayInfo, item);
    return;
  }
  throw bridgeError('UNSUPPORTED_CAPABILITY', '当前物模型数据类型尚未支持');
}

/** matchesRequirement 标记可选能力的类型/单位/枚举差异，不把未兼容字段当成可正常使用。 */
function matchesRequirement(requirement: PanelRequirement, field: Record<string, unknown>) {
  if (requirement.kind === 'action') return canonical(requirement.input || {}) === canonical(field.input || {});
  return ['type', 'unit', 'mapping', 'values', 'min', 'max', 'step', 'maxLen', 'specs', 'arrayInfo'].every(
    (key) => requirement.define?.[key] === undefined || canonical(requirement.define[key]) === canonical(field[key]),
  );
}

/** hasOwn 在旧版 WebView 中安全判断自有属性，避免依赖较新的 Object.hasOwn。 */
function hasOwn(value: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
/** canonical 按键名递归排序，使物模型结构比较不受 JSON 对象键顺序影响。 */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}
