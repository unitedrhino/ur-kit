const SCREEN_PROJECT_BINDINGS_KEY = 'bigscreen-screen-project-bindings';
const UNASSIGNED_SCREENS_KEY = 'bigscreen-unassigned-screens';

export interface UnassignedScreenRecord {
  previousProjectID?: string;
  reason?: 'project_deleted';
  updatedAt?: number;
}

function saveScreenProjectBindings(bindings: Record<string, string>) {
  localStorage.setItem(SCREEN_PROJECT_BINDINGS_KEY, JSON.stringify(bindings));
}

function saveUnassignedScreenRecords(records: Record<string, UnassignedScreenRecord>) {
  localStorage.setItem(UNASSIGNED_SCREENS_KEY, JSON.stringify(records));
}

export function getScreenProjectBindings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SCREEN_PROJECT_BINDINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getUnassignedScreenRecords(): Record<string, UnassignedScreenRecord> {
  try {
    const raw = localStorage.getItem(UNASSIGNED_SCREENS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function removeUnassignedScreenRecord(screenId: string) {
  const next = getUnassignedScreenRecords();
  if (!(screenId in next)) return;
  const { [screenId]: _removed, ...rest } = next;
  saveUnassignedScreenRecords(rest);
}

export function setScreenProjectBinding(screenId: string, projectID: string) {
  const next = {
    ...getScreenProjectBindings(),
    [screenId]: projectID,
  };
  saveScreenProjectBindings(next);
  removeUnassignedScreenRecord(screenId);
}

export function removeScreenProjectBinding(screenId: string) {
  const next = getScreenProjectBindings();
  const { [screenId]: _removed, ...rest } = next;
  saveScreenProjectBindings(rest);
}

export function markScreenUnassigned(screenId: string, previousProjectID?: string) {
  const next = {
    ...getUnassignedScreenRecords(),
    [screenId]: {
      previousProjectID,
      reason: 'project_deleted' as const,
      updatedAt: Date.now(),
    },
  };
  saveUnassignedScreenRecords(next);
}

export function reconcileScreenProjectAssociations(validProjectIDs: string[]) {
  const validProjectIDSet = new Set(validProjectIDs.filter(Boolean));
  const bindings = getScreenProjectBindings();
  const nextBindings: Record<string, string> = {};
  const nextUnassigned = getUnassignedScreenRecords();
  const releasedScreenIds: string[] = [];
  const releasedProjectIDs = new Set<string>();

  let bindingsChanged = false;
  let unassignedChanged = false;

  for (const [screenId, projectID] of Object.entries(bindings)) {
    if (projectID && validProjectIDSet.has(projectID)) {
      nextBindings[screenId] = projectID;
      continue;
    }

    bindingsChanged = true;
    releasedScreenIds.push(screenId);
    if (projectID) {
      releasedProjectIDs.add(projectID);
    }

    nextUnassigned[screenId] = {
      previousProjectID: projectID,
      reason: 'project_deleted',
      updatedAt: Date.now(),
    };
    unassignedChanged = true;
  }

  if (bindingsChanged) {
    saveScreenProjectBindings(nextBindings);
  }
  if (unassignedChanged) {
    saveUnassignedScreenRecords(nextUnassigned);
  }

  return {
    releasedProjectIDs: Array.from(releasedProjectIDs),
    releasedScreenIds,
  };
}

export function pruneMissingScreenProjectAssociations(existingScreenIds: string[]) {
  const existingScreenIDSet = new Set(existingScreenIds.filter(Boolean));

  const bindings = getScreenProjectBindings();
  const nextBindings: Record<string, string> = {};
  let bindingsChanged = false;

  for (const [screenId, projectID] of Object.entries(bindings)) {
    if (existingScreenIDSet.has(screenId)) {
      nextBindings[screenId] = projectID;
    } else {
      bindingsChanged = true;
    }
  }

  const unassigned = getUnassignedScreenRecords();
  const nextUnassigned: Record<string, UnassignedScreenRecord> = {};
  let unassignedChanged = false;

  for (const [screenId, record] of Object.entries(unassigned)) {
    if (existingScreenIDSet.has(screenId)) {
      nextUnassigned[screenId] = record;
    } else {
      unassignedChanged = true;
    }
  }

  if (bindingsChanged) {
    saveScreenProjectBindings(nextBindings);
  }
  if (unassignedChanged) {
    saveUnassignedScreenRecords(nextUnassigned);
  }

  return {
    removedBoundScreenIds: Object.keys(bindings).filter((screenId) => !existingScreenIDSet.has(screenId)),
    removedUnassignedScreenIds: Object.keys(unassigned).filter((screenId) => !existingScreenIDSet.has(screenId)),
  };
}
