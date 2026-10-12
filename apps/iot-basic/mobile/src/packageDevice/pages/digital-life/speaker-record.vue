<template>
<app-navigation-bar title="声纹录制" />

<scroll-view class="sr-body" scroll-y>
  <!-- 录音区域 -->
  <view class="sr-record-area">
    <view
      :class="`sr-record-btn ${recording ? 'sr-record-btn--recording' : ''}`"
      @tap="handleRecordTap"
      hover-class="sr-record-btn--hover"
    >
      <text class="sr-record-btn__icon">{{ recording ? '⏹' : '🎤' }}</text>
      <text class="sr-record-btn__text">{{ recording ? '停止录音' : '点击开始录音' }}</text>
    </view>

    <!-- 录音时长 -->
    <view v-if="recording || recorded" class="sr-duration">
      <text class="sr-duration__label">录音时长</text>
      <text class="sr-duration__value">{{ formatDuration(duration) }} / 00:10</text>
    </view>

    <!-- 录音进度条 -->
    <view v-if="recording || recorded" class="sr-progress">
      <view class="sr-progress__bar">
        <view class="sr-progress__fill" :style="{ width: `${Math.min(duration / 10 * 100, 100)}%` }" />
      </view>
    </view>

    <!-- 提示文字 -->
    <view class="sr-tips">
      <text v-if="!recording && !recorded" class="sr-tips__text">请在安静环境下录制</text>
      <text v-if="!recording && !recorded" class="sr-tips__text">清晰朗读 3-10 秒语音</text>
      <text v-if="recording" class="sr-tips__text sr-tips__text--recording">正在录制中，请继续说话...</text>
      <text v-if="recorded && !recording" class="sr-tips__text sr-tips__text--success">录音完成，请输入说话人名称</text>
    </view>
  </view>

  <!-- 说话人名称输入 -->
  <view class="sr-form">
    <view class="sr-form__item">
      <text class="sr-form__label">说话人名称</text>
      <input
        v-model="speakerName"
        class="sr-form__input"
        placeholder="请输入说话人名称"
        :disabled="uploading"
      />
    </view>
  </view>

  <!-- 提交按钮 -->
  <view class="sr-actions">
    <view
      :class="`sr-submit-btn ${canSubmit ? '' : 'sr-submit-btn--disabled'}`"
      @tap="handleSubmit"
      hover-class="sr-submit-btn--hover"
    >
      <text v-if="uploading" class="sr-submit-btn__text">正在提取声纹...</text>
      <text v-else class="sr-submit-btn__text">完成录制</text>
    </view>
  </view>

  <!-- 重新录制 -->
  <view v-if="recorded && !uploading" class="sr-retry">
    <view class="sr-retry__btn" @tap="handleRetry" hover-class="sr-retry__btn--hover">
      <text class="sr-retry__text">重新录制</text>
    </view>
  </view>
</scroll-view>

<safe-area />
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createRecordingService, type RecordingService } from '../../../utils/recording-service';
import { digitalLifeProvider } from '../../../providers/digital-life.provider';

const speakerName = ref('');
const recording = ref(false);
const recorded = ref(false);
const uploading = ref(false);
const duration = ref(0);
const audioBase64 = ref('');
const VOICEPRINT_AUTH_STORAGE_KEY = 'voiceprint_authorization_agreed_v1';

let recordingService: RecordingService | null = null;

onLoad(() => {
  // 初始化录音服务
  recordingService = createRecordingService();

  // 注册回调
  recordingService.on({
    onStart: () => {
      recording.value = true;
      duration.value = 0;
    },
    onStop: (base64) => {
      recording.value = false;
      recorded.value = true;
      audioBase64.value = base64;
    },
    onError: (error) => {
      recording.value = false;
      uni.showToast({ title: error, icon: 'none' });
    },
    onTimeUpdate: (d) => {
      duration.value = d;

      // 录音达到 10 秒自动停止
      if (d >= 10) {
        recordingService?.stop();
      }
    },
  });
});

onUnmounted(() => {
  recordingService?.destroy();
  recordingService = null;
});

/**
 * 是否可以提交
 */
const canSubmit = computed(() => {
  return recorded.value && !uploading.value && speakerName.value.trim().length > 0;
});

/**
 * 处理录音按钮点击
 */
async function handleRecordTap(): Promise<void> {
  if (recording.value) {
    // 停止录音
    recordingService?.stop();
  } else {
    const authorized = await ensureVoiceprintAuthorized();
    if (!authorized) return;

    // 检查权限
    // #ifdef H5
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      uni.showToast({ title: '请开启麦克风权限', icon: 'none' });
      return;
    }
    // #endif

    // 开始录音
    await recordingService?.start();
  }
}

