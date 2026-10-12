import type { CoreApi } from '@vben/api';

import { consumePendingInviteCode, parseInviteTenantCode, savePendingInviteCode } from './invite-link';

type InviteStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

type AcceptInviteDeps = {
  join: (payload: CoreApi.TenantUserJoinReq) => Promise<unknown>;
  refreshSelfAppList: () => Promise<unknown>;
  refreshUserInfo: () => Promise<unknown>;
  setTenant: (tenantCode: string) => void;
  storage?: InviteStorage;
};

export async function acceptPendingInviteAfterAuth(deps: AcceptInviteDeps) {
  const code = consumePendingInviteCode(deps.storage);
  if (!code) return { accepted: false, tenantCode: '' };

  const tenantCode = parseInviteTenantCode(code);

  try {
    await deps.join({ code, method: 'code' });
  } catch (error) {
    savePendingInviteCode(code, deps.storage);
    throw error;
  }

  if (tenantCode) {
    deps.setTenant(tenantCode);
  }

  await deps.refreshUserInfo();
  await deps.refreshSelfAppList();

  return { accepted: true, tenantCode };
}
