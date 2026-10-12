/**
 * notify-contact 单元测试：告警通知直接填写联系人（手机号/邮箱）的校验与去重规则。
 */

import { describe, expect, it } from 'vitest';

import { validateDirectContact } from './notify-contact';

describe('validateDirectContact', () => {
  describe('phone', () => {
    it('合法 11 位手机号通过', () => {
      const r = validateDirectContact('phone', '13800138000', []);
      expect(r.ok).toBe(true);
      expect(r.value).toBe('13800138000');
    });

    it('前后空格被去除', () => {
      const r = validateDirectContact('phone', ' 13800138000 ', []);
      expect(r.ok).toBe(true);
      expect(r.value).toBe('13800138000');
    });

    it('非法格式拒绝（位数不足/非数字/非国内号段）', () => {
      for (const bad of ['12345', '1380013800', '23800138000', 'abc', '']) {
        const r = validateDirectContact('phone', bad, []);
        expect(r.ok).toBe(false);
      }
    });

    it('重复号码拒绝并提示已存在', () => {
      const r = validateDirectContact('phone', '13800138000', ['13800138000']);
      expect(r.ok).toBe(false);
      expect(r.reason).toContain('已存在');
    });
  });

  describe('email', () => {
    it('合法邮箱通过', () => {
      const r = validateDirectContact('email', 'alert@example.com', []);
      expect(r.ok).toBe(true);
      expect(r.value).toBe('alert@example.com');
    });

    it('缺少域名的非法邮箱拒绝', () => {
      for (const bad of ['alert', 'alert@', 'alert@example', 'alert @example.com']) {
        const r = validateDirectContact('email', bad, []);
        expect(r.ok).toBe(false);
      }
    });

    it('重复邮箱拒绝', () => {
      const r = validateDirectContact('email', 'alert@example.com', ['alert@example.com']);
      expect(r.ok).toBe(false);
      expect(r.reason).toContain('已存在');
    });
  });

  it('空输入返回 empty 原因（UI 静默忽略）', () => {
    const r = validateDirectContact('phone', '   ', []);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('empty');
  });
});
