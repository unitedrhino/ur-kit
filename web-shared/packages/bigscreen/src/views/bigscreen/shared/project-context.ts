import { useProjectStore } from '@vben/stores';

import { reconcileScreenProjectAssociations } from '../screen/project-binding';

type ProjectStore = ReturnType<typeof useProjectStore>;

export interface BigscreenProjectContextSyncResult {
  currentProjectIDBeforeClear: null | string;
  currentProjectInvalid: boolean;
  releasedProjectIDs: string[];
  releasedScreenIds: string[];
  validProjectIDs: string[];
}

export async function syncBigscreenProjectContext(
  projectStore: ProjectStore,
): Promise<BigscreenProjectContextSyncResult> {
  await projectStore.getProjects();

  const validProjectIDs = projectStore.projects
    .map((project) => project.projectID)
    .filter((projectID): projectID is string => !!projectID);

  const {
    releasedProjectIDs,
    releasedScreenIds,
  } = reconcileScreenProjectAssociations(validProjectIDs);

  const currentProjectIDBeforeClear = projectStore.currentProjectID;
  const currentProjectInvalid =
    !!currentProjectIDBeforeClear &&
    !validProjectIDs.includes(currentProjectIDBeforeClear);

  if (currentProjectInvalid) {
    projectStore.clearCurrentProjectID();
  }

  return {
    currentProjectIDBeforeClear,
    currentProjectInvalid,
    releasedProjectIDs,
    releasedScreenIds,
    validProjectIDs,
  };
}
