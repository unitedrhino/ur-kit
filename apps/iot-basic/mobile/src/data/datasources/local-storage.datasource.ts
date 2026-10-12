const STORAGE_PREFIX = 'iot_';

interface StorageItem<T> {
  data: T;
  expireAt: number;  // 0 = 永不过期
}

export class LocalStorageDataSource {
  private key(name: string): string {
    return STORAGE_PREFIX + name;
  }

  get<T>(name: string): T | null {
    try {
      const raw = uni.getStorageSync(this.key(name));
      if (!raw) return null;
      const item = JSON.parse(raw) as StorageItem<T>;
      if (item.expireAt > 0 && Date.now() > item.expireAt) {
        this.remove(name);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  }

  set<T>(name: string, data: T, ttlMs = 0): void {
    const item: StorageItem<T> = {
      data,
      expireAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
    };
    uni.setStorageSync(this.key(name), JSON.stringify(item));
  }

  remove(name: string): void {
    uni.removeStorageSync(this.key(name));
  }

  clear(): void {
    const info = uni.getStorageInfoSync();
    info.keys
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => uni.removeStorageSync(k));
  }
}

export const localStorage = new LocalStorageDataSource();
