/**
 * 文件说明：告警通知直接填写联系人（手机号/邮箱）的纯函数工具。
 * 供 StepNotify 的直接填写输入与单测复用，保持校验规则与 UI 解耦。
 */

/** 手机号格式：国内 11 位手机号。 */
export const PHONE_PATTERN = /^1[3-9]\d{9}$/;

/** 邮箱格式：简单本地域校验，避免明显非法输入。 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 直接联系人类型：phone 手机号 / email 邮箱。 */
export type DirectContactKind = 'phone' | 'email';

/** 校验结果：ok 通过时 value 为规范化后的地址，否则 reason 为失败原因。 */
export interface DirectContactCheckResult {
  ok: boolean;
  value: string;
  reason?: string;
}

/** validateDirectContact 校验直接填写的手机号/邮箱，并做去重检查。 */
export function validateDirectContact(
  kind: DirectContactKind,
  raw: string,
  existing: string[],
): DirectContactCheckResult {
  const value = raw.trim();
  if (!value) {
    return { ok: false, value, reason: 'empty' };
  }
  if (kind === 'phone' && !PHONE_PATTERN.test(value)) {
    return { ok: false, value, reason: '手机号格式不正确，请输入 11 位国内手机号' };
  }
  if (kind === 'email' && !EMAIL_PATTERN.test(value)) {
    return { ok: false, value, reason: '邮箱格式不正确' };
  }
  if (existing.includes(value)) {
    return { ok: false, value, reason: `${value} 已存在` };
  }
  return { ok: true, value };
}
