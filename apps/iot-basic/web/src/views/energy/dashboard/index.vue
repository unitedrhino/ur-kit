<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import DefaultDashboard from './default.vue';
import CustomDashboard from './custom.vue';
import DashboardSettingModal from './components/DashboardSettingModal.vue';
import {
  DEFAULT_ENERGY_DASHBOARD_SETTING,
  type EnergyDashboardSetting,
} from './types/dashboard-setting';
import { loadDashboardSetting } from './services/dashboard-setting.service';

const setting = ref<EnergyDashboardSetting>({ ...DEFAULT_ENERGY_DASHBOARD_SETTING });
const ready = ref(false);
const showSettingModal = ref(false);

async function reload() {
  const next = await loadDashboardSetting();
  setting.value = next;
}

const isCustomMode = computed(
  () => setting.value.mode === 'custom' && !!setting.value.selectedScreenId,
);

function handleFallback() {
  setting.value = { ...DEFAULT_ENERGY_DASHBOARD_SETTING };
}

function handleSettingSaved() {
  void reload();
}

// 控制台 fallback 入口：定制大屏加载后没有标题可 5 连击，
// 允许在浏览器 console 输入命令强制唤出设置 Modal
//   ccd()
// 别名：openEnergyDashboardSetting() / __energyDashboardSetting()
function openSettingModalFromConsole() {
  showSettingModal.value = true;
  // eslint-disable-next-line no-console
  console.info('[energy-dashboard] 设置 Modal 已打开');
}

const GLOBAL_KEYS = [
  'ccd',
  'openEnergyDashboardSetting',
  '__energyDashboardSetting',
] as const;

onMounted(async () => {
  await reload();
  ready.value = true;
  if (typeof window !== 'undefined') {
    for (const key of GLOBAL_KEYS) {
      (window as any)[key] = openSettingModalFromConsole;
    }
    // eslint-disable-next-line no-console
    console.info(
      '[energy-dashboard] 可在控制台输入 ccd() 打开大屏配置',
    );
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    for (const key of GLOBAL_KEYS) {
      if ((window as any)[key] === openSettingModalFromConsole) {
        delete (window as any)[key];
      }
    }
  }
});
</script>

<template>
  <div class="dashboard-host">
    <template v-if="!ready">
      <div class="dashboard-host__loading">
        <div class="dashboard-host__spinner" />
      </div>
    </template>
    <template v-else>
      <CustomDashboard
        v-if="isCustomMode"
        :screen-id="setting.selectedScreenId!"
        @fallback="handleFallback"
      />
      <DefaultDashboard v-else @setting-saved="handleSettingSaved" />
    </template>

    <!-- 控制台 fallback 入口唤起的配置弹窗：定制大屏下也能切回默认或更换大屏 -->
    <DashboardSettingModal
      v-model:show="showSettingModal"
      @saved="handleSettingSaved"
    />
  </div>
</template>

<style scoped>
.dashboard-host {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 80px);
}
.dashboard-host__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
}
.dashboard-host__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #8b95a7;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: 0.5;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
