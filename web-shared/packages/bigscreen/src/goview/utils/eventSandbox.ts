import { isUnsafeDynamicJsAllowed, warnDynamicJsBlocked } from '../../shared/dynamic-js-policy';

/**
 * 安全的全局对象白名单：仅允许基础数学、时间、数据操作对象
 * 白名单模式下，任何不在白名单中的全局变量都将返回 undefined
 */
const ALLOWED_GLOBALS = new Set([
  // 基础类型构造器
  'Array',
  'BigInt',
  'Boolean',
  'Number',
  'String',
  'Symbol',
  'Object',
  // 错误类型
  'Error',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  // 集合类型
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  // 全局常量与函数
  'Infinity',
  'NaN',
  'undefined',
  'null',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'encodeURI',
  'encodeURIComponent',
  'decodeURI',
  'decodeURIComponent',
  // 工具对象
  'JSON',
  'Math',
  'Date',
  'RegExp',
  'Promise',
  'console',
  // 定时器（沙箱环境内可用，但不会影响主线程）
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
]);

/**
 * 创建白名单模式的沙箱 Proxy
 * - has() 返回 true：阻止 with 语句逃逸到真实全局作用域
 * - get() 仅允许白名单中的全局变量，其余返回 undefined
 * - 支持通过 allowedVars 动态注入安全变量（如 components、node_modules）
 */
const createSandboxProxy = (allowedVars: Record<string, any>) =>
  new Proxy(allowedVars, {
    has() {
      // 始终返回 true，阻止 with 语句查找真实全局作用域
      return true;
    },
    get(target, key: string) {
      // 优先返回注入的变量
      if (key in target) return target[key];
      // 白名单中的全局变量
      if (ALLOWED_GLOBALS.has(key)) return (globalThis as any)[key];
      // 不在白名单中的全局变量一律拒绝访问
      return undefined;
    },
    set(target, key: string, value) {
      target[key] = value;
      return true;
    },
  });

const createNoopAsync = () => async () => undefined;

export const sandboxedExec = (fnBody: string, allowedVars: Record<string, any> = {}) => {
  if (!isUnsafeDynamicJsAllowed()) {
    warnDynamicJsBlocked('eventSandbox.sandboxedExec');
    return undefined;
  }

  const proxy = createSandboxProxy(allowedVars);
  const wrapped = new Function('_sandbox_', `with(_sandbox_){${fnBody}}`);
  return wrapped.call(proxy, proxy);
};

export const sandboxedBaseFunc = (fnBody: string, allowedVars: Record<string, any> = {}) => {
  if (!isUnsafeDynamicJsAllowed()) {
    warnDynamicJsBlocked('eventSandbox.sandboxedBaseFunc');
    return createNoopAsync();
  }

  const proxy = createSandboxProxy(allowedVars);
  const wrapped = new Function('_sandbox_', `with(_sandbox_){return(async function(components,mouseEvent){${fnBody}})}`);
  return wrapped.call(proxy, proxy).bind(undefined, allowedVars.components);
};

export const sandboxedLifecycleExec = (fnBody: string, e: any, allowedVars: Record<string, any> = {}) => {
  if (!isUnsafeDynamicJsAllowed()) {
    warnDynamicJsBlocked('eventSandbox.sandboxedLifecycleExec');
    return;
  }

  const proxy = createSandboxProxy(allowedVars);
  const wrapped = new Function(
    '_sandbox_',
    `with(_sandbox_){return(async function(e,components,node_modules){const {${Object.keys(allowedVars.node_modules || {}).join(',')}}=node_modules;${fnBody}})}`,
  );
  wrapped.call(proxy, proxy).bind(e?.component)(e, allowedVars.components, allowedVars.node_modules);
};
