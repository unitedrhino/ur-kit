export const BIGSCREEN_COVER_UPDATED_EVENT = 'bigscreen:cover-updated';
export const BIGSCREEN_COVER_UPDATED_STORAGE_KEY = 'bigscreen:cover-updated';

export interface ProjectCoverUpdatedDetail {
  filePath?: string;
  projectId: string;
  updatedAt: number;
}

export function emitProjectCoverUpdated(detail: ProjectCoverUpdatedDetail) {
  window.dispatchEvent(
    new CustomEvent<ProjectCoverUpdatedDetail>(BIGSCREEN_COVER_UPDATED_EVENT, {
      detail,
    }),
  );

  try {
    localStorage.setItem(BIGSCREEN_COVER_UPDATED_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // Ignore storage write failures and keep the in-page event path available.
  }
}

export function isProjectCoverUpdatedStorageKey(storageKey?: null | string) {
  return storageKey === BIGSCREEN_COVER_UPDATED_STORAGE_KEY;
}

export function parseProjectCoverUpdatedDetail(raw: null | string): null | ProjectCoverUpdatedDetail {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ProjectCoverUpdatedDetail>;
    if (!parsed?.projectId) return null;
    return {
      filePath: parsed.filePath ? String(parsed.filePath) : undefined,
      projectId: String(parsed.projectId),
      updatedAt: Number(parsed.updatedAt || Date.now()),
    };
  } catch {
    return null;
  }
}
