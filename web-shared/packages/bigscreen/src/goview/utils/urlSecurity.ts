/**
 * 检查 URL 是否指向本地回环或私有网络地址
 * 用于防止前端动态数据请求被滥用为内网探测/SSRF 类攻击
 *
 * 拦截范围：
 * - localhost / 127.0.0.1 / 0.0.0.0 / ::1
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 *
 * 注意：纯相对路径（如 /api/...）不拦截，因其依赖当前页面域名
 */
export const isUnsafeUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  try {
    // 纯相对路径不做拦截
    if (url.startsWith('/') && !url.startsWith('//')) return false;

    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // 本地回环
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]'
    ) {
      return true;
    }

    // IPv4 私有地址
    const ipv4 = hostname.split('.').map(Number);
    const octet1 = ipv4[0];
    const octet2 = ipv4[1];
    if (
      ipv4.length === 4 &&
      octet1 !== undefined &&
      octet2 !== undefined &&
      ipv4.every((n) => !Number.isNaN(n) && n >= 0 && n <= 255)
    ) {
      // 10.0.0.0/8
      if (octet1 === 10) return true;
      // 172.16.0.0/12
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) return true;
      // 127.0.0.0/8
      if (octet1 === 127) return true;
    }

    return false;
  } catch {
    // URL 解析失败时，用简单正则兜底
    const unsafePatterns = [
      /^(https?:)?\/\/localhost[\/:]/i,
      /^(https?:)?\/\/127\.\d+\.\d+\.\d+[\/:]/i,
      /^(https?:)?\/\/0\.0\.0\.0[\/:]/i,
      /^(https?:)?\/\/10\.\d+\.\d+\.\d+[\/:]/i,
      /^(https?:)?\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+[\/:]/i,
      /^(https?:)?\/\/192\.168\.\d+\.\d+[\/:]/i,
    ];
    return unsafePatterns.some((re) => re.test(url));
  }
};
