export interface ProjectSyncEventDetail {
  projectID?: string;
  type: 'created' | 'deleted' | 'updated';
  updatedAt: number;
}

const PROJECT_SYNC_BROADCAST_CHANNEL = 'ithings-project-sync';
const PROJECT_SYNC_STORAGE_KEY = 'ithings-project-sync-event';

function parseProjectSyncEvent(raw: unknown): null | ProjectSyncEventDetail {
  if (!raw || typeof raw !== 'object') return null;
  const detail = raw as Partial<ProjectSyncEventDetail>;
  if (!detail.type) return null;
  return {
    projectID: detail.projectID ? String(detail.projectID) : undefined,
    type: detail.type,
    updatedAt: Number(detail.updatedAt || Date.now()),
  };
}

export function emitProjectSyncEvent(detail: Omit<ProjectSyncEventDetail, 'updatedAt'>) {
  if (typeof window === 'undefined') return;

  const payload: ProjectSyncEventDetail = {
    ...detail,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(PROJECT_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore localStorage write failures
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(PROJECT_SYNC_BROADCAST_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  }
}

export function subscribeProjectSyncEvent(
  callback: (detail: ProjectSyncEventDetail) => void,
) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== PROJECT_SYNC_STORAGE_KEY) return;
    try {
      const detail = event.newValue ? parseProjectSyncEvent(JSON.parse(event.newValue)) : null;
      if (detail) {
        callback(detail);
      }
    } catch {
      // ignore malformed storage payloads
    }
  };

  window.addEventListener('storage', handleStorage);

  let channel: BroadcastChannel | null = null;
  let handleMessage: ((event: MessageEvent<ProjectSyncEventDetail>) => void) | null = null;

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(PROJECT_SYNC_BROADCAST_CHANNEL);
    handleMessage = (event: MessageEvent<ProjectSyncEventDetail>) => {
      const detail = parseProjectSyncEvent(event.data);
      if (detail) {
        callback(detail);
      }
    };
    channel.addEventListener('message', handleMessage);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel && handleMessage) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
  };
}
