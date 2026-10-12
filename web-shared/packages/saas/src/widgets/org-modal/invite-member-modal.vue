<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { $t } from '@vben/saas/locales';
import { CoreApi } from '@vben/api';
import { preferences } from '@vben/preferences';

import { computed, ref, watch } from 'vue';

import { useClipboard } from '@vueuse/core';

// import { CoreApi as Api } from '@vben/api';
import { useVbenModal } from '@vben-core/popup-ui';
import {
  VbenButton,
  VbenIcon,
  Input as VbenInput,
  VbenSelect,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@vben-core/shadcn-ui';
import { useMessage } from 'naive-ui';

import { buildInviteLink } from '../../views/_core/authentication/invite-link';

defineOptions({
  name: 'InviteMemberModal',
});

// ============================================
// 功能开关配置
// ============================================
// 是否启用手机邀请功能（后端未实现时设为 false）
const ENABLE_PHONE_INVITE = false;
// ============================================

const emit = defineEmits<{
  success: [];
}>();

const message = useMessage();
/** 邀请表单在阿拉伯语和乌尔都语下按阅读方向排列。 */
const isRtl = computed(() => preferences.app.locale === 'ar' || preferences.app.locale === 'ur-PK');

// 剪贴板功能
const { copy } = useClipboard({ legacy: true });

// 当前激活的 Tab
const activeTab = ref<'email' | 'phone' | 'code'>('email');

// 角色相关
const roleList = ref<CoreApi.RoleInfo[]>([]);
const selectedRoleId = ref<string>('');
const loadingRoles = ref(false);

// 邮箱/手机邀请相关
const addresses = ref('');
const addressError = ref('');
const sending = ref(false);

// 邀请码相关
const inviteCode = ref('');
const inviteCodeVisible = ref(false);
const inviteCodeValidUntil = ref<string>('');
const generating = ref(false);

const inviteLink = computed(() => (inviteCode.value ? buildInviteLink(inviteCode.value) : ''));

// 待处理邀请列表
const pendingInvites = ref<CoreApi.TenantUserInvite[]>([]);
const loadingPending = ref(false);

// 获取角色列表
async function fetchRoles() {
  loadingRoles.value = true;
  try {
    const res = await CoreApi.postApiV1SystemRoleInfoGetList({
      page: { page: 1, size: 100 },
    });
    roleList.value = res.list || [];
    // 默认选择第一个角色
    if (roleList.value.length > 0 && !selectedRoleId.value) {
      selectedRoleId.value = String(roleList.value[0]!.id || '');
    }
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.failedToObtainRoleList'), (text) => message.error(text));
  } finally {
    loadingRoles.value = false;
  }
}

// 验证地址（邮箱或手机号）
function validateAddresses(value: string): string | null {
  if (!value.trim()) {
    return $t('orgWidgets.ui.pleaseEnterYourEmailAddressOrMobilePhoneNumber');
  }

  const addresses = value
    .split(',')
    .map((addr) => addr.trim())
    .filter((addr) => addr);

  if (addresses.length === 0) {
    return $t('orgWidgets.ui.pleaseEnterAtLeastOneEmailAddressOrMobilePhoneNu');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^1[3-9]\d{9}$/;

  for (const addr of addresses) {
    if (!emailRegex.test(addr) && !phoneRegex.test(addr)) {
      return $t('orgWidgets.ui.invalidInviteAddress', { address: addr });
    }
  }

  return null;
}

// 发送邀请
async function handleSendInvite() {
  addressError.value = '';

  const error = validateAddresses(addresses.value);
  if (error) {
    addressError.value = error;
    return;
  }

  if (!selectedRoleId.value) {
    message.error($t('orgWidgets.ui.pleaseSelectARole'));
    return;
  }

  const addressArray = addresses.value
    .split(',')
    .map((addr) => addr.trim())
    .filter((addr) => addr);

  sending.value = true;
  try {
    await CoreApi.postApiV1SystemTenantUserInviteSend({
      roleID: selectedRoleId.value,
      addresses: addressArray,
    });
    message.success($t('orgWidgets.ui.invitationSentSuccessfully'));
    addresses.value = '';
    // 刷新待处理邀请列表
    await fetchPendingInvites();
    emit('success');
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.invitationSendingFailed'), (text) => message.error(text));
  } finally {
    sending.value = false;
  }
}

// 生成邀请码
async function generateInviteCode() {
  if (!selectedRoleId.value) {
    message.error($t('orgWidgets.ui.pleaseSelectARole'));
    return;
  }

  generating.value = true;
  try {
    const res = await CoreApi.postApiV1SystemTenantUserInviteCodeGen({
      roleID: selectedRoleId.value,
    });
    inviteCode.value = res.code || '';
    inviteCodeValidUntil.value = res.validUntilTime || '';
    message.success($t('orgWidgets.ui.invitationCodeGeneratedSuccessfully'));
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.failedToGenerateInvitationCode'), (text) => message.error(text));
  } finally {
    generating.value = false;
  }
}

// 重置邀请码
async function resetInviteCode() {
  await generateInviteCode();
}

// 复制邀请码
async function copyInviteCode() {
  if (!inviteCode.value) {
    message.warning($t('orgWidgets.ui.pleaseGenerateAnInvitationCodeFirst'));
    return;
  }

  try {
    await copy(inviteCode.value);
    message.success($t('orgWidgets.ui.theInvitationCodeHasBeenCopiedToTheClipboard'));
  } catch (error) {
    notifyRequestError(error, () => $t('orgWidgets.ui.copyFailedPleaseCopyManually'), (text) => message.error(text));
  }
}

async function copyInviteLink() {
  if (!inviteLink.value) {
    message.warning($t('orgWidgets.ui.pleaseGenerateAnInvitationLinkFirst'));
    return;
  }

  try {
    await copy(inviteLink.value);
    message.success($t('orgWidgets.ui.theInvitationLinkHasBeenCopiedToTheClipboard'));
  } catch (error) {
    notifyRequestError(error, () => $t('orgWidgets.ui.copyFailedPleaseCopyManually'), (text) => message.error(text));
  }
}

// 获取待处理邀请列表
async function fetchPendingInvites() {
  loadingPending.value = true;
  try {
    const res = await CoreApi.postApiV1SystemTenantUserInvitePendingGetList({});
    pendingInvites.value = res.list || [];
  } catch (error: any) {
    console.error($t('orgWidgets.ui.failedToObtainPendingInvitationList'), error);
  } finally {
    loadingPending.value = false;
  }
}

// 重新发送邀请
async function resendInvite(invite: CoreApi.TenantUserInvite) {
  try {
    await CoreApi.postApiV1SystemTenantUserInviteSend({
      roleID: invite.roleID,
      addresses: [invite.address],
    });
    message.success($t('orgWidgets.ui.theInvitationHasBeenResent'));
    await fetchPendingInvites();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.resendFailed'), (text) => message.error(text));
  }
}

// 取消邀请
async function cancelInvite(invite: CoreApi.TenantUserInvite) {
  try {
    await CoreApi.postApiV1SystemTenantUserInvitePendingDelete({
      inviteType: invite.inviteType,
      address: invite.address,
    });
    message.success($t('orgWidgets.ui.invitationCanceled'));
    await fetchPendingInvites();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('orgWidgets.ui.failedToCancelInvitation'), (text) => message.error(text));
  }
}

// 格式化日期时间
function formatDateTime(timestamp: string): string {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp));
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 判断邀请是否过期
function isExpired(validUntilTime: string): boolean {
  if (!validUntilTime) return false;
  return Number(validUntilTime) < Date.now();
}

