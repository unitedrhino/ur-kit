<script setup lang="ts">
import { useDashboardTheme } from '../composables/useTheme';

defineProps<{
  avgPower: number;
  minPower: number;
  maxPower: number;
  totalPower: number;
  todayEnergy: number;
  deviceTotal: number;
  deviceOnline: number;
  deviceOffline: number;
}>();

const theme = useDashboardTheme();

function fmtVal(val: number, decimals = 1): string {
  if (val >= 1000) return (val / 1000).toFixed(decimals);
  return val.toFixed(decimals);
}

function fmtUnit(val: number, base: string): string {
  if (base === 'kW' && val >= 1000) return 'MW';
  if (base === 'kWh' && val >= 1000) return 'MWh';
  return base;
}
</script>

<template>
  <div class="cards">
    <div
      v-for="item in [
        { icon: 'icon-[mdi--flash]', label: $t('orgIotClient.energyDashboard.realTimePower'), value: fmtVal(totalPower), unit: fmtUnit(totalPower, 'kW') },
        { icon: 'icon-[mdi--lightning-bolt-circle]', label: $t('orgIotClient.energyDashboard.todayEnergy'), value: fmtVal(todayEnergy), unit: fmtUnit(todayEnergy, 'kWh') },
        { icon: 'icon-[mdi--chart-timeline-variant]', label: $t('orgIotClient.energyDashboard.avgPower'), value: fmtVal(avgPower), unit: fmtUnit(avgPower, 'kW') },
        { icon: 'icon-[mdi--arrow-down-bold-circle]', label: $t('orgIotClient.energyDashboard.minPower'), value: fmtVal(minPower), unit: fmtUnit(minPower, 'kW') },
        { icon: 'icon-[mdi--arrow-up-bold-circle]', label: $t('orgIotClient.energyDashboard.peakPower'), value: fmtVal(maxPower), unit: fmtUnit(maxPower, 'kW') },
        { icon: 'icon-[mdi--devices]', label: $t('orgIotClient.dashboard.totalDevices'), value: String(deviceTotal), unit: $t('orgIotClient.energyDashboard.unitDevices') },
        { icon: 'icon-[mdi--access-point]', label: $t('orgIotClient.dashboard.onlineDevices'), value: String(deviceOnline), unit: $t('orgIotClient.energyDashboard.unitDevices') },
        { icon: 'icon-[mdi--access-point-off]', label: $t('orgIotClient.dashboard.offlineDevices'), value: String(deviceOffline), unit: $t('orgIotClient.energyDashboard.unitDevices') },
      ]"
      :key="item.label"
      class="card"
      :style="{ borderColor: theme.overviewCardBorder, background: theme.overviewCardBg }"
    >
      <div class="card__icon" :style="{ background: theme.overviewIconBg, color: theme.accent }">
        <span :class="item.icon" />
      </div>
      <div class="card__content">
        <span class="card__label" :style="{ color: theme.overviewLabel }">{{ item.label }}</span>
        <div class="card__value" :style="{ color: theme.overviewValue }">
          {{ item.value }}
          <span class="card__unit" :style="{ color: theme.overviewUnit }">{{ item.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid;
  backdrop-filter: blur(12px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 17px;
  flex-shrink: 0;
}

.card__label {
  font-size: 11px;
}

.card__value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 1px;
}

.card__unit {
  font-size: 11px;
  font-weight: 400;
  margin-left: 2px;
}

@media (max-width: 1600px) {
  .cards { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 1200px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
