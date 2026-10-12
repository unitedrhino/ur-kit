/**
 * 统一录音服务
 * 根据平台自动选择合适的录音实现
 */

import { WebRecorderManager, createWebRecorder } from './web-recorder';
import { MobileRecorderManager, createMobileRecorder } from './mobile-recorder';

/** 录音状态 */
export type RecordingState = 'inactive' | 'recording' | 'paused';

/** 录音回调 */
export interface RecordingCallbacks {
  onStart?: () => void;
  onStop?: (audioBase64: string) => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (duration: number) => void;
}

/**
 * 统一录音服务
 */
export class RecordingService {
  private webRecorder: WebRecorderManager | null = null;
  private mobileRecorder: MobileRecorderManager | null = null;
  private isWeb = false;
  private callbacks: RecordingCallbacks = {};

  constructor() {
    // #ifdef H5
    this.isWeb = true;
    // #endif

    // #ifndef H5
    this.isWeb = false;
    // #endif
  }

  /**
   * 注册回调
   */
  on(callbacks: RecordingCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };

    if (this.isWeb && this.webRecorder) {
      this.webRecorder.on({
        onStart: this.callbacks.onStart,
        onStop: this.callbacks.onStop,
        onError: this.callbacks.onError,
        onTimeUpdate: this.callbacks.onTimeUpdate,
      });
    } else if (!this.isWeb && this.mobileRecorder) {
      this.mobileRecorder.on({
        onStart: this.callbacks.onStart,
        onStop: async (filePath) => {
          try {
            const base64 = await this.mobileRecorder!.readFileAsBase64(filePath);
            this.callbacks.onStop?.(base64);
          } catch (err) {
            this.callbacks.onError?.(`读取音频文件失败: ${err}`);
          }
        },
        onError: this.callbacks.onError,
        onTimeUpdate: this.callbacks.onTimeUpdate,
      });
    }
  }

  /**
   * 初始化录音器
   */
  private initRecorder(): void {
    if (this.isWeb) {
      if (!this.webRecorder) {
        this.webRecorder = createWebRecorder();
      }
      this.webRecorder.on({
        onStart: this.callbacks.onStart,
        onStop: this.callbacks.onStop,
        onError: this.callbacks.onError,
        onTimeUpdate: this.callbacks.onTimeUpdate,
      });
    } else {
      if (!this.mobileRecorder) {
        this.mobileRecorder = createMobileRecorder();
        this.mobileRecorder.init();
      }
      this.mobileRecorder.on({
        onStart: this.callbacks.onStart,
        onStop: async (filePath) => {
          try {
            const base64 = await this.mobileRecorder!.readFileAsBase64(filePath);
            this.callbacks.onStop?.(base64);
          } catch (err) {
            this.callbacks.onError?.(`读取音频文件失败: ${err}`);
          }
        },
        onError: this.callbacks.onError,
        onTimeUpdate: this.callbacks.onTimeUpdate,
      });
    }
  }

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    this.initRecorder();

    if (this.isWeb) {
      await this.webRecorder!.start();
    } else {
      this.mobileRecorder!.start();
    }
  }

  /**
   * 停止录音
   */
  stop(): void {
    if (this.isWeb) {
      this.webRecorder?.stop();
    } else {
      this.mobileRecorder?.stop();
    }
  }

  /**
   * 暂停录音（仅 Web 端支持）
   */
  pause(): void {
    if (this.isWeb) {
      this.webRecorder?.pause();
    }
  }

  /**
   * 恢复录音（仅 Web 端支持）
   */
  resume(): void {
    if (this.isWeb) {
      this.webRecorder?.resume();
    }
  }

  /**
   * 获取录音状态
   */
  getState(): RecordingState {
    if (this.isWeb) {
      return this.webRecorder?.state || 'inactive';
    }
    return (this.mobileRecorder?.state as RecordingState) || 'inactive';
  }

  /**
   * 获取录音时长（秒）
   */
  getDuration(): number {
    if (this.isWeb) {
      return this.webRecorder?.duration || 0;
    }
    return this.mobileRecorder?.duration || 0;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.webRecorder?.destroy();
    this.mobileRecorder?.destroy();
    this.webRecorder = null;
    this.mobileRecorder = null;
    this.callbacks = {};
  }
}

/**
 * 创建 RecordingService 实例
 */
export function createRecordingService(): RecordingService {
  return new RecordingService();
}
