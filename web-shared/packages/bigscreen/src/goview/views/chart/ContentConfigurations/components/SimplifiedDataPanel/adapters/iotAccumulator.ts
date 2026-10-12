/**
 * prop+latest 时序累积器
 *
 * 防御 1：按组件 ID 缓存，按配置变更清理
 * - 全局 Map<string, IoTAccumulator>，以组件 ID 为 key
 * - configKey（productID:deviceName:dataIDs 排序拼接）变更时自动清空重建
 * - 组件卸载时调用 destroyAccumulator 清理，防止内存泄漏
 *
 * 每次 poll 拿到 name-value 快照 → 转换为宽表行 { timestamp, propA: v1, propB: v2 }
 * 维护固定大小的环形缓冲区，返回完整时序 rows
 */

export class IoTAccumulator {
  private buffer: Record<string, any>[] = [];
  readonly configKey: string;
  private maxSize: number;

  constructor(maxSize: number, configKey: string) {
    this.maxSize = maxSize;
    this.configKey = configKey;
  }

  /**
   * 将 name-value 快照转换为宽表行并推入缓冲区
   * @param snapshot  prop+latest 返回的 [{ name, value }] 数组
   * @param timestamp 设备时间戳（毫秒）
   * @returns 完整的时序 rows（包含历史累积数据）
   */
  push(snapshot: { name: string; value: number }[], timestamp: number): Record<string, any>[] {
    const row: Record<string, any> = {
      time: new Date(timestamp).toISOString().slice(0, 19).replace('T', ' '),
    };
    snapshot.forEach(({ name, value }) => {
      row[name] = Number(value) || 0;
    });
    this.buffer.push(row);
    // 环形缓冲：超出 maxSize 时移除最旧的
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return [...this.buffer];
  }

  /** 获取当前缓冲区数据（不推入新数据） */
  getRows(): Record<string, any>[] {
    return [...this.buffer];
  }

  /** 清空缓冲区 */
  clear() {
    this.buffer = [];
  }

  /** 缓冲区当前长度 */
  get length() {
    return this.buffer.length;
  }
}

// ── 全局缓存表 ──

const accumulatorMap = new Map<string, IoTAccumulator>();

/**
 * 获取或创建累积器实例
 * 当 configKey 变更时自动清空重建，防止旧设备数据串台
 */
export function getOrCreateAccumulator(
  compId: string,
  configKey: string,
  maxSize = 200,
): IoTAccumulator {
  const existing = accumulatorMap.get(compId);
  if (existing && existing.configKey === configKey) return existing;
  // 配置变更 → 清空重建
  existing?.clear();
  const acc = new IoTAccumulator(maxSize, configKey);
  accumulatorMap.set(compId, acc);
  return acc;
}

/** 组件卸载时调用，清理缓冲区并移除引用 */
export function destroyAccumulator(compId: string) {
  accumulatorMap.get(compId)?.clear();
  accumulatorMap.delete(compId);
}

/** 构建 configKey：productID:deviceName:dataIDs 排序拼接 */
export function buildAccumulatorConfigKey(
  productID: string,
  deviceName: string,
  dataIDs: string[],
): string {
  return `${productID}:${deviceName}:${[...dataIDs].sort().join(',')}`;
}