/** ensureVoiceprintAuthorized 在开始声纹录制前取得用户对声纹采集和使用的独立授权。 */
async function ensureVoiceprintAuthorized(): Promise<boolean> {
  if (uni.getStorageSync(VOICEPRINT_AUTH_STORAGE_KEY) === 'true') return true;
  const { confirm } = await uni.showModal({
    title: '声纹授权',
    content: '录制声纹会收集并上传你的语音片段，用于提取声纹特征、创建声纹记录和完成声纹识别匹配。你可在“我的-设置-声纹授权协议”查看完整说明。',
    confirmText: '同意录制',
    cancelText: '不同意',
  });
  if (!confirm) return false;
  uni.setStorageSync(VOICEPRINT_AUTH_STORAGE_KEY, 'true');
  return true;
}

/**
 * 处理提交
 */
async function handleSubmit(): Promise<void> {
  // 不可提交时给出明确提示，避免用户感觉点击无反应
  if (!canSubmit.value) {
    if (!recorded.value) {
      uni.showToast({ title: '请先完成录音', icon: 'none' });
    } else if (!speakerName.value.trim()) {
      uni.showToast({ title: '请输入说话人名称', icon: 'none' });
    }
    return;
  }

  // 校验
  if (!speakerName.value.trim()) {
    uni.showToast({ title: '请输入说话人名称', icon: 'none' });
    return;
  }

  if (!audioBase64.value) {
    uni.showToast({ title: '请先录制声纹', icon: 'none' });
    return;
  }

  if (duration.value < 3) {
    uni.showToast({ title: '录音时长至少 3 秒', icon: 'none' });
    return;
  }

  uploading.value = true;

  try {
    const success = await digitalLifeProvider.createSpeaker(
      speakerName.value.trim(),
      audioBase64.value,
    );

    if (success) {
      uni.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      // provider 内部捕获异常并返回 false，错误信息保存在 state.error 中
      const errorMsg = digitalLifeProvider.getState().error || '创建失败，请重试';
      uni.showToast({ title: errorMsg, icon: 'none' });
    }
  } catch (err) {
    uni.showToast({ title: `创建失败: ${err}`, icon: 'none' });
  } finally {
    uploading.value = false;
  }
}

/**
 * 重新录制
 */
function handleRetry(): void {
  recorded.value = false;
  audioBase64.value = '';
  duration.value = 0;
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<style lang="scss" scoped>
.sr-body {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

/* 录音区域 */
.sr-record-area {
  margin: 20px 16px;
  padding: 30px 20px;
  background: var(--card-bg);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sr-record-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.sr-record-btn--recording {
  background: var(--color-error-bg);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--color-error);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 15px transparent;
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 transparent;
  }
}

.sr-record-btn--hover {
  opacity: 0.85;
}

.sr-record-btn__icon {
  font-size: 36px;
  margin-bottom: 4px;
}

.sr-record-btn__text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 录音时长 */
.sr-duration {
  margin-top: 20px;
  text-align: center;
}

.sr-duration__label {
  font-size: 12px;
  color: var(--text-tertiary);
  display: block;
}

.sr-duration__value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
  display: block;
}

/* 进度条 */
.sr-progress {
  width: 100%;
  margin-top: 16px;
  padding: 0 10px;
}

.sr-progress__bar {
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.sr-progress__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s;
}

/* 提示文字 */
.sr-tips {
  margin-top: 16px;
  text-align: center;
}

.sr-tips__text {
  font-size: 13px;
  color: var(--text-tertiary);
  display: block;
  line-height: 1.6;
}

.sr-tips__text--recording {
  color: var(--color-danger);
}

.sr-tips__text--success {
  color: var(--color-success);
}

/* 表单 */
.sr-form {
  margin: 0 16px 16px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
}

.sr-form__item {
  display: flex;
  align-items: center;
}

.sr-form__label {
  font-size: 15px;
  color: var(--text-primary);
  width: 100px;
  flex-shrink: 0;
}

.sr-form__input {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
  padding: 8px 0;
}

/* 提交按钮 */
.sr-actions {
  margin: 0 16px 16px;
}

.sr-submit-btn {
  padding: 14px;
  background: var(--color-primary);
  border-radius: 12px;
  text-align: center;
}

.sr-submit-btn--disabled {
  opacity: 0.5;
}

.sr-submit-btn--hover {
  opacity: 0.85;
}

.sr-submit-btn__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-on-primary);
}

/* 重新录制 */
.sr-retry {
  margin: 0 16px 20px;
  text-align: center;
}

.sr-retry__btn {
  padding: 10px 20px;
}

.sr-retry__btn--hover {
  opacity: 0.7;
}

.sr-retry__text {
  font-size: 14px;
  color: var(--color-primary);
}
</style>
