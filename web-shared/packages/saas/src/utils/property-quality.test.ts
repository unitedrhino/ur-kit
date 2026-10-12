/** 属性质量兼容与数值空缺规则的单元测试。 */
import { describe, expect, it } from 'vitest';
import { formatPropertyTime, goodPropertyNumber, nullablePropertyNumber, propertyQualityLabel, sumPropertyNumbers } from './property-quality';

describe('属性质量', () => {
  it('旧记录兼容良好，未上报与未知质量不伪装良好', () => {
    expect(propertyQualityLabel({ timestamp: '123', value: '0' })).toBe('良好');
    expect(propertyQualityLabel({ timestamp: '0', value: '0' })).toBe('未上报');
    expect(propertyQualityLabel({ quality: 'good' })).toBe('未知');
    expect(propertyQualityLabel({ quality: null })).toBe('未知');
  });
  it('只提取 GOOD 的真实数值，保留零并拒绝空值转换', () => {
    expect(goodPropertyNumber({ value: '0', quality: 'GOOD' })).toBe(0);
    expect(goodPropertyNumber({ value: '100', quality: 'UNCERTAIN' })).toBeNull();
    expect(goodPropertyNumber({ value: '1000', quality: 'BAD' })).toBeNull();
    for (const value of [null, undefined, '', '  ', false, {}, 'NaN', 'Infinity']) expect(nullablePropertyNumber(value)).toBeNull();
  });
  it('无有效数据的求和保持空缺，真实零仍返回零', () => {
    expect(sumPropertyNumbers([null, '', '—'])).toBeNull();
    expect(sumPropertyNumbers([null, '0'])).toBe(0);
    expect(sumPropertyNumbers(['2.5', null, 3])).toBe(5.5);
  });
  it('历史未知时间显示空缺，不显示纪元或当前时间', () => {
    for (const time of [null, undefined, '', 0, '0', 'bad']) expect(formatPropertyTime(time)).toBe('—');
    expect(formatPropertyTime('1789516800120')).toMatch(/\.120$/);
    expect(formatPropertyTime(1789516800120)).toBe(formatPropertyTime('1789516800120'));
    expect(formatPropertyTime(1789516800120)).toMatch(/\.120$/);
  });
});
