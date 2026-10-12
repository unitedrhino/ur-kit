/**
 * 检查是否为普通对象
 */
function isPlainObject(value: any): boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 安全解析后端返回的值，支持多种类型：
 * - 数字：100 → 返回 100
 * - 数字型字符串："100" → 返回 100
 * - 对象序列化后的字符串：'{"key":"value"}' → 返回 {key: "value"}
 * - 对象：{key: "value"} → 返回 {key: "value"}
 * - 普通字符串（如时间戳）：'2025-10-28 00:30:00' → 返回 '2025-10-28 00:30:00'
 * @param value 需要解析的值
 * @returns 解析后的值
 */
export function safeParseValue(value: any) {
  // 如果是普通对象，直接返回
  if (isPlainObject(value)) {
    return value;
  }

  // 如果是数字，直接返回
  if (typeof value === 'number') {
    return value;
  }

  // 如果不是字符串，返回空对象
  if (typeof value !== 'string') {
    return {};
  }

  // 如果是空字符串，返回空对象
  if (value.trim() === '') {
    return {};
  }

  // 尝试解析JSON字符串
  try {
    return JSON.parse(value);
  } catch {
    // 如果解析失败，说明是普通字符串（如时间戳），直接返回原字符串
    return value;
  }
}
