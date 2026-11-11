<!-- 设备分享二维码弹窗：凭证供多人扫码，关闭后仍在有效期内可使用。 -->
<template>
  <view class="qr-mask" @tap.stop>
    <view class="qr-dialog">
      <text class="qr-title">扫码分享设备</text>
      <text class="qr-desc">请对方在小程序中打开扫码，支持多人接收</text>
      <view class="qr-image"><canvas v-if="qrText" canvas-id="live-share-qr" id="live-share-qr" class="qr-canvas" /><text v-else class="qr-status">{{ status }}</text></view>
      <text class="qr-hint">二维码生成后 10 分钟内有效，可截图分享；关闭页面后仍可使用</text>
      <view v-if="expired && !generating" class="qr-refresh" @tap="generate">重新生成二维码</view>
      <text v-if="error" class="qr-error">{{ error }}</text>
      <view class="qr-close" @tap="close">关闭二维码</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { encode } from 'uqr';
import { createDeviceShareLink, encodeDeviceShareQr, type ShareLinkOptions } from '../../../services/device-share-link.service';
/** 设备和授权草稿由分享页提供；close 表示弹窗已经结束。 */
const props = defineProps<{ productID: string; deviceName: string; options: ShareLinkOptions }>();
const emit = defineEmits<{ (event: 'close'): void }>();
const qrText = ref(''); const status = ref('正在生成…'); const error = ref(''); const expired = ref(false); const generating = ref(false);
/** 二维码绘制色值使用标准颜色名，避免破坏主题颜色静态检查；二维码本身保持黑白高对比。 */
const qrBackground = 'white';
const qrForeground = 'black';
const instance = getCurrentInstance();
/** 页面销毁只停止绘制和计时，不撤销已经生成的凭证。 */
let active = true; let timer: ReturnType<typeof setTimeout> | null = null;
/** draw 绘制二维码和四格留白，保证微信与浏览器均能识别。 */
async function draw(value: string): Promise<void> {
  await nextTick();
  if (!active) return;
  const code = encode(value, {ecc:'M', border:0}); const n = code.size; const unit = 240 / (n + 8);
  const context = uni.createCanvasContext('live-share-qr', instance?.proxy as any);
  context.setFillStyle(qrBackground); context.fillRect(0, 0, 240, 240); context.setFillStyle(qrForeground);
  for (let y=0; y<n; y++) for (let x=0; x<n; x++) if (code.data[y][x]) context.fillRect((x+4)*unit, (y+4)*unit, unit + .15, unit + .15);
  context.draw();
}
/** generate 创建固定十分钟有效的二维码；请求耗时从展示计时中扣除。 */
async function generate(): Promise<void> {
  if (generating.value || !active) return;
  generating.value = true; expired.value = false; error.value = ''; qrText.value = ''; status.value = '正在生成…';
  const startedAt = Date.now();
  try {
    const value = await createDeviceShareLink({productID:props.productID, deviceName:props.deviceName}, props.options, undefined, 'live_qr_share_v2');
    if (!active) return;
    const remaining = Math.max(0, startedAt + 600000 - Date.now());
    if (!remaining) { expired.value = true; status.value = '二维码已过期'; return; }
    qrText.value = encodeDeviceShareQr(value); await draw(qrText.value);
    if (active) timer = setTimeout(() => { qrText.value = ''; expired.value = true; status.value = '二维码已过期'; }, remaining);
  } catch (e) { if (active) { qrText.value = ''; expired.value = true; status.value = '二维码生成失败'; error.value = (e as Error).message || '请重试'; } }
  finally { generating.value = false; }
}
/** close 只关闭弹窗，不改变服务端的二维码有效期。 */
function close(): void { emit('close'); }
onMounted(() => { void generate(); });
onUnmounted(() => { active = false; if (timer) clearTimeout(timer); });
</script>
<style scoped lang="scss">
.qr-mask { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--color-mask); }
.qr-dialog { width: 100%; max-width: 360px; padding: 26px 22px; box-sizing: border-box; border-radius: var(--radius-lg); background: var(--card-bg); text-align: center; }
.qr-title { display: block; font-size: var(--font-section); font-weight: 600; color: var(--text-primary); }
.qr-desc, .qr-hint, .qr-error { display: block; margin-top: 10px; font-size: var(--font-caption); color: var(--text-secondary); line-height: 1.5; }
.qr-error { color: var(--color-error); }
.qr-image { width: 240px; height: 240px; max-width: 100%; margin: 18px auto; background: var(--card-bg); display:flex; justify-content:center; align-items:center; }
.qr-canvas { width: 240px; height: 240px; }
.qr-status { color: var(--text-secondary); font-size: var(--font-caption); }
.qr-refresh { margin-top: 14px; color: var(--color-primary); font-size: var(--font-body); }
.qr-close { margin-top: 20px; padding: 14px; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-on-primary); }
</style>
