/** 密码登录模式：统一页脚、登录页和过期弹窗的选择，并按浏览器来源及应用持久化。 */
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';

/** LoginPasswordMode 只控制密码登录的客户端摘要算法。 */
export type LoginPasswordMode = 'md5' | 'sha256';

/** parseLoginPasswordMode 只接受单个合法模式，忽略空值、重复 URL 参数及未知配置。 */
export function parseLoginPasswordMode(value: unknown): LoginPasswordMode | undefined {
  return value === 'md5' || value === 'sha256' ? value : undefined;
}

/** getLoginPasswordModeKey 用应用名和 ID 隔离记忆；localStorage 自身按来源隔离。 */
export function getLoginPasswordModeKey() {
  const appName = encodeURIComponent(import.meta.env.VITE_GLOB_APPNAME || 'app');
  const appId = encodeURIComponent(import.meta.env.VITE_GLOB_APPID || '');
  return `saas:password-login-mode:${appName}:${appId}`;
}

/** getDefaultLoginPasswordMode 生产优先读外置配置，旧构建配置缺项时兼容构建 env。 */
export function getDefaultLoginPasswordMode(): LoginPasswordMode {
  const runtimeValue = import.meta.env.PROD && typeof window !== 'undefined' ? window._VBEN_ADMIN_PRO_APP_CONF_?.VITE_GLOB_LOGIN_PASSWORD_MODE : undefined;
  return parseLoginPasswordMode(runtimeValue) ?? parseLoginPasswordMode(import.meta.env.VITE_GLOB_LOGIN_PASSWORD_MODE) ?? 'sha256';
}

/** readSavedMode 安全读取当前应用记忆；禁用存储和损坏值均不阻止登录。 */
function readSavedMode(key: string) {
  try {
    return parseLoginPasswordMode(window.localStorage.getItem(key));
  } catch {
    return undefined;
  }
}

/** usePasswordLoginModeStore 仅保存算法名，供同一应用的所有密码表单共享。 */
export const usePasswordLoginModeStore = defineStore('saas-password-login-mode', () => {
  /** storageKey 不包含用户账号，应用 ID 相同但宿主不同也不会互相覆盖。 */
  const storageKey = getLoginPasswordModeKey();
  /** rememberedMode 在浏览器存储不可用时保留本页会话中的显式选择。 */
  let rememberedMode = readSavedMode(storageKey);
  /** mode 是当前提交所用模式；env 默认值不写入记忆，以便后续配置仍能生效。 */
  const mode = ref<LoginPasswordMode>(rememberedMode ?? getDefaultLoginPasswordMode());

  /** selectMode 立即切换并尝试记忆；不修改 URL，避免 route.fullPath 触发表单重建。 */
  function selectMode(value: LoginPasswordMode) {
    mode.value = value;
    rememberedMode = value;
    try {
      window.localStorage.setItem(storageKey, value);
    } catch {
      // 存储权限和容量不影响本页登录，模式仍保留在内存中。
    }
  }

  /** enterLogin 登录页进入时以有效 URL 优先，其次应用记忆和 env；重复参数视为无效。 */
  function enterLogin(queryValue: unknown) {
    const urlMode = parseLoginPasswordMode(queryValue);
    if (urlMode) {
      selectMode(urlMode);
    } else {
      mode.value = readSavedMode(storageKey) ?? rememberedMode ?? getDefaultLoginPasswordMode();
    }
  }

  /** $reset 退出登录只重置认证态，保留用户的模式偏好供下次登录及过期弹窗使用。 */
  function $reset() {
    mode.value = readSavedMode(storageKey) ?? rememberedMode ?? getDefaultLoginPasswordMode();
  }

  return { mode, selectMode, enterLogin, $reset };
});

/** useLoginPasswordMode 登录路由应用 URL 选择；业务页中的过期弹窗只复用当前模式。 */
export function useLoginPasswordMode() {
  const store = usePasswordLoginModeStore();
  const route = useRoute();
  watch(
    () => route.fullPath,
    () => {
      if (route.name === 'Login') store.enterLogin(route.query.passwordMode);
    },
    { immediate: true },
  );
  return store;
}
