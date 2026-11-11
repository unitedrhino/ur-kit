<!-- 文件说明：独立面板路由复用详情嵌入宿主，旧收藏入口仍指向同一真实设备。 -->
<template>
  <view class="device-detail-layout">
    <app-navigation-bar title="设备面板" />
    <view class="panel-page">
      <device-panel-host
        v-if="productID && deviceName"
        :product-i-d="productID"
        :device-name="deviceName"
        :active="active"
        @availability="availability = $event"
      />
      <view v-if="availability === 'native'" class="panel-empty"
        ><text>当前设备没有可用的自定义面板</text
        ><button @tap="goBack">返回设备详情</button></view
      >
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onHide, onShow, onUnload } from "@dcloudio/uni-app";
import AppNavigationBar from "../../../components/app-navigation-bar/app-navigation-bar.vue";
import DevicePanelHost from "../../../components/device-panel-host/device-panel-host.vue";
/** productID/deviceName 固定当前路由目标；active 将页面生命周期交给嵌入宿主。 */
const productID = ref("");
const deviceName = ref("");
const active = ref(true);
/** availability 决定没有绑定时展示返回入口，不添加第二套控制。 */
const availability = ref<"loading" | "panel" | "native">("loading");
onLoad((query) => {
  productID.value = String(query?.productID || "");
  deviceName.value = String(query?.deviceName || "");
});
onHide(() => {
  active.value = false;
});
onShow(() => {
  active.value = true;
});
onUnload(() => {
  active.value = false;
});
/** goBack 返回原设备详情，原生控制由详情页统一承接。 */
function goBack(): void {
  uni.navigateBack();
}
</script>
<style scoped lang="scss">
.device-detail-layout {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--page-bg);
}
.panel-empty {
  padding: 24px;
  color: var(--text-secondary);
}
</style>
