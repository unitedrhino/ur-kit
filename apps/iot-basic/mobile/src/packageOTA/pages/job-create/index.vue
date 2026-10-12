<template>
<app-navigation-bar title="新建升级任务" />

<scroll-view class="create-page" scroll-y type="list">
  <view class="form">
    <!-- 任务名称 -->
    <view class="form-item">
      <text class="form-item__label">任务名称</text>
      <input class="form-item__input" placeholder="请输入任务名称" :value="jobName" @blur="handleJobNameBlur" />
    </view>

    <!-- 升级类型 -->
    <view class="form-item">
      <text class="form-item__label">升级类型</text>
      <radio-group @change="onUpgradeTypeChange">
        <label class="radio-label"><radio value="0" :checked="upgradeType === 0" />通知升级</label>
        <label class="radio-label"><radio value="1" :checked="upgradeType === 1" />静默升级</label>
      </radio-group>
    </view>

    <!-- 重试次数 -->
    <view class="form-item">
      <text class="form-item__label">重试次数</text>
      <input class="form-item__input" type="number" :value="retryCount" @blur="handleRetryCountBlur" />
    </view>

    <!-- 重试间隔 -->
    <view class="form-item">
      <text class="form-item__label">重试间隔（分钟）</text>
      <input class="form-item__input" type="number" :value="retryInterval" @blur="handleRetryIntervalBlur" />
    </view>

    <button class="submit-btn" @tap="handleSubmit" :disabled="submitting">
      {{submitting ? '提交中...' : '创建任务'}}
    </button>
  </view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { otaProvider } from '../../../providers/ota.provider';
import { ensurePageReady } from '../../../utils/page-guard';

const firmwareID = ref('');
const jobName = ref('');
const upgradeType = ref(0);
const retryCount = ref(1);
const retryInterval = ref(10);
const submitting = ref(false);

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const opts = (options || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageOTA/pages/job-create/index', opts);
  if (!ready) return;
  if (opts.firmwareID) firmwareID.value = opts.firmwareID;
});

function onUpgradeTypeChange(e: any) {
  upgradeType.value = Number(e.detail.value);
}

/** 输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于创建按钮 tap，提交处拿到最新值 */
function handleJobNameBlur(e: any) { jobName.value = e.detail.value }
function handleRetryCountBlur(e: any) { retryCount.value = e.detail.value }
function handleRetryIntervalBlur(e: any) { retryInterval.value = e.detail.value }

/** 数字输入框在 v-model 下得到的是字符串，这里统一转回数字并兜底默认值 */
watch(retryCount, (next) => {
  const num = Number(next) || 1;
  if (num !== next) retryCount.value = num;
});

watch(retryInterval, (next) => {
  const num = Number(next) || 10;
  if (num !== next) retryInterval.value = num;
});

async function handleSubmit() {
  if (!jobName.value.trim()) {
    uni.showToast({ title: '请输入任务名称', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    await otaProvider.createJob({
      firmwareID: firmwareID.value,
      jobName: jobName.value.trim(),
      upgradeType: upgradeType.value,
      retryCount: retryCount.value,
      retryInterval: retryInterval.value,
    });
    uni.showToast({ title: '创建成功' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 1500);
  } catch {
    uni.showToast({ title: '创建失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.create-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.form { padding: 16px; }
.form-item { background: var(--card-bg); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
.form-item__label { font-size: 14px; color: var(--text-secondary); display: block; margin-bottom: 8px; }
.form-item__input { font-size: 15px; color: var(--text-primary); width: 100%; }
.radio-label { font-size: 14px; color: var(--text-primary); margin-right: 24px; }
.submit-btn { margin-top: 24px; background: var(--color-primary); color: var(--card-bg); border-radius: 24px; font-size: 16px; font-weight: 500; height: 44px; line-height: 44px; }
.submit-btn[disabled] { opacity: 0.5; }

</style>
