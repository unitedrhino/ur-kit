<!-- org-iot-client 专用用户下拉：保留修改密码与退出登录，移除组织切换区。 -->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, ref, useTemplateRef, watch } from 'vue';

import { useHoverToggle } from '@vben/hooks';
import { LockKeyhole, LogOut } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences, usePreferences } from '@vben/preferences';
import { isWindowsOs } from '@vben/utils';

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@vben-core/shadcn-ui';

import { useMagicKeys, whenever } from '@vueuse/core';
import { NButton, NInput, NModal, useMessage } from 'naive-ui';

import SaasAvatar from '../../../../packages/saas/src/components/saas-avatar.vue';
import { sha256Hex } from '../views/_core/authentication/crypto';

interface Props {
  /** 头像地址。 */
  avatar?: string;
  /** 用户辅助说明，优先展示邮箱、手机号或创建时间。 */
  description?: string;
  /** 是否启用快捷键。 */
  enableShortcutKey?: boolean;
  /** 用户身份标签文本。 */
  tagText?: string;
  /** 用户显示名称。 */
  text?: string;
  /** 触发方式。 */
  trigger?: 'both' | 'click' | 'hover';
  /** hover 触发时的延迟时间。 */
  hoverDelay?: number;
}

defineOptions({
  name: 'UserDropdownClient',
});

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  description: '',
  enableShortcutKey: true,
  tagText: '',
  text: '',
  trigger: 'click',
  hoverDelay: 500,
});

const emit = defineEmits<{ logout: [] }>();

const { globalLockScreenShortcutKey, globalLogoutShortcutKey } = usePreferences();

const refTrigger = useTemplateRef('refTrigger');
const refContent = useTemplateRef('refContent');
const [openPopover, hoverWatcher] = useHoverToggle([refTrigger, refContent], () => props.hoverDelay);
const message = useMessage();
/** 修改密码弹窗显示状态。 */
const changePasswordOpen = ref(false);
/** 旧密码明文，仅保存在当前表单输入态，提交前会摘要。 */
const oldPassword = ref('');
/** 新密码明文，仅保存在当前表单输入态，提交前会摘要。 */
const newPassword = ref('');
/** 新密码确认值，用于提交前一致性校验。 */
const confirmPassword = ref('');
/** 修改密码提交状态。 */
const changingPassword = ref(false);
const logoutOpen = ref(false);

watch(
  () => props.trigger === 'hover' || props.trigger === 'both',
  (val) => {
    if (val) {
      hoverWatcher.enable();
    } else {
      hoverWatcher.disable();
    }
  },
  {
    immediate: true,
  },
);

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));

const enableLogoutShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLogoutShortcutKey.value;
});

const enableLockScreenShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLockScreenShortcutKey.value;
});

const enableShortcutKey = computed(() => {
  return props.enableShortcutKey && preferences.shortcutKeys.enable;
});

function resetChangePasswordForm() {
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  changingPassword.value = false;
}

function handleOpenChangePassword() {
  openPopover.value = false;
  changePasswordOpen.value = true;
}

function validateChangePasswordForm() {
  if (!oldPassword.value) {
    return $t('console.changePwd.oldRequired');
  }
  if (!newPassword.value) {
    return $t('console.changePwd.newRequired');
  }
  if (!confirmPassword.value) {
    return $t('orgIotClient.layout.confirmPwdPlaceholder');
  }
  if (newPassword.value !== confirmPassword.value) {
    return $t('orgIotClient.layout.confirmMismatch');
  }
  if (newPassword.value === oldPassword.value) {
    return $t('orgIotClient.layout.newSameAsOld');
  }
  return '';
}

async function handleSubmitChangePassword() {
  const validationError = validateChangePasswordForm();
  if (validationError) {
    message.warning(validationError);
    return;
  }

  try {
    changingPassword.value = true;
    const { CoreApi } = await import('@vben/api');
    await CoreApi.postApiV1SystemUserSelfChangePwd({
      type: CoreApi.UserChangePwdReqTypeEnum.PWD,
      oldPassword: sha256Hex(oldPassword.value),
      password: sha256Hex(newPassword.value),
    });
    message.success($t('orgIotClient.layout.changePwdSuccess'));
    changePasswordOpen.value = false;
    resetChangePasswordForm();
  } catch (error: any) {
    const errorMsg = error?.msg || error?.message || $t('console.changePwd.failed');
    notifyRequestError(error, () => errorMsg, (text) => message.error(text));
  } finally {
    changingPassword.value = false;
  }
}

