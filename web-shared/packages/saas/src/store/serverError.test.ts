import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useServerErrorStore } from './serverError';

describe('serverError store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('控制全局 500 覆盖层的显示与隐藏', () => {
    const store = useServerErrorStore();
    expect(store.visible).toBe(false);

    store.show();
    expect(store.visible).toBe(true);

    store.hide();
    expect(store.visible).toBe(false);
  });

  it('$reset 恢复为隐藏', () => {
    const store = useServerErrorStore();
    store.show();
    store.$reset();
    expect(store.visible).toBe(false);
  });
});
