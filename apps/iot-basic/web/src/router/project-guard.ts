/**
 * org-iot-client 项目守卫辅助逻辑。
 *
 * 登录后进入业务页必须先等项目列表完成加载，再根据列表数量决定是否弹窗；
 * 该文件把“请求单飞”和“入口判断”拆成可测试的纯业务函数。
 */

import type { ThingsApi } from '@vben/api';

/** ProjectListLoadGate 保存项目列表加载的单飞状态。 */
export interface ProjectListLoadGate {
  /** 是否已完成至少一次成功加载。 */
  loaded: boolean;
  /** 当前正在进行的加载请求。 */
  pending: null | Promise<boolean>;
}

/** ProjectGuardStoreLike 是项目守卫依赖的最小 store 接口。 */
export interface ProjectGuardStoreLike {
  /** 当前选中的项目 ID。 */
  currentProjectID: null | string;
  /** 项目列表加载方法。 */
  getProjects: () => Promise<unknown>;
  /** 打开强制新建项目弹窗。 */
  openProjectCreateModal: (options?: { required?: boolean }) => void;
  /** 打开项目选择弹窗。 */
  openProjectSelectModal: () => void;
  /** 项目列表。 */
  projects: ThingsApi.ProjectInfo[];
  /** 自动选中项目。 */
  setCurrentProjectID: (projectID: string) => void;
  /** 关闭新建项目弹窗。 */
  closeProjectCreateModal?: () => void;
  /** 关闭项目选择弹窗。 */
  closeProjectSelectModal?: () => void;
}

/** createProjectListLoadGate 创建新的项目列表加载单飞状态。 */
export function createProjectListLoadGate(): ProjectListLoadGate {
  return {
    loaded: false,
    pending: null,
  };
}

/** ensureProjectListLoaded 阻塞等待项目列表完成加载，并复用并发导航中的同一个请求。 */
export async function ensureProjectListLoaded(projectStore: ProjectGuardStoreLike, gate: ProjectListLoadGate) {
  if (gate.loaded) return true;

  if (!gate.pending) {
    gate.pending = (async () => {
      try {
        await projectStore.getProjects();
        gate.loaded = true;
        return true;
      } catch (error) {
        console.warn('[org-iot-client] 获取项目列表失败', error);
        return false;
      } finally {
        gate.pending = null;
      }
    })();
  }

  return await gate.pending;
}

/** applyProjectEntryFlow 在项目列表确定后执行 0/1/多项目的入口选择逻辑。 */
export function applyProjectEntryFlow(projectStore: ProjectGuardStoreLike) {
  if (projectStore.currentProjectID && !projectStore.projects.some((p) => String(p.projectID) === String(projectStore.currentProjectID))) {
    console.warn('[project-guard] currentProjectID not found in project list, keep cookie value:', projectStore.currentProjectID);
  }

  const count = projectStore.projects.length;
  if (count === 0) {
    projectStore.closeProjectSelectModal?.();
    projectStore.openProjectCreateModal({ required: true });
    return;
  }

  projectStore.closeProjectCreateModal?.();
  if (count === 1) {
    projectStore.closeProjectSelectModal?.();
    if (!projectStore.currentProjectID) {
      const pid = String(projectStore.projects[0]?.projectID || '');
      projectStore.setCurrentProjectID(pid);
    }
    return;
  }

  if (!projectStore.currentProjectID) {
    projectStore.openProjectSelectModal();
  } else {
    projectStore.closeProjectSelectModal?.();
  }
}
