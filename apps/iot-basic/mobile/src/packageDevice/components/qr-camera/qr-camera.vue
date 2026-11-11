<!-- H5 相机扫码：仅在浏览器支持相机和二维码识别时运行，退出即释放相机。 -->
<template>
  <view class="qr-mask">
    <view class="qr-sheet">
      <view class="qr-header"><text>扫一扫</text><text class="qr-close" @tap="emit('close')">关闭</text></view>
      <view id="device-qr-camera" class="qr-camera" />
      <text class="qr-hint">将设备二维码或分享二维码放入画面中</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
/** result 返回扫码原文，close 退出并释放相机；组件无 props 或插槽。 */
const emit = defineEmits<{ (event: 'result', value: string): void; (event: 'close'): void }>();
let stream: MediaStream | null = null; let timer: ReturnType<typeof setTimeout> | null = null; let active = true;
/** stop 释放所有相机轨道并取消后续识别。 */
function stop(): void { active = false; if (timer) clearTimeout(timer); timer = null; stream?.getTracks().forEach(track => track.stop()); stream = null; }
/** start 检查浏览器能力，识别到二维码后只返回一次；关闭期间迟到的相机请求也立即释放。 */
async function start(): Promise<void> {
  try {
    const Detector = (globalThis as any).BarcodeDetector;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('请使用 HTTPS 或小程序扫码');
    // 浏览器没有原生识别器时按需加载二维码解码器，避免影响首屏。
    const decode = Detector ? null : (await import('jsqr')).default;
    if (!active) return;
    const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
    const canvas = document.createElement('canvas'); const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!detector && !context) throw new Error('当前浏览器无法识别二维码');
    const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    if (!active) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired;
    const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.autoplay = true; video.srcObject = stream;
    const host = document.getElementById('device-qr-camera'); if (!host) throw new Error('无法打开扫码画面');
    host.appendChild(video); await video.play();
    const scan = async (): Promise<void> => {
      if (!active) return;
      try {
        let value = '';
        if (detector) { const codes = await detector.detect(video); value = String(codes?.[0]?.rawValue || ''); }
        else if (decode && context && video.videoWidth && video.videoHeight) {
          const scale = Math.min(1, 960 / video.videoWidth); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height); value = decode(frame.data, frame.width, frame.height)?.data || '';
        }
        if (active && value) { stop(); emit('result', value); return; }
      }
      catch { /* 单帧无法识别时继续扫描。 */ }
      if (active) timer = setTimeout(scan, 300);
    };
    void scan();
  } catch (error) { if (active) { const err = error as Error; const message = err.name === 'NotAllowedError' ? '相机权限被拒绝，请在浏览器设置中允许' : err.name === 'NotFoundError' ? '未找到可用相机' : err.message || '无法打开相机'; stop(); uni.showToast({ title: message, icon: 'none', duration: 3000 }); emit('close'); } }
}
onMounted(() => { void start(); });
onUnmounted(stop);
</script>
<style scoped>
.qr-mask { position: fixed; inset: 0; z-index: 1000; background: var(--color-mask); display: flex; align-items: center; justify-content: center; padding: 20px; }
.qr-sheet { width: 100%; max-width: 420px; box-sizing: border-box; padding: 20px; border-radius: var(--radius-lg); background: var(--card-bg); }
.qr-header { display: flex; justify-content: space-between; font-size: var(--font-label); font-weight: 600; }.qr-close { color: var(--color-primary); }
.qr-camera { width: 100%; aspect-ratio: 1; margin-top: 16px; background: var(--text-primary); overflow: hidden; border-radius: var(--radius-md); }
.qr-camera :deep(video) { width: 100%; height: 100%; object-fit: cover; }.qr-hint { display: block; margin-top: 12px; color: var(--text-secondary); font-size: var(--font-body); text-align: center; }
</style>
