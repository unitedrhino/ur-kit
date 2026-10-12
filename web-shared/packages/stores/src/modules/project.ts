import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { ThingsApi } from '@vben/api';

/**
 * 当前选中项目ID的 cookie key
 * 不直接从 @vben/saas 引入以避免 stores ↔ saas 循环依赖
 */
const PROJECT_ID_COOKIE_KEY = 'project-id';

function readProjectIDCookie(): null | string {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + PROJECT_ID_COOKIE_KEY + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

function writeProjectIDCookie(value: null | string) {
  if (typeof document === 'undefined') return;
  if (value) {
    // 1 年有效期，跨所有路径共享
    document.cookie = `${PROJECT_ID_COOKIE_KEY}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365}`;
  } else {
    document.cookie = `${PROJECT_ID_COOKIE_KEY}=;path=/;max-age=0`;
  }
}

export const useProjectStore = defineStore(
  'project',
  () => {
    const projects = ref<ThingsApi.ProjectInfo[]>([]);
    const loading = ref(false);
    const error = ref<null | string>(null);
    // currentProjectID 初始值从 cookie 读取，跨应用/跨刷新复用
    const currentProjectID = ref<null | string>(readProjectIDCookie());
    const currentProject = computed(() =>
      projects.value.find((p) => String(p.projectID) === String(currentProjectID.value)) ?? null,
    );
    // 项目选择模态框控制
    const showProjectSelectModal = ref(false);
    // 新建项目模态框控制（项目数量为 0 时引导创建）
    const showProjectCreateModal = ref(false);
    // 新建项目模态框是否为强制模式（不可关闭）
    const isCreateRequired = ref(false);
    const pendingRoute = ref<null | string>(null);
    // 侧边栏项目选择器是否启用（由各 app 主动调用 enableSidebarSelector 开启）
    const sidebarSelectorEnabled = ref(false);
    // 侧边栏项目选择器生效的路由前缀（为 null 时全局启用；为字符串时仅当当前路径匹配前缀才生效）
    const sidebarSelectorPathPrefix = ref<null | string>(null);

    // 项目上下文（project-id 请求头注入）的页面级生效范围。
    // scopeDefaultEnabled 为 true 时保持历史行为：所有页面都从 cookie 注入 project-id；
    // 业务 app 可调用 setProjectScopeDefault(false) 关闭全局注入，
    // 再通过 enableProjectScope 按路由前缀白名单启用，实现"只有开启项目选择的页面才带项目上下文"，
    // 避免设备列表等租户维度页面被 cookie 里的旧项目污染。
    const scopeDefaultEnabled = ref(true);
    const scopePathPrefixes = ref<string[]>([]);

    const projectOptions = computed(() => {
      return projects.value.map((project) => ({
        label: project.projectName,
        value: project.projectID,
      }));
    });

    const getProjects = async (params?: { page?: number; size?: number }) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsProjectInfoGetList({
          isGetAll: true,
          page: {
            page: params?.page || 1,
            size: params?.size || 1000,
          },
        });

        projects.value = res.list;
        return res;
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : '获取项目列表失败';
        throw error_;
      } finally {
        loading.value = false;
      }
    };

    // 创建项目
    const createProject = async (projectData: Partial<ThingsApi.ProjectInfoCreateReq>) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsProjectInfoCreate(projectData as ThingsApi.ProjectInfoCreateReq);
        return res;
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : '创建项目失败';
        throw error_;
      } finally {
        loading.value = false;
      }
    };

    // 更新项目
    const updateProject = async (projectData: ThingsApi.ProjectInfo) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsProjectInfoUpdate(projectData);

        // 更新本地数据
        const index = projects.value.findIndex((project) => project.projectID === projectData.projectID);
        if (index !== -1) {
          projects.value[index] = { ...projects.value[index], ...projectData };
        }

        return res;
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : '更新项目失败';
        throw error_;
      } finally {
        loading.value = false;
      }
    };

    // 删除项目
    const deleteProject = async (projectID: string) => {
      try {
        loading.value = true;
        error.value = null;

        const res = await ThingsApi.postApiV1ThingsProjectInfoDelete({ projectID });

        // 从本地数据中移除
        projects.value = projects.value.filter((project) => project.projectID !== projectID);

        return res;
      } catch (error_) {
        error.value = error_ instanceof Error ? error_.message : '删除项目失败';
        throw error_;
      } finally {
        loading.value = false;
      }
    };

    const setCurrentProjectID = (projectID: string) => {
      currentProjectID.value = projectID ? String(projectID) : projectID;
      writeProjectIDCookie(currentProjectID.value);
    };
    const getCurrentProjectID = () => {
      return currentProjectID.value;
    };
    const syncCurrentProjectIDFromCookie = () => {
      const cookieProjectID = readProjectIDCookie();
      if (cookieProjectID && cookieProjectID !== currentProjectID.value) {
        currentProjectID.value = cookieProjectID;
      }
      return currentProjectID.value;
    };
    const clearCurrentProjectID = () => {
      currentProjectID.value = null;
      writeProjectIDCookie(null);
    };
    const updateCurrentProjectID = (projectID: string) => {
      currentProjectID.value = projectID ? String(projectID) : projectID;
      writeProjectIDCookie(currentProjectID.value);
    };

    // 打开项目选择模态框
    const openProjectSelectModal = (targetRoute?: string) => {
      showProjectSelectModal.value = true;
      if (targetRoute) {
        pendingRoute.value = targetRoute;
      }
    };

    // 关闭项目选择模态框
    const closeProjectSelectModal = () => {
      showProjectSelectModal.value = false;
      pendingRoute.value = null;
    };

    // 打开新建项目模态框
    // required=true 表示强制模式（不可关闭，常用于项目数为 0 的强制创建场景）
    const openProjectCreateModal = (options?: { required?: boolean }) => {
      isCreateRequired.value = !!options?.required;
      showProjectCreateModal.value = true;
    };

    // 关闭新建项目模态框
    const closeProjectCreateModal = () => {
      showProjectCreateModal.value = false;
      isCreateRequired.value = false;
    };

    // 启用侧边栏项目选择器
    // options.pathPrefix 设置后仅当当前路由以该前缀开头时显示
    const enableSidebarSelector = (options?: { pathPrefix?: null | string }) => {
      sidebarSelectorEnabled.value = true;
      sidebarSelectorPathPrefix.value = options?.pathPrefix ?? null;
    };

    // 设置项目上下文是否默认全局启用（false 时仅 enableProjectScope 声明的路由前缀生效）
    const setProjectScopeDefault = (enabled: boolean) => {
      scopeDefaultEnabled.value = enabled;
    };

    // 按路由前缀启用项目上下文（可多次调用累加，重复前缀自动去重）
    const enableProjectScope = (pathPrefixes: string | string[]) => {
      const list = Array.isArray(pathPrefixes) ? pathPrefixes : [pathPrefixes];
      for (const prefix of list) {
        if (prefix && !scopePathPrefixes.value.includes(prefix)) {
          scopePathPrefixes.value.push(prefix);
        }
      }
    };

    // 判断指定路径是否启用项目上下文（请求拦截器据此决定是否注入 project-id）
    // 前缀匹配按路径分段对齐：/iot/alarm 命中 /iot/alarm 与 /iot/alarm/rule，但不命中 /iot/alarmx
    const isProjectScopeEnabled = (path: string) => {
      if (scopeDefaultEnabled.value) return true;
      if (!path) return false;
      return scopePathPrefixes.value.some((prefix) => {
        const normalized = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
        return path === normalized || path.startsWith(`${normalized}/`);
      });
    };

    // 实现 $reset 方法，用于重置 store 状态
    const $reset = () => {
      projects.value = [];
      loading.value = false;
      error.value = null;
      currentProjectID.value = null;
      writeProjectIDCookie(null);
      showProjectSelectModal.value = false;
      showProjectCreateModal.value = false;
      isCreateRequired.value = false;
      pendingRoute.value = null;
      scopeDefaultEnabled.value = true;
      scopePathPrefixes.value = [];
    };

    return {
      projects,
      projectOptions,
      currentProjectID,
      currentProject,
      loading,
      error,
      showProjectSelectModal,
      showProjectCreateModal,
      isCreateRequired,
      pendingRoute,
      sidebarSelectorEnabled,
      sidebarSelectorPathPrefix,
      scopeDefaultEnabled,
      scopePathPrefixes,
      getProjects,
      createProject,
      updateProject,
      deleteProject,
      setCurrentProjectID,
      getCurrentProjectID,
      syncCurrentProjectIDFromCookie,
      clearCurrentProjectID,
      updateCurrentProjectID,
      openProjectSelectModal,
      closeProjectSelectModal,
      openProjectCreateModal,
      closeProjectCreateModal,
      enableSidebarSelector,
      setProjectScopeDefault,
      enableProjectScope,
      isProjectScopeEnabled,
      $reset,
    };
  },
  {
    persist: {
      // currentProjectID 存 cookie（见 read/writeProjectIDCookie），此处只持久化项目列表缓存
      pick: ['projects'],
    },
  },
);
