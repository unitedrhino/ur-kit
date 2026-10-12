import { describe, expect, it } from 'vitest';

import { shouldSkipTenantCode } from '../request-tenant';

describe('shouldSkipTenantCode', () => {
  it('skips tenant-code for login requests', () => {
    expect(shouldSkipTenantCode('/api/v1/system/user/self/login')).toBe(true);
  });

  it('keeps tenant-code for tenant creation requests from an active tenant context', () => {
    expect(shouldSkipTenantCode('/api/v1/system/tenant/info/create')).toBe(false);
  });
});
