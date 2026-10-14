// 本文件为 Node HTTP/RPC 客户端统一保护数字 ID 请求头，避免 Number 丢失 64 位精度。

// headerID 将安全整数、BigInt 或十进制字符串转换为请求头；不安全 Number 必须改用字符串或 BigInt。
export function headerID(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new Error('ID 数字必须是安全整数；大整数请使用十进制字符串或 BigInt');
  }
  return String(value);
}
