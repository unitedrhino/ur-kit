import type { App } from 'vue';
import type { Pinia } from 'pinia';
import { createPinia, getActivePinia } from 'pinia';

export function resolvePinia(hostPinia?: Pinia) {
  // 优先复用宿主应用的 Pinia，避免 GoView 子应用读到一套独立 store。
  return hostPinia || getActivePinia() || createPinia();
}

export function setupStore(app: App<Element>, hostPinia?: Pinia) {
  app.use(resolvePinia(hostPinia));
}
