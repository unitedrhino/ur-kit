<!-- 文件说明：详情与独立面板页共用的嵌入宿主；隐藏时释放端口，返回后重新读取真实状态。 -->
<template>
  <view
    v-if="state.loading || state.snapshot || state.error || runtimeError"
    class="panel-host"
    :class="{ 'panel-host--full': !state.error && !runtimeError }"
  >
    <view v-if="state.loading" class="panel-notice"
      ><text>正在加载设备面板…</text></view
    >
    <view
      v-else-if="state.error || runtimeError"
      class="panel-notice panel-notice--error"
    >
      <text>自定义面板暂不可用，已显示原生控制。</text>
      <text class="panel-notice__reason">{{
        runtimeError || state.error
      }}</text>
      <button class="panel-retry" @tap="reload">重试</button>
    </view>
    <template v-else-if="state.snapshot">
      <!-- #ifdef H5 -->
      <iframe
        ref="frame"
        title="设备面板"
        sandbox="allow-scripts"
        referrerpolicy="no-referrer"
        class="panel-frame"
      />
      <!-- #endif -->
    </template>
  </view>
</template>
<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, shallowRef, watch } from "vue";
import { DevicePanelProvider } from "../../providers/device-panel.provider";
import { openMiniPanelSettings } from "../../services/mini-panel-navigation.service";
import { eventBus } from "../../utils/event-bus";
// #ifdef H5
import { attachPanelBridge } from "../../utils/device-panel/bridge";
// #endif
/** props 固定设备身份；active 由所属页面的显示/隐藏生命周期驱动，子组件不自行推断页面可见性。 */
const props = defineProps<{
  productID: string;
  deviceName: string;
  active: boolean;
}>();
/** availability 通知父页显示嵌入面板或原生控制；解析完成前不闪现另一套控件。 */
const emit = defineEmits<{
  (event: "availability", value: "loading" | "panel" | "native"): void;
}>();
/** provider 只属于本次宿主，设置目标仅取已校验的设备快照。 */
const provider = new DevicePanelProvider(
  undefined,
  async ({ productID, deviceName }) => {
    if (await openMiniPanelSettings({ productID, deviceName })) return;
    await new Promise<void>((resolve, reject) => {
      uni.navigateTo({
        url: `/packageDevice/pages/settings/index?productID=${encodeURIComponent(productID)}&deviceName=${encodeURIComponent(deviceName)}`,
        success: () => resolve(),
        fail: () => reject(new Error("无法打开设备设置，请返回设备详情重试")),
      });
    });
  },
);
/** state 订阅当前解析结果；runtimeError 只记录本次窗口握手错误，不覆盖服务端快照。 */
const state = shallowRef(provider.getState());
const runtimeError = ref("");
/** frame 是 H5 的隔离 iframe；其尺寸由详情剩余区域决定。 */
const frame = ref<HTMLIFrameElement>();
/** platform 使用编译分支隔离 H5 DOM、App 原生窗口和不支持 HTML 的小程序。 */
let platform = "mini";
// #ifdef H5
platform = "h5";
// #endif
// #ifdef APP-PLUS
platform = uni.getSystemInfoSync().platform === "ios" ? "appIos" : "appAndroid";
// #endif
/** dispose 关闭本实例消息端口；revision 防止 nextTick 后给已隐藏或已切换设备的节点重新挂桥。 */
let dispose: (() => void) | undefined;
let revision = 0;
let destroyed = false;
/** unsubscribe 只移除本组件的 Provider 监听。 */
const unsubscribe = provider.subscribe((next) => {
  state.value = next;
});
/** availability 仅有可用快照且窗口正常时替换原生控制。 */
const availability = computed(() =>
  state.value.loading
    ? "loading"
    : state.value.snapshot && !state.value.error && !runtimeError.value
      ? "panel"
      : "native",
);
watch(availability, (value) => emit("availability", value), {
  immediate: true,
});
/** stop 隐藏/销毁时同步取消旧端口、命令轮询与原生子窗口；快照保留供返回时重新读取真实值。 */
function stop(): void {
  revision += 1;
  dispose?.();
  dispose = undefined;
  provider.stop();
}
/** mount 等待 iframe 节点后装配当前快照，返回设置页不复用已关闭的 adapter。 */
async function mount(): Promise<void> {
  stop();
  const current = revision;
  if (
    destroyed ||
    !props.active ||
    !state.value.snapshot ||
    state.value.error ||
    runtimeError.value
  )
    return;
  // 返回设置页时旧网络授权可能已到期；先刷新解析，不能让浏览器拿缓存掩盖失效入口。
  if (platform === "h5" && state.value.snapshot.resolution.assetExpiresAt && state.value.snapshot.resolution.assetExpiresAt <= Date.now() + 5000) {
    await reload();
    return;
  }
  await nextTick();
  if (destroyed || current !== revision || !props.active) return;
  try {
    // #ifdef H5
    if (frame.value) {
      dispose = attachPanelBridge(
        frame.value,
        provider.createAdapter(),
        state.value.snapshot!.resolution.manifest?.requirements || [],
        (message) => {
          if (current !== revision || destroyed) return;
          runtimeError.value = message;
          stop();
        },
      );
      frame.value.src = state.value.snapshot!.entryURL;
    }
    // #endif
    // #ifdef APP-PLUS
    provider.openNative();
    // #endif
  } catch (error: unknown) {
    runtimeError.value =
      error instanceof Error ? error.message : "设备面板启动失败";
    stop();
  }
}
/** reload 重新解析本设备绑定，失败时保留原生控制；不复用其他设备的窗口。 */
async function reload(): Promise<void> {
  stop();
  runtimeError.value = "";
  if (!destroyed && props.productID && props.deviceName)
    await provider.load(props.productID, props.deviceName, platform);
}
watch(
  () => [props.productID, props.deviceName],
  () => {
    void reload();
  },
  { immediate: true },
);
watch(
  () => [state.value.snapshot, props.active],
  () => {
    void mount();
  },
  { flush: "post" },
);
/** logout 撤销本实例快照和认证，不能让返回按钮恢复旧账号面板。 */
function logout(): void {
  stop();
  provider.clear();
}
eventBus.on("auth:logout", logout);
onUnmounted(() => {
  destroyed = true;
  stop();
  unsubscribe();
  provider.clear();
  eventBus.off("auth:logout", logout);
});
</script>
<style scoped lang="scss">
.panel-host {
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: var(--page-bg);
}
.panel-host--full {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-frame {
  display: block;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  background: var(--card-bg);
}
.panel-notice {
  padding: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}
.panel-notice--error {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 16px;
}
.panel-notice__reason {
  width: 100%;
  font-size: 12px;
}
.panel-retry {
  margin: 0;
  padding: 0 16px;
  font-size: 13px;
  color: var(--color-primary);
  background: var(--card-bg);
}
</style>
