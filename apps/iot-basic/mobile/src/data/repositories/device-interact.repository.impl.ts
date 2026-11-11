/** 文件说明：设备交互与物模型读取；仅缓存按身份隔离的模型定义，实时属性和命令不缓存。 */
import { request } from '../../utils/request';
import { getRequestContext } from '../../utils/request-context';
import { eventBus } from '../../utils/event-bus';
import type {
  ActionSendParams,
  IDeviceInteractRepository,
  PropertyControlParams,
} from '../../domain/interfaces/device-interact.repository';
import type {
  ActionParam,
  PropertyState,
  ThingModelAction,
  ThingModelDefine,
  ThingModelEvent,
  ThingModelProperty,
  ThingModelSchema,
} from '../../domain/models/device-control.model';

/** schemaCache 只保留当前身份最近32份模型，60秒后重新读取；不写磁盘。 */
const schemaCache = new Map<string, { expiresAt: number; value?: ThingModelSchema; pending?: Promise<ThingModelSchema> }>();
/** schemaScope 令牌及企业/项目仅用于内存隔离，不输出日志或作为平台授权。 */
let schemaScope = '';
eventBus.on('auth:logout', () => { schemaCache.clear(); schemaScope = ''; });

interface SchemaListItem {
  type?: number | string;
  identifier?: string;
  name?: string | null;
  affordance?: string;
  funcGroup?: number | string;
}

interface RawParam {
  identifier?: string;
  name?: string;
  define?: unknown;
}

function parseDefine(raw: unknown): ThingModelDefine {
  if (!raw || typeof raw !== 'object') return { type: 'string' };
  const r = raw as Record<string, unknown>;
  const define: ThingModelDefine = { type: (r.type as ThingModelDefine['type']) || 'string' };
  if (r.mapping && typeof r.mapping === 'object') {
    define.mapping = r.mapping as Record<string, string>;
  }
  if (typeof r.min === 'string') define.min = r.min;
  if (typeof r.max === 'string') define.max = r.max;
  if (typeof r.step === 'string') define.step = r.step;
  if (typeof r.unit === 'string') define.unit = r.unit;
  if (r.specs) define.specs = r.specs;
  if (r.arrayInfo) define.arrayInfo = r.arrayInfo;
  return define;
}

function parseParams(raw: unknown): ActionParam[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const item = (p || {}) as RawParam;
    return {
      identifier: String(item.identifier || ''),
      name: String(item.name || item.identifier || ''),
      define: parseDefine(item.define),
    };
  });
}

export class DeviceInteractRepositoryImpl implements IDeviceInteractRepository {
  async propertyControlSend(params: PropertyControlParams): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/interact/property-control-send',
      data: {
        productID: params.productID,
        deviceName: params.deviceName,
        data: JSON.stringify({ [params.dataID]: params.value }),
      },
    });
    return String(resp.msgToken || '');
  }

  async propertyGetReportSend(productID: string, deviceName: string, dataIDs: string[]): Promise<void> {
    await request({
      url: '/api/v1/things/device/interact/property-get-report-send',
      data: { productID, deviceName, dataIDs },
    });
  }

  async actionSend(params: ActionSendParams): Promise<string> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/interact/action-send',
      data: {
        productID: params.productID,
        deviceName: params.deviceName,
        actionID: params.actionID,
        inputParams: JSON.stringify(params.params),
      },
    });
    return String(resp.msgToken || '');
  }

  /** getThingModel 复用短期模型定义及在途请求，状态值始终由独立实时接口取得。 */
  async getThingModel(productID: string, deviceName?: string): Promise<ThingModelSchema> {
    const scope = JSON.stringify([uni.getStorageSync('token') || '', getRequestContext()]);
    if (scope !== schemaScope) { schemaCache.clear(); schemaScope = scope; }
    const key = JSON.stringify([productID, deviceName || '']);
    const cached = schemaCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      const model = cached.value || await cached.pending!;
      return JSON.parse(JSON.stringify(model)) as ThingModelSchema;
    }
    const entry = { expiresAt: Date.now() + 60_000, pending: this.loadThingModel(productID, deviceName) };
    if (schemaCache.size >= 32) schemaCache.delete(schemaCache.keys().next().value!);
    schemaCache.set(key, entry);
    try {
      const model = await entry.pending;
      if (schemaScope === scope && schemaCache.get(key) === entry) {
        schemaCache.set(key, { expiresAt: Date.now() + 60_000, value: model });
      }
      return JSON.parse(JSON.stringify(model)) as ThingModelSchema;
    } catch (error) {
      if (schemaCache.get(key) === entry) schemaCache.delete(key);
      throw error;
    }
  }

  /** loadThingModel 执行平台模型查询和解析；失败不写缓存，不影响其他设备模型。 */
  private async loadThingModel(productID: string, deviceName?: string): Promise<ThingModelSchema> {
    const resp = await request<Record<string, unknown>>({
      url: deviceName ? '/api/v1/things/device/schema/get-list' : '/api/v1/things/product/schema/get-list',
      data: deviceName ? { productID, deviceName, withProductSchema: true } : { productID },
    });
    const list = (resp.list || []) as SchemaListItem[];

    const properties: ThingModelProperty[] = [];
    const events: ThingModelEvent[] = [];
    const actions: ThingModelAction[] = [];

    list.forEach((item) => {
      const type = Number(item.type);
      const identifier = String(item.identifier || '');
      if (!identifier) return;
      const name = String(item.name || identifier);
      let afford: Record<string, unknown> = {};
      if (item.affordance) {
        try {
          afford = JSON.parse(item.affordance) as Record<string, unknown>;
        } catch {
          afford = {};
        }
      }
      if (type === 1) {
        const mode = afford.mode === 'r' ? 'r' : 'rw';
        properties.push({
          identifier,
          name,
          mode,
          define: parseDefine(afford.define),
          funcGroup: Number(item.funcGroup || 0),
        });
      } else if (type === 2) {
        events.push({
          identifier,
          name,
          type: String(afford.type || 'info'),
          params: parseParams(afford.params),
        });
      } else if (type === 3) {
        const dir = afford.dir === 'up' ? 'up' : 'down';
        actions.push({
          funcGroup: Number(item.funcGroup || 0),
          identifier,
          name,
          dir,
          input: parseParams(afford.input),
          output: parseParams(afford.output),
        });
      }
    });

    return { properties, events, actions };
  }

  async getLatestProperties(productID: string, deviceName: string): Promise<PropertyState[]> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/device/msg/property-latest/get-list',
      data: { productID, deviceName },
    });
    const list = (resp.list || []) as Record<string, unknown>[];
    return list.map((item) => ({
      dataID: String(item.dataID || ''),
      dataName: String(item.dataName || item.dataID || ''),
      value: item.value,
      timestamp: Number(item.timestamp || 0),
    }));
  }
}
