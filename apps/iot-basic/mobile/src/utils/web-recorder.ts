/**
 * Web 端录音管理器
 * 封装 MediaRecorder API，提供统一的录音接口
 */

import { convertBlobToWavBase64 } from './audio-format-converter';

/** 录音状态 */
export type RecorderState = 'inactive' | 'recording' | 'paused';

/** 录音回调 */
export interface RecorderCallbacks {
  onStart?: () => void;
  onStop?: (wavBase64: string) => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (duration: number) => void;
}

/**
 * Web 端录音管理器
 */
export class WebRecorderManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  /** 录音状态 */
  private _state: RecorderState = 'inactive';
  get state(): RecorderState {
    return this._state;
  }

  /** 录音时长（秒） */
  private _duration = 0;
  get duration(): number {
    return this._duration;
  }

  /** 回调 */
  private callbacks: RecorderCallbacks = {};

  /**
   * 注册回调
   */
  on(callbacks: RecorderCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 开始录音
   */
  async start(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      // 数据可用回调
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 录音停止回调
      this.mediaRecorder.onstop = async () => {
        try {
          this.stopTimer();

          // 合并为 WebM
          const webmBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

          // 转为 WAV Base64
          const base64 = await convertBlobToWavBase64(webmBlob);

          // 回调
          this.callbacks.onStop?.(base64);
        } catch (err) {
          this.callbacks.onError?.(`音频转换失败: ${err}`);
        } finally {
          this.releaseStream();
        }
      };

      // 错误回调
      this.mediaRecorder.onerror = (event) => {
        this.callbacks.onError?.(`录音错误: ${event.error?.message || '未知错误'}`);
        this.releaseStream();
      };

      // 开始录音，每 100ms 收集一次数据
      this.mediaRecorder.start(100);
      this._state = 'recording';
      this._duration = 0;
      this.startTime = Date.now();
      this.startTimer();
      this.callbacks.onStart?.();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.callbacks.onError?.('麦克风权限被拒绝，请在浏览器设置中开启');
      } else {
        this.callbacks.onError?.(`无法访问麦克风: ${err}`);
      }
    }
  }

  /**
   * 停止录音
   */
  stop(): void {
    if (this.mediaRecorder && this._state === 'recording') {
      this.mediaRecorder.stop();
      this._state = 'inactive';
    }
  }

  /**
   * 暂停录音
   */
  pause(): void {
    if (this.mediaRecorder && this._state === 'recording') {
      this.mediaRecorder.pause();
      this._state = 'paused';
      this.stopTimer();
    }
  }

  /**
   * 恢复录音
   */
  resume(): void {
    if (this.mediaRecorder && this._state === 'paused') {
      this.mediaRecorder.resume();
      this._state = 'recording';
      this.startTimer();
    }
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
   * 释放媒体流
   */
  private releaseStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop();
    this.stopTimer();
    this.releaseStream();
    this.callbacks = {};
  }
}

/**
 * 创建 WebRecorderManager 实例
 */
export function createWebRecorder(): WebRecorderManager {
  return new WebRecorderManager();
}
