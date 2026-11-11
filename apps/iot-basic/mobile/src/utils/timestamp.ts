/** 客户端时间展示边界：兼容旧接口秒值和当前接口毫秒值。 */
/** timestampMillis 将合法时间戳转换为毫秒，缺失或非有限值返回 0。 */
export function timestampMillis(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value < 100_000_000_000 ? value * 1000 : value;
}
