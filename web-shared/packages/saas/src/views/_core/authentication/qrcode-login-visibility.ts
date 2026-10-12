/**
 * qrcode-login-visibility 统一判断扫码页是否还有可返回的其他登录方式。
 */

/** isWxOpenOnlyLogin 判断应用是否只允许微信开放平台扫码登录。 */
export function isWxOpenOnlyLogin(loginTypes: null | readonly string[] | undefined): boolean {
  return loginTypes?.length === 1 && loginTypes[0] === 'wxOpen';
}

/** canShowQrCodeBack 仅在登录配置已就绪且存在其他登录方式时显示返回按钮。 */
export function canShowQrCodeBack(showBack: boolean, loginTypes: null | string[]): boolean {
  if (!showBack || loginTypes === null) return false;
  return !isWxOpenOnlyLogin(loginTypes);
}
