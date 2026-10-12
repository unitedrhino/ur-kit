import type { App as VueApp } from 'vue';

export type GoviewMode = 'component' | 'edit' | 'preview';

export type MountedGoview = {
  app: VueApp;
  navigateTo: (id: string, mode?: GoviewMode) => Promise<void>;
  providerApp: VueApp;
  unmount: () => void;
};

export async function mountGoview(
  container: HTMLElement,
  id: string,
  mode: GoviewMode = 'edit',
  opts?: { published?: boolean },
): Promise<MountedGoview> {
  // 必须使用字面量路径，Vite 才能在构建时解析动态 import 并拆分 chunk
  const runtime = (await import('./mount.runtime')) as {
    mountGoview: (container: HTMLElement, id: string, mode?: GoviewMode, opts?: { published?: boolean }) => Promise<MountedGoview>;
  };
  return runtime.mountGoview(container, id, mode, opts);
}

export async function getGoviewInstance(container: HTMLElement) {
  const runtime = (await import('./mount.runtime')) as {
    getGoviewInstance: (container: HTMLElement) => MountedGoview | Promise<MountedGoview | undefined> | undefined;
  };
  return runtime.getGoviewInstance(container);
}
