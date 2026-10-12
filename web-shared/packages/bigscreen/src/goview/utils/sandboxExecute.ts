/** 文件说明：脚本沙盒线程调度，缺少错误详情时显示当前语言提示。 */
import { $t as editorT } from '@vben/saas/locales';
import { cloneDeep } from 'lodash';

import { isUnsafeDynamicJsAllowed, warnDynamicJsBlocked } from '../../shared/dynamic-js-policy';

/**
 * 安全的全局对象白名单（与 eventSandbox.ts 保持一致）
 */
const ALLOWED_GLOBALS = new Set([
  'Array', 'BigInt', 'Boolean', 'Number', 'String', 'Symbol', 'Object',
  'Error', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError',
  'Map', 'Set', 'WeakMap', 'WeakSet',
  'Infinity', 'NaN', 'undefined', 'null',
  'isFinite', 'isNaN', 'parseFloat', 'parseInt',
  'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent',
  'JSON', 'Math', 'Date', 'RegExp', 'Promise', 'console',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
]);

/**
 * WorkerPool 单例：管理沙盒 Worker 线程池
 * 懒初始化 + FIFO 任务队列 + 超时控制 + 安全 fallback
 */

interface PendingTask {
  taskId: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timer: ReturnType<typeof setTimeout>;
}

const POOL_SIZE = 2;
const TASK_TIMEOUT = 3000;

const workers: Worker[] = [];
const pendingTasks = new Map<number, PendingTask>();
let taskIdCounter = 0;
const taskQueue: Array<{ data: any; funcStr: string; res: any; taskId: number }> = [];
const busyWorkers = new Set<number>();
let initialized = false;
let workerSupported = true;

/** 懒初始化 Worker 池 */
const ensurePool = () => {
  if (initialized) return;
  initialized = true;
  try {
    for (let i = 0; i < POOL_SIZE; i++) {
      const w = new Worker(new URL('sandbox.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e) => onWorkerMessage(i, e);
      w.onerror = () => onWorkerError(i);
      workers.push(w);
    }
  } catch {
    workerSupported = false;
    console.warn('[sandbox] Worker 不可用，退回主线程沙箱执行');
  }
};

/** Worker 返回结果 */
const onWorkerMessage = (workerIdx: number, e: MessageEvent) => {
  const { taskId, success, result, error } = e.data;
  const pending = pendingTasks.get(taskId);
  if (pending) {
    clearTimeout(pending.timer);
    pendingTasks.delete(taskId);
    success ? pending.resolve(result) : pending.reject(new Error(error || editorT('bigscreenEditor.ui.functionFailed')));
  }
  busyWorkers.delete(workerIdx);
  dispatchNext(workerIdx);
};

/** Worker 异常 */
const onWorkerError = (workerIdx: number) => {
  busyWorkers.delete(workerIdx);
  dispatchNext(workerIdx);
};

/** 从队列取下一个任务派发给空闲 Worker */
const dispatchNext = (workerIdx: number) => {
  if (taskQueue.length === 0) return;
  const task = taskQueue.shift()!;
  const worker = workers[workerIdx];
  // workerIdx 来自初始化循环索引，正常必存在；防御性兜底避免越界崩溃
  if (!worker) return;
  busyWorkers.add(workerIdx);
  worker.postMessage(task);
};

/** 找到一个空闲 Worker 索引，无则返回 -1 */
const findIdleWorker = (): number => {
  for (let i = 0; i < workers.length; i++) {
    if (!busyWorkers.has(i)) return i;
  }
  return -1;
};

/**
 * 创建白名单模式的沙箱 Proxy（与 eventSandbox.ts 保持一致）
 * - has() 返回 true：阻止 with 语句逃逸到真实全局作用域
 * - get() 仅允许白名单中的全局变量，其余返回 undefined
 * - 函数参数名（_sandbox_/data/res）不拦截，否则 with 作用域会把传入参数遮蔽成 undefined
 */
const FALLBACK_PARAM_KEYS = new Set(['_sandbox_', 'data', 'res']);

const createMainThreadSandboxProxy = () =>
  new Proxy({} as Record<string, any>, {
    has(_target, key) {
      return !(typeof key === 'string' && FALLBACK_PARAM_KEYS.has(key));
    },
    get(_target, key: string) {
      if (ALLOWED_GLOBALS.has(key)) return (globalThis as any)[key];
      return undefined;
    },
    set(_target, _key: string, _value) {
      return true; // 静默忽略写入，避免报错
    },
  });

/**
 * 主线程安全 fallback：使用白名单 Proxy 隔离 + with 语句限制作用域
 * 当 Worker 不可用时（CSP 限制、浏览器兼容问题）使用此路径
 * 注意：funcStr 与 Worker 端（sandbox.worker.ts）保持一致的函数体语义，
 * 支持多语句脚本（如 "return data.map(...)"），否则过滤器会静默退化为原始数据
 */
const safeFallbackExecute = (data: any, res: any, funcStr: string): any => {
  try {
    const proxy = createMainThreadSandboxProxy();
    const fn = new Function('_sandbox_', 'data', 'res', `with(_sandbox_){${funcStr}}`);
    return fn.call(proxy, proxy, cloneDeep(data), cloneDeep(res));
  } catch (error: any) {
    console.error('[sandbox safe fallback]', error);
    return data;
  }
};

/**
 * 沙盒执行用户过滤脚本（异步）
 * 快路径：无 funcStr 时直接返回 data，零开销
 * 正常路径：Worker 线程隔离执行
 * 安全降级路径：Worker 不可用时使用白名单 Proxy 主线程执行
 */
export const sandboxExecute = async (data: any, res: any, funcStr?: string): Promise<any> => {
  // 快路径：无 filter 直接返回
  if (!funcStr) return data;

  // 预览模式下使用同步执行，避免后台标签页 Worker 消息节流导致显示延迟
  ensurePool();

  // Worker 不可用，走安全 fallback（白名单 Proxy 隔离）
  if (!workerSupported || workers.length === 0) {
    if (!isUnsafeDynamicJsAllowed()) {
      warnDynamicJsBlocked('sandboxExecute main-thread fallback');
      return data;
    }
    return safeFallbackExecute(data, res, funcStr);
  }

  const taskId = ++taskIdCounter;
  const message = {
    taskId,
    data: cloneDeep(data),
    res: cloneDeep(res),
    funcStr,
  };

  return new Promise((resolve, reject) => {
    // 超时控制
    const timer = setTimeout(() => {
      pendingTasks.delete(taskId);
      console.warn(`[sandbox] 任务 ${taskId} 超时(${TASK_TIMEOUT}ms)`);
      resolve(data); // 超时返回原始数据，不中断流程
    }, TASK_TIMEOUT);

    pendingTasks.set(taskId, { taskId, resolve, reject, timer });

    // 尝试派发到空闲 Worker
    const idx = findIdleWorker();
    if (idx >= 0) {
      const worker = workers[idx];
      // idx 来自 findIdleWorker 遍历索引，正常必存在；防御性兜底避免越界崩溃
      if (!worker) return;
      busyWorkers.add(idx);
      worker.postMessage(message);
    } else {
      // 全忙，入队等待
      taskQueue.push(message);
    }
  });
};
