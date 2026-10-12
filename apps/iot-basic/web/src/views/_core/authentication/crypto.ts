// 本文件提供 org-iot-client 本地登录页副本使用的密码摘要工具。
import CryptoJS from 'crypto-js';

/**
 * sha256Hex 将明文字符串转换为 SHA-256 十六进制摘要。
 *
 * @param value 需要计算摘要的原始字符串
 * @returns 十六进制格式的 SHA-256 摘要
 */
export function sha256Hex(value: string) {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}
