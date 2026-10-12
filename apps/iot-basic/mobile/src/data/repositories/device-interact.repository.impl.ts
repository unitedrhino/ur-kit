import { request } from '../../utils/request';
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

  async getThingModel(productID: string): Promise<ThingModelSchema> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/product/schema/get-list',
      data: { productID },
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
