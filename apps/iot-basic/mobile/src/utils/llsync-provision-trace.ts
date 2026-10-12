/**
 * LLSync 配网追踪器：按会话记录阶段和完整 BLE 原始包，并分片上报 具名 info 日志。
 * 远端上报采用 best-effort，任何可观测性异常都不得改变配网业务结果。
 */
import type { ProvisionStage } from '../domain/models/provision-session-state.model';
import { logger } from './logger';

/** LLSyncTraceEntry 描述一条可按序还原的配网阶段或原始包记录。 */
export interface LLSyncTraceEntry {
  seq: number;
  elapsedMs: number;
  kind: 'stage' | 'tx' | 'rx' | 'result';
  direction?: 'app-to-device' | 'device-to-app';
  opcode?: string;
  byteLength?: number;
  hex?: string;
  summary?: string;
  stage?: ProvisionStage;
}

/** LLSyncTraceStartContext 提供配网开始时已知的设备身份和阶段。 */
export interface LLSyncTraceStartContext {
  stage: ProvisionStage;
  bleDeviceId?: string;
  productID?: string;
  deviceName?: string;
}

/** LLSyncTraceResult 描述一次配网会话唯一的最终结果。 */
export interface LLSyncTraceResult {
  result: 'success' | 'failed';
  stage: ProvisionStage;
  failureCode?: string;
  summary?: string;
  productID?: string;
  deviceName?: string;
}

/** LLSyncTraceFinishOptions 允许终态关闭前继续记录 E5 诊断包。 */
export interface LLSyncTraceFinishOptions {
  beforeClose?: () => Promise<void>;
}

/** LLSyncTraceSession 是显式传入 BLE 调用链的单次配网追踪句柄。 */
export interface LLSyncTraceSession {
  readonly traceId: string;
  recordStage(stage: ProvisionStage, summary?: string): void;
  recordTx(bytes: number[]): void;
  recordRx(bytes: number[]): void;
  finish(result: LLSyncTraceResult, options?: LLSyncTraceFinishOptions): Promise<void>;
}

/** LLSyncTraceMessageContext 是追踪器向统一 logger 提交的 info 事件。 */
export interface LLSyncTraceMessageContext {
  level: 'info';
  tags: Record<string, string | number | boolean | undefined>;
  extra: Record<string, unknown>;
}

/** LLSyncTraceCapture 隔离追踪算法与具体 远端调试桥，便于运行时测试。 */
export type LLSyncTraceCapture = (message: string, context: LLSyncTraceMessageContext) => void;

/** LLSyncTraceBreadcrumb 描述直接展示在 调试日志中的单条配网记录。 */
export interface LLSyncTraceBreadcrumb {
  category: string;
  message: string;
  level: 'info';
  data: Record<string, unknown>;
}

/** LLSyncTraceBreadcrumbCapture 隔离时间线格式与统一日志实现。 */
export type LLSyncTraceBreadcrumbCapture = (breadcrumb: LLSyncTraceBreadcrumb) => void;

const TRACE_SCHEMA_VERSION = 1;
const TRACE_CHUNK_ENTRY_LIMIT = 20;
const TRACE_CHUNK_BYTE_LIMIT = 32 * 1024;
let traceSequence = 0;

type TraceState = 'active' | 'finishing' | 'closed';
type TraceEventType = 'start' | 'chunk' | 'finish';

/** utf8ByteLength 计算 JSON 字符串实际 UTF-8 字节数，避免依赖各端 TextEncoder 支持。 */
function utf8ByteLength(value: string): number {
  let length = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) {
      length += 1;
    } else if (code <= 0x7ff) {
      length += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        length += 4;
        index += 1;
      } else {
        length += 3;
      }
    } else {
      length += 3;
    }
  }
  return length;
}

/** bytesToHex 将实际 BLE 字节转换为统一的小写空格分隔格式，不改写 E2/E4 内容。 */
export function bytesToTraceHex(bytes: number[]): string {
  return bytes.map((byte) => (byte & 0xff).toString(16).padStart(2, '0')).join(' ');
}

/** createTraceId 生成可检索且进程内唯一的配网会话标识。 */
function createTraceId(): string {
  traceSequence += 1;
  return `llsync-${Date.now().toString(36)}-${traceSequence.toString(36)}`;
}

