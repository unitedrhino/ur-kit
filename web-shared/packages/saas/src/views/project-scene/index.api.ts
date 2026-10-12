import { ThingsApi } from '@vben/api';

export function getProjectSceneRequestOptions(projectId?: null | string) {
  const normalizedProjectId = String(projectId ?? '').trim();
  if (!normalizedProjectId) return undefined;

  return {
    headers: {
      'project-id': normalizedProjectId,
    },
  };
}

export const ProjectSceneApi = {
  async list(page: number, pageSize: number, formValues: any, projectId: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoGetList(
      {
        page: { page, size: pageSize },
        ...formValues,
      },
      getProjectSceneRequestOptions(projectId),
    );
  },

  async logIndex(page: number, pageSize: number, formValues: any, projectId: string) {
    return await ThingsApi.postApiV1ThingsSceneLogGetList(
      {
        page: { page, size: pageSize },
        ...formValues,
      },
      getProjectSceneRequestOptions(projectId),
    );
  },

  async manuallyTrigger(id: string, projectId: string) {
    return await ThingsApi.postApiV1ThingsSceneInfoManuallyTrigger({ id }, getProjectSceneRequestOptions(projectId));
  },
};
