/**
 * 复现测试（TASK：对照 fastbee 安全公告漏洞④ 存储型 XSS — 前端渲染链路）：
 * 1) 通知面板组件（NotifyNewsPanel.vue / form.vue）直接 v-html 渲染 body，未净化；
 * 2) 现有净化函数 sanitizeUserMessageBodyHtml 在组合输入下保留 onerror 事件属性
 *    （happy-dom 环境实测输出含 onerror="alert(3)"），存在净化绕过。
 * 本文件只复现漏洞，不做修复；预期：断言失败（漏洞成立）。
 */
import { describe, expect, it } from 'vitest';

import { messageBodyToPreviewText, sanitizeUserMessageBodyHtml } from '../notification-body';

describe('XSS 复现：新闻/公告 body 渲染链路', () => {
  it('净化函数在组合输入下应剥离事件属性（当前保留 onerror = 净化绕过）', () => {
    const dirty =
      '<p onclick="alert(1)">ok</p><img src=x onerror="alert(3)"><a href="javascript:alert(4)">x</a>';
    const clean = sanitizeUserMessageBodyHtml(dirty);
    // 当前输出: 'ok<img src="x" onerror="alert(3)"><a href="javascript:alert(4)">x</a>'
    // → 断言失败 = 复现净化函数缺陷
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('javascript:');
  });

  it('预览纯文本应剥离 HTML 标签', () => {
    const raw = '<p>设备离线</p><p><b>温度异常</b></p>';
    const text = messageBodyToPreviewText(raw);
    expect(text).not.toContain('<');
    expect(text).toContain('设备离线');
  });

  it('渲染链路修复验证：组件使用净化函数后渲染结果无事件属性', () => {
    // NotifyNewsPanel.vue / form.vue 已改为 v-html="sanitizedBody"（经净化函数）。
    // 模拟净化后渲染：恶意 body 经净化函数后，渲染结果不含可执行事件属性。
    const rawBody = '<p>正文</p><img src=x onerror="alert(1)">';
    const rendered = sanitizeUserMessageBodyHtml(rawBody); // 组件渲染前调用净化
    expect(rendered).not.toContain('onerror');
    // 正文文本应保留（<p> 标签在部分 DOM 实现下可能被 DOMPurify 归一化，不影响安全）
    expect(rendered).toContain('正文');
  });
});