/** LLSyncProvisionTrace 创建相互独立的配网追踪会话。 */
export class LLSyncProvisionTrace {
  constructor(
    private readonly capture: LLSyncTraceCapture = (message, context) => logger.captureMessage(message, context),
    private readonly addBreadcrumb: LLSyncTraceBreadcrumbCapture = (breadcrumb) => logger.addBreadcrumb(breadcrumb),
  ) {}

  /** start 创建新会话并立即提交开始事件。 */
  start(context: LLSyncTraceStartContext): LLSyncTraceSession {
    return new LLSyncProvisionTraceSession(createTraceId(), context, this.capture, this.addBreadcrumb);
  }
}

/** LLSyncProvisionTraceSession 管理单次会话的序号、分片和唯一终态。 */
class LLSyncProvisionTraceSession implements LLSyncTraceSession {
  private readonly startedAt = Date.now();
  private state: TraceState = 'active';
  private currentStage: ProvisionStage;
  private sequence = 0;
  private totalEntries = 0;
  private chunkIndex = 0;
  private buffer: LLSyncTraceEntry[] = [];
  private finishPromise: Promise<void> | null = null;

  constructor(
    readonly traceId: string,
    private readonly startContext: LLSyncTraceStartContext,
    private readonly capture: LLSyncTraceCapture,
    private readonly addBreadcrumb: LLSyncTraceBreadcrumbCapture,
  ) {
    this.currentStage = startContext.stage;
    this.captureBreadcrumb({
      seq: 0,
      elapsedMs: 0,
      kind: 'stage',
      stage: startContext.stage,
      summary: '配网会话开始',
    });
    this.captureEvent('LLSync 配网开始', 'start', 'running', {
      bleDeviceId: startContext.bleDeviceId,
    });
  }

  /** recordStage 在活动状态记录业务阶段变化。 */
  recordStage(stage: ProvisionStage, summary?: string): void {
    if (this.state !== 'active') return;
    this.currentStage = stage;
    this.appendEntry({ kind: 'stage', stage, summary });
  }

  /** recordTx 保留写入阶段和长度，敏感命令只记录脱敏标记。 */
  recordTx(bytes: number[]): void {
    this.recordPacket('tx', 'app-to-device', bytes);
  }

  /** recordRx 记录设备实际通知给应用的完整原始包。 */
  recordRx(bytes: number[]): void {
    this.recordPacket('rx', 'device-to-app', bytes);
  }

  /** finish 锁定首个终态，等待可选诊断后提交唯一结束事件。 */
  finish(result: LLSyncTraceResult, options: LLSyncTraceFinishOptions = {}): Promise<void> {
    if (this.finishPromise) return this.finishPromise;
    if (this.state === 'closed') return Promise.resolve();
    this.state = 'finishing';
    this.finishPromise = this.completeFinish(result, options);
    return this.finishPromise;
  }

  /** recordPacket 在活动或终态诊断期间记录真实 BLE 包。 */
  private recordPacket(
    kind: 'tx' | 'rx',
    direction: 'app-to-device' | 'device-to-app',
    bytes: number[],
  ): void {
    if (this.state === 'closed') return;
    const normalized = bytes.map((byte) => byte & 0xff);
    this.appendEntry({
      kind,
      direction,
      opcode: normalized.length > 0 ? normalized[0].toString(16).padStart(2, '0') : '',
      byteLength: normalized.length,
      // E2 凭据、E4 绑定 Token（含分片）不能进入日志或 Sentry。
      hex: kind === 'tx' && [0xe2, 0xe4].includes(normalized[0]) ? '[redacted]' : bytesToTraceHex(normalized),
    });
  }

  /** appendEntry 分配连续序号，并在普通记录达到阈值时立即分片。 */
  private appendEntry(entry: Omit<LLSyncTraceEntry, 'seq' | 'elapsedMs'>, allowFlush = true): void {
    this.sequence += 1;
    this.totalEntries += 1;
    const traceEntry: LLSyncTraceEntry = {
      seq: this.sequence,
      elapsedMs: Math.max(0, Date.now() - this.startedAt),
      ...entry,
    };
    this.buffer.push(traceEntry);
    this.captureBreadcrumb(traceEntry);
    if (allowFlush && this.shouldFlush()) this.flushChunk();
  }

