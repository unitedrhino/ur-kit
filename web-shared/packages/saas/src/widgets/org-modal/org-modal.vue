<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/saas/locales';
import type { CoreApi } from '@vben/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben-core/popup-ui';
import { VbenAvatar, VbenButton, VbenIcon } from '@vben-core/shadcn-ui';
import { useUserStore } from '@vben/stores';

import { message } from '../../adapter/naive';
import { getAvatarUrl, getBackToConsoleUrl } from '../../utils/utils';
import { useAuthStore } from '../../store/auth';
import { useSessionStore } from '../../store/session';

import AddTenantModal from './add-tenant-modal.vue';
import JoinTenantModal from './join-tenant-modal.vue';

defineOptions({
  name: 'OrgModal',
});

const emit = defineEmits<{
  submit: [tenantCode: string];
}>();

const userStore = useUserStore();
const sessionStore = useSessionStore();
const switchingTenantCode = ref('');

// 新增企业模态框引用
const addTenantModalRef = ref<InstanceType<typeof AddTenantModal>>();
// 加入企业模态框引用
const joinTenantModalRef = ref<InstanceType<typeof JoinTenantModal>>();

// 刷新企业列表
async function refreshTenants() {
  await useAuthStore().fetchUserInfo();
}

// 打开新增企业模态框
function openAddTenantModal() {
  addTenantModalRef.value?.open();
}

// 打开加入企业模态框
function openJoinTenantModal() {
  joinTenantModalRef.value?.open();
}

// 处理新增企业成功
async function handleAddTenantSuccess() {
  await refreshTenants();
  window.location.href = getBackToConsoleUrl('/index');
}

// 处理加入企业成功
async function handleJoinTenantSuccess() {
  await refreshTenants();
  window.location.href = getBackToConsoleUrl('/index');
}

// 获取企业列表
const tenants = computed(() => {
  return userStore.userInfo?.tenants || [];
});

// 当前选中的企业编码（响应式，从 sessionStore 读取）
const currentTenantCode = computed(() => sessionStore.tenantCode);

// 获取主题CSS变量颜色值
function getThemeColor(varName: string): string {
  if (typeof window === 'undefined') return '';
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value ? `hsl(${value})` : '';
}

// 根据ID生成颜色 - 使用主题CSS变量
function getTenantColor(id: string | undefined): string {
  const themeColors = [
    getThemeColor('--primary'),
    getThemeColor('--success'),
    getThemeColor('--warning'),
    getThemeColor('--destructive'),
    getThemeColor('--accent'),
  ].filter((color) => color);

  if (themeColors.length === 0) {
    return 'hsl(var(--primary))';
  }

  if (!id) return themeColors[0]!;
  const idStr = String(id);
  const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return themeColors[hash % themeColors.length]!;
}

// 获取企业首字母
function getTenantInitial(name: string | undefined): string {
  if (!name) return 'O';
  return name.charAt(0).toUpperCase();
}

const [Modal, modalApi] = useVbenModal({
  onOpenChange() {},
});

// 处理选择企业
async function handleSelectTenant(tenant: CoreApi.UserTenant) {
  const tenantCode = tenant.tenantCode;
  if (!tenantCode) return;

  // 选择当前企业不做任何操作
  if (tenantCode === currentTenantCode.value) {
    modalApi.close();
    return;
  }

  if (switchingTenantCode.value) return;
  switchingTenantCode.value = tenantCode;

  try {
    const appId = import.meta.env.VITE_GLOB_APPID as string;
    const authorized = appId ? await sessionStore.verifySelfAppAccess(tenantCode, appId) : true;
    if (!authorized) {
      message.warning($t('orgWidgets.ui.theEnterpriseHasNotActivatedThisApplicationAndCa'));
      return;
    }

    // 1. 写入新企业编码到 cookie
    sessionStore.setTenant(tenantCode);

    // 2. 先关闭弹窗
    modalApi.close();
    emit('submit', tenantCode);

    // 3. 延迟刷新，等弹窗关闭动画完成后再 reload
    setTimeout(() => window.location.reload(), 150);
  } catch (error) {
    console.error($t('orgWidgets.ui.enterpriseSwitchingPermissionVerificationFailed'), error);
    notifyRequestError(error, () => $t('orgWidgets.ui.enterpriseSwitchingVerificationFailedPleaseTryAg'), (text) => message.error(text));
  } finally {
    switchingTenantCode.value = '';
  }
}
</script>

