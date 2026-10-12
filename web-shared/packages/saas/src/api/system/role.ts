import type { Recordable } from '@vben/types';

import { CoreApi } from '@vben/api';

export namespace SystemRoleApi {
  export interface SystemRole {
    [key: string]: any;
    id: string;
    name: string;
    permissions: string[];
    remark?: string;
    status: 0 | 1;
  }
}

/** 解析当前租户下用于角色菜单授权的默认应用 ID（优先名称含 core 的绑定） */
async function resolveDefaultAdminAppId(): Promise<string> {
  const res = await CoreApi.postApiV1SystemTenantAppGetList({ useBy: 'admin', withApp: true });
  const list = res.list ?? [];
  const preferred = list.find((t) => (t.app?.name || '').toLowerCase().includes('core'));
  return preferred?.appID ?? list[0]?.appID ?? '1';
}

/**
 * 获取角色列表数据
 */
async function getRoleList(params: Recordable<any>) {
  const res = await CoreApi.postApiV1SystemRoleInfoGetList({
    ...params,
  });

  return res;
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: Omit<SystemRoleApi.SystemRole, 'id'>) {
  const res = await CoreApi.postApiV1SystemRoleInfoCreate({
    code: data.code,
    name: data.name,
    desc: data.desc,
    status: data.status,
  });

  console.log('res ======== 创建角色 ============= ', res);

  if (data.permissions?.length) {
    const appID = await resolveDefaultAdminAppId();

    const res_app = await CoreApi.postApiV1SystemRoleAppBatchUpdate({
      id: res.id!,
      appIDs: [appID],
    });
    console.log('res_app ======== 更新APP权限 ============= ', res_app);

    const res_menu = await CoreApi.postApiV1SystemRoleMenuBatchUpdate({
      id: res.id!,
      appID,
      menuIDs: data.permissions.map(String),
    });

    console.log('res_menu ======== 更新角色对应菜单列表 ============= ', res_menu);
  }

  return res;
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(id: string, data: Omit<SystemRoleApi.SystemRole, 'id'>) {
  if (data.permissions?.length) {
    const appID = await resolveDefaultAdminAppId();
    const res = await CoreApi.postApiV1SystemRoleMenuBatchUpdate({
      id,
      appID,
      menuIDs: data.permissions.map(String),
    });

    console.log('res ======== 更新角色对应菜单列表 ============= ', res);
  }

  const res = await CoreApi.postApiV1SystemRoleInfoUpdate({
    id,
    ...data,
  });
  return res;
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  const res = await CoreApi.postApiV1SystemRoleInfoDelete({
    id,
  });
  console.log('res ======== 删除角色 ============= ', res);
  return res;
}

export { createRole, deleteRole, getRoleList, updateRole };
