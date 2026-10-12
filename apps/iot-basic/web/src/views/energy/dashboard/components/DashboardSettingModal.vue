<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/locales';
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NCard,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NRadio,
  NRadioGroup,
  NSpin,
  NSpace,
  useMessage,
} from 'naive-ui';
import { ViewView } from '@vben/api';

import {
  DEFAULT_ENERGY_DASHBOARD_SETTING,
  type EnergyDashboardMode,
  type EnergyDashboardSetting,
} from '../types/dashboard-setting';
import {
  loadDashboardSetting,
  saveDashboardSetting,
} from '../services/dashboard-setting.service';

interface Props {
  show: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'saved', setting: EnergyDashboardSetting): void;
}>();

const message = useMessage();

const loading = ref(false);
const listLoading = ref(false);
const saving = ref(false);
const mode = ref<EnergyDashboardMode>('default');
const selectedScreenId = ref<string | undefined>(undefined);
const selectedScreenName = ref<string | undefined>(undefined);
const screenList = ref<Array<{ id: string; name: string; indexImage?: string; desc?: string }>>([]);
const searchKeyword = ref('');

const visible = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v),
});

const canSave = computed(() => {
  if (saving.value) return false;
  if (mode.value === 'default') return true;
  return !!selectedScreenId.value;
});

async function fetchScreenList() {
  listLoading.value = true;
  try {
    const res: any = await ViewView.postApiV1ViewProjectGetList({
      projectInfoGetListReqEx: {
        type: 'screen',
        status: 1,
        name: searchKeyword.value || undefined,
        page: { page: 1, size: 200 },
      } as any,
    } as any);
    const data = res?.data ?? res;
    const list = data?.list ?? [];
    screenList.value = list.map((it: any) => ({
      id: String(it.id ?? ''),
      name: it.name ?? $t('orgIotClient.energyDashboard.unnamedScreen'),
      indexImage: it.indexImage,
      desc: it.desc,
    }));
  } catch (e) {
    console.warn('[dashboard-setting-modal] load screen list failed', e);
    screenList.value = [];
  } finally {
    listLoading.value = false;
  }
}

async function initFromProfile() {
  loading.value = true;
  try {
    const setting = await loadDashboardSetting();
    mode.value = setting.mode;
    selectedScreenId.value = setting.selectedScreenId;
    selectedScreenName.value = setting.selectedScreenName;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.show,
  async (v) => {
    if (!v) return;
    await initFromProfile();
    if (mode.value === 'custom' || screenList.value.length === 0) {
      await fetchScreenList();
    }
  },
);

watch(mode, async (v) => {
  if (v === 'custom' && screenList.value.length === 0) {
    await fetchScreenList();
  }
});

function handleSelect(item: { id: string; name: string }) {
  selectedScreenId.value = item.id;
  selectedScreenName.value = item.name;
}

async function handleSave() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const payload: EnergyDashboardSetting =
      mode.value === 'default'
        ? { ...DEFAULT_ENERGY_DASHBOARD_SETTING }
        : {
            mode: 'custom',
            selectedScreenId: selectedScreenId.value,
            selectedScreenName: selectedScreenName.value,
          };
    await saveDashboardSetting(payload);
    message.success($t('orgIotClient.energyDashboard.saved'));
    emit('saved', payload);
    visible.value = false;
  } catch (e: any) {
    notifyRequestError(e, () => e?.message || $t('orgManage.common.saveFailed'), (text) => message.error(text));
  } finally {
    saving.value = false;
  }
}

function handleSearch() {
  void fetchScreenList();
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('orgIotClient.energyDashboard.settingTitle')"
    style="width: 720px; max-width: 92vw"
    :mask-closable="!saving"
    :close-on-esc="!saving"
  >
    <NSpin :show="loading">
      <div class="setting-modal">
        <div class="setting-modal__row">
          <span class="setting-modal__label">{{ $t('orgIotClient.energyDashboard.planLabel') }}</span>
          <NRadioGroup v-model:value="mode">
            <NRadio value="default">{{ $t('orgIotClient.energyDashboard.defaultScreen') }}</NRadio>
            <NRadio value="custom">{{ $t('orgIotClient.energyDashboard.customScreen') }}</NRadio>
          </NRadioGroup>
        </div>

        <div v-if="mode === 'custom'" class="setting-modal__section">
          <div class="setting-modal__toolbar">
            <NInput
              v-model:value="searchKeyword"
              :placeholder="$t('orgIotClient.energyDashboard.searchScreenPlaceholder')"
              clearable
              size="small"
              style="width: 240px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
            <NButton size="small" :loading="listLoading" @click="handleSearch">
              {{ $t('orgManage.common.search') }}
            </NButton>
          </div>

          <NSpin :show="listLoading" class="setting-modal__list-spin">
            <div v-if="screenList.length === 0" class="setting-modal__empty">
              <NEmpty :description="$t('orgIotClient.energyDashboard.noScreens')" />
            </div>
            <div v-else class="setting-modal__grid">
              <NCard
                v-for="item in screenList"
                :key="item.id"
                hoverable
                size="small"
                class="setting-modal__card"
                :class="{ 'setting-modal__card--active': selectedScreenId === item.id }"
                @click="handleSelect(item)"
              >
                <div class="setting-modal__cover">
                  <img v-if="item.indexImage" :src="item.indexImage" alt="" />
                  <NIcon v-else size="32" class="setting-modal__cover-empty">
                    <svg viewBox="0 0 24 24" width="1em" height="1em">
                      <path fill="currentColor" d="M4 4h16v12H4zM2 18h20v2H2z" />
                    </svg>
                  </NIcon>
                </div>
                <div class="setting-modal__title">{{ item.name }}</div>
                <div v-if="item.desc" class="setting-modal__desc">{{ item.desc }}</div>
              </NCard>
            </div>
          </NSpin>
        </div>
      </div>
    </NSpin>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="saving" @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" :disabled="!canSave" @click="handleSave">
          {{ $t('orgManage.common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.setting-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 220px;
}
.setting-modal__row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.setting-modal__label {
  font-size: 14px;
  color: var(--n-text-color);
  min-width: 80px;
}
.setting-modal__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.setting-modal__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.setting-modal__list-spin {
  min-height: 200px;
}
.setting-modal__empty {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.setting-modal__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
}
.setting-modal__card {
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.setting-modal__card--active {
  border: 2px solid var(--n-color-target, #2080f0);
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.18);
}
.setting-modal__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f3f5f7;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.setting-modal__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.setting-modal__cover-empty {
  color: #c2c9d1;
}
.setting-modal__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.setting-modal__desc {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