// 格式化有效期显示
const validUntilText = computed(() => {
  if (!inviteCodeValidUntil.value) return '';
  const dateStr = formatDateTime(inviteCodeValidUntil.value);
  return $t('orgWidgets.ui.invitationCodeExpiry', { date: dateStr });
});

// 获取角色名称
function getRoleName(roleId: string): string {
  const role = roleList.value.find((r) => r.id === roleId);
  return role?.name || roleId || $t('orgWidgets.ui.unknownCharacter');
}

// 监听地址输入变化
watch(addresses, (newVal) => {
  if (addressError.value && newVal) {
    // 清除之前的错误（如果有输入）
    addressError.value = '';
  }
});

// 监听 Tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'code' && !inviteCode.value) {
    // 切换到邀请码 Tab 时，如果还没有生成过，自动生成
    if (selectedRoleId.value) {
      generateInviteCode();
    }
  } else if ((newTab === 'email' || newTab === 'phone') && pendingInvites.value.length === 0) {
    // 切换到邀请 Tab 时，加载待处理列表
    fetchPendingInvites();
  }
});

const [Modal, modalApi] = useVbenModal({
  title: $t('orgWidgets.ui.inviteMembers'),
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      // 打开时重置状态
      activeTab.value = 'email';
      addresses.value = '';
      addressError.value = '';
      inviteCode.value = '';
      inviteCodeVisible.value = false;
      inviteCodeValidUntil.value = '';
      selectedRoleId.value = '';
      // 加载角色列表和待处理邀请
      fetchRoles();
      fetchPendingInvites();
    }
  },
});

/** 邀请弹窗标题随个人语言即时更新。 */
watch(() => preferences.app.locale, () => modalApi.setState({ title: $t('orgWidgets.ui.inviteMembers') }));

defineExpose({
  open: () => modalApi.open(),
});
</script>

