import type { Merge } from 'type-fest';

import type { Recordable } from '@vben/types';

import type { MaybeI18nKeyPath, Translate } from '../locales';

import { $t } from '@vben/locales';

type Label = string;
type Value = number | string;

/**
 * 创建选项和映射表，可以只解构你需要的某一个值，内部是惰性计算的
 * @example
 * ```ts
 * const data = [
 *   ['value1', 'label1'],
 *   ['value2', 'label2'],
 * ]
 * const { options, mapping } = createOptionsAndMapping(data)
 * ```
 * 如果需要增加额外的属性，可以在选项中添加第三个参数
 * ```ts
 * const data = [
 *   ['value1', 'label1', { customValue: 'customValue1' }],
 *   ['value2', 'label2', { customValue: 'customValue2' }],
 * ]
 * const { options, mapping, mapping2 } = createOptionsAndMapping(data)
 * ```
 */
export function createOptionsAndMapping<const T extends [Value, Label, ...any[]][]>(data: T) {
  return {
    get options() {
      return data.map(([value, label]) => ({ value, label })) as {
        [K in keyof T]: {
          label: T[K] extends [Value, infer L, ...any[]] ? L : never;
          value: T[K] extends [infer V, Label, ...any[]] ? V : never;
        };
      };
    },
    get mapping() {
      return Object.fromEntries(data) as {
        [K in T[number] as `${K[0]}`]: K[1];
      };
    },
    get mapping2() {
      return Object.fromEntries(data.map(([value, , customValue]) => [value, customValue])) as {
        [K in T[number] as `${K[0]}`]: K extends [any, any, infer X, ...any[]] ? X : void;
      };
    },
  };
}

/**
 * 翻译选项，会自动从 locale 中翻译 label，并且会保留其他的属性，类型完整
 * @example
 * ```ts
 * const options = [
 *   { label: 'label1', value: 'value1' },
 *   { label: 'label2', value: 'value2' },
 * ]
 * const translatedOptions = translateOptions(options)
 * ```
 */
export function translateOptions<T extends Recordable<any>[]>(options: T) {
  return options.map(({ label, ...rest }) => ({
    ...rest,
    label: $t(label),
  })) as {
    [Item in keyof T]: T[Item] extends {
      [x: PropertyKey]: any;
      label: MaybeI18nKeyPath;
    }
      ? Merge<
          T[Item],
          {
            label: Translate<T[Item]['label']>;
          }
        >
      : T[Item];
  };
}

/**
 * 将日期编码为掩码字符串
 * @param date 日期对象
 * @returns 编码后的日期字符串（5位：年2位+月1位+日2位）
 * @example
 * ```ts
 * encodeDateMask(new Date('2023-11-29')) // 'NBTZ'
 * encodeDateMask(new Date('2024-01-15')) // 'P1F'
 * ```
 */
function encodeDateMask(date: Date): string {
  // 年份映射：只取后两位，映射到字母
  // 00-99 -> AA-ZZ (使用两位字母表示)
  const yearMap = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24个字母（排除I和O）
  const year = date.getFullYear() % 100; // 取后两位
  const yearChar = yearMap.charAt(Math.floor(year / 10)) + yearMap.charAt(year % 10);

  // 月份映射：1-12 -> 1-9,A-C
  const monthMap = '0123456789AC'; // 1->1, 10->A, 11->B, 12->C
  const month = date.getMonth() + 1;
  const monthChar = monthMap.charAt(month);

  // 日期映射：1-31 -> 使用两位字符
  const dayMap = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const day = date.getDate();
  const dayChar = dayMap.charAt(Math.floor(day / 10)) + dayMap.charAt(day % 10);

  return `${yearChar}${monthChar}${dayChar}`;
}

/**
 * 产品ID 自动生成（包含字母数字混合序列号，日期使用掩码）
 * @param length 序列号长度，默认为 8 位
 * @returns 格式：NBTZA3F7B2E1（日期掩码+随机序列号）
 * @example
 * ```ts
 * generateProductId() // 长度 13（5 位日期掩码 + 8 位随机序列号）
 * generateProductId(10) // 长度 15
 * generateProductId(6) // 长度 11
 * ```
 */
export function generateProductId(length = 8): string {
  // 获取编码后的日期掩码（5位）
  const now = new Date();
  const dateMask = encodeDateMask(now);

  // 生成包含字母和数字的随机序列号
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除易混淆的 I 和 O
  let serialNumber = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    serialNumber += chars[randomIndex];
  }

  return `${dateMask}${serialNumber}`;
}

