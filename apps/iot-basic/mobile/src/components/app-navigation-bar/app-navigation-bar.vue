<!-- 文件说明：统一页面导航与可随时撤销的远程控制状态标识。 -->
<template>
  <view class="nav-bar">
    <view v-if="controlling" class="nav-bar__control" role="button" aria-label="远程控制中，点击取消" @tap.stop="stopControl">
      <text>◉ 远程控制中 · 取消</text>
    </view>
    <view
      class="nav-bar__inner"
      :style="`padding-top: ${statusBarHeight}px; height: ${navBarHeight}px; color: ${color}; background: ${background};`"
    >
      <view class="nav-bar__left" :style="`width: ${leftSlotWidth}px`">
        <template v-if="showBack">
          <view class="nav-bar__back" hover-class="nav-bar__back--active" @tap="handleBack">
            <view class="nav-bar__back-icon" />
          </view>
        </template>
        <template v-else-if="showBrand">
          <view class="nav-bar__brand">
            <image v-if="brandLogoPath" class="nav-bar__brand-logo" :src="brandLogoPath" mode="aspectFit" />
            <view v-else class="nav-bar__brand-logo nav-bar__brand-logo--fallback">
              <text class="nav-bar__brand-logo-text">{{ brandInitial }}</text>
            </view>
            <text class="nav-bar__brand-name">{{ brandName }}</text>
          </view>
        </template>
        <template v-else>
          <slot name="left" />
        </template>
      </view>

      <view class="nav-bar__center">
        <view v-if="loading" class="nav-bar__loading" />
        <template v-if="displayTitle">
          <text class="nav-bar__title">{{ displayTitle }}</text>
        </template>
        <template v-else>
          <slot name="center" />
        </template>
      </view>

      <view class="nav-bar__right" :style="`padding-right: ${menuButtonWidth}px`">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { tenantProvider } from '../../providers/tenant.provider';
import { getNavigationBrandName, getSingleTenantBrandLogoPath, loadSingleTenantBrand } from '../../utils/tenant-brand';
import { safeNavigateBack } from '../../utils/navigation';
import { getSystemInfo } from '../../utils/platform';
import { clientDebugService } from '../../services/client-debug.service';

/** controlling 同步当前会话授权状态，跨页面使用统一取消入口。 */
const controlling = ref(clientDebugService.isControlling());
/** unsubscribeControl 在组件销毁时释放状态监听。 */
let unsubscribeControl: (() => void) | undefined;
/** stopControl 立即在本地撤销授权，不等待网络或再次弹窗。 */
function stopControl(): void { clientDebugService.stop(); }

interface Props {
  title?: string;
  back?: boolean;
  brand?: boolean;
  background?: string;
  color?: string;
  loading?: boolean;
  delta?: number;
  customBack?: boolean;
  fallbackUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  back: true,
  brand: false,
  background: '',
  color: '',
  loading: false,
  delta: 1,
  customBack: false,
  fallbackUrl: '/pages/home/index',
});

const emit = defineEmits<{ (e: 'back'): void }>();

const sys = getSystemInfo();
const statusBarHeight = ref(sys.statusBarHeight);
const navBarHeight = ref(sys.navBarHeight);
const menuButtonWidth = ref(sys.menuButtonRect ? sys.screenWidth - sys.menuButtonRect.left : 95);
const brandSlotWidth = ref(sys.menuButtonRect ? Math.max(120, sys.menuButtonRect.left - 16) : Math.max(120, sys.screenWidth - 140));
const leftSlotWidth = computed(() => (showBrand.value ? brandSlotWidth.value : menuButtonWidth.value));
const showBack = computed(() => props.back && !props.brand);
const showBrand = computed(() => props.brand);
const displayTitle = computed(() => (props.brand ? '' : props.title));
const brandName = ref(getNavigationBrandName());
const brandLogoPath = ref(getSingleTenantBrandLogoPath());
const brandInitial = computed(() => brandName.value.slice(0, 1) || '联');
let unsubscribeTenant: (() => void) | null = null;

/** syncBrand 同步导航栏品牌名、单组织头像和默认品牌图。 */
function syncBrand(): void {
  brandName.value = getNavigationBrandName();
  brandLogoPath.value = getSingleTenantBrandLogoPath();
}

onMounted(() => {
  controlling.value = clientDebugService.isControlling();
  unsubscribeControl = clientDebugService.subscribe(() => { controlling.value = clientDebugService.isControlling(); });
  syncBrand();
  unsubscribeTenant = tenantProvider.subscribe(syncBrand);
  void loadSingleTenantBrand().then(syncBrand);
});

onUnmounted(() => {
  unsubscribeControl?.();
  unsubscribeTenant?.();
});

function handleBack() {
  emit('back');
  if (props.customBack) return;
  safeNavigateBack({ delta: props.delta, fallbackUrl: props.fallbackUrl });
}
</script>

<style lang="scss" scoped>
.nav-bar__control {
  position: fixed;
  right: 16rpx;
  bottom: calc(150rpx + env(safe-area-inset-bottom));
  z-index: 9999;
  padding: 18rpx 22rpx;
  border-radius: 40rpx;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 24rpx;
}

.nav-bar {
  display: flex;
  width: 100vw;
  color: var(--text-primary);
}

.nav-bar__inner {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.nav-bar__left {
  display: flex;
  align-items: center;
  padding-left: 16px;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.nav-bar__back {
  padding: 10px 18px 10px 0;
}

.nav-bar__back--active {
  opacity: 0.5;
}

.nav-bar__back-icon {
  width: 12px;
  height: 24px;
  background: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='24' viewBox='0 0 12 24'%3E%3Cpath fill-opacity='.9' fill-rule='evenodd' d='M10 19.438L8.955 20.5l-7.666-7.79a1.02 1.02 0 0 1 0-1.42L8.955 3.5 10 4.563 2.682 12 10 19.438z'/%3E%3C/svg%3E") no-repeat center;
  background-size: cover;
}

.nav-bar__brand {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.nav-bar__brand-logo {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-primary);
}

.nav-bar__brand-logo--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-bar__brand-logo-text {
  color: var(--color-on-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 24px;
}

.nav-bar__brand-name {
  min-width: 0;
  margin-left: 8px;
  color: currentColor;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-bar__center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-bar__title {
  width: 100%;
  max-width: 100%;
  font-size: 17px;
  font-weight: bold;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-bar__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
}

.nav-bar__loading {
  width: 20px;
  height: 20px;
  margin-right: 6px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: nav-spin 0.6s linear infinite;
}

@keyframes nav-spin {
  to { transform: rotate(360deg); }
}
</style>
