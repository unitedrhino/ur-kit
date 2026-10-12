import { useSessionStore } from '../store/session';

export function syncSessionToken(token: string) {
  useSessionStore().setToken(token);
}
