import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { setupStore } from '../index';

describe('goview setupStore', () => {
  it('uses the host pinia instance when one is provided', () => {
    const hostPinia = createPinia();
    const app = {
      use: vi.fn(),
    };

    (setupStore as any)(app, hostPinia);

    expect(app.use).toHaveBeenCalledWith(hostPinia);
  });
});
