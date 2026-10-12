const warnedContexts = new Set<string>();

const BLOCKED_SCRIPT_RULES = [
  { reason: 'remote import', rule: /\bimport\s*\(/u },
  { reason: 'importScripts', rule: /\bimportScripts\b/u },
  { reason: 'network api', rule: /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/u },
  { reason: 'token or storage access', rule: /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/u },
  { reason: 'global escape', rule: /\b(globalThis|self|postMessage|navigator)\b/u },
  { reason: 'dynamic code generation', rule: /\b(eval|Function)\b/u },
];

export const isUnsafeDynamicJsAllowed = () => import.meta.env.DEV || import.meta.env.VITE_GOVIEW_ALLOW_UNSAFE_JS === 'true';

export const warnDynamicJsBlocked = (context: string) => {
  if (warnedContexts.has(context)) return;
  warnedContexts.add(context);
  console.warn(
    `[dynamic-js] blocked in current environment: ${context}. ` +
      'Set VITE_GOVIEW_ALLOW_UNSAFE_JS=true only in a fully trusted environment if you must re-enable it.',
  );
};

export const validateDynamicJsSource = (code: string, context: string) => {
  const normalizedCode = code.trim();
  if (!normalizedCode) return true;

  for (const { reason, rule } of BLOCKED_SCRIPT_RULES) {
    if (rule.test(normalizedCode)) {
      warnDynamicJsBlocked(`${context}: ${reason}`);
      return false;
    }
  }

  return true;
};

export const canExecuteDynamicJs = (code: string, context: string) => {
  if (!isUnsafeDynamicJsAllowed()) {
    warnDynamicJsBlocked(context);
    return false;
  }

  return validateDynamicJsSource(code, context);
};
