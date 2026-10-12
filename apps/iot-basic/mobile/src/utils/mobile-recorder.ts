/**
 * 移动端录音管理器
 * 封装 uni.getRecorderManager()
 */

/** 录音回调 */
export interface MobileRecorderCallbacks {
  onStart?: () => void;
  onStop?: (tempFilePath: string) => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (duration: number) => void;
}

/**
 * 移动端录音管理器
 */
export class MobileRecorderManager {
  private recorderManager: UniApp.RecorderManager | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  /** 录音时长（秒） */
  private _duration = 0;
  get duration(): number {
    return this._duration;
  }

  /** 录音状态 */
  private _state: 'inactive' | 'recording' = 'inactive';
  get state(): string {
    return this._state;
  }

  /** 回调 */
  private callbacks: MobileRecorderCallbacks = {};

  /** 录音配置 */
  private readonly recordOptions: UniApp.RecorderManagerStartOptions = {
    format: 'wav',
    sampleRate: 16000,
    numberOfChannels: 1,
    encodeBitRate: 96000,
  };

  /**
   * 初始化
   */
  init(): void {
    if (this.recorderManager) return;

    this.recorderManager = uni.getRecorderManager();

    this.recorderManager.onStart(() => {
      this._state = 'recording';
      this._duration = 0;
      this.startTime = Date.now();
      this.startTimer();
      this.callbacks.onStart?.();
    });

    this.recorderManager.onStop((res) => {
      this._state = 'inactive';
      this.stopTimer();
      this.callbacks.onStop?.(res.tempFilePath);
    });

    this.recorderManager.onError((res) => {
      this._state = 'inactive';
      this.stopTimer();
      this.callbacks.onError?.(res.errMsg || '录音失败');
    });
  }

  /**
   * 注册回调
   */
  on(callbacks: MobileRecorderCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 开始录音
   */
  start(): void {
    if (!this.recorderManager) {
      this.init();
    }
    this.recorderManager?.start(this.recordOptions);
  }

  /**
   * 停止录音
   */
  stop(): void {
    this.recorderManager?.stop();
  }

  /**
   * 启动计时器
   */
  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      this._duration = Math.floor((Date.now() - this.startTime) / 1000);
      this.callbacks.onTimeUpdate?.(this._duration);
    }, 100);
  }

  /**
   * 停止计时器
   */
  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 读取文件并转 Base64
   */
  async readFileAsBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      const fs = uni.getFileSystemManager();
      fs.readFile({
        filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data as string);
        },
        fail: (err) => {
          reject(new Error(err.errMsg));
        },
      });
      // #endif

      // #ifndef MP-WEIXIN
      // H5/App 环境下使用 XMLHttpRequest 读取
      const xhr = new XMLHttpRequest();
      xhr.open('GET', filePath, true);
      xhr.responseType = 'blob';
      xhr.onload = () => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.send();
      // #endif
    });
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.stopTimer();
    this.callbacks = {};
  }
}

/**
 * 创建 MobileRecorderManager 实例
 */
export function createMobileRecorder(): MobileRecorderManager {
  return new MobileRecorderManager();
}
