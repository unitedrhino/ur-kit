import { getSystemInfo } from '../utils/platform';

export interface AppState {
  networkType: string;
  statusBarHeight: number;
  navBarHeight: number;
  safeAreaBottom: number;
}

class AppProvider {
  private state: AppState;
  private listeners: Set<(s: AppState) => void> = new Set();

  constructor() {
    const sys = getSystemInfo();
    this.state = {
      networkType: 'wifi',
      statusBarHeight: sys.statusBarHeight,
      navBarHeight: sys.navBarHeight,
      safeAreaBottom: sys.safeAreaBottom,
    };
  }

  getState(): AppState { return this.state; }

  subscribe(listener: (s: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  init(): void {
    // 监听网络状态
    uni.onNetworkStatusChange((res) => {
      this.state = { ...this.state, networkType: res.networkType };
      this.notify();
    });
    // 获取初始网络状态
    uni.getNetworkType({
      success: (res) => {
        this.state = { ...this.state, networkType: res.networkType };
        this.notify();
      },
    });
  }
}

export const appProvider = new AppProvider();
