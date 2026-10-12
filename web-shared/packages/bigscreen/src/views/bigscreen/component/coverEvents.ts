export const BIGSCREEN_COMPONENT_COVER_UPDATED_EVENT = 'bigscreen:component-cover-updated';
export const BIGSCREEN_COMPONENT_COVER_UPDATED_STORAGE_KEY = 'bigscreen:component-cover-updated';

export interface ComponentCoverUpdatedDetail {
  componentId: string;
  updatedAt: number;
}

export function emitComponentCoverUpdated(detail: ComponentCoverUpdatedDetail) {
  window.dispatchEvent(
    new CustomEvent<ComponentCoverUpdatedDetail>(BIGSCREEN_COMPONENT_COVER_UPDATED_EVENT, {
      detail,
    }),
  );

  try {
    localStorage.setItem(BIGSCREEN_COMPONENT_COVER_UPDATED_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // ignore
  }
}

export function isComponentCoverUpdatedStorageKey(storageKey?: null | string) {
  return storageKey === BIGSCREEN_COMPONENT_COVER_UPDATED_STORAGE_KEY;
}

export function parseComponentCoverUpdatedDetail(raw: null | string): ComponentCoverUpdatedDetail | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ComponentCoverUpdatedDetail>;
    if (!parsed?.componentId) return null;
    return {
      componentId: String(parsed.componentId),
      updatedAt: Number(parsed.updatedAt || Date.now()),
    };
  } catch {
    return null;
  }
}
