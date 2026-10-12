import CryptoJS from 'crypto-js';

import { isString } from './type';

// 密钥优先从环境变量读取；未设置时动态生成随机密钥并打印警告
let SECRET_KEY: string = (import.meta as any).env?.VITE_APP_STORE_SECURE_KEY || '';

if (!SECRET_KEY) {
  // 动态生成 32 字节随机密钥，每次页面加载重新生成
  // 这意味着刷新后之前加密的 localStorage 数据将无法解密（可接受，GoView 编辑器状态丢失仅导致重新配置）
  const randomWords = CryptoJS.lib.WordArray.random(32);
  SECRET_KEY = randomWords.toString(CryptoJS.enc.Base64).slice(0, 32);
  console.warn(
    '[crypto] 未设置 VITE_APP_STORE_SECURE_KEY 环境变量，已动态生成随机密钥。' +
      '刷新页面后之前加密的本地数据将无法解密。建议在部署时配置固定的环境变量。',
  );
}

const KEY = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(32, '0').slice(0, 32));

/**
 * 加密（CBC 模式 + 随机 IV）
 * @param data { string }
 * @returns base64 编码的 "iv:ciphertext" 格式
 */
export const cryptoEncode = (data: string): string => {
  if (!isString(data)) return '';
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(data, KEY, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // 将 IV 和密文拼接，便于解密时提取
  return `${iv.toString(CryptoJS.enc.Base64)}:${encrypted.toString()}`;
};

/**
 * 解密
 * @param data { string } "iv:ciphertext" 格式
 * @returns
 */
export const cryptoDecode = (data: string): string => {
  if (!isString(data)) return '';
  try {
    // 兼容旧版 ECB 格式（不含 ':'）
    if (!data.includes(':')) {
      const legacyKey = 'mt';
      const decrypted = CryptoJS.AES.decrypt(data, legacyKey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    }
    // 只按第一个 ':' 分割，避免密文中包含 ':' 导致截断
    const idx = data.indexOf(':');
    const ivBase64 = data.slice(0, Math.max(0, idx));
    const ciphertext = data.slice(Math.max(0, idx + 1));
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const decrypted = CryptoJS.AES.decrypt(ciphertext, KEY, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.warn('[cryptoDecode] 解密失败:', error);
    return '';
  }
};
