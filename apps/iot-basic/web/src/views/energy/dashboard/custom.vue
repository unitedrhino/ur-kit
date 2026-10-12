<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { $t } from '@vben/locales';
import type { MountedGoview } from '@vben/bigscreen/mount';

interface Props {
  screenId: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'fallback', reason: string): void }>();

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const errorMsg = ref<null | string>(null);
let mounted: MountedGoview | null = null;

async function mount() {
  if (!props.screenId) {
    errorMsg.value = $t('orgIotClient.energyDashboard.missingScreenId');
    loading.value = false;
    emit('fallback', 'missing-id');
    return;
  }
  loading.value = true;
  errorMsg.value = null;
  try {
    await nextTick();
    if (!containerRef.value) {
      throw new Error($t('orgIotClient.energyDashboard.containerNotReady'));
    }
    const { mountGoview } = await import('@vben/bigscreen/mount');
    mounted = await mountGoview(containerRef.value, props.screenId, 'preview');
  } catch (e: any) {
    console.warn('[dashboard-custom] mountGoview failed', e);
    errorMsg.value = e?.message || $t('orgIotClient.energyDashboard.loadFailed');
    emit('fallback', errorMsg.value || 'mount-failed');
  } finally {
    loading.value = false;
  }
}

function unmount() {
  try {
    mounted?.unmount();
  } catch (e) {
    console.warn('[dashboard-custom] unmount error', e);
  }
  mounted = null;
}

onMounted(() => {
  void mount();
});

onBeforeUnmount(() => {
  unmount();
});

watch(
  () => props.screenId,
  async (v, old) => {
    if (v === old) return;
    unmount();
    await mount();
  },
);
</script>

<template>
  <div class="custom-screen">
    <div v-if="loading" class="custom-screen__state">
      <div class="custom-screen__spinner" />
      <p>{{ $t('orgIotClient.energyDashboard.screenLoading') }}</p>
    </div>
    <div v-else-if="errorMsg" class="custom-screen__state custom-screen__state--error">
      <div class="custom-screen__icon">⚠️</div>
      <p>{{ errorMsg }}</p>
    </div>
    <div v-show="!loading && !errorMsg" ref="containerRef" class="custom-screen__content"></div>
  </div>
</template>

<style scoped>
.custom-screen {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 80px);
  background: #0b1020;
}
.custom-screen__content {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 80px);
}
.custom-screen__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  min-height: calc(100vh - 80px);
  color: #c7d0dd;
}
.custom-screen__state--error .custom-screen__icon {
  font-size: 36px;
}
.custom-screen__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: 0.4;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
