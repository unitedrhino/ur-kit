/** 设备默认图片：只在产品未配置图片或图片失效时使用。 */
/** defaultDeviceImage 按明确的设备类型与常见名称识别网关、水表、电表，未知类型返回空值。 */
export function defaultDeviceImage(deviceType: number, productName: string, deviceAlias: string): string {
  if (deviceType === 2) return '/static/device-defaults/gateway.jpg';
  const name = `${productName} ${deviceAlias}`.toLowerCase();
  if (/网关|gateway|opengw|edge[s_-]*gateway/.test(name)) return '/static/device-defaults/gateway.jpg';
  if (/水表|water[\s_-]*meter/.test(name)) return '/static/device-defaults/water-meter.jpg';
  if (/电表|电能表|electric(?:ity)?[\s_-]*meter|power[\s_-]*meter/.test(name)) return '/static/device-defaults/electric-meter.jpg';
  return '';
}

/** deviceImageCandidates 按设备、产品和分类默认图的顺序返回去重后的图片地址。 */
export function deviceImageCandidates(deviceImg: string, productImg: string, deviceType: number, productName: string, deviceAlias: string): string[] {
  return [...new Set([deviceImg, productImg, defaultDeviceImage(deviceType, productName, deviceAlias)].filter(Boolean))];
}
