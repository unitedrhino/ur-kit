/**
 * 文件说明：dompurify HTML 净化回归基线测试（OWASP 依赖漏洞治理 · 阶段零）
 *
 * 覆盖依赖与调用点：
 * - `dompurify`（apps/web/packages/saas/src/utils/notification-body.ts 的 sanitizeUserMessageBodyHtml）：
 *   通知/站内信正文渲染前的白名单净化（ALLOWED_TAGS / ALLOWED_ATTR / FORBID_ATTR / ALLOW_DATA_ATTR），
 *   以及净化函数自带的兜底正则（剥离 on* 事件属性、javascript:/data:/协议相对地址）。
 *
 * 环境说明（重要）：
 * - 本测试跑在 happy-dom 环境。实测（dompurify 3.4.12 + happy-dom 17.6.3）：
 *   DOMPurify.isSupported = true；**默认配置**下 <script>/<iframe> 可正常剥离；
 *   但一旦传入**自定义 ALLOWED_TAGS 白名单**，happy-dom 下其余标签的强制剥离会降级
 *   （script/iframe/formaction/srcdoc 等标签壳可能残留在输出中）。
 *   真实浏览器 DOM 中不存在此降级。
 * - 因此本文件分层固化行为：兜底正则可保证的安全行为用严格断言；
 *   happy-dom 白名单降级行为如实记录（升级 dompurify/happy-dom 后跑此基线，
 *   若降级行为消失（标签恢复剥离）需人工确认后更新基线断言）。
 */
import DOMPurify from 'dompurify';
import { describe, expect, it } from 'vitest';

import { sanitizeUserMessageBodyHtml } from '../notification-body';

describe('dompurify 环境能力基线', () => {
  it('当前 DOM 实现（happy-dom）下 DOMPurify 应处于受支持状态', () => {
    expect(DOMPurify.isSupported).toBe(true);
    expect(DOMPurify.version).toBeTruthy();
  });
});

describe('净化函数兜底防线（环境无关，严格断言）', () => {
  it('应剥离 on* 事件属性（onerror / onclick / onload）', () => {
    const clean = sanitizeUserMessageBodyHtml(
      '<img src="a.png" onerror="void 0"><p onclick="void 0">x</p><video src="v.mp4" onload="void 0"></video>',
    );
    expect(clean).not.toMatch(/\son\w+\s*=/i);
  });

  it('应剥离 javascript: 伪协议链接', () => {
    const clean = sanitizeUserMessageBodyHtml('<a href="javascript:void 0">link</a>');
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });

  it('应剥离 data: 协议链接与 vbscript: 链接', () => {
    const clean = sanitizeUserMessageBodyHtml(
      '<a href="data:text/html,<p>x</p>">d</a><a href="vbscript:void 0">v</a>',
    );
    expect(clean.toLowerCase()).not.toContain('data:text/html');
    expect(clean.toLowerCase()).not.toContain('vbscript:');
  });

  it('应剥离协议相对地址（// 开头的外链）', () => {
    const clean = sanitizeUserMessageBodyHtml('<a href="//evil.example.com/phish">go</a>');
    expect(clean).not.toContain('//evil.example.com');
  });

  it('ALLOW_DATA_ATTR=false：data-* 属性应被剥离', () => {
    const clean = sanitizeUserMessageBodyHtml('<p data-inject="payload">t</p>');
    expect(clean).not.toContain('data-inject');
  });

  it('style 属性应被剥离', () => {
    const clean = sanitizeUserMessageBodyHtml('<p style="color:red">s</p>');
    expect(clean).not.toContain('style=');
  });
});

describe('净化函数白名单行为（含 happy-dom 降级基线，如实固化）', () => {
  it('白名单内标签与文本应保留（p/strong/a/img）', () => {
    // 已知行为：兜底正则按 `//` 剥离 href/src，https:// 正常链接也会被一并剥离
    // （协议相对地址拦截的实现粒度过粗）。此处固化当前真实行为，dompurify
    // 升级后据此对照是否放宽。
    const clean = sanitizeUserMessageBodyHtml(
      '<p><strong>重点</strong></p><a href="https://example.com" title="说明">链接</a><img src="a.png" alt="图">',
    );
    expect(clean).toContain('<strong>重点</strong>');
    expect(clean).toContain('title="说明"');
    expect(clean).toContain('alt="图"');
    // 当前实现下 https:// 的 href/src 一并被剥离
    expect(clean).not.toContain('href=');
  });

  it('script 标签剥离：happy-dom + 自定义白名单下降级为保留（浏览器中会剥离）', () => {
    // 真实浏览器：DOMPurify 白名单生效，<script> 被剥离。
    // happy-dom 降级（实测）：传入 ALLOWED_TAGS 后 script 标签壳残留。
    // 固化当前环境行为：若未来升级后 script 恢复剥离，此断言失败 → 属行为改善，更新基线。
    const clean = sanitizeUserMessageBodyHtml('<p>通知</p><script>void 0</script>');
    expect(clean).toContain('通知');
    expect(clean).toContain('<script');
  });

  it('formaction / srcdoc / iframe：happy-dom 白名单下降级为 iframe 标签壳残留（浏览器中会剥离）', () => {
    // 实测当前环境：button 标签被正常剥离，iframe 标签壳残留（无事件属性可执行）。
    const clean = sanitizeUserMessageBodyHtml(
      '<button formaction="/steal">b</button><iframe srcdoc="<p>inner</p>"></iframe>',
    );
    expect(clean).not.toMatch(/\son\w+\s*=/i);
    expect(clean).not.toContain('<button');
    expect(clean).toContain('<iframe');
  });

  it('iframe/svg/math 组合输入下不得出现事件属性与危险协议（安全底线）', () => {
    const clean = sanitizeUserMessageBodyHtml(
      '<iframe src="https://evil.example.com"></iframe><svg onload="void 0"></svg><math href="javascript:void 0">m</math>',
    );
    // 无论标签壳是否残留，事件属性与危险协议必须被兜底防线剥离
    expect(clean).not.toMatch(/\son\w+\s*=/i);
    expect(clean).not.toContain('javascript:');
  });
});

describe('净化函数边界行为', () => {
  it('空输入与纯空白应返回空字符串', () => {
    expect(sanitizeUserMessageBodyHtml(null)).toBe('');
    expect(sanitizeUserMessageBodyHtml(undefined)).toBe('');
    expect(sanitizeUserMessageBodyHtml('')).toBe('');
    expect(sanitizeUserMessageBodyHtml('   ')).toBe('');
  });

  it('纯文本输入应原样返回（不经 DOM 处理链）', () => {
    expect(sanitizeUserMessageBodyHtml('纯文本通知内容')).toBe('纯文本通知内容');
  });
});
