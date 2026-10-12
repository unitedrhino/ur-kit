import type { CoreApi } from '@vben/api';

import { useSystemConfigStore } from '@vben/stores';

const PASSWORD_SETUP_PENDING_KEY = 'force-set-password-pending';
const BOOL_YES = 1;
const BOOL_NO = 2;
const DEFAULT_REMIND_SET_PASSWORD = BOOL_YES;
const DEFAULT_FORCE_SET_PASSWORD = BOOL_NO;

/**
 * 根据 passLevel 检查密码强度
 * passLevel 定义：
 * 1: 长度大于等于8位即可
 * 2: 包含数字,大写字母,小写字母,特殊字符起码两种
 * 3: 包含数字,大写字母,小写字母,特殊字符起码3种
 * 4: 包含数字,大写字母,小写字母,特殊字符（!@#~$%^&*()+|_）全部4种
 */

const SPECIAL_CHARS_REGEX = /[!@#~$%^&*()+|_]/;

/**
 * 计算密码包含的字符类型数量
 */
function countCharTypes(password: string): number {
  const hasDigit = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = SPECIAL_CHARS_REGEX.test(password);
  return [hasDigit, hasUpper, hasLower, hasSpecial].filter(Boolean).length;
}

/**
 * 获取当前系统配置的 passLevel
 */
export function getPassLevel(): number {
  try {
    const store = useSystemConfigStore();
    return store.systemConfig?.user?.passLevel ?? 2;
  } catch {
    return 2;
  }
}

function normalizeBoolFlag(value: number | null | undefined, fallback: number): number {
  return value === BOOL_YES || value === BOOL_NO ? value : fallback;
}

export function isPasswordUnset(
  userInfo?: Pick<CoreApi.UserInfo, 'password'> | null,
): boolean {
  return !userInfo?.password?.trim();
}

export function shouldRemindSetPassword(
  systemConfig?: Pick<CoreApi.SysConfigInfo, 'user'> | null,
  userInfo?: Pick<CoreApi.UserInfo, 'password'> | null,
): boolean {
  if (!isPasswordUnset(userInfo)) {
    return false;
  }
  return normalizeBoolFlag(
    systemConfig?.user?.remindSetPassword,
    DEFAULT_REMIND_SET_PASSWORD,
  ) === BOOL_YES;
}

export function shouldForceSetPassword(
  systemConfig?: Pick<CoreApi.SysConfigInfo, 'user'> | null,
  userInfo?: Pick<CoreApi.UserInfo, 'password'> | null,
): boolean {
  if (!isPasswordUnset(userInfo)) {
    return false;
  }
  return normalizeBoolFlag(
    systemConfig?.user?.forceSetPassword,
    DEFAULT_FORCE_SET_PASSWORD,
  ) === BOOL_YES;
}

export function getPasswordSetupPath(options?: {
  force?: boolean;
  reminder?: boolean;
}): string {
  const params = new URLSearchParams({ openChangePassword: '1', tab: 'settings' });
  if (options?.force) {
    params.set('forceSetPassword', '1');
  }
  if (options?.reminder) {
    params.set('passwordReminder', '1');
  }
  return `/user/settings?${params.toString()}`;
}

export function markForcePasswordSetupPending(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(PASSWORD_SETUP_PENDING_KEY, '1');
}

export function clearForcePasswordSetupPending(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(PASSWORD_SETUP_PENDING_KEY);
}

export function isForcePasswordSetupPending(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.sessionStorage.getItem(PASSWORD_SETUP_PENDING_KEY) === '1';
}

/**
 * 根据 passLevel 获取密码验证错误信息，返回 null 表示校验通过
 */
export function validatePasswordByLevel(
  password: string,
  passLevel?: number,
): string | null {
  const level = passLevel ?? getPassLevel();

  if (password.length < 8) {
    return '密码长度至少8位';
  }

  if (level >= 2) {
    const types = countCharTypes(password);
    if (level === 2 && types < 2) {
      return '密码需包含数字、大写字母、小写字母、特殊字符中至少两种';
    }
    if (level === 3 && types < 3) {
      return '密码需包含数字、大写字母、小写字母、特殊字符中至少三种';
    }
    if (level >= 4 && types < 4) {
      return '密码必须包含数字、大写字母、小写字母和特殊字符（!@#~$%^&*()+|_）';
    }
  }

  return null;
}

/**
 * 获取 passLevel 对应的提示文案
 */
export function getPasswordHint(passLevel?: number): string {
  const level = passLevel ?? getPassLevel();
  switch (level) {
    case 1: {
      return '密码长度至少8位';
    }
    case 2: {
      return '密码需包含数字、大写字母、小写字母、特殊字符中至少两种';
    }
    case 3: {
      return '密码需包含数字、大写字母、小写字母、特殊字符中至少三种';
    }
    case 4: {
      return '密码必须包含数字、大写字母、小写字母和特殊字符';
    }
    default: {
      return '密码需包含数字、大写字母、小写字母、特殊字符中至少两种';
    }
  }
}