<template>
  <Modal :footer="false" :fullscreen-button="false" :title="$t('orgWidgets.ui.switchEnterprise')" class="org-modal">
    <div class="flex w-full flex-col">
      <!-- 企业列表 -->
      <div class="max-h-[500px] space-y-2 overflow-y-auto px-1 py-4">
        <div
          v-for="tenant in tenants"
          :key="tenant.tenantCode || tenant.tenant?.code"
          class="group relative flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 hover:bg-accent"
          :class="{
            'border-primary bg-primary/5': tenant.tenantCode === currentTenantCode,
          }"
          @click="handleSelectTenant(tenant)"
        >
          <!-- 企业头像 -->
          <VbenAvatar
            :src="getAvatarUrl(tenant.tenant?.avatar || '')"
            :size="40"
            class="flex-shrink-0"
            :style="{ borderRadius: '8px' }"
          >
            <template #fallback>
              <div
                class="flex size-full items-center justify-center text-sm font-medium text-white"
                :style="{ backgroundColor: getTenantColor(tenant.tenant?.id) }"
              >
                {{ getTenantInitial(tenant.tenant?.name) }}
              </div>
            </template>
          </VbenAvatar>

          <!-- 企业信息 -->
          <div class="min-w-0 flex-1">
            <div class="text-foreground mb-0.5 flex items-center gap-2 text-sm font-medium">
              <span class="truncate">{{ tenant.tenant?.name || $t('orgWidgets.ui.unnamedOrganization') }}</span>
              <span
                v-if="tenant.tenantCode === currentTenantCode"
                class="text-primary flex-shrink-0 text-xs"
              >
                {{ $t('orgWidgets.ui.current') }}
              </span>
            </div>
            <div class="text-muted-foreground truncate text-xs">
              {{ tenant.tenant?.desc || $t('orgWidgets.ui.noDescriptionYet') }}
            </div>
          </div>

          <!-- 右箭头图标 -->
          <VbenIcon
            icon="mdi:chevron-right"
            class="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            :size="20"
          />
        </div>

        <!-- 空状态 -->
        <div
          v-if="tenants.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <VbenIcon icon="mdi:office-building-outline" class="text-muted-foreground mb-2" :size="48" />
          <div class="text-muted-foreground text-sm">{{ $t('orgWidgets.ui.noCompanyYet') }}</div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="border-t border-border px-4 py-3">
        <div class="grid grid-cols-2 gap-2">
          <VbenButton
            variant="outline"
            class="cursor-pointer border-dashed transition-all duration-200 hover:border-primary hover:bg-accent"
            @click="openJoinTenantModal"
          >
            <VbenIcon icon="mdi:account-plus" class="mr-2" :size="18" />
            {{ $t('orgWidgets.ui.joinTheCompanyTeam') }}
          </VbenButton>
          <VbenButton
            variant="outline"
            class="cursor-pointer border-dashed transition-all duration-200 hover:border-primary hover:bg-accent"
            @click="openAddTenantModal"
          >
            <VbenIcon icon="mdi:plus-circle-outline" class="mr-2" :size="18" />
            {{ $t('orgWidgets.ui.newEnterprise') }}
          </VbenButton>
        </div>
      </div>
    </div>

    <!-- 新增企业模态框 -->
    <AddTenantModal ref="addTenantModalRef" @success="handleAddTenantSuccess" />
    <!-- 加入企业模态框 -->
    <JoinTenantModal ref="joinTenantModalRef" @success="handleJoinTenantSuccess" />
  </Modal>
</template>

<style scoped>
.org-modal :deep(.vben-modal-body) {
  padding: 0;
}
</style>