<template>
  <Modal class="invite-member-modal">
    <div class="px-4 pb-4" :dir="isRtl ? 'rtl' : 'ltr'">
      <Tabs v-model="activeTab" default-value="email" :dir="isRtl ? 'rtl' : 'ltr'" class="w-full">
        <TabsList :class="ENABLE_PHONE_INVITE ? 'grid w-full grid-cols-3 mb-4' : 'grid w-full grid-cols-2 mb-4'">
          <TabsTrigger value="email" class="cursor-pointer transition-all duration-200">
            {{ $t('orgWidgets.ui.emailInvitation') }}
          </TabsTrigger>
          <TabsTrigger
            v-if="ENABLE_PHONE_INVITE"
            value="phone"
            class="cursor-pointer transition-all duration-200"
          >
            {{ $t('orgWidgets.ui.mobileInvitation') }}
          </TabsTrigger>
          <TabsTrigger value="code" class="cursor-pointer transition-all duration-200">
            {{ $t('orgWidgets.ui.generateInvitationLink') }}
          </TabsTrigger>
        </TabsList>

        <!-- 邮箱邀请 Tab -->
        <TabsContent value="email" class="space-y-4">
          <div class="space-y-4">
            <!-- 地址输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.emailAddress') }}</label>
              <Textarea
                v-model="addresses"
                :placeholder="$t('orgWidgets.ui.emailAddressesSeparatedByCommasEgEmail1ExampleCo')"
                :class="{ 'border-destructive': addressError }"
                class="min-h-[80px]"
              />
              <p v-if="addressError" class="text-sm text-destructive mt-1">{{ addressError }}</p>
            </div>

            <!-- 角色选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.character') }}</label>
              <VbenSelect
                v-model="selectedRoleId"
                :options="
                  roleList.map((role) => ({
                    label: role.name || String(role.id),
                    value: String(role.id),
                  }))
                "
                :placeholder="$t('orgWidgets.ui.pleaseSelectARole')"
                allow-clear
              />
            </div>

            <!-- 发送按钮 -->
            <VbenButton
              type="primary"
              :loading="sending"
              :disabled="!addresses.trim() || !selectedRoleId || sending"
              class="w-full cursor-pointer transition-colors duration-200"
              @click="handleSendInvite"
            >
              {{ $t('orgWidgets.ui.sendInvitation') }}
            </VbenButton>

            <!-- 待处理邀请列表 -->
            <div v-if="pendingInvites.filter((i) => i.inviteType === 'email').length > 0" class="mt-6 space-y-2">
              <h3 class="text-sm font-medium mb-3">{{ $t('orgWidgets.ui.pendingInvitations') }}</h3>
              <div class="space-y-2 max-h-[300px] overflow-y-auto">
                <div
                  v-for="(invite, index) in pendingInvites.filter((i) => i.inviteType === 'email')"
                  :key="index"
                  class="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent transition-colors duration-200"
                  :class="{
                    'opacity-60': isExpired(invite.validUntilTime),
                  }"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">{{ invite.address }}</span>
                      <span
                        v-if="isExpired(invite.validUntilTime)"
                        class="text-xs text-destructive flex items-center gap-1"
                      >
                        <VbenIcon icon="lucide:clock" class="size-3" />
                        {{ $t('orgWidgets.ui.expired') }}
                      </span>
                    </div>
                    <div class="text-xs text-muted-foreground mt-1">
                      {{ getRoleName(invite.roleID) }} ·
                      {{ formatDateTime(invite.createdTime) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <VbenButton
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer"
                      @click="resendInvite(invite)"
                    >
                      {{ $t('orgWidgets.ui.resend') }}
                    </VbenButton>
                    <VbenButton
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer text-destructive hover:text-destructive"
                      @click="cancelInvite(invite)"
                    >
                      {{ $t('orgWidgets.ui.cancel') }}
                    </VbenButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- 手机邀请 Tab -->
        <TabsContent value="phone" class="space-y-4">
          <div class="space-y-4">
            <!-- 地址输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.mobilePhoneNumber') }}</label>
              <Textarea
                v-model="addresses"
                :placeholder="$t('orgWidgets.ui.mobilePhoneNumbersSeparatedByCommasEg13800138000')"
                :class="{ 'border-destructive': addressError }"
                class="min-h-[80px]"
              />
              <p v-if="addressError" class="text-sm text-destructive mt-1">{{ addressError }}</p>
            </div>

            <!-- 角色选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.character') }}</label>
              <VbenSelect
                v-model="selectedRoleId"
                :options="
                  roleList.map((role) => ({
                    label: role.name || String(role.id),
                    value: String(role.id),
                  }))
                "
                :placeholder="$t('orgWidgets.ui.pleaseSelectARole')"
                allow-clear
              />
            </div>

            <!-- 发送按钮 -->
            <VbenButton
              type="primary"
              :loading="sending"
              :disabled="!addresses.trim() || !selectedRoleId || sending"
              class="w-full cursor-pointer transition-colors duration-200"
              @click="handleSendInvite"
            >
              {{ $t('orgWidgets.ui.sendInvitation') }}
            </VbenButton>

            <!-- 待处理邀请列表 -->
            <div v-if="pendingInvites.filter((i) => i.inviteType === 'phone').length > 0" class="mt-6 space-y-2">
              <h3 class="text-sm font-medium mb-3">{{ $t('orgWidgets.ui.pendingInvitations') }}</h3>
              <div class="space-y-2 max-h-[300px] overflow-y-auto">
                <div
                  v-for="(invite, index) in pendingInvites.filter((i) => i.inviteType === 'phone')"
                  :key="index"
                  class="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent transition-colors duration-200"
                  :class="{
                    'opacity-60': isExpired(invite.validUntilTime),
                  }"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">{{ invite.address }}</span>
                      <span
                        v-if="isExpired(invite.validUntilTime)"
                        class="text-xs text-destructive flex items-center gap-1"
                      >
                        <VbenIcon icon="lucide:clock" class="size-3" />
                        {{ $t('orgWidgets.ui.expired') }}
                      </span>
                    </div>
                    <div class="text-xs text-muted-foreground mt-1">
                      {{ getRoleName(invite.roleID) }} ·
                      {{ formatDateTime(invite.createdTime) }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-4">
                    <VbenButton
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer"
                      @click="resendInvite(invite)"
                    >
                      {{ $t('orgWidgets.ui.resend') }}
                    </VbenButton>
                    <VbenButton
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer text-destructive hover:text-destructive"
                      @click="cancelInvite(invite)"
                    >
                      {{ $t('orgWidgets.ui.cancel') }}
                    </VbenButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- 生成邀请码 Tab -->
        <TabsContent value="code" class="space-y-4">
          <div class="space-y-4">
            <!-- 邀请链接输入框 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.invitationLink') }}</label>
              <VbenInput
                :model-value="inviteLink"
                readonly
                :placeholder="$t('orgWidgets.ui.pleaseGenerateAnInvitationLinkFirst')"
              />
            </div>

            <!-- 邀请码输入框 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.invitationCode') }}</label>
              <div class="relative">
                <VbenInput
                  :model-value="inviteCodeVisible ? inviteCode : inviteCode ? '**********' : ''"
                  readonly
                  :placeholder="$t('orgWidgets.ui.pleaseGenerateAnInvitationCodeFirst')"
                  class="pr-20"
                />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <VbenButton
                    v-if="inviteCode"
                    variant="ghost"
                    size="sm"
                    class="h-7 w-7 p-0 cursor-pointer"
                    @click="inviteCodeVisible = !inviteCodeVisible"
                  >
                    <VbenIcon
                      :icon="inviteCodeVisible ? 'lucide:eye-off' : 'lucide:eye'"
                      class="size-4"
                    />
                  </VbenButton>
                </div>
              </div>
              <p v-if="validUntilText" class="text-xs text-muted-foreground mt-1">
                {{ validUntilText }}
              </p>
            </div>

            <!-- 角色选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">{{ $t('orgWidgets.ui.character') }}</label>
              <VbenSelect
                v-model="selectedRoleId"
                :options="
                  roleList.map((role) => ({
                    label: role.name || String(role.id),
                    value: String(role.id),
                  }))
                "
                :placeholder="$t('orgWidgets.ui.pleaseSelectARole')"
                allow-clear
              />
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2 pt-2">
              <VbenButton
                variant="outline"
                class="flex-1 cursor-pointer transition-colors duration-200"
                @click="modalApi.close()"
              >
                {{ $t('orgWidgets.ui.cancel') }}
              </VbenButton>
              <VbenButton
                variant="outline"
                :loading="generating"
                :disabled="generating || !selectedRoleId"
                class="flex-1 cursor-pointer transition-colors duration-200"
                @click="resetInviteCode"
              >
                {{ $t('orgWidgets.ui.reset') }}
              </VbenButton>
              <VbenButton
                type="primary"
                :disabled="!inviteCode"
                class="flex-1 cursor-pointer transition-colors duration-200"
                @click="copyInviteCode"
              >
                {{ $t('orgWidgets.ui.copyInvitationCode') }}
              </VbenButton>
              <VbenButton
                type="primary"
                :disabled="!inviteLink"
                class="flex-1 cursor-pointer transition-colors duration-200 bg-green-600 hover:bg-green-700"
                @click="copyInviteLink"
              >
                {{ $t('orgWidgets.ui.copyLink') }}
              </VbenButton>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </Modal>
</template>

<style scoped>
.invite-member-modal :deep(.vben-modal-body) {
  padding: 0;
}

:global(html[dir='rtl'] .invite-member-modal h2) {
  text-align: right;
  padding-right: 3rem;
}
</style>
