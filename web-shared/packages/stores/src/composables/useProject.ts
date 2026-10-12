import { computed } from 'vue';
import { useProjectStore } from '../modules/project';
import type { CoreApi } from '@vben/api';

/**
 * 项目状态常量
 */
export const PROJECT_STATUS = {
  NORMAL: 1, // 正常
  DISABLED: 2, // 禁用
  EXPIRED: 3, // 过期
} as const;

/**
 * 项目状态标签映射
 */
export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.NORMAL]: '正常',
  [PROJECT_STATUS.DISABLED]: '禁用',
  [PROJECT_STATUS.EXPIRED]: '过期',
} as const;

/**
 * 项目相关的统一业务逻辑封装
 */
export function useProject() {
  const projectStore = useProjectStore();

  // 计算属性：项目列表
  const projects = computed(() => projectStore.projects);

  // 计算属性：加载状态
  const isLoading = computed(() => projectStore.loading);

  // 计算属性：错误信息
  const errorMessage = computed(() => projectStore.error);

  // 计算属性：项目数量
  const projectCount = computed(() => projects.value.length);

  // 计算属性：是否有项目
  const hasProjects = computed(() => projectCount.value > 0);

  /**
   * 初始化项目列表
   */
  const initProjects = async (params?: { page?: number; size?: number }) => {
    return await projectStore.getProjects(params);
  };

  /**
   * 刷新项目列表
   */
  const refreshProjects = async () => {
    return await projectStore.getProjects();
  };

  /**
   * 根据 ID 获取项目
   */
  const findProjectById = (id: string) => {
    return projects.value.find((project) => project.projectID === id);
  };

  /**
   * 根据名称搜索项目
   */
  const searchProjects = (keyword: string) => {
    return projects.value.filter((project) => project.projectName?.toLowerCase().includes(keyword.toLowerCase()));
  };

  /**
   * 创建项目
   */
  const createProject = async (projectData: Partial<CoreApi.ProjectInfo>) => {
    const result = await projectStore.createProject(projectData);
    // 创建成功后刷新列表
    await refreshProjects();
    return result;
  };

  /**
   * 更新项目
   */
  const updateProject = async (projectData: CoreApi.ProjectInfo) => {
    return await projectStore.updateProject(projectData);
  };

  /**
   * 删除项目
   */
  const deleteProject = async (projectID: string) => {
    return await projectStore.deleteProject(projectID);
  };

  /**
   * 获取项目选项（用于下拉框等）
   */
  const getProjectOptions = () => {
    return projects.value.map((project) => ({
      label: project.projectName || '未命名项目',
      value: project.projectID || '',
      data: project,
    }));
  };

  /**
   * 根据状态筛选项目
   */
  const getProjectsByStatus = (status?: number) => {
    if (!status) return projects.value;
    return projects.value.filter((project) => project.status === status);
  };

  /**
   * 获取活跃项目（状态为正常）
   */
  const getActiveProjects = () => {
    return projects.value.filter((project) => project.status === PROJECT_STATUS.NORMAL);
  };

  /**
   * 获取禁用的项目
   */
  const getDisabledProjects = () => {
    return projects.value.filter((project) => project.status === PROJECT_STATUS.DISABLED);
  };

  /**
   * 获取过期的项目
   */
  const getExpiredProjects = () => {
    return projects.value.filter((project) => project.status === PROJECT_STATUS.EXPIRED);
  };

  /**
   * 根据项目名称精确匹配查找项目
   */
  const findProjectByName = (name: string) => {
    return projects.value.find((project) => project.projectName === name);
  };

  /**
   * 获取项目选项（根据状态筛选）
   */
  const getProjectOptionsByStatus = (status?: number) => {
    const filteredProjects = status ? projects.value.filter((project) => project.status === status) : projects.value;

    return filteredProjects.map((project) => ({
      label: project.projectName || '未命名项目',
      value: project.projectID || '',
      data: project,
    }));
  };

  /**
   * 检查项目名称是否已存在
   */
  const isProjectNameExists = (name: string, excludeId?: string) => {
    return projects.value.some((project) => project.projectName === name && (excludeId ? project.projectID !== excludeId : true));
  };

  /**
   * 获取项目状态标签
   */
  const getProjectStatusLabel = (status?: number) => {
    if (!status) return '未知';
    return PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] || '未知';
  };

  /**
   * 获取项目状态选项（用于下拉框）
   */
  const getProjectStatusOptions = () => {
    return Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
      label,
      value: Number(value),
    }));
  };

  /**
   * 清除错误信息
   */
  const clearError = () => {
    projectStore.error = null;
  };

  return {
    // 响应式数据
    projects,
    isLoading,
    errorMessage,
    projectCount,
    hasProjects,

    // 查询方法
    initProjects,
    refreshProjects,
    findProjectById,
    findProjectByName,
    searchProjects,
    getProjectOptions,
    getProjectOptionsByStatus,
    getProjectsByStatus,
    getActiveProjects,
    getDisabledProjects,
    getExpiredProjects,
    isProjectNameExists,

    // CRUD 方法
    createProject,
    updateProject,
    deleteProject,

    // 工具方法
    getProjectStatusLabel,
    getProjectStatusOptions,
    clearError,
  };
}
