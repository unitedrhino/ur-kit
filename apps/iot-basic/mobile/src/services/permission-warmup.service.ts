import { BRAND_CONFIG } from '../config/brand';
import { localStorage } from '../data/datasources/local-storage.datasource';
import { ensureBluetoothReady } from '../utils/ble-readiness';
import { locationService } from './location.service';

interface StorageLike {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs?: number): void;
}

interface PermissionWarmupServiceOptions {
  ensureBluetoothReady?: typeof ensureBluetoothReady;
  storage?: StorageLike;
}

const ROOM_CREATE_LOCATION_KEY = 'permission_warmup_room_create_location_v1';

export class PermissionWarmupService {
  private readonly ensureBluetoothReadyImpl: typeof ensureBluetoothReady;
  private readonly storage: StorageLike;

  constructor(options: PermissionWarmupServiceOptions = {}) {
    this.ensureBluetoothReadyImpl = options.ensureBluetoothReady || ensureBluetoothReady;
    this.storage = options.storage || localStorage;
  }

  async tryWarmupAfterLogin(userID: string): Promise<void> {
    if (!userID) return;
    const storageKey = `permission_warmup_after_login_${userID}_v1`;
    if (this.storage.get<boolean>(storageKey)) {
      return;
    }

    try {
      const tasks: Array<Promise<unknown>> = [];
      if (BRAND_CONFIG.permissionWarmup.afterLogin.location) {
        tasks.push(this.tryGetLocation());
      }
      if (BRAND_CONFIG.permissionWarmup.afterLogin.bluetooth) {
        tasks.push(this.tryWarmupBluetooth());
      }
      await Promise.allSettled(tasks);
    } finally {
      this.storage.set(storageKey, true);
    }
  }

  async tryWarmupRoomCreate(): Promise<void> {
    if (!BRAND_CONFIG.permissionWarmup.roomCreate.location) {
      return;
    }
    if (this.storage.get<boolean>(ROOM_CREATE_LOCATION_KEY)) {
      return;
    }

    try {
      await this.tryGetLocation();
    } finally {
      this.storage.set(ROOM_CREATE_LOCATION_KEY, true);
    }
  }

  private async tryWarmupBluetooth(): Promise<void> {
    try {
      await this.ensureBluetoothReadyImpl();
    } catch {
      // 非阻塞预热：真实业务场景再做强提示
    }
  }

  private async tryGetLocation(): Promise<void> {
    await locationService.getCurrentLocation().catch(() => undefined);
  }
}

export const permissionWarmupService = new PermissionWarmupService();