  /** captureBreadcrumb 把阶段与原始包转成无需展开 Context 即可阅读的 调试日志。 */
  private captureBreadcrumb(entry: LLSyncTraceEntry): void {
    try {
      this.addBreadcrumb({
        category: `llsync.${entry.kind}`,
        message: formatTraceBreadcrumb(this.traceId, entry),
        level: 'info',
        data: {
          traceId: this.traceId,
          productID: this.startContext.productID,
          deviceName: this.startContext.deviceName,
          ...entry,
        },
      });
    } catch {
      // 时间线上报失败不得改变配网状态机和最终结果。
    }
  }

  /** shouldFlush 判断条目数量或 UTF-8 JSON 大小是否达到分片阈值。 */
  private shouldFlush(): boolean {
    if (this.buffer.length >= TRACE_CHUNK_ENTRY_LIMIT) return true;
    return utf8ByteLength(JSON.stringify(this.buffer)) >= TRACE_CHUNK_BYTE_LIMIT;
  }

  /** flushChunk 提交当前分片；失败后仍清空分片并推进索引。 */
  private flushChunk(): void {
    if (this.buffer.length === 0) return;
    const entries = this.buffer;
    this.buffer = [];
    this.chunkIndex += 1;
    this.captureEvent('LLSync 配网日志分片', 'chunk', 'running', {
      chunkIndex: this.chunkIndex,
      seqStart: entries[0]?.seq,
      seqEnd: entries[entries.length - 1]?.seq,
      entries,
    });
  }

  /** completeFinish 确保诊断异常也能进入 finally 完成唯一终态。 */
  private async completeFinish(result: LLSyncTraceResult, options: LLSyncTraceFinishOptions): Promise<void> {
    try {
      await options.beforeClose?.();
    } catch {
      // 设备诊断失败只影响诊断内容，不覆盖已经锁定的配网结果。
    }
    this.currentStage = result.stage;
    this.appendEntry({
      kind: 'result',
      stage: result.stage,
      summary: result.summary,
    }, false);
    const entries = this.buffer;
    this.buffer = [];
    this.captureEvent(
      result.result === 'success' ? 'LLSync 配网成功' : 'LLSync 配网失败',
      'finish',
      result.result,
      {
        totalEntries: this.totalEntries,
        durationMs: Math.max(0, Date.now() - this.startedAt),
        failureCode: result.failureCode,
        entries,
      },
      result,
    );
    this.state = 'closed';
  }

  /** captureEvent 统一构造 具名日志，并吞掉任何远端上报异常。 */
  private captureEvent(
    message: string,
    eventType: TraceEventType,
    result: 'running' | 'success' | 'failed',
    extra: Record<string, unknown>,
    finalResult?: LLSyncTraceResult,
  ): void {
    const productID = finalResult?.productID || this.startContext.productID;
    const deviceName = finalResult?.deviceName || this.startContext.deviceName;
    const payload = {
      schemaVersion: TRACE_SCHEMA_VERSION,
      traceId: this.traceId,
      eventType,
      result,
      stage: finalResult?.stage || this.currentStage,
      productID,
      deviceName,
      ...extra,
    };
    try {
      this.capture(message, {
        level: 'info',
        tags: {
          feature: 'llsync-provision',
          name: eventType === 'chunk' ? 'ble.llsync.raw' : 'ble.llsync.trace',
          traceId: this.traceId,
          eventType,
          result,
          stage: payload.stage,
          productID,
          deviceName,
        },
        extra: payload,
      });
    } catch {
      // 调试桥不可用或离线时，配网流程仍按原结果继续。
    }
  }
}

/** formatTraceBreadcrumb 生成 调试日志可直接检索和阅读的单行文本。 */
function formatTraceBreadcrumb(traceId: string, entry: LLSyncTraceEntry): string {
  const prefix = `trace=${traceId} #${entry.seq} +${entry.elapsedMs}ms`;
  if (entry.kind === 'tx' || entry.kind === 'rx') {
    const direction = entry.kind.toUpperCase();
    const opcode = (entry.opcode || 'NA').toUpperCase();
    return `${prefix} ${direction} ${opcode} ${entry.byteLength || 0}B | ${entry.hex || ''}`;
  }
  if (entry.kind === 'result') {
    return `${prefix} 结果 ${entry.stage || ''}${entry.summary ? ` | ${entry.summary}` : ''}`;
  }
  return `${prefix} 阶段 ${entry.stage || ''}${entry.summary ? ` | ${entry.summary}` : ''}`;
}

/** llsyncProvisionTrace 是移动端配网流程共享的追踪工厂。 */
export const llsyncProvisionTrace = new LLSyncProvisionTrace();
