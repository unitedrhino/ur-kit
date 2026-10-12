<script setup lang="ts">
import { $t } from '@vben/locales';
import dayjs from 'dayjs';
import { useDashboardTheme } from '../composables/useTheme';

defineProps<{
  records: any[];
}>();

const theme = useDashboardTheme();

const levelMap: Record<string, { label: string; color: string }> = {
  remind: { label: $t('orgIotClient.energyDashboard.levelRemind'), color: '#f59e0b' },
  minor: { label: $t('orgIotClient.energyDashboard.levelMinor'), color: '#f59e0b' },
  major: { label: $t('orgIotClient.energyDashboard.levelMajor'), color: '#f97316' },
  critical: { label: $t('orgIotClient.energyDashboard.levelCritical'), color: '#ef4444' },
};

const statusMap: Record<string, string> = {
  alarmActive: $t('orgIotClient.energyDashboard.statusAlarming'),
  acked: $t('orgIotClient.energyDashboard.statusAcked'),
  shielded: $t('orgIotClient.energyDashboard.statusShielded'),
  normal: $t('orgIotClient.energyDashboard.statusNormal'),
};

function getLevel(level: string) {
  return levelMap[level] ?? { label: $t('orgIotClient.deviceSpace.unknown'), color: '#64748b' };
}

function formatTime(ts: string | number) {
  if (!ts) return '--';
  const v = typeof ts === 'string' ? Number(ts) : ts;
  // 秒级时间戳转毫秒
  const ms = v < 1e12 ? v * 1000 : v;
  return dayjs(ms).format('MM-DD HH:mm');
}
</script>

<template>
  <div class="alarm-panel">
    <div v-if="records.length === 0" class="alarm-empty">
      <span class="icon-[mdi--check-circle-outline] alarm-empty__icon" :style="{ color: theme.alarmEmptyIcon }" />
      <p>{{ $t('orgIotClient.energyDashboard.noAlarms') }}</p>
    </div>
    <div v-else class="alarm-list">
      <div
        v-for="(item, idx) in records"
        :key="item.id ?? idx"
        class="alarm-item"
        :style="{ background: theme.alarmItemBg, borderColor: theme.alarmItemBorder }"
      >
        <div class="alarm-item__level">
          <span
            class="alarm-dot"
            :style="{ backgroundColor: getLevel(item.level).color }"
          />
          <span
            class="alarm-level-text"
            :style="{ color: getLevel(item.level).color }"
          >
            {{ getLevel(item.level).label }}
          </span>
        </div>
        <div class="alarm-item__info">
          <div class="alarm-item__name" :title="item.alarmName" :style="{ color: theme.tooltipText }">
            {{ item.alarmName || '--' }}
          </div>
          <div class="alarm-item__device" :style="{ color: theme.textDim }">
            {{ item.deviceAlias || item.deviceName || '--' }}
          </div>
        </div>
        <div class="alarm-item__meta">
          <span class="alarm-item__status" :style="{ color: theme.alarmBadge, background: theme.alarmBadgeBg }">
            {{ statusMap[item.status] ?? '--' }}
          </span>
          <span class="alarm-item__time" :style="{ color: theme.textDim }">
            {{ formatTime(item.lastTriggerTime || item.firstTriggerTime || item.createdTime) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alarm-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.alarm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: currentColor;
  opacity: 0.5;
  font-size: 13px;
}

.alarm-empty__icon {
  font-size: 36px;
}

.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 2px;
}

.alarm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid;
  transition: filter 0.2s;
}

.alarm-item:hover {
  filter: brightness(1.2);
}

.alarm-item__level {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  min-width: 52px;
}

.alarm-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.alarm-level-text {
  font-size: 11px;
  font-weight: 600;
}

.alarm-item__info {
  flex: 1;
  min-width: 0;
}

.alarm-item__name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alarm-item__device {
  font-size: 10px;
  margin-top: 1px;
}

.alarm-item__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 2px;
}

.alarm-item__status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}

.alarm-item__time {
  font-size: 10px;
}
</style>