/**
 * 批量生成产品ID（包含字母数字混合序列号，日期使用掩码）
 * @param count 生成数量
 * @param length 序列号长度，默认为 8 位
 * @returns 产品ID数组
 * @example
 * ```ts
 * generateBatchProductIds(10) // 长度 13（5 位日期掩码 + 10 位序列号）的 ID 数组
 * generateBatchProductIds(5, 10) // 长度 15 的 ID 数组
 * ```
 */
export function generateBatchProductIds(count: number, length = 8): string[] {
  const ids = new Set<string>();

  // 获取编码后的日期掩码
  const now = new Date();
  const dateMask = encodeDateMask(now);

  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除易混淆的 I 和 O

  // 生成指定数量的唯一ID
  while (ids.size < count) {
    let serialNumber = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      serialNumber += chars[randomIndex];
    }
    ids.add(`${dateMask}${serialNumber}`);
  }

  return [...ids];
}

/**
 * 生成带校验码的产品ID（使用简单的校验算法，日期使用掩码）
 * @param length 序列号长度，默认为 8 位
 * @returns 格式：5 位日期掩码 + length 位序列号 + 1 位校验码
 * @example
 * ```ts
 * generateProductIdWithChecksum() // 长度 14（默认 8 位序列号）
 * generateProductIdWithChecksum(10) // 长度 16
 * ```
 */
export function generateProductIdWithChecksum(length = 8): string {
  const baseId = generateProductId(length);

  // 计算简单校验码（取所有字符的ASCII值之和的模26，转换为字母）
  const sum = baseId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  const checksum = String.fromCharCode(65 + (sum % 26)); // A-Z

  return `${baseId}${checksum}`;
}

export function normalizeRedirectPath(raw: string | undefined | null, fallback = '/'): string {
  let value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return fallback;

  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  if (!value || value === 'undefined' || value === 'null') return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('/auth/login')) return fallback;
  return value;
}

/**
 * 解码产品ID中的日期掩码
 * @param productIdOrMask 完整的产品ID或日期掩码字符串（取前5位）
 * @returns 解码后的日期字符串（YYYY-MM-DD）
 * @example
 * ```ts
 * decodeDateMask('CDB29...') // '2023-11-29'（2023-11-29 的编码掩码为 CDB29）
 * decodeDateMask('CDB2') // '2023-11-20'（仅 4 位时日个位按 0 处理）
 * ```
 */
export function decodeDateMask(productIdOrMask: string): string {
  // 取前5位作为日期掩码
  const dateMask = productIdOrMask.slice(0, 5);
  if (dateMask.length < 4) {
    return '无效日期掩码';
  }

  const yearMap = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const monthMap = '0123456789AC';
  const dayMap = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  // 解码年份（前两位）
  const yearChar1 = yearMap.indexOf(dateMask.charAt(0));
  const yearChar2 = yearMap.indexOf(dateMask.charAt(1));
  const year = 2000 + yearChar1 * 10 + yearChar2;

  // 解码月份（第3位）
  const month = monthMap.indexOf(dateMask.charAt(2));

  // 解码日期（第4-5位）
  const dayChar1 = dayMap.indexOf(dateMask.charAt(3));
  const dayChar2 = dateMask.length > 4 ? dayMap.indexOf(dateMask.charAt(4)) : 0;
  const day = dayChar1 * 10 + dayChar2;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 格式化时间
 * 支持 数字/字符串/日期对象
 * 支持 秒级/毫秒级时间戳自动识别
 * 支持 格式化
 */
export function formatDate(time: number | string): string {
  if (!time) {
    return '--';
  }

  let timestamp: number;

  // 如果是字符串
  if (typeof time === 'string') {
    // 判断是否为纯数字字符串
    if (/^\d+$/.test(time)) {
      // 纯数字字符串，转换为数字时间戳
      timestamp = Number(time);
    } else {
      // 非纯数字字符串，尝试直接解析日期
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return '无效日期';
      }
      return formatDateObject(date);
    }
  } else {
    timestamp = time;
  }

  // 判断是秒级还是毫秒级时间戳
  // 秒级时间戳长度为 10 位，毫秒级为 13 位
  const milliseconds = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期';
  }

  return formatDateObject(date);
}

/**
 * 将 Date 对象格式化为字符串
 */
function formatDateObject(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
