/** 文件说明：构建企业创建授权提示，并识别后端授权限制错误。 */
import { $t } from '@vben/saas/locales';

/**
 * 构建企业创建授权提示文案
 * @param userOwnTenantLimit - 用户可免费创建的企业数量上限，0 表示不允许免费创建
 * @returns 提示文案
 */
export function buildTenantLicensePrompt(userOwnTenantLimit: number): string {
  if (userOwnTenantLimit <= 0) {
    return $t('orgWidgets.ui.freeOrgCreationDisabled');
  }
  return $t('orgWidgets.ui.freeOrgLimitReached', { count: userOwnTenantLimit });
}

/**
 * 判断后端错误是否表示需要企业授权码（License）
 * @param error - 后端返回的错误对象
 * @returns 是否需要 License
 */
export function shouldRequireTenantLicense(error: any): boolean {
  if (!error) return false;

  // 后端 Parameter 错误码为 100006
  const code = error.code ?? error.Code;
  const msg = error.msg ?? error.message ?? error.Msg ?? '';

  if (code === 100006) {
    // 参数错误中包含"达到上限"或"提供授权码"即表示需要 License
    if (
      typeof msg === 'string' &&
      (msg.includes('达到上限') || msg.includes('提供授权码'))
    ) {
      return true;
    }
  }

  return false;
}
