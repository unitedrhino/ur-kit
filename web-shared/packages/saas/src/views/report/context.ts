/**
 * 报表上下文参数组装（企业/项目/区域名称）：渲染与导出共用。
 * 企业名称：当前租户（system/tenant/info/get-one）；项目名称：projectStore；
 * 区域名称：当前项目下首个区域（things/area/info/get-list）。
 * store 由调用方在组件 setup 中获取后传入（保证 pinia 上下文有效）。
 */
import type { Store } from 'pinia';

import { AreaApi, TenantApi } from './api';

interface SessionLike {
  tenantCode: string;
  syncTenantFromCookie?: () => void;
}

interface ProjectLike {
  projects: any[];
  currentProjectID: string | null;
  currentProject: any;
  getProjects: () => Promise<any>;
  setCurrentProjectID: (id: string) => void;
}

// 确保项目列表已加载且 currentProjectID 有效（持久化残留时自动切到第一个项目）
export async function ensureProject(projectStore: ProjectLike): Promise<void> {
  try {
    await projectStore.getProjects();
  } catch {
    // 项目列表加载失败不阻断
  }
  const valid = projectStore.projects.some(
    (p) => String(p.projectID) === String(projectStore.currentProjectID),
  );
  if (!valid) {
    projectStore.setCurrentProjectID(projectStore.projects[0]?.projectID || '');
  }
}

export async function buildContextParams(
  sessionStore: SessionLike,
  projectStore: ProjectLike,
  areaName?: string,
): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  try {
    // 直链进入页面时 sessionStore 可能尚未从 cookie 同步租户（首次同步发生在请求拦截器），此处先行同步
    sessionStore.syncTenantFromCookie?.();
    if (sessionStore.tenantCode) {
      const t = await TenantApi.getOne(sessionStore.tenantCode);
      if (t?.name) params.tenantName = t.name;
    }
  } catch {
    // 企业名称获取失败不阻断
  }
  try {
    // 项目 store 有 localStorage 持久化，换账号/租户后会残留旧数据；此处强制刷新并校验
    await ensureProject(projectStore);
    if (projectStore.currentProject?.projectName) {
      params.projectName = projectStore.currentProject.projectName;
    }
    // 设计器已选择区域时优先使用；否则回退取当前项目首个区域
    if (areaName) {
      params.areaName = areaName;
    } else if (!params.areaName && projectStore.currentProjectID) {
      const resp = await AreaApi.list({
        page: { page: 1, size: 1 },
        projectID: projectStore.currentProjectID,
      });
      const areaName = resp.list?.[0]?.areaName ?? '';
      if (areaName) params.areaName = areaName;
    }
  } catch {
    // 项目/区域名称获取失败不阻断
  }
  return params;
}

export type { Store };
