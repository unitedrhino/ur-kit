/**
 * 文件说明：在独立线程执行脚本；缺少错误详情时由主线程按当前语言补充提示。
 * DOM access is unavailable here, and a small set of risky globals is shadowed.
 */

import { validateDynamicJsSource } from '../../shared/dynamic-js-policy';

interface TaskMessage {
  taskId: number;
  data: any;
  res: any;
  funcStr: string;
}

interface TaskResult {
  taskId: number;
  success: boolean;
  result?: any;
  error?: string;
}

// 注意：eval 和 arguments 不能用作严格模式函数的参数名或变量名（语法错误），
// 因此不将它们列入 BLOCKED_GLOBALS。Worker 线程本身已提供隔离，无需额外屏蔽。
const BLOCKED_GLOBALS = [
  'EventSource',
  'Function',
  'WebSocket',
  'XMLHttpRequest',
  'fetch',
  'globalThis',
  'importScripts',
  'navigator',
  'postMessage',
  'self',
];

function createSandboxFunction(funcStr: string) {
  if (!validateDynamicJsSource(funcStr, 'sandbox.worker')) {
    throw new Error('Unsafe dynamic script is blocked by policy');
  }

  return new Function(
    'data',
    'res',
    ...BLOCKED_GLOBALS,
    `"use strict"; ${funcStr}`,
  );
}

self.onmessage = (e: MessageEvent<TaskMessage>) => {
  const { taskId, data, res, funcStr } = e.data;
  try {
    const fn = createSandboxFunction(funcStr);
    const result = fn(data, res, ...BLOCKED_GLOBALS.map(() => undefined));
    self.postMessage({ taskId, success: true, result } as TaskResult);
  } catch (error: any) {
    self.postMessage({
      taskId,
      success: false,
      error: error?.message || '',
    } as TaskResult);
  }
};
