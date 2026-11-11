/** 文件说明：第一方微信H5面板只向原生固定设备设置导航，不接受HTML提供的路由。 */
/** MiniBridge 描述官方微信JS SDK的最小导航能力。 */
interface MiniBridge { miniProgram: { navigateTo(options: { url: string; success(): void; fail(): void }): void; getEnv(callback: (env: { miniprogram?: boolean }) => void): void } }
/** nativeIdentity 仅在一次性登录交接成功后设置，刷新H5不会凭空恢复原生桥。 */
let nativeIdentity: { productID: string; deviceName: string } | null = null;
/** bridge 保存通过官方运行环境检查的微信桥，不是模拟器对象。 */
let bridge: MiniBridge | null = null;
/** prepareMiniPanelNavigation 只在微信内加载官方SDK并确认小程序环境，普通H5继续原路由。 */
export async function prepareMiniPanelNavigation(identity: { productID: string; deviceName: string }): Promise<void> {
  // #ifdef H5
  if (!/MicroMessenger/i.test(navigator.userAgent)) return;
  const sdk = await new Promise<MiniBridge>((resolve, reject) => {
    const existing = (window as unknown as { wx?: MiniBridge }).wx;
    if (existing?.miniProgram) { resolve(existing); return; }
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); reject(new Error('微信设置桥加载超时，请返回设备重试')); }, 8000);
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => { clearTimeout(timer); const value = (window as unknown as { wx?: MiniBridge }).wx; value?.miniProgram ? resolve(value) : reject(new Error('微信设置桥不可用')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('微信设置桥加载失败，请重试')); };
    document.head.appendChild(script);
  });
  const isMini = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 3000);
    sdk.miniProgram.getEnv((env) => { clearTimeout(timer); resolve(env.miniprogram === true); });
  });
  if (isMini) { nativeIdentity = { ...identity }; bridge = sdk; }
  // #endif
}
/** isMiniPanelWebHost 标记已校验微信整页H5，供详情隐藏重复导航栏。 */
export function isMiniPanelWebHost(): boolean { return !!nativeIdentity && !!bridge; }
/** openMiniPanelSettings 只允许当前交接设备进入原生设置；其他H5场景返回false。 */
export async function openMiniPanelSettings(identity: { productID: string; deviceName: string }): Promise<boolean> {
  if (!nativeIdentity || !bridge) return false;
  if (identity.productID !== nativeIdentity.productID || identity.deviceName !== nativeIdentity.deviceName) throw new Error('设备上下文已变化，请返回设备重新打开');
  await new Promise<void>((resolve, reject) => bridge!.miniProgram.navigateTo({
    url: '/packageDevice/pages/settings/index?productID=' + encodeURIComponent(identity.productID) + '&deviceName=' + encodeURIComponent(identity.deviceName),
    success: resolve, fail: () => reject(new Error('无法打开设备设置，请返回重试')),
  }));
  return true;
}
