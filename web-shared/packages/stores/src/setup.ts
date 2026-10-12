import type { Pinia } from 'pinia';

import type { App } from 'vue';

import { createPinia, getActivePinia } from 'pinia';
import SecureLSImport from 'secure-ls';

// secure-ls 是 UMD/CJS 包：rolldown 构建在跨 chunk 引用场景下 interop 会产生
// { exports: SecureLS } 双层包装（2026-09-12 KVM 部署实测导致生产构建白屏），
// 此处统一解包，兼容 default 为类、包装对象或原始类三种形态
const SecureLS: typeof SecureLSImport = (() => {
  const mod = SecureLSImport as any;
  if (typeof mod === 'function') return mod;
  return mod?.exports?.default ?? mod?.default ?? mod;
})();

let pinia: Pinia;

type SecureLSStorage = {
  get(key: string): any;
  set(key: string, value: unknown): void;
};

type SecureLSCtor = new (config?: {
  encodingType?: string;
  encryptionSecret?: string;
  isCompression?: boolean;
  metaKey?: string;
}) => SecureLSStorage;

/**
 * 解析 SecureLS 构造函数。
 *
 * secure-ls 是带 `__esModule` 的 TS 编译 CJS 包，不同打包器的 CJS 互操作语义
 * 对其默认导出的解包层级不同（rolldown/vite 8 不再穿透 exports.default），
 * 因此兼容三种形态取构造函数：解包后的 default / 命名导出 / 模块本身。
 * 写法对齐 vben 上游 main（packages/stores/src/setup.ts）。
 */
const secureLSModule = SecureLS as unknown as {
  default?: SecureLSCtor;
  SecureLS?: SecureLSCtor;
};

const SecureLSConstructor: SecureLSCtor =
  secureLSModule.default ??
  secureLSModule.SecureLS ??
  (SecureLS as unknown as SecureLSCtor);

interface BuildAppNamespaceOptions {
  appName: string;
  appVersion: string;
  env: 'dev' | 'prod';
  namespace?: string;
}

export function buildAppNamespace(options: BuildAppNamespaceOptions) {
  const { appName, appVersion, env, namespace } = options;
  const normalizedNamespace = namespace?.trim() || appName.trim();
  return `${normalizedNamespace}-${appVersion}-${env}`;
}

export function buildSharedAppNamespace(options: BuildAppNamespaceOptions) {
  const { appVersion, env, namespace } = options;
  const normalizedNamespace = namespace?.trim() || '';
  return `${normalizedNamespace}-${appVersion}-${env}`;
}

export function buildStorePersistKey(storeKey: string, options: BuildAppNamespaceOptions) {
  return `${buildAppNamespace(options)}-${storeKey}`;
}

export interface InitStoreOptions {
  /**
   * @zh_CN 应用名,由于 @vben/stores 是公用的，后续可能有多个app，为了防止多个app缓存冲突，可在这里配置应用名,应用名将被用于持久化的前缀
   */
  namespace: string;
}

/**
 * @zh_CN 初始化pinia
 */
export async function initStores(app: App, options: InitStoreOptions) {
  const { createPersistedState } = await import('pinia-plugin-persistedstate');
  pinia = createPinia();
  const { namespace } = options;
  const ls = new SecureLSConstructor({
    encodingType: 'aes',
    encryptionSecret: import.meta.env.VITE_APP_STORE_SECURE_KEY,
    isCompression: true,
    metaKey: `${namespace}-secure-meta`,
  });
  pinia.use(
    createPersistedState({
      // key $appName-$store.id
      key: (storeKey) => `${namespace}-${storeKey}`,
      storage: import.meta.env.DEV
        ? localStorage
        : {
            getItem(key) {
              return ls.get(key);
            },
            setItem(key, value) {
              ls.set(key, value);
            },
          },
    }),
  );
  app.use(pinia);
  return pinia;
}

export function resetAllStores() {
  const targetPinia = pinia ?? getActivePinia();
  if (!targetPinia) {
    console.error('Pinia is not installed');
    return;
  }

  const allStores = (targetPinia as any)?._s;
  if (!allStores || typeof allStores[Symbol.iterator] !== 'function') {
    console.warn('[resetAllStores] Pinia store registry is unavailable', targetPinia);
    return;
  }

  for (const [_key, store] of allStores) {
    store.$reset?.();
  }
}
