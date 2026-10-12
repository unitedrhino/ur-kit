import CryptoJS from 'crypto-js';

export function sha256Hex(value: string) {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}
