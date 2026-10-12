import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'packages/saas/src/widgets/user-dropdown/user-dropdown.vue'),
  'utf8',
);

describe('user dropdown organization settings link', () => {
  it('renders a settings icon link beside the organization heading', () => {
    expect(source).toContain('organizationSettingsPath');
    expect(source).toContain('lucide:settings');
    expect(source).toContain("getBackToConsoleUrl('/user/settings?tab=org')");
  });

  it('syncs the local tenant list when refreshed user info carries newly created enterprises', () => {
    expect(source).toContain('syncTenantsFromUserInfo');
    expect(source).toContain('() => userStore.userInfo?.tenants');
    expect(source).toContain('tenants.value = [...userTenants]');
  });
});
