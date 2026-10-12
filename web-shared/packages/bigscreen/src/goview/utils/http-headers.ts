import { useSessionStore } from '@vben/saas';
import { useAccessStore, useProjectStore } from '@vben/stores';

import { useCookies } from '@vueuse/integrations/useCookies';

import { restoreAccessTokenFromCookie } from '../../shared/auth';

/**
 * 为 GoView 编辑器中的原生 fetch() 调用构建标准请求头。
 *
 * 包含: token, app-id, tenant-code（如有）。
 * 不包含 Content-Type —— 由调用方通过 extra 参数按需添加：
 *   - JSON 请求: getEditorFetchHeaders({ 'Content-Type': 'application/json' })
 *   - FormData 上传: getEditorFetchHeaders()  （浏览器自动设置 Content-Type）
 */
export function getEditorFetchHeaders(extra?: Record<string, string>): Record<string, string> {
  const cookies = useCookies(['org-id'], { doNotParse: true });
  const sessionStore = useSessionStore();
  const projectStore = useProjectStore();
  const token = useAccessStore().accessToken || restoreAccessTokenFromCookie('Editor Fetch Headers');
  const tenantCode = sessionStore.tenantCode || cookies.get('org-id');
  const projectID = projectStore.currentProjectID || '';
  return {
    token: token as string,
    'app-id': import.meta.env.VITE_GLOB_APPID || '2',
    ...(tenantCode ? { 'tenant-code': tenantCode } : {}),
    ...(projectID ? { 'project-id': projectID } : {}),
    ...extra,
  };
}
