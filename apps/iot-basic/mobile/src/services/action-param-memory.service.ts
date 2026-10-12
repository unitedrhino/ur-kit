/**
 * 行为参数记忆服务：保存设备行为最近一次成功入参，并用物模型签名避免误复用。
 */
import { localStorage } from '../data/datasources/local-storage.datasource';
import type {
  ActionItem,
  ThingModelDefine,
} from '../domain/models/device-control.model';
import type { DeviceEntity } from '../domain/entities/device.entity';

type ActionMemoryDevice = Pick<DeviceEntity, 'deviceName' | 'productID'>;

/** ActionParamMemoryStorage 抽象本地存储能力，便于测试注入和后续替换。 */
interface ActionParamMemoryStorage {
  get<T>(name: string): T | null;
  remove(name: string): void;
  set<T>(name: string, data: T, ttlMs?: number): void;
}

/** ActionParamMemoryRecord 表示一次成功行为调用后可复用的参数记录。 */
export interface ActionParamMemoryRecord {
  /** params 保存当前物模型声明过的行为入参。 */
  params: Record<string, unknown>;
  /** signature 保存行为入参结构签名，用于避免物模型变化后的误执行。 */
  signature: string;
  /** updatedAt 表示参数记忆最近一次更新的时间戳。 */
  updatedAt: number;
}

const ACTION_PARAM_MEMORY_PREFIX = 'device_action_param_memory_v1';
const ACTION_PARAM_MEMORY_TTL_MS = 180 * 24 * 60 * 60 * 1000;

function encodeKeyPart(value: string): string {
  return encodeURIComponent(value || '').replace(/%/g, '_');
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function firstEnumValue(define: ThingModelDefine): string {
  return Object.keys(define.mapping || {})[0] || '';
}

function buildDefineSignature(define: ThingModelDefine): string {
  const mappingKeys = Object.keys(define.mapping || {}).join(',');
  return [
    define.type,
    define.min || '',
    define.max || '',
    define.step || '',
    define.unit || '',
    mappingKeys,
  ].join(':');
}

function buildStorageKey(device: ActionMemoryDevice, action: ActionItem): string {
  return [
    ACTION_PARAM_MEMORY_PREFIX,
    encodeKeyPart(device.productID),
    encodeKeyPart(device.deviceName),
    encodeKeyPart(action.identifier),
  ].join(':');
}

/** buildActionParamSignature 生成行为入参结构签名，用于判断缓存是否仍适配当前物模型。 */
export function buildActionParamSignature(action: ActionItem): string {
  return action.input
    .map((param) => `${param.identifier}:${buildDefineSignature(param.define)}`)
    .join('|');
}

/** buildActionParamDefaults 根据行为入参类型生成可直接展示在表单里的默认值。 */
export function buildActionParamDefaults(action: ActionItem, now = Date.now()): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  action.input.forEach((param) => {
    const define = param.define;
    if (define.type === 'bool') {
      result[param.identifier] = false;
      return;
    }
    if (define.type === 'enum') {
      result[param.identifier] = firstEnumValue(define);
      return;
    }
    if (define.type === 'timestamp') {
      result[param.identifier] = now;
      return;
    }
    if (define.type === 'int' || define.type === 'float') {
      result[param.identifier] = toFiniteNumber(define.min, 0);
      return;
    }
    result[param.identifier] = '';
  });
  return result;
}

/** getActionParamMemory 读取仍匹配当前行为入参签名的记忆参数。 */
export function getActionParamMemory(
  device: ActionMemoryDevice,
  action: ActionItem,
  storage: ActionParamMemoryStorage = localStorage,
): ActionParamMemoryRecord | null {
  const key = buildStorageKey(device, action);
  const record = storage.get<ActionParamMemoryRecord>(key);
  if (!record) return null;
  if (record.signature !== buildActionParamSignature(action)) {
    storage.remove(key);
    return null;
  }
  return record;
}

/** saveActionParamMemory 保存本次成功执行的行为入参，仅保留当前物模型声明的参数。 */
export function saveActionParamMemory(
  device: ActionMemoryDevice,
  action: ActionItem,
  values: Record<string, unknown>,
  storage: ActionParamMemoryStorage = localStorage,
): void {
  const defaults = buildActionParamDefaults(action);
  const params: Record<string, unknown> = {};
  action.input.forEach((param) => {
    params[param.identifier] = values[param.identifier] ?? defaults[param.identifier];
  });
  storage.set<ActionParamMemoryRecord>(
    buildStorageKey(device, action),
    {
      params,
      signature: buildActionParamSignature(action),
      updatedAt: Date.now(),
    },
    ACTION_PARAM_MEMORY_TTL_MS,
  );
}