function handleLogout() {
  logoutOpen.value = true;
  openPopover.value = false;
}

function handleSubmitLogout() {
  emit('logout');
  logoutOpen.value = false;
}

if (enableShortcutKey.value) {
  const keys = useMagicKeys();
  whenever(keys['Alt+KeyQ']!, () => {
    if (enableLogoutShortcutKey.value) {
      handleLogout();
    }
  });

  whenever(keys['Alt+KeyL']!, () => {
    if (enableLockScreenShortcutKey.value) {
      openPopover.value = false;
    }
  });
}
</script>

<template>
  <NModal
    v-model:show="changePasswordOpen"
    preset="card"
    class="w-[min(460px,calc(100vw-2rem))]"
    :title="$t('orgIotClient.layout.changePassword')"
    :bordered="false"
    :mask-closable="!changingPassword"
    @after-leave="resetChangePasswordForm"
  >
    <div class="flex flex-col gap-6 py-2">
      <label class="grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm">
        <span class="text-foreground">
          {{ $t('orgIotClient.layout.oldPassword') }}
          <span class="text-error ml-1">*</span>
        </span>
        <NInput
          v-model:value="oldPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('console.changePwd.oldRequired')"
          clearable
          @keydown.enter="handleSubmitChangePassword"
        />
      </label>
      <label class="grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm">
        <span class="text-foreground">
          {{ $t('console.changePwd.newPassword') }}
          <span class="text-error ml-1">*</span>
        </span>
        <NInput
          v-model:value="newPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('console.changePwd.newRequired')"
          clearable
          @keydown.enter="handleSubmitChangePassword"
        />
      </label>
      <label class="grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm">
        <span class="text-foreground">
          {{ $t('authentication.confirmPassword') }}
          <span class="text-error ml-1">*</span>
        </span>
        <NInput
          v-model:value="confirmPassword"
          type="password"
          show-password-on="click"
          :placeholder="$t('orgIotClient.layout.confirmPwdPlaceholder')"
          clearable
          @keydown.enter="handleSubmitChangePassword"
        />
      </label>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton :disabled="changingPassword" @click="changePasswordOpen = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="changingPassword" @click="handleSubmitChangePassword"> {{ $t('orgIotClient.layout.saveSubmit') }} </NButton>
      </div>
    </template>
  </NModal>

  <NModal v-model:show="logoutOpen" preset="dialog" :title="$t('common.prompt')" :show-icon="false">
    <div class="px-1 py-2">{{ $t('ui.widgets.logoutTip') }}</div>
    <template #action>
      <NButton @click="logoutOpen = false">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" @click="handleSubmitLogout">{{ $t('common.confirm') }}</NButton>
    </template>
  </NModal>

  <DropdownMenu v-model:open="openPopover">
    <DropdownMenuTrigger ref="refTrigger" :disabled="props.trigger === 'hover'">
      <div class="hover:bg-accent ml-1 mr-2 cursor-pointer rounded-full p-1.5">
        <div class="hover:text-accent-foreground flex-center">
          <SaasAvatar :avatar="avatar" :name="text" :size="32" class="rounded-full" />
        </div>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-2 w-[320px] max-w-[calc(100vw-1rem)] p-0 pb-2">
      <div ref="refContent">
        <div class="px-3 pb-2 pt-3">
          <div class="flex items-center gap-3">
            <SaasAvatar :avatar="avatar" :name="text" :size="40" class="rounded-full" />
            <div class="min-w-0 flex-1">
              <div v-if="tagText || text || $slots.tagText" class="text-foreground mb-0.5 flex items-center text-sm font-medium">
                <span class="truncate">{{ text }}</span>
                <slot name="tagText">
                  <Badge v-if="tagText" class="ml-2 flex-shrink-0 text-green-400">
                    {{ tagText }}
                  </Badge>
                </slot>
              </div>
              <div class="text-muted-foreground truncate text-xs font-normal">
                {{ description }}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem class="mx-1 flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm" @click="handleOpenChangePassword">
          <LockKeyhole class="mr-2 size-4" />
          <span>{{ $t('orgIotClient.layout.changePassword') }}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem class="mx-1 flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm" @click="handleLogout">
          <LogOut class="mr-2 size-4" />
          <span>{{ $t('common.logout') }}</span>
          <DropdownMenuShortcut v-if="enableLogoutShortcutKey" class="ml-auto"> {{ altView }} Q </DropdownMenuShortcut>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
