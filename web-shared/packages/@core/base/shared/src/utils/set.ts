/**
 * 文件说明：对象路径安全设值工具
 *
 * 替代已停止维护且存在 CVE-2020-8203 的 lodash.set，
 * 仅保留当前项目实际使用的路径设值能力（点分路径 + 数字下标）。
 */

type Target = Record<string, any>;

/**
 * 判断路径片段是否为数字下标，用于决定创建数组还是对象。
 *
 * @param key 路径片段
 * @returns true 表示应按数组处理
 */
function isArrayIndex(key: string | number): boolean {
  return typeof key === 'number' || /^\d+$/.test(String(key));
}

/**
 * 将值设置到对象的指定路径上，不存在的中级路径会自动创建为对象或数组。
 *
 * @param object 目标对象
 * @param path 点分路径，支持数字下标（如 "a.b.0.c"）
 * @param value 要设置的值
 * @returns 修改后的目标对象
 */
export default function set<T extends Target>(object: T, path: string | number | (string | number)[], value: any): T {
  if (object == null || typeof object !== 'object') {
    return object;
  }

  const keys: (string | number)[] = Array.isArray(path)
    ? path
    : String(path)
        .replace(/\[(\w+)]/g, '.$1')
        .split('.')
        .filter((key) => key.length > 0);

  if (keys.length === 0) {
    return object;
  }

  let current: any = object;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const nextKey = keys[i + 1]!;

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = isArrayIndex(nextKey) ? [] : {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]!] = value;
  return object;
}
