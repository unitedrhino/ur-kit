<script setup lang="ts">
import { NDataTable } from '@vben/saas/resizable-naive-table';

import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/locales';
import { computed, h, ref, watch, watchEffect } from 'vue';
import { Page } from '@vben/common-ui';
import { ThingsApi } from '@vben/api';
import { useQRCode } from '@vueuse/integrations/useQRCode';
import { NButton, NCard, NModal, NSpace, NTabPane, NTabs, NTag, useMessage } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useEnergyTree } from '#/hooks/use-energy-tree';
import EnergyTreeSelector from '#/components/energy/EnergyTreeSelector.vue';
import { extractList } from '#/utils/api-response';

const message = useMessage();

const {
  groupType, searchValue, treeData, isLoading: treeLoading, defaultKey,
} = useEnergyTree();

const selectedKeys = ref<string[]>([]);
watchEffect(() => {
  if (defaultKey.value && !selectedKeys.value.length) {
    selectedKeys.value = [defaultKey.value];
  }
});

const activeTab = ref('users');
const page = ref(1);
const pageSize = ref(10);

const hasSelection = computed(() => selectedKeys.value.length > 0);
/** 当前选中的权限区域 ID，用于生成授权二维码内容。 */
const selectedAreaID = computed(() => selectedKeys.value[0] ?? '');
/** 授权二维码弹窗显示状态。 */
const authQRCodeVisible = ref(false);
/** 授权二维码写入内容，移动端扫码后据此识别区域授权申请。 */
const authQRCodePayload = computed(() =>
  selectedAreaID.value ? `t=area&at=2&areaID=${selectedAreaID.value}` : '',
);
/** 授权二维码图片 data URL。 */
const authQRCodeUrl = useQRCode(authQRCodePayload, {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 240,
});

const userData = ref<any>(null);
const userLoading = ref(false);

async function fetchUsers() {
  if (!hasSelection.value) return;
  userLoading.value = true;
  try {
    userData.value = await ThingsApi.postApiV1ThingsDataUserGetList({
      page: { page: page.value, size: pageSize.value },
      areaIDs: selectedKeys.value,
    });
  } catch (e) {
    console.error('fetchUsers error', e);
  } finally {
    userLoading.value = false;
  }
}

function refetch() {
  fetchUsers();
}

watch([selectedKeys, page, pageSize], () => {
  fetchUsers();
}, { immediate: true });

const userList = computed(() => extractList(userData.value));
const userTotal = computed(() => (userData.value as any)?.total ?? (userData.value as any)?.data?.total ?? 0);

const userColumns: DataTableColumns<any> = [
  { title: $t('orgManage.user.username'), key: 'nickName', width: 120 },
  { title: $t('orgManage.user.phoneNo'), key: 'phone', width: 140 },
  { title: $t('orgManage.user.email'), key: 'email', width: 180 },
  {
    title: $t('orgManage.user.role'), key: 'roles', width: 160,
    render: (row) => {
      const roles = row.roles ?? [];
      return h(NSpace, { size: 4 }, {
        default: () => roles.map((r: any) =>
          h(NTag, { size: 'small', type: 'info' }, { default: () => r.name }),
        ),
      });
    },
  },
  {
    title: $t('orgManage.common.operation'), key: 'action', width: 100,
    render: (row) =>
      h(NButton, {
        text: true, type: 'error', size: 'small',
        onClick: () => onRemovePermission(row),
      }, { default: () => $t('orgIotClient.energyDashboard.revokeAuth') }),
  },
];

async function onRemovePermission(row: any) {
  try {
    await ThingsApi.postApiV1ThingsDataAreaBatchDelete({
      targetType: 'user',
      targetID: row.userID,
      areaIDs: selectedKeys.value,
    });
    message.success($t('orgIotClient.energyDashboard.authRevoked'));
    refetch();
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('orgIotClient.deviceSpace.operationFailed'), (text) => message.error(text));
  }
}

function handlePageChange(p: number) {
  page.value = p;
}

/**
 * 打开当前区域授权二维码弹窗。
 */
function openAuthQRCode() {
  if (!hasSelection.value) return;
  authQRCodeVisible.value = true;
}
</script>

<template>
  <Page>
    <div class="flex h-full gap-3">
      <NCard class="w-56 shrink-0" content-style="padding: 12px; height: 100%; display: flex; flex-direction: column;">
        <EnergyTreeSelector
          :selected-keys="selectedKeys"
          :group-type="groupType"
          :tree-data="treeData as any"
          :loading="treeLoading"
          :search-value="searchValue"
          :multiple="false"
          @update:selected-keys="(v) => (selectedKeys = v)"
          @update:group-type="(v) => (groupType = v)"
          @update:search-value="(v) => (searchValue = v)"
        />
      </NCard>

      <NCard class="flex-1">
        <div class="mb-3 flex items-center justify-end">
          <NButton type="primary" :disabled="!hasSelection" @click="openAuthQRCode">
            {{ $t('orgIotClient.energyDashboard.authQRCode') }}
          </NButton>
        </div>
        <NTabs v-model:value="activeTab">
          <NTabPane name="users" :tab="$t('orgIotClient.energyDashboard.boundUsersTab')">
            <NDataTable
              :columns="userColumns"
              :data="userList"
              :loading="userLoading"
              size="small"
              :row-key="(r: any) => r.userID"
              :pagination="{
                page,
                pageSize,
                itemCount: userTotal,
                onUpdatePage: handlePageChange,
              }"
              remote
            />
          </NTabPane>
        </NTabs>
      </NCard>
    </div>

    <NModal
      v-model:show="authQRCodeVisible"
      class="w-[320px] bg-transparent shadow-none"
    >
      <div class="flex flex-col items-center">
        <div class="flex size-80 items-center justify-center rounded-lg bg-white">
          <img :src="authQRCodeUrl" :alt="$t('orgIotClient.energyDashboard.authQRCode')" class="size-60" />
        </div>
        <div class="my-8 text-sm font-medium text-white">
          {{ $t('orgIotClient.energyDashboard.qrCodeHint') }}
        </div>
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-full border border-white text-white transition hover:bg-white/10"
          :aria-label="$t('orgIotClient.energyDashboard.closeQRCode')"
          @click="authQRCodeVisible = false"
        >
          <span class="icon-[mdi--close] size-5" />
        </button>
      </div>
    </NModal>
  </Page>
</template>
